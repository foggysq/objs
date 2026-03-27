const STORAGE_KEY = "objsExtTestsV2";
/** Persists o.tShowOk preference (show “OK” lines in test log / overlay). Legacy: objsExtOverlayShowSucceeded. */
const TSHOWOK_PREFS_KEY = "objsExtTShowOk";
const LEGACY_OVERLAY_PREFS_KEY = "objsExtOverlayShowSucceeded";
const THEME_KEY = "objsExtTheme";
const RECORDING_SETTINGS_KEY = "objsExtRecordingSettings";

const defaultRecordingSettings = {
	useFetchMocks: true,
	useWsMock: true,
	runAssertions: true,
	assertionDebug: false,
	/** Shorthand: strictPlay + all strict* below */
	strictPlay: false,
	strictAssertions: false,
	strictNetwork: false,
	strictWebSocket: false,
	strictRemoved: false,
};

/** Merged defaults + chrome.storage — used for JSON replay / playRecording opts. */
let recordingSettings = { ...defaultRecordingSettings };

const defaultEmptyScript = `// Use Record (http(s) tab behind this popup) or paste o.exportTest() output from the library / recording example.

`;

function parseMaybeRecording(text) {
	try {
		const o = JSON.parse(text.trim());
		if (o && Array.isArray(o.actions)) return o;
	} catch {
		return null;
	}
	return null;
}

/** Display name from a chosen file name (strip path and common extensions). */
function titleFromFileName(fileName) {
	const base = String(fileName || "").replace(/^.*[/\\]/, "");
	const stripped = base.replace(/\.(js|json|ts|mjs|cjs|jsx|tsx)$/i, "").trim();
	return stripped || "Imported";
}

/**
 * Apply imported file text to one test (JSON recording → snapshot + exportTest when possible).
 * @returns {{ exportError?: unknown }} set when JSON was recognized but exportTest failed
 */
async function importTextIntoTest(t, text) {
	const jsonRec = parseMaybeRecording(text);
	if (jsonRec) {
		t.recordingSnapshot = jsonRec;
		try {
			const script = await sendInvoke("exportTest", { recording: jsonRec, options: { delay: 16 } });
			t.testScript = script;
		} catch (e) {
			t.testScript = text;
			return { exportError: e };
		}
	} else {
		t.testScript = text;
		t.recordingSnapshot = null;
	}
	t.updatedAt = Date.now();
	return {};
}

function canPlayScript(text) {
	const s = text.trim();
	if (!s) return false;
	if (parseMaybeRecording(s)) return true;
	if (s.includes("o.addTest")) {
		if (/o\.addTest\s*\(\s*['"][^'"]*['"]\s*,\s*\[\s*\]/s.test(s)) return false;
		return true;
	}
	if (s.includes("o.test") && s.includes("__objsExtensionTestRun")) return true;
	return false;
}

function sendMessage(msg) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(msg, (res) => {
			const err = chrome.runtime.lastError;
			if (err) {
				reject(new Error(err.message));
				return;
			}
			if (!res) {
				reject(new Error("No response"));
				return;
			}
			if (res.ok) resolve(res);
			else reject(new Error(res.error || "Unknown error"));
		});
	});
}

async function getTabId() {
	const res = await sendMessage({ type: "getTabId" });
	return res.tabId;
}

/** Passed to bridge; sets o.tShowOk before run (checked = show succeeded step lines). */
function overlayArg() {
	const chk = el("chk-show-succeeded");
	const showSucceeded = chk ? chk.checked : true;
	return { overlay: { showSucceeded } };
}

/** Invoke bridge in the target tab; tabId resolved in service worker if omitted. */
function sendInvoke(method, arg) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ type: "invoke", tabId: null, method, arg }, (res) => {
			const err = chrome.runtime.lastError;
			if (err) {
				reject(new Error(err.message));
				return;
			}
			if (!res) {
				reject(new Error("No response"));
				return;
			}
			if (res.ok) resolve(res.result);
			else reject(new Error(res.error || "Unknown error"));
		});
	});
}

