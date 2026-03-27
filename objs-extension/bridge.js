/**
 * Objs extension bridge — runs in page MAIN world after objs-inject.js
 */
(function () {
	function ensureO() {
		if (typeof window.o === "undefined") {
			throw new Error("Objs is not loaded");
		}
	}

	/** Maps extension “Show succeeded” to o.tShowOk (whether OK step lines are written to o.tLog). */
	function applyTShowOkFromPayload(payload) {
		if (payload && payload.overlay && typeof payload.overlay.showSucceeded === "boolean") {
			window.o.tShowOk = payload.overlay.showSucceeded;
		}
	}

	/** Sets o.autotag (data-{name} for selectors); empty string clears it. */
	function applyAutotagFromPayload(payload) {
		if (!payload || typeof payload.autotag !== "string" || typeof window.o === "undefined") return;
		const s = payload.autotag.trim();
		window.o.autotag = s === "" ? undefined : s;
	}

	/** Same as recording example: draggable panel with o.tLog / o.tRes (pass/fail per test). */
	function showTestResultsOverlay() {
		const o = window.o;
		if (typeof o.testOverlay !== "function") return;
		try {
			o.testOverlay();
			if (o.testOverlay.showPanel) o.testOverlay.showPanel();
		} catch {
			/* ignore */
		}
	}

	window.__objsExtensionBridge = {
		ping() {
			return typeof window.o !== "undefined";
		},

		/** Open o.testOverlay() + results list on the page (same as after Play). */
		showTestOverlay(payload) {
			ensureO();
			applyTShowOkFromPayload(payload || {});
			showTestResultsOverlay();
			return { shown: true };
		},

		startRecording(payload) {
			ensureO();
			applyAutotagFromPayload(payload || {});
			const p = payload || {};
			const observe = p.observe ? String(p.observe) : undefined;
			const bag = {};
			if (observe) bag.observe = observe;
			if (p.strictCaptureAssertions) bag.strictCaptureAssertions = true;
			if (p.strictCaptureNetwork) bag.strictCaptureNetwork = true;
			if (p.strictCaptureWebSocket) bag.strictCaptureWebSocket = true;
			if (Object.keys(bag).length > 0) window.o.startRecording(bag);
			else window.o.startRecording();
			return { active: true };
		},

		stopRecording() {
			ensureO();
			return window.o.stopRecording();
		},

		/**
		 * Stop recording and return both raw recording and o.exportTest() JS (primary format for the extension).
		 */
		stopAndExport(payload) {
			ensureO();
			const recording = window.o.stopRecording();
			const options = Object.assign({}, (payload && payload.options) || {}, { extensionExport: true });
			const script = window.o.exportTest(recording, options);
			return { recording, script };
		},

		/**
		 * Run an o.exportTest() script: executes o.test(..., { sync: true }, ...) in-page and polls tFinalized.
		 * Legacy scripts with o.addTest are rewritten to o.test + sync (addTest + run() interleaves async steps wrong).
		 */
		runExportedTest(payload) {
			ensureO();
			applyAutotagFromPayload(payload || {});
			applyTShowOkFromPayload(payload);
			const code = String((payload && payload.code) || "");
			if (!code.includes("o.addTest") && !code.includes("o.test")) {
				throw new Error("Script must contain o.test(...) or o.addTest(...) from o.exportTest()");
			}
			let patched = code.trim();
			if (patched.includes("o.addTest")) {
				patched = patched.replace(
					/\bo\.addTest\s*\(\s*(['"])Recorded test\1\s*,\s*\[/,
					"const __objsExtensionTestRun = o.test($1Recorded test$1,"
				);
				patched = patched.replace(
					/\]\s*\n(\s*\/\/ Add manual checks[^\n]*)/,
					"],\n$1"
				);
				patched = patched.replace(
					/\n\s*\]\s*,\s*\(\)\s*=>\s*\{\s*\r?\n\s*\/\/ teardown/,
					",\n{ sync: true }, () => {\n  // teardown"
				);
			}
			if (!patched.includes("__objsExtensionTestRun")) {
				throw new Error("Expected const __objsExtensionTestRun from o.exportTest(); legacy addTest upgrade failed");
			}
			const fullCode = patched + "\nreturn __objsExtensionTestRun;";
			let testId;
			try {
				testId = new Function("o", fullCode)(window.o);
			} catch (e) {
				throw new Error((e && e.message) || String(e));
			}
			const tid = Number(testId);
			if (!Number.isFinite(tid) || tid < 0) {
				throw new Error("o.test did not return a valid test id");
			}
			return new Promise((resolve, reject) => {
				try {
					const deadline = Date.now() + 120000;
					let finished = false;
					const poll = () => {
						if (finished) return;
						if (window.o.tFinalized && window.o.tFinalized[tid]) {
							finished = true;
							showTestResultsOverlay();
							resolve({
								testId: tid,
								passed: !!window.o.tRes[tid],
							});
							return;
						}
						if (Date.now() > deadline) {
							finished = true;
							showTestResultsOverlay();
							resolve({
								testId: tid,
								passed: !!window.o.tRes[tid],
								timedOut: true,
							});
							return;
						}
						setTimeout(poll, 40);
					};
					setTimeout(poll, 0);
				} catch (e) {
					reject(e);
				}
			});
		},

		playRecording(payload) {
			ensureO();
			applyAutotagFromPayload(payload || {});
			applyTShowOkFromPayload(payload);
			const recording = payload.recording;
			const opts = Object.assign({ runAssertions: true }, payload.opts || {});
			return new Promise((resolve, reject) => {
				try {
					opts.onComplete = (assertionResult) => {
						showTestResultsOverlay();
						resolve({ assertionResult: assertionResult || null });
					};
					window.o.playRecording(recording, opts);
				} catch (e) {
					reject(e);
				}
			});
		},

		exportTest(payload) {
			ensureO();
			return window.o.exportTest(
				payload.recording,
				Object.assign({}, payload.options || {}, { extensionExport: true }),
			);
		},

		exportPlaywrightTest(payload) {
			ensureO();
			return window.o.exportPlaywrightTest(payload.recording, payload.options || {});
		},

		recorderActive() {
			if (typeof window.o === "undefined") return false;
			return !!(window.o.recorder && window.o.recorder.active);
		},
	};
})();
