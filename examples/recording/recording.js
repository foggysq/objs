o.autotag = "qa";

// ─── Task store ───────────────────────────────────────────────
const taskStore = o.createStore({ tasks: [], nextId: 1 });

// Task item atom — common data-qa (design-system pattern); replay selects by index in list
const TaskItemStates = {
	name: "TaskItem",
	render: ({ text, done }) => ({
		tag: "li",
		className: `task-item${done ? " task-item--done" : ""}`,
		"data-qa": "task-item",
		html: `<input type="checkbox" class="task-cb" data-qa="task-item-cb"${done ? " checked" : ""}>
           <span class="task-text">${text}</span>
           <span class="task-del-wrap"><button class="task-del" data-qa="task-item-del" aria-label="Delete">✕</button><span class="task-del-tooltip">Delete</span></span>`,
	}),
	toggle: ({ self }, done) => {
		done ? self.addClass("task-item--done") : self.removeClass("task-item--done");
		const cb = self.first(".task-cb");
		done ? cb.attr("checked", "") : cb.attr("checked", null);
	},
};

// Task list organism — includes error ref for empty-input validation
const taskListStates = {
	name: "TaskList",
	render: {
		tag: "div",
		className: "task-app",
		html: `<div class="task-input-row">
             <input class="task-input" type="text" placeholder="Add a task…" ref="input" data-qa="task-input">
             <button class="btn btn--primary btn--sm task-add-btn" ref="addBtn" data-qa="task-add-btn">Add</button>
           </div>
           <p class="task-error" ref="error" data-qa="task-error">Task cannot be empty.</p>
           <ul class="task-list" ref="list" data-qa="task-list"></ul>
           <p class="task-empty">No tasks yet. Add one above.</p>`,
	},
	sync: ({ self }) => {
		const empty = self.first(".task-empty");
		taskStore.tasks.length ? empty.css({ display: "none" }) : empty.css(null);
	},
	addTask: ({ self }) => {
		const { input, list, error } = self.refs;
		const text = input.val().trim();
		if (!text) {
			error.css({ display: "block" }); // show validation (overrides .task-error { display:none })
			input.el.focus();
			return;
		}
		error.css({ display: "none" }); // hide validation on valid add
		const task = { id: taskStore.nextId++, text, done: false };
		taskStore.tasks.push(task);
		const item = o.init(TaskItemStates).render(task);
		item.appendInside(list.el);
		item.first(".task-cb").on("change", (e) => {
			task.done = e.target.checked;
			item.toggle(task.done);
			taskStore.notify();
		});
		item.first(".task-del-wrap .task-del").on("click", () => {
			taskStore.tasks = taskStore.tasks.filter((t) => t.id !== task.id);
			item.el.remove();
			taskStore.notify();
		});
		input.val("").el.focus();
		taskStore.notify();
	},
};

const taskApp = o.init(taskListStates).render().appendInside("#task-app");
taskStore.subscribe(taskApp, "sync");

taskApp.refs.addBtn.on("click", () => taskApp.addTask());
taskApp.refs.input.on("keydown", (e) => {
	if (e.key === "Enter") taskApp.addTask();
});

// Seed with a few tasks
["Record user interactions", "Export as Playwright test", "Run in CI"].forEach((text) => {
	const task = { id: taskStore.nextId++, text, done: false };
	taskStore.tasks.push(task);
	const item = o.init(TaskItemStates).render(task);
	item.appendInside(taskApp.refs.list.el);
	item.first(".task-cb").on("change", (e) => {
		task.done = e.target.checked;
		item.toggle(task.done);
		taskStore.notify();
	});
	item.first(".task-del-wrap .task-del").on("click", () => {
		taskStore.tasks = taskStore.tasks.filter((t) => t.id !== task.id);
		item.el.remove();
		taskStore.notify();
	});
});
taskStore.notify();