async function loadStore() {
	const data = await chrome.storage.local.get(STORAGE_KEY);
	const raw = data[STORAGE_KEY];
	if (raw && raw.tests) {
		raw.tests = raw.tests.map(normalizeTest);
		if (!raw.expandedIds) raw.expandedIds = [];
		return raw;
	}
	/* migrate from v1 */
	const legacy = await chrome.storage.local.get("objsExtTestsV1");
	const old = legacy.objsExtTestsV1;
	if (old && old.tests) {
		const migrated = {
			tests: old.tests.map((t) =>
				normalizeTest({
					id: t.id,
					name: t.name || "Test",
					observeRoot: t.observeRoot || "",
					autotag: t.autotag,
					testScript: "",
					recordingSnapshot: parseMaybeRecording(t.recordingText || "") || null,
					updatedAt: t.updatedAt || Date.now(),
				}),
			),
			expandedIds: old.activeId ? [old.activeId] : [],
		};
		await chrome.storage.local.set({ [STORAGE_KEY]: migrated });
		return migrated;
	}
	return { tests: [], expandedIds: [] };
}

const DEFAULT_AUTOTAG = "qa";

function normalizeTest(t) {
	const autotag =
		t.autotag !== undefined && t.autotag !== null ? String(t.autotag) : DEFAULT_AUTOTAG;
	if (t.testScript != null && typeof t.testScript === "string") {
		return {
			id: t.id,
			name: t.name || "Untitled",
			observeRoot: t.observeRoot || "",
			autotag,
			testScript: t.testScript,
			recordingSnapshot: t.recordingSnapshot || null,
			updatedAt: t.updatedAt || Date.now(),
		};
	}
	if (t.recordingText && typeof t.recordingText === "string") {
		const snap = parseMaybeRecording(t.recordingText);
		if (snap) {
			return {
				id: t.id,
				name: t.name || "Untitled",
				observeRoot: t.observeRoot || "",
				autotag,
				testScript: "",
				recordingSnapshot: snap,
				updatedAt: t.updatedAt || Date.now(),
			};
		}
	}
	return {
		id: t.id,
		name: t.name || "Untitled",
		observeRoot: t.observeRoot || "",
		autotag,
		testScript: t.recordingText || defaultEmptyScript,
		recordingSnapshot: t.recordingSnapshot || null,
		updatedAt: t.updatedAt || Date.now(),
	};
}

async function saveStore(store) {
	await chrome.storage.local.set({ [STORAGE_KEY]: store });
}

let store = { tests: [], expandedIds: [] };
let importTargetId = null;
let saveTimer = null;

function scheduleSave() {
	clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveStore(store).catch(() => {});
	}, 400);
}

function el(id) {
	return document.getElementById(id);
}

let statusHideTimer = null;

function setStatus(msg) {
	const node = el("status");
	clearTimeout(statusHideTimer);
	node.textContent = msg || "";
	if (msg) {
		node.classList.remove("status--hidden");
		statusHideTimer = setTimeout(() => {
			node.textContent = "";
			node.classList.add("status--hidden");
		}, 5000);
	} else {
		node.classList.add("status--hidden");
	}
}

function isExpanded(id) {
	return store.expandedIds && store.expandedIds.includes(id);
}

function toggleExpanded(id) {
	if (!store.expandedIds) store.expandedIds = [];
	const i = store.expandedIds.indexOf(id);
	if (i >= 0) store.expandedIds.splice(i, 1);
	else store.expandedIds.push(id);
	scheduleSave();
	render();
}

function testById(id) {
	return store.tests.find((t) => t.id === id);
}

function updatePlayButton(btn, script) {
	if (!btn) return;
	btn.disabled = !canPlayScript(script || "");
}

async function migrateLegacyScript(t) {
	if (!t.recordingSnapshot || (t.testScript && t.testScript.includes("o.addTest"))) return;
	try {
		const script = await sendInvoke("exportTest", {
			recording: t.recordingSnapshot,
			options: { delay: 16 },
		});
		t.testScript = script;
		t.recordingSnapshot = null;
		await saveStore(store);
	} catch {
		/* no tab yet */
	}
}

