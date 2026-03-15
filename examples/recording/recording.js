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

// ─── Playback ─────────────────────────────────────────────────

async function playRecording() {
	if (!lastRecording || !taskSnapshot) return;

	[
		"btn-start-rec",
		"btn-stop-rec",
		"btn-play-rec",
		"btn-test-rec",
		"btn-clear-rec",
		"btn-export-objs",
		"btn-export-pw",
	].forEach((id) => o(`#${id}`).attr("disabled", ""));

	playIndicator.css(null);

	restoreSnapshot(taskSnapshot);
	await sleep(400);

	// Use o.playRecording for playback — same execution path as Test, so assertions work
	const root = lastRecording.observeRoot || "#task-app";
	if (typeof o.playRecording === "function") {
		o.playRecording(lastRecording, {
			runAssertions: true,
			root,
			actionDelay: 200,
			manualChecks: [
				{
					afterAction: "end",
					label: "Manual check (hover effects)",
					items: [
						"Add button hover effect exists",
						"Delete button hover shows a tooltip",
					],
				},
			],
			onComplete: (assertionResult) => {
				playIndicator.css({ display: "none" });
				o("#btn-start-rec").attr("disabled", null);
				o("#btn-play-rec").attr("disabled", null);
				o("#btn-test-rec").attr("disabled", null);
				o("#btn-clear-rec").attr("disabled", null);
				o("#btn-export-objs").attr("disabled", null);
				o("#btn-export-pw").attr("disabled", null);
				const ar = assertionResult;
				const failureSummary =
					ar && ar.failures && ar.failures.length
						? (() => {
								const key = (f) => `${f.selector} ${f.message}`;
								const counts = {};
								for (const f of ar.failures) {
									const k = key(f);
									counts[k] = (counts[k] || 0) + 1;
								}
								return Object.entries(counts)
									.map(([k, n]) => (n > 1 ? `${k} (${n}×)` : k))
									.join("; ");
							})()
						: "";
				o("#playback-results-generated").html(
					!ar || ar.total === 0
						? "<p><strong>Generated assertions:</strong> none recorded</p>"
						: `<p><strong>Generated assertions:</strong> ${ar.passed}/${ar.total} passed${failureSummary ? ` — ${failureSummary}` : ""}</p>`,
				);
				o("#playback-results-manual").html(
					"<p><strong>Manual check:</strong> (in test overlay — complete the checklist and click Continue)</p>",
				);
				o("#playback-results").css(null);
				if (typeof o.testOverlay === "function") {
					o.testOverlay();
					if (o.testOverlay.showPanel) o.testOverlay.showPanel();
				}
			},
		});
	}
	updateLog(lastRecording.actions);
}