// ─── Dev panel state ──────────────────────────────────────────
let lastRecording = null;
let taskSnapshot = null;

const recIndicator = o("#rec-indicator");
const playIndicator = o("#play-indicator");
const actionLog = o("#action-log");
const exportOutput = o("#export-output");
const exportCode = o("#export-code");
const exportLabel = o("#export-label");
const ciHint = o("#ci-hint");

// ─── Snapshot helpers ─────────────────────────────────────────

function captureSnapshot() {
	return taskStore.tasks.map((t) => ({ id: t.id, text: t.text, done: t.done }));
}

function restoreSnapshot(snapshot) {
	taskApp.refs.list.html("");
	taskApp.refs.error.css({ display: "none" });
	taskStore.tasks = [];
	taskStore.nextId = snapshot.length > 0 ? Math.max(...snapshot.map((t) => t.id)) + 1 : 1;

	snapshot.forEach((saved) => {
		const task = { ...saved };
		taskStore.tasks.push(task);
		const item = o.init(TaskItemStates).render(task);
		item.appendInside(taskApp.refs.list.el);
		item.first(".task-cb").on("change", (e) => {
			task.done = e.target.checked;
			item.toggle(task.done);
			taskStore.notify();
		});
		item.first(".task-del-wrap .task-del").on("click", () => {
			taskStore.tasks = taskStore.tasks.filter((t) => t.id !== task.id);
			item.el.remove();
			taskStore.notify();
		});
	});
	taskStore.notify();
}

// ─── Log helper ───────────────────────────────────────────────

function updateLog(actions, highlightIdx = -1, highlightStatus = null) {
	if (!actions.length) {
		actionLog.html('<p class="log-empty">No actions recorded yet.</p>');
		return;
	}
	actionLog.html(
		[...actions]
			.reverse()
			.map((a, i) => {
				const idx = actions.length - 1 - i;
				let cls = "log-item";
				if (idx === highlightIdx) {
					cls += " log-item--active";
					if (highlightStatus === "pass") cls += " log-item--pass";
					if (highlightStatus === "fail") cls += " log-item--fail";
				}
				return `<div class="${cls}"><span class="log-type">${a.type}</span> <span class="log-target">${a.target || "(scroll)"}</span></div>`;
			})
			.join(""),
	);
}

// ─── Play delays ─────────────────────────────────────────────
const PLAY_PAUSE = { click: 650, change: 550, input: 180, mouseover: 120, scroll: 280 };

// ─── Playback ─────────────────────────────────────────────────