function render() {
	const root = el("accordion-root");
	root.innerHTML = "";
	for (const t of store.tests) {
		const open = isExpanded(t.id);
		const item = document.createElement("div");
		item.className = "acc-item" + (open ? " acc-item--open" : "");
		item.dataset.testId = t.id;

		const head = document.createElement("div");
		head.className = "acc-head";

		const chev = document.createElement("button");
		chev.type = "button";
		chev.className = "acc-chevron";
		chev.textContent = "▶";
		chev.title = "Expand / collapse";
		chev.addEventListener("click", () => toggleExpanded(t.id));

		const nameInp = document.createElement("input");
		nameInp.type = "text";
		nameInp.className = "acc-name";
		nameInp.value = t.name || "";
		nameInp.placeholder = "Test name";
		nameInp.addEventListener("input", () => {
			t.name = nameInp.value;
			t.updatedAt = Date.now();
			scheduleSave();
		});

		const btnPlay = document.createElement("button");
		btnPlay.type = "button";
		btnPlay.className = "btn btn--play btn--sm";
		btnPlay.textContent = "Play";
		btnPlay.dataset.action = "play";

		const btnStop = document.createElement("button");
		btnStop.type = "button";
		btnStop.className = "btn btn--stop btn--sm";
		btnStop.textContent = "Stop";
		btnStop.dataset.action = "stop";

		const btnRec = document.createElement("button");
		btnRec.type = "button";
		btnRec.className = "btn btn--rec btn--sm";
		btnRec.textContent = "Record";
		btnRec.dataset.action = "record";

		const btnImp = document.createElement("button");
		btnImp.type = "button";
		btnImp.className = "btn btn--outline btn--sm";
		btnImp.textContent = "Import";
		btnImp.dataset.action = "import";

		const btnExp = document.createElement("button");
		btnExp.type = "button";
		btnExp.className = "btn btn--outline btn--sm";
		btnExp.textContent = "Export .js";
		btnExp.dataset.action = "export-js";

		const btnPw = document.createElement("button");
		btnPw.type = "button";
		btnPw.className = "btn btn--outline btn--sm";
		btnPw.textContent = "Playwright";
		btnPw.dataset.action = "export-pw";

		const btnDel = document.createElement("button");
		btnDel.type = "button";
		btnDel.className = "btn btn--sm acc-head__delete";
		btnDel.textContent = "✕";
		btnDel.title = "Delete test";
		btnDel.dataset.action = "delete";

		head.appendChild(chev);
		head.appendChild(nameInp);
		head.appendChild(btnPlay);
		head.appendChild(btnDel);

		const body = document.createElement("div");
		body.className = "acc-body";

		const obsRow = document.createElement("div");
		obsRow.className = "acc-row";
		const obsLbl = document.createElement("label");
		obsLbl.className = "lbl";
		obsLbl.textContent = "Observe root · o.autotag";
		const obsLine = document.createElement("div");
		obsLine.className = "acc-observe-line";
		const obsInp = document.createElement("input");
		obsInp.type = "text";
		obsInp.className = "inp acc-observe";
		obsInp.placeholder = "#task-app";
		obsInp.title = "CSS selector for MutationObserver scope (optional)";
		obsInp.value = t.observeRoot || "";
		const qaInp = document.createElement("input");
		qaInp.type = "text";
		qaInp.className = "inp acc-autotag";
		qaInp.placeholder = DEFAULT_AUTOTAG;
		qaInp.title = "o.autotag — data-… attribute name (e.g. qa → data-qa)";
		qaInp.value = t.autotag !== undefined && t.autotag !== null ? t.autotag : DEFAULT_AUTOTAG;
		obsLine.appendChild(obsInp);
		obsLine.appendChild(qaInp);
		obsLine.appendChild(btnRec);
		obsLine.appendChild(btnStop);
		obsRow.appendChild(obsLbl);
		obsRow.appendChild(obsLine);

		const taRow = document.createElement("div");
		taRow.className = "acc-row";
		const taLbl = document.createElement("span");
		taLbl.className = "lbl";
		taLbl.textContent = "Objs test (o.exportTest) — edit freely";
		const ta = document.createElement("textarea");
		ta.className = "ta acc-script";
		ta.spellcheck = false;
		ta.value = t.testScript || defaultEmptyScript;
		taRow.appendChild(taLbl);
		taRow.appendChild(ta);

		const belowTa = document.createElement("div");
		belowTa.className = "acc-row acc-actions-below";
		belowTa.appendChild(btnImp);
		belowTa.appendChild(btnExp);
		belowTa.appendChild(btnPw);

		const hint = document.createElement("p");
		hint.className = "hint";
		hint.textContent =
			"Import .js or legacy .json. JSON-only uses Play (slow replay) with fetch/WS mocks; JS from Record uses o.test sync (fast).";

		body.appendChild(obsRow);
		appendRecordingSettingsSection(body, t.id);
		body.appendChild(taRow);
		body.appendChild(belowTa);
		body.appendChild(hint);

		obsInp.addEventListener("input", () => {
			t.observeRoot = obsInp.value.trim();
			t.updatedAt = Date.now();
			scheduleSave();
		});
		qaInp.addEventListener("input", () => {
			t.autotag = qaInp.value;
			t.updatedAt = Date.now();
			scheduleSave();
		});

		ta.addEventListener("input", () => {
			t.testScript = ta.value;
			t.updatedAt = Date.now();
			updatePlayButton(btnPlay, ta.value);
			scheduleSave();
		});

		updatePlayButton(btnPlay, ta.value);

		item.appendChild(head);
		item.appendChild(body);
		root.appendChild(item);

		/* wire actions */
		const run = async (ev) => {
			const action = ev.target.closest("[data-action]")?.dataset?.action;
			if (!action) return;
			const id = t.id;
			const cur = testById(id);
			if (!cur) return;

			if (action === "delete") {
				if (store.tests.length <= 1) {
					setStatus("Keep at least one test.");
					return;
				}
				store.tests = store.tests.filter((x) => x.id !== id);
				store.expandedIds = (store.expandedIds || []).filter((e) => e !== id);
				await saveStore(store);
				render();
				setStatus("Test removed");
				return;
			}

			if (action === "import") {
				importTargetId = id;
				el("file-import-hidden").click();
				return;
			}

			if (action === "export-js") {
				const blob = new Blob([cur.testScript || ""], { type: "text/javascript" });
				const u = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = u;
				a.download = (cur.name || "objs-test").replace(/[^a-z0-9-_]+/gi, "_") + ".js";
				a.click();
				URL.revokeObjectURL(u);
				setStatus("Exported .js");
				return;
			}

			if (action === "export-pw") {
				let rec = cur.recordingSnapshot;
				if (!rec) {
					const p = parseMaybeRecording(cur.testScript || "");
					if (p) rec = p;
				}
				if (!rec) {
					setStatus("Playwright export needs a recording — Record once or import JSON.");
					return;
				}
				try {
					const name = (cur.name || "Recorded").replace(/"/g, '\\"');
					const code = await sendInvoke("exportPlaywrightTest", {
						recording: rec,
						options: { testName: name },
					});
					const blob = new Blob([code], { type: "text/typescript" });
					const u = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = u;
					a.download = (cur.name || "recorded").replace(/[^a-z0-9-_]+/gi, "_") + ".spec.ts";
					a.click();
					URL.revokeObjectURL(u);
					setStatus("Playwright file downloaded");
				} catch (e) {
					setStatus(String(e.message || e));
				}
				return;
			}

			try {
				await getTabId();
			} catch (e) {
				setStatus(String(e.message || e));
				return;
			}

			const obs = obsInp.value.trim();
			const qa = (qaInp.value || "").trim();
			const taEl = item.querySelector(".acc-script");
			const autotagPayload = { autotag: qa };

			if (action === "record") {
				try {
					await sendInvoke("startRecording", {
						observe: obs || undefined,
						...autotagPayload,
					});
					btnRec.disabled = true;
					btnStop.disabled = false;
					btnPlay.disabled = true;
					setStatus("Recording… use the page, then Stop.");
				} catch (e) {
					setStatus(String(e.message || e));
				}
				return;
			}

			if (action === "stop") {
				try {
					const out = await sendInvoke("stopAndExport", { options: { delay: 16 } });
					cur.testScript = out.script;
					cur.recordingSnapshot = out.recording;
					cur.observeRoot = obs;
					cur.autotag = qaInp.value;
					cur.updatedAt = Date.now();
					taEl.value = out.script;
					updatePlayButton(btnPlay, out.script);
					await saveStore(store);
					btnRec.disabled = false;
					btnStop.disabled = true;
					const n = out.recording.actions ? out.recording.actions.length : 0;
					setStatus(n ? `Stopped — ${n} steps, Objs test updated` : "Stopped — no actions");
				} catch (e) {
					setStatus(String(e.message || e));
				}
				return;
			}

			if (action === "play") {
				const text = taEl.value;
				const legacy = parseMaybeRecording(text);
				try {
					setStatus("Running…");
					if (legacy) {
						const out = await sendInvoke("playRecording", {
							recording: legacy,
							opts: playRecordingOptsFromSettings(obs, legacy),
							...autotagPayload,
							...overlayArg(),
						});
						const ar = out && out.assertionResult;
						setStatus(
							ar && ar.total > 0
								? `Replay done — assertions ${ar.passed}/${ar.total}`
								: "Replay finished",
						);
					} else {
						await sendInvoke("runExportedTest", {
							code: text,
							...autotagPayload,
							...overlayArg(),
						});
						setStatus("Objs test finished — see overlay on the page");
					}
				} catch (e) {
					setStatus(String(e.message || e));
				}
				return;
			}
		};

		item.addEventListener("click", run);
	}

	/* recorder state refresh */
	refreshAllRecorderStates();
}

async function refreshAllRecorderStates() {
	try {
		await getTabId();
		const active = await sendInvoke("recorderActive", undefined);
		for (const item of document.querySelectorAll(".acc-item")) {
			const id = item.dataset.testId;
			const t = testById(id);
			if (!t) continue;
			const btnRec = item.querySelector('[data-action="record"]');
			const btnStop = item.querySelector('[data-action="stop"]');
			const ta = item.querySelector(".acc-script");
			const btnPlay = item.querySelector('[data-action="play"]');
			if (btnRec && btnStop) {
				btnRec.disabled = !!active;
				btnStop.disabled = !active;
			}
			if (btnPlay && ta) {
				updatePlayButton(btnPlay, ta.value);
				if (active) btnPlay.disabled = true;
			}
		}
	} catch {
		for (const btnRec of document.querySelectorAll('[data-action="record"]')) {
			btnRec.disabled = false;
		}
		for (const btnStop of document.querySelectorAll('[data-action="stop"]')) {
			btnStop.disabled = true;
		}
	}
}

async function loadTShowOkPrefs() {
	const data = await chrome.storage.local.get([TSHOWOK_PREFS_KEY, LEGACY_OVERLAY_PREFS_KEY]);
	const chk = el("chk-show-succeeded");
	if (!chk) return;
	if (data[TSHOWOK_PREFS_KEY] !== undefined) {
		chk.checked = data[TSHOWOK_PREFS_KEY] !== false;
	} else if (data[LEGACY_OVERLAY_PREFS_KEY] !== undefined) {
		chk.checked = data[LEGACY_OVERLAY_PREFS_KEY] !== false;
	} else {
		chk.checked = true;
	}
}

function applyTheme(theme) {
	const th = theme === "light" || theme === "dark" ? theme : "dark";
	document.documentElement.setAttribute("data-theme", th);
	const btn = el("btn-theme");
	if (btn) {
		if (th === "dark") {
			btn.textContent = "☀";
			btn.title = "Switch to light theme";
			btn.setAttribute("aria-label", "Switch to light theme");
		} else {
			btn.textContent = "🌙";
			btn.title = "Switch to dark theme";
			btn.setAttribute("aria-label", "Switch to dark theme");
		}
	}
}

async function initTheme() {
	const data = await chrome.storage.local.get(THEME_KEY);
	const saved = data[THEME_KEY];
	applyTheme(saved === "light" || saved === "dark" ? saved : "dark");
}

async function loadRecordingSettings() {
	const data = await chrome.storage.local.get(RECORDING_SETTINGS_KEY);
	const s = data[RECORDING_SETTINGS_KEY];
	if (s && typeof s === "object") {
		recordingSettings = { ...defaultRecordingSettings, ...s };
	} else {
		recordingSettings = { ...defaultRecordingSettings };
	}
}

function persistRecordingSettings() {
	return chrome.storage.local.set({ [RECORDING_SETTINGS_KEY]: recordingSettings });
}

function playRecordingOptsFromSettings(obs, legacy) {
	const o = {
		root: obs || legacy.observeRoot || undefined,
		actionDelay: 120,
		runAssertions: recordingSettings.runAssertions,
		skipWebSocketMock: !recordingSettings.useWsMock,
		skipNetworkMocks: !recordingSettings.useFetchMocks,
		recordingAssertionDebug: recordingSettings.assertionDebug,
	};
	if (recordingSettings.strictPlay) o.strictPlay = true;
	else {
		if (recordingSettings.strictAssertions) o.strictAssertions = true;
		if (recordingSettings.strictNetwork) o.strictNetwork = true;
		if (recordingSettings.strictWebSocket) o.strictWebSocket = true;
		if (recordingSettings.strictRemoved) o.strictRemoved = true;
	}
	return o;
}

function appendRecordingSettingsSection(body, testId) {
	const details = document.createElement("details");
	details.className = "acc-rec-settings";
	const sum = document.createElement("summary");
	sum.className = "acc-rec-settings__summary";
	sum.textContent = "Recording settings";
	details.appendChild(sum);

	const inner = document.createElement("div");
	inner.className = "acc-rec-settings__inner";

	const addRow = (key, labelText) => {
		const id = `rs-${key}-${testId}`;
		const lab = document.createElement("label");
		lab.className = "acc-rec-settings__row";
		lab.htmlFor = id;
		const cb = document.createElement("input");
		cb.type = "checkbox";
		cb.id = id;
		cb.checked = !!recordingSettings[key];
		cb.addEventListener("change", () => {
			recordingSettings[key] = cb.checked;
			persistRecordingSettings().catch(() => {});
			render();
		});
		const span = document.createElement("span");
		span.textContent = labelText;
		lab.appendChild(cb);
		lab.appendChild(span);
		inner.appendChild(lab);
	};

	addRow("useFetchMocks", "Replay fetch / XHR mocks (off = live network)");
	addRow("useWsMock", "Replay WebSocket mock when recording includes WS");
	addRow("runAssertions", "Run DOM assertions during JSON replay");
	addRow("assertionDebug", "Log assertion debug to console (o.recordingAssertionDebug)");
	addRow("strictPlay", "Strict replay: DOM + request body + WebSocket sends (see o.playRecording)");
	addRow("strictAssertions", "Strict DOM only (exact list index/text/style; implies strict removed unless off below)");
	addRow("strictNetwork", "Strict network only (mock request body must match)");
	addRow("strictWebSocket", "Strict WebSocket only (outbound frames must match)");
	addRow("strictRemoved", "Strict removed-elements check (verify absence, not auto-pass)");

	details.appendChild(inner);
	body.appendChild(details);
}

async function init() {
	await initTheme();
	await loadRecordingSettings();
	await loadTShowOkPrefs();
	const chkSucceeded = el("chk-show-succeeded");
	if (chkSucceeded) {
		chkSucceeded.addEventListener("change", () => {
			chrome.storage.local.set({ [TSHOWOK_PREFS_KEY]: chkSucceeded.checked });
		});
	}

	store = await loadStore();
	if (store.tests.length === 0) {
		const id = crypto.randomUUID();
		store.tests.push({
			id,
			name: "First test",
			observeRoot: "",
			autotag: DEFAULT_AUTOTAG,
			testScript: defaultEmptyScript,
			recordingSnapshot: null,
			updatedAt: Date.now(),
		});
		store.expandedIds = [];
		await saveStore(store);
	}
	if (!store.expandedIds) {
		store.expandedIds = [];
	}

	render();

	for (const t of store.tests) {
		await migrateLegacyScript(t);
	}
	if (store.tests.some((t) => t.testScript && t.testScript.includes("o.addTest"))) {
		render();
	}

	el("btn-new-global").addEventListener("click", async () => {
		const id = crypto.randomUUID();
		store.tests.push({
			id,
			name: "New test",
			observeRoot: "",
			autotag: DEFAULT_AUTOTAG,
			testScript: defaultEmptyScript,
			recordingSnapshot: null,
			updatedAt: Date.now(),
		});
		store.expandedIds = store.expandedIds || [];
		await saveStore(store);
		render();
		setStatus("New test");
	});

	el("file-import-hidden").addEventListener("change", async (ev) => {
		const f = ev.target.files && ev.target.files[0];
		if (f) ev.target.value = "";
		if (!f || !importTargetId) return;
		const text = await f.text();
		const t = testById(importTargetId);
		importTargetId = null;
		if (!t) return;

		const r = await importTextIntoTest(t, text);
		if (r.exportError) {
			setStatus("Could not convert JSON — stored as text. " + (r.exportError.message || r.exportError));
		} else {
			setStatus("Imported");
		}
		await saveStore(store);
		render();
	});

	el("btn-import-global").addEventListener("click", () => {
		el("file-import-multi-hidden").click();
	});

	el("file-import-multi-hidden").addEventListener("change", (ev) => {
		void (async () => {
			/* Snapshot File objects before clearing input — Chrome empties the live FileList on reset. */
			const files = Array.from(ev.target.files || []);
			ev.target.value = "";
			if (files.length === 0) return;

			try {
				let exportErrors = 0;
				const newIds = [];
				for (let i = 0; i < files.length; i++) {
					const f = files[i];
					let text;
					try {
						text = await f.text();
					} catch (e) {
						setStatus("Could not read file: " + (f.name || "") + " — " + (e.message || e));
						return;
					}
					const id = crypto.randomUUID();
					const t = {
						id,
						name: titleFromFileName(f.name),
						observeRoot: "",
						autotag: DEFAULT_AUTOTAG,
						testScript: defaultEmptyScript,
						recordingSnapshot: null,
						updatedAt: Date.now(),
					};
					const r = await importTextIntoTest(t, text);
					if (r.exportError) exportErrors += 1;
					store.tests.push(t);
					newIds.push(id);
				}
				store.expandedIds = [...(store.expandedIds || []), ...newIds];
				await saveStore(store);
				render();
				const n = files.length;
				if (exportErrors > 0) {
					setStatus(
						`Imported ${n} test${n === 1 ? "" : "s"} — ${exportErrors} JSON file(s) kept as text (exportTest unavailable or failed)`,
					);
				} else {
					setStatus(n === 1 ? `Imported 1 test — ${titleFromFileName(files[0].name)}` : `Imported ${n} tests`);
				}
			} catch (e) {
				setStatus("Import failed: " + (e && e.message ? e.message : String(e)));
			}
		})();
	});

	setInterval(() => refreshAllRecorderStates().catch(() => {}), 1500);
}

/** Delegated so theme works even if async init() stalls before direct listeners run. */
function wireThemeToggle() {
	document.body.addEventListener("click", async (e) => {
		const btn = e.target && e.target.closest && e.target.closest("#btn-theme");
		if (!btn) return;
		e.preventDefault();
		const cur = document.documentElement.getAttribute("data-theme") || "dark";
		const next = cur === "dark" ? "light" : "dark";
		try {
			await chrome.storage.local.set({ [THEME_KEY]: next });
		} catch {
			/* storage unavailable */
		}
		applyTheme(next);
	});
}

wireThemeToggle();

/** Open o.testOverlay on the active tab — delegated so it works even if init stalls. */
function wireShowOverlayButton() {
	document.body.addEventListener("click", async (e) => {
		const btn = e.target.closest("#btn-show-overlay");
		if (!btn) return;
		e.preventDefault();
		try {
			await getTabId();
			await sendInvoke("showTestOverlay", overlayArg());
			setStatus("Test results opened on the page");
		} catch (err) {
			setStatus(String(err.message || err));
		}
	});
}

wireShowOverlayButton();
init().catch((e) => setStatus(String(e.message || e)));