async function runTestRecording() {
	if (!lastRecording || !taskSnapshot) return;

	[
		"btn-start-rec",
		"btn-stop-rec",
		"btn-play-rec",
		"btn-test-rec",
		"btn-clear-rec",
		"btn-export-objs",
		"btn-export-pw",
	].forEach((id) => o(`#${id}`).attr("disabled", ""));

	playIndicator.css(null);
	restoreSnapshot(taskSnapshot);
	await sleep(400);

	if (typeof o.playRecording === "function") {
		o.playRecording(lastRecording, {
			runAssertions: true,
			root: "#task-app",
			manualChecks: [
				{
					afterAction: "end",
					label: "Manual check (hover effects)",
					items: [
						"Add button hover effect exists",
						"Delete button hover shows a tooltip",
					],
				},
			],
			onComplete: (assertionResult) => {
				playIndicator.css({ display: "none" });
				o("#btn-start-rec").attr("disabled", null);
				o("#btn-play-rec").attr("disabled", null);
				o("#btn-test-rec").attr("disabled", null);
				o("#btn-clear-rec").attr("disabled", null);
				o("#btn-export-objs").attr("disabled", null);
				o("#btn-export-pw").attr("disabled", null);
				const ar = assertionResult;
				const failureSummary =
					ar && ar.failures && ar.failures.length
						? (() => {
								const key = (f) => `${f.selector} ${f.message}`;
								const counts = {};
								for (const f of ar.failures) {
									const k = key(f);
									counts[k] = (counts[k] || 0) + 1;
								}
								return Object.entries(counts)
									.map(([k, n]) => (n > 1 ? `${k} (${n}×)` : k))
									.join("; ");
							})()
						: "";
				o("#playback-results-generated").html(
					!ar || ar.total === 0
						? "<p><strong>Generated assertions:</strong> (running as o.test steps)</p>"
						: `<p><strong>Generated assertions:</strong> ${ar.passed}/${ar.total} passed${failureSummary ? ` — ${failureSummary}` : ""}</p>`,
				);
				o("#playback-results-manual").html(
					"<p><strong>Manual check:</strong> (in test overlay — complete the checklist and click Continue)</p>",
				);
				o("#playback-results").css(null);
				if (typeof o.testOverlay === "function") {
					o.testOverlay();
					if (o.testOverlay.showPanel) o.testOverlay.showPanel();
				}
			},
		});
	}
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

const RECORDING_DEBUG = true; // set to false to disable replay/assertion logs
if (typeof o !== "undefined") o.recordingAssertionDebug = RECORDING_DEBUG;

// ─── Assertions preview ───────────────────────────────────────

function showAssertionsPreview(recording) {
	const callout = o("#assertions-callout");
	const preview = o("#assertions-preview");
	const assertions = recording.assertions || [];
	if (!assertions.length) {
		callout.css({ display: "none" });
		return;
	}
	const seen = new Set();
	const deduped = assertions.filter((a) => {
		const key = `${a.selector}|${a.type}|${a.actionIdx}|${a.index ?? ""}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	const action = (idx) => recording.actions[idx];
	preview.html(
		deduped
			.map((a) => {
				const act = action(a.actionIdx);
				const actionLabel = act ? `${act.type} → ${act.target}` : `action ${a.actionIdx}`;
				let text;
				if (a.type === "visible") {
					text = `expect(<code>${a.selector}</code>).toBeVisible()${a.text ? ` + toContainText("${a.text.slice(0, 40)}")` : ""}`;
				} else if (a.type === "class") {
					text = `expect(<code>${a.selector}</code>).toHaveClass("${(a.className || "").slice(0, 40)}")`;
				} else if (a.type === "style") {
					text = `expect(<code>${a.selector}</code>) style: "${(a.style || "").slice(0, 40)}"`;
				} else if (a.type === "hidden") {
					text = `expect(<code>${a.selector}</code>).toBe${a.hidden ? "Hidden" : "Visible"}()`;
				} else if (a.type === "disabled") {
					text = `expect(<code>${a.selector}</code>).toBe${a.disabled ? "Disabled" : "Enabled"}()`;
				} else if (a.type === "aria-expanded") {
					text = `expect(<code>${a.selector}</code>).toHaveAttribute("aria-expanded", "${a.ariaExpanded ?? ""}")`;
				} else if (a.type === "aria-checked") {
					text = `expect(<code>${a.selector}</code>).toHaveAttribute("aria-checked", "${a.ariaChecked ?? ""}")`;
				} else {
					text = `${a.type} on <code>${a.selector}</code>`;
				}
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
	o("#btn-test-rec").attr("disabled", "");
	actionLog.html('<p class="log-empty">Recording… interact with the task app.</p>');
});

o("#btn-stop-rec").on("click", () => {
	lastRecording = o.stopRecording();
	recIndicator.css({ display: "none" });
	o("#btn-start-rec").attr("disabled", null);
	o("#btn-stop-rec").attr("disabled", "");
	const hasActions = lastRecording.actions.length > 0;
	o("#btn-play-rec").attr("disabled", hasActions ? null : "");
	o("#btn-test-rec").attr("disabled", hasActions ? null : "");
	o("#btn-clear-rec").attr("disabled", null);
	o("#btn-export-objs").attr("disabled", null);
	o("#btn-export-pw").attr("disabled", null);
	updateLog(lastRecording.actions);
	showAssertionsPreview(lastRecording);
});

o("#btn-play-rec").on("click", () => {
	playRecording();
});

o("#btn-test-rec").on("click", () => {
	runTestRecording();
});

o("#btn-clear-rec").on("click", () => {
	lastRecording = null;
	taskSnapshot = null;
	recIndicator.css({ display: "none" });
	playIndicator.css({ display: "none" });
	o("#btn-clear-rec").attr("disabled", "");
	o("#btn-play-rec").attr("disabled", "");
	o("#btn-test-rec").attr("disabled", "");
	o("#btn-export-objs").attr("disabled", "");
	o("#btn-export-pw").attr("disabled", "");
	exportOutput.css({ display: "none" });
	ciHint.css({ display: "none" });
	o("#assertions-callout").css({ display: "none" });
	o("#playback-results").css({ display: "none" });
	actionLog.html('<p class="log-empty">No actions recorded yet.</p>');
});

o("#cb-show-ok").on("change", (e) => {
	o.tShowOk = !!e.target.checked;
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
	// Create overlay before test so the button exists; showPanel() will expand it when done
	if (typeof o.testOverlay === "function") o.testOverlay();
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
			o(".o-overlay-common").remove(); // remove manual-check overlay if still visible
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