async function playRecording() {
	if (!lastRecording || !taskSnapshot) return;

	[
		"btn-start-rec",
		"btn-stop-rec",
		"btn-play-rec",
		"btn-clear-rec",
		"btn-export-objs",
		"btn-export-pw",
	].forEach((id) => o(`#${id}`).attr("disabled", ""));

	playIndicator.css(null);

	restoreSnapshot(taskSnapshot);
	await sleep(400);

	const observeRoot = document.querySelector("#task-app") || document.body;

	if (RECORDING_DEBUG) {
		console.log(
			"[replay] actions:",
			lastRecording.actions.length,
			lastRecording.actions.map((ac, idx) => ({
				i: idx,
				type: ac.type,
				target: ac.target,
				value: ac.value !== undefined ? String(ac.value).slice(0, 40) : undefined,
			})),
		);
		console.log(
			"[replay] assertions:",
			(lastRecording.assertions || []).length,
			(lastRecording.assertions || []).map((a) => ({
				selector: a.selector,
				actionIdx: a.actionIdx,
				textSnippet: a.text ? a.text.slice(0, 40) : undefined,
			})),
		);
	}

	for (let i = 0; i < lastRecording.actions.length; i++) {
		const action = lastRecording.actions[i];
		updateLog(lastRecording.actions, i);

		const selector = action.target;
		let el = null;
		if (selector) {
			if (action.listSelector != null && action.targetIndex != null) {
				const items = observeRoot.querySelectorAll(action.listSelector);
				const item = items[action.targetIndex];
				if (item) {
					el =
						action.target !== action.listSelector
							? item.querySelector(action.target)
							: item;
					if (!el && action.target !== action.listSelector) el = item;
				}
			} else {
				const matches = observeRoot.querySelectorAll(selector);
				if (matches.length > 1 && RECORDING_DEBUG) {
					console.warn(
						"[replay] selector matches multiple elements, using first:",
						selector,
						"count:",
						matches.length,
						"— ensure actions use stable selectors (e.g. data-qa)",
					);
				}
				el = matches.length > 0 ? matches[0] : document.querySelector(selector);
			}
		}
		const isCheckboxOrRadio = el && (el.type === "checkbox" || el.type === "radio");

		if (RECORDING_DEBUG && selector) {
			console.log(
				"[replay] step",
				i,
				action.type,
				selector,
				el ? "found" : "NOT FOUND",
				action.value !== undefined ? `value=${String(action.value).slice(0, 30)}` : "",
			);
		}

		// Scroll runs even when el is null (e.g. window scroll)
		if (action.type === "scroll") {
			window.scrollTo({ top: action.scrollY || 0, behavior: "smooth" });
		} else if (el) {
			if (!isCheckboxOrRadio) {
				el.classList.add("replay-highlight");
				await sleep(160);
			}

			if (action.type === "input") {
				if (action.value !== undefined) el.value = action.value;
				el.dispatchEvent(new Event("input", { bubbles: true }));
			} else if (action.type === "change") {
				if (action.value !== undefined) el.value = action.value;
				if (action.checked !== undefined) el.checked = action.checked;
				el.dispatchEvent(new Event("change", { bubbles: true }));
			} else if (action.type === "click") {
				if (!isCheckboxOrRadio) el.click();
			} else if (action.type === "mouseover") {
				el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
			}

			if (!isCheckboxOrRadio) {
				await sleep(100);
				el.classList.remove("replay-highlight");
			}
		}

		await sleep(PLAY_PAUSE[action.type] || 500);
	}

	if (RECORDING_DEBUG) {
		const taskItems = observeRoot.querySelectorAll("[data-qa='task-item']");
		console.log("[replay] after playback: task list item count", taskItems.length);
	}

	let manualResult = null;
	if (typeof o.testConfirm === "function") {
		manualResult = await o.testConfirm("Manual check (hover effects)", [
			"Add button hover effect exists",
			"Delete button hover shows a tooltip",
		]);
		if (!manualResult.ok && manualResult.errors && manualResult.errors.length) {
			console.warn("[replay] Manual check failed (unchecked):", manualResult.errors);
		}
	}

	const assertResult = runAssertionsInPage(lastRecording, observeRoot);
	const failureSummary = (() => {
		if (!assertResult.failures.length) return "";
		const key = (f) => `${f.selector} ${f.message}`;
		const counts = {};
		for (const f of assertResult.failures) {
			const k = key(f);
			counts[k] = (counts[k] || 0) + 1;
		}
		return Object.entries(counts)
			.map(([k, n]) => (n > 1 ? `${k} (${n}×)` : k))
			.join("; ");
	})();
	o("#playback-results-generated").html(
		assertResult.total === 0
			? "<p><strong>Generated assertions:</strong> none recorded</p>"
			: `<p><strong>Generated assertions:</strong> ${assertResult.passed}/${assertResult.total} passed${failureSummary ? ` — ${failureSummary}` : ""}</p>`,
	);
	o("#playback-results-manual").html(
		manualResult === null
			? "<p><strong>Manual check:</strong> skipped (o.testConfirm is dev-only)</p>"
			: manualResult.ok
				? "<p><strong>Manual check:</strong> Passed</p>"
				: `<p><strong>Manual check:</strong> Failed — unchecked: ${(manualResult.errors || []).join(", ")}</p>`,
	);
	o("#playback-results").css(null);

	// Record replay into tLog/tRes so the test overlay can show it
	if (typeof o.test === "function") {
		o.test(
			"Recorded playback",
			["Playback completed", () => true],
			[
				"Generated assertions",
				() => assertResult.total === 0 || assertResult.passed === assertResult.total,
			],
			[
				"Manual check",
				() =>
					manualResult == null
						? true
						: manualResult.ok
							? true
							: manualResult.errors && manualResult.errors.length
								? manualResult.errors.join("; ")
								: false,
			],
			() => {
				o(".o-tc-overlay").remove();
				if (typeof o.testOverlay === "function") {
					o.testOverlay();
					if (o.testOverlay.showPanel) o.testOverlay.showPanel();
				}
			},
		);
	}

	playIndicator.css({ display: "none" });
	updateLog(lastRecording.actions);

	o("#btn-start-rec").attr("disabled", null);
	o("#btn-play-rec").attr("disabled", null);
	o("#btn-clear-rec").attr("disabled", null);
	o("#btn-export-objs").attr("disabled", null);
	o("#btn-export-pw").attr("disabled", null);
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

const RECORDING_DEBUG = true; // set to false to disable replay/assertion logs

function normalizeText(s) {
	return (s || "").trim().replace(/\s+/g, " ");
}

// For task items, prefer .task-text content so we don't depend on "✕ Delete" in the assertion.
function getTextForAssertion(el, selector) {
	if (!el) return "";
	const isTaskItem =
		selector?.includes("task-item") &&
		!selector.includes("-cb") &&
		!selector.includes("-del");
	const primary = isTaskItem ? el.querySelector(".task-text") : null;
	const raw = primary ? primary.textContent : el.textContent;
	return normalizeText(raw || "");
}

// Normalize expected text for task items: strip "✕Delete" / tooltip so we compare title only.
function normalizeExpectedForTaskItem(selector, expectedText) {
	if (!expectedText) return "";
	const isTaskItem =
		selector?.includes("task-item") &&
		!selector.includes("-cb") &&
		!selector.includes("-del");
	if (!isTaskItem) return expectedText;
	return expectedText.replace(/\s*✕\s*Delete\s*$/i, "").trim() || expectedText;
}

// Run recording assertions in the current DOM; returns { passed, total, failures }.
function runAssertionsInPage(recording, root) {
	const assertions = recording.assertions || [];
	const deduped = assertions.filter(
		(a, i, arr) =>
			arr.findIndex(
				(x) =>
					x.selector === a.selector &&
					x.type === a.type &&
					x.actionIdx === a.actionIdx &&
					x.index === a.index,
			) === i,
	);
	let passed = 0;
	const failures = [];
	for (const a of deduped) {
		let el = null;
		let indexOutOfBounds = false;
		if (a.listSelector != null && a.index != null) {
			const items = root.querySelectorAll(a.listSelector);
			const item = items[a.index];
			if (item) {
				el = a.selector !== a.listSelector ? item.querySelector(a.selector) : item;
				if (!el && a.selector !== a.listSelector) el = item;
			} else {
				indexOutOfBounds = true; // list has fewer items than at record time
			}
		} else {
			const matches = root.querySelectorAll(a.selector);
			el = matches.length > 0 ? matches[0] : document.querySelector(a.selector);
			if (matches.length > 1 && RECORDING_DEBUG) {
				console.warn(
					"[assertion] selector matches multiple elements, using first:",
					a.selector,
					"count:",
					matches.length,
				);
			}
		}
		if (a.type === "visible") {
			const visible =
				el &&
				el.nodeType === 1 &&
				(el.offsetParent !== null ||
					(el.getBoundingClientRect && el.getBoundingClientRect().width > 0));
			const expectedRaw = normalizeText(a.text);
			const expectedText = normalizeExpectedForTaskItem(a.selector, expectedRaw);
			const actualText = getTextForAssertion(el, a.selector);
			const fullActual = el ? normalizeText(el.textContent) : "";
			const textOk =
				!expectedText ||
				actualText.indexOf(expectedText) !== -1 ||
				fullActual.indexOf(expectedText) !== -1 ||
				(expectedText.length > 0 && expectedText.indexOf(actualText) !== -1);
			if (visible && textOk) {
				passed += 1;
			} else {
				const message = indexOutOfBounds
					? `index out of bounds (list has ${root.querySelectorAll(a.listSelector || a.selector).length} items, assertion expected index ${a.index})`
					: !el
						? "element not found"
						: !visible
							? "not visible"
							: !textOk
								? "text mismatch"
								: "fail";
				failures.push({ selector: a.selector, message });
				if (RECORDING_DEBUG) {
					const detail = indexOutOfBounds
						? { listLength: root.querySelectorAll(a.listSelector).length, expectedIndex: a.index }
						: {
								expectedSnippet: expectedText.slice(0, 50),
								actualSnippet: actualText.slice(0, 50),
								fullActualSnippet: fullActual.slice(0, 80),
							};
					console.warn("[assertion]", a.selector, message, detail);
				}
			}
		} else if (a.type === "class") {
			const tokens = (a.className || "").trim().split(/\s+/).filter(Boolean);
			const hasClass =
				el && (tokens.length === 0 || tokens.every((c) => el.classList?.contains(c)));
			if (hasClass) {
				passed += 1;
			} else {
				const msg = indexOutOfBounds
					? `index out of bounds (list has ${root.querySelectorAll(a.listSelector).length} items, expected index ${a.index})`
					: !el
						? "element not found"
						: `expected class "${a.className}"`;
				failures.push({ selector: a.selector, message: msg });
				if (RECORDING_DEBUG && !el) {
					console.warn(
						"[assertion]",
						indexOutOfBounds ? "index out of bounds:" : "element not found:",
						a.selector,
						indexOutOfBounds
							? `(list has ${root.querySelectorAll(a.listSelector).length} items, expected index ${a.index})`
							: "(replay may not have created it)",
					);
				}
			}
		}
	}
	if (RECORDING_DEBUG && failures.length > 0) {
		const taskCount = root.querySelectorAll("[data-qa='task-item']").length;
		console.warn(
			"[assertion] after run: task items in DOM:",
			taskCount,
			"assertions:",
			deduped.length,
		);
	}
	return { passed, total: deduped.length, failures };
}

// ─── Assertions preview ───────────────────────────────────────

function showAssertionsPreview(recording) {
	const callout = o("#assertions-callout");
	const preview = o("#assertions-preview");
	const assertions = recording.assertions || [];
	if (!assertions.length) {
		callout.css({ display: "none" });
		return;
	}
	const deduped = assertions.filter(
		(a, i, arr) =>
			arr.findIndex(
				(x) =>
					x.selector === a.selector &&
					x.type === a.type &&
					x.actionIdx === a.actionIdx &&
					x.index === a.index,
			) === i,
	);
	const action = (idx) => recording.actions[idx];
	preview.html(
		deduped
			.map((a) => {
				const act = action(a.actionIdx);
				const actionLabel = act ? `${act.type} → ${act.target}` : `action ${a.actionIdx}`;
				const text =
					a.type === "visible"
						? `expect(<code>${a.selector}</code>).toBeVisible()${a.text ? ` + toContainText("${a.text.slice(0, 40)}")` : ""}`
						: `class changed on <code>${a.selector}</code>: "${a.className}"`;
				return `<div class="assert-item"><span class="assert-action">${actionLabel}</span><span class="assert-text">${text}</span></div>`;
			})
			.join(""),
	);
	callout.css(null);
}

// ─── Button wiring ────────────────────────────────────────────

o("#btn-start-rec").on("click", () => {
	taskSnapshot = captureSnapshot();
	o("#playback-results").css({ display: "none" });
	// observe: scope to task app so we record and play only item-list actions; MutationObserver and replay lookup use this root
	o.startRecording("#task-app");
	recIndicator.css(null);
	o("#btn-start-rec").attr("disabled", "");
	o("#btn-stop-rec").attr("disabled", null);
	o("#btn-play-rec").attr("disabled", "");
	actionLog.html('<p class="log-empty">Recording… interact with the task app.</p>');
});

o("#btn-stop-rec").on("click", () => {
	lastRecording = o.stopRecording();
	recIndicator.css({ display: "none" });
	o("#btn-start-rec").attr("disabled", null);
	o("#btn-stop-rec").attr("disabled", "");
	o("#btn-play-rec").attr("disabled", lastRecording.actions.length ? null : "");
	o("#btn-clear-rec").attr("disabled", null);
	o("#btn-export-objs").attr("disabled", null);
	o("#btn-export-pw").attr("disabled", null);
	updateLog(lastRecording.actions);
	showAssertionsPreview(lastRecording);
});

o("#btn-play-rec").on("click", () => {
	playRecording();
});

o("#btn-clear-rec").on("click", () => {
	lastRecording = null;
	taskSnapshot = null;
	recIndicator.css({ display: "none" });
	playIndicator.css({ display: "none" });
	o("#btn-clear-rec").attr("disabled", "");
	o("#btn-play-rec").attr("disabled", "");
	o("#btn-export-objs").attr("disabled", "");
	o("#btn-export-pw").attr("disabled", "");
	exportOutput.css({ display: "none" });
	ciHint.css({ display: "none" });
	o("#assertions-callout").css({ display: "none" });
	o("#playback-results").css({ display: "none" });
	actionLog.html('<p class="log-empty">No actions recorded yet.</p>');
});

o("#btn-export-objs").on("click", () => {
	if (!lastRecording) return;
	const code = o.exportTest(lastRecording);
	exportCode.el.textContent = code;
	exportLabel.el.textContent = "o.addTest() — Objs test";
	exportOutput.css(null);
	ciHint.css({ display: "none" });
});

o("#btn-export-pw").on("click", () => {
	if (!lastRecording) return;
	const code = o.exportPlaywrightTest(lastRecording, { testName: "Recorded task flow" });
	exportCode.el.textContent = code;
	exportLabel.el.textContent = "Playwright .spec.ts";
	exportOutput.css(null);
	ciHint.css(null);
});

o("#btn-copy").on("click", () => {
	const text = exportCode.el.textContent;
	navigator.clipboard?.writeText(text).then(() => {
		o("#btn-copy").html("Copied!");
		setTimeout(() => o("#btn-copy").html("Copy"), 1800);
	});
});

// ─── Try the test overlay (example) ───────────────────────────
// Test overlay is shown only after a test finishes (example test or replay), not on page open.

o("#btn-run-example-test").on("click", () => {
	const prevTTime = o.tTime;
	o.tTime = 30000; // 30s for manual check step in this example
	// Deterministic assertions so the overlay demo doesn't randomly fail
	o.test(
		"Example test (auto + manual)",
		["Simulated assertion 1", () => true],
		["Simulated assertion 2", () => true],
		[
			"Manual check (checklist then Continue)",
			(info) => {
				if (typeof o.testConfirm !== "function") {
					o.testUpdate(info, true);
					return;
				}
				return o.testConfirm("Manual check", [
					"Simulated assertion 1",
					"Simulated assertion 2",
				]);
			},
		],
		(testN) => {
			o.tTime = prevTTime;
			o(".o-tc-overlay").remove();
			o("#example-test-result").css(null);
			o("#example-test-result-generated").html(
				"<p><strong>Done.</strong> Results are shown in the test overlay.</p>",
			);
			o("#example-test-result-manual").html("");
			if (typeof o.testOverlay === "function") {
				o.testOverlay();
				if (o.testOverlay.showPanel) o.testOverlay.showPanel();
			}
		},
	);
});

// ─── Test function examples: runners ──────────────────────────
let exampleFixture;

function runExampleUnit() {
	const resultEl = o("#example-result-unit");
	resultEl.el.textContent = "";
	resultEl.attr("class", "test-example__result");
	o.tStyled = true; // HTML-formatted log in result div
	const cases = [
		["list container exists", () => !!document.querySelector("#task-app")],
		["store has tasks array", () => Array.isArray(taskStore.tasks)],
	];
	const added = o.addTest("Task list sanity", ...cases);
	o.runTest(added.testId);
	o.tStyled = false;
	const total = cases.length;
	const passed = o.tRes[added.testId] ? total : 0;
	resultEl.html(o.tLog[added.testId] || "");
	resultEl.addClass(
		passed === total ? "test-example__result--pass" : "test-example__result--fail",
	);
}

function runExampleHooks() {
	const resultEl = o("#example-result-hooks");
	resultEl.el.textContent = "";
	resultEl.attr("class", "test-example__result");
	o.tStyled = true;
	const cases = [["fixture is set", () => exampleFixture === 1]];
	const added = o.addTest("With hooks", ...cases, {
		before: () => {
			exampleFixture = 1;
		},
		after: () => {
			exampleFixture = 0;
		},
	});
	added.run();
	o.tStyled = false;
	const total = cases.length;
	const passed = o.tRes[added.testId] ? total : 0;
	resultEl.html(o.tLog[added.testId] || "");
	resultEl.addClass(
		passed === total ? "test-example__result--pass" : "test-example__result--fail",
	);
}

function runExampleRecorded() {
	const resultEl = o("#example-result-recorded");
	resultEl.el.textContent = "";
	resultEl.attr("class", "test-example__result");
	o.tStyled = true;
	const cases = [
		[
			'click on [data-qa="task-add-btn"]',
			() => {
				const el = document.querySelector('[data-qa="task-add-btn"]');
				if (!el) return "element not found";
				el.click();
				return true;
			},
		],
	];
	const added = o.addTest("Recorded test", ...cases);
	o.runTest(added.testId);
	o.tStyled = false;
	const total = cases.length;
	const passed = o.tRes[added.testId] ? total : 0;
	resultEl.html(o.tLog[added.testId] || "");
	resultEl.addClass(
		passed === total ? "test-example__result--pass" : "test-example__result--fail",
	);
}

function runExampleConfirm() {
	const resultEl = o("#example-result-confirm");
	resultEl.el.textContent = "";
	resultEl.attr("class", "test-example__result");
	if (typeof o.testConfirm !== "function") {
		resultEl.el.textContent = "o.testConfirm is dev-only (not available).";
		return;
	}
	resultEl.el.textContent = "Opening overlay… Check item and click Continue.";
	o.testConfirm("Manual check", ["Item verified"]).then((r) => {
		const text = r.ok ? "Passed" : `Failed — unchecked: ${(r.errors || []).join(", ")}`;
		resultEl.el.textContent = text;
		resultEl.attr("class", "test-example__result");
		resultEl.addClass(r.ok ? "test-example__result--pass" : "test-example__result--fail");
	});
}

const exampleRunners = {
	unit: runExampleUnit,
	hooks: runExampleHooks,
	recorded: runExampleRecorded,
	confirm: runExampleConfirm,
};

o(".test-example__run").on("click", function () {
	const id = o(this).attr("data-example");
	const resultId = `example-result-${id}`;
	const resultEl = o(`#${resultId}`);
	resultEl.el.textContent = "";
	const run = exampleRunners[id];
	if (!run) return;
	const btn = o(this);
	btn.attr("disabled", "");
	run();
	btn.attr("disabled", null);
});

// Hide indicators initially
recIndicator.css({ display: "none" });
playIndicator.css({ display: "none" });
