/**
 * Objs Test Recorder — MV3 service worker
 *
 * UI opens via action.default_popup (sidepanel.html). No side_panel manifest key —
 * that key is Chromium-version-specific and triggers “Unrecognized manifest key” in
 * many browsers; popup works everywhere.
 *
 * Tab resolution: chrome.tabs.query({ active: true, lastFocusedWindow: true }) from the
 * popup often returns no tab (the popup window has focus). Resolve the last-focused
 * *normal* browser window’s active http(s) tab instead.
 */
async function getTargetTabId() {
	const tryUrl = (u) => u && /^https?:\/\//i.test(u);

	/* Prefer a normal browser window (not the extension popup) */
	try {
		const normalActive = await chrome.tabs.query({ active: true, windowType: "normal" });
		const na = normalActive.find((x) => tryUrl(x.url));
		if (na?.id != null) return na.id;
	} catch {
		/* windowType not supported in some builds */
	}

	const last = await chrome.windows.getLastFocused({ populate: true });
	if (last.type === "normal" && last.tabs) {
		const t = last.tabs.find((x) => x.active && tryUrl(x.url));
		if (t?.id != null) return t.id;
	}

	const wins = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
	for (const w of wins) {
		const t = w.tabs?.find((x) => x.active && tryUrl(x.url));
		if (t?.id != null) return t.id;
	}

	const any = await chrome.tabs.query({});
	const t = any.find((x) => x.active && tryUrl(x.url));
	if (t?.id != null) return t.id;

	throw new Error("Open an http(s) page in a normal tab and try again.");
}

async function ensureInjected(tabId) {
	const [check] = await chrome.scripting.executeScript({
		target: { tabId },
		world: "MAIN",
		func: () => ({
			hasO: typeof window.o !== "undefined",
			hasBridge: typeof window.__objsExtensionBridge !== "undefined",
		}),
	});
	const { hasO, hasBridge } = check.result || {};
	if (hasO && hasBridge) return;
	await chrome.scripting.executeScript({
		target: { tabId },
		world: "MAIN",
		files: ["lib/objs-inject.js", "bridge.js"],
	});
}

async function invokeBridge(tabId, method, arg) {
	await ensureInjected(tabId);
	const [out] = await chrome.scripting.executeScript({
		target: { tabId },
		world: "MAIN",
		func: async (payload) => {
			const b = window.__objsExtensionBridge;
			if (!b) return { error: "Bridge not loaded" };
			try {
				const fn = b[payload.method];
				if (typeof fn !== "function") return { error: "Unknown method: " + payload.method };
				const r = fn.call(b, payload.arg);
				if (r && typeof r.then === "function") {
					return { value: await r };
				}
				return { value: r };
			} catch (e) {
				return { error: String(e && e.message ? e.message : e) };
			}
		},
		args: [{ method, arg }],
	});
	const res = out.result;
	if (res.error) throw new Error(res.error);
	return res.value;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg.type === "getTabId") {
		getTargetTabId()
			.then((tabId) => sendResponse({ ok: true, tabId }))
			.catch((e) => sendResponse({ ok: false, error: String(e && e.message ? e.message : e) }));
		return true;
	}
	if (msg.type === "invoke") {
		const tabId = msg.tabId;
		if (tabId == null) {
			getTargetTabId()
				.then((id) => invokeBridge(id, msg.method, msg.arg))
				.then((r) => sendResponse({ ok: true, result: r }))
				.catch((e) => sendResponse({ ok: false, error: String(e && e.message ? e.message : e) }));
		} else {
			invokeBridge(tabId, msg.method, msg.arg)
				.then((r) => sendResponse({ ok: true, result: r }))
				.catch((e) => sendResponse({ ok: false, error: String(e && e.message ? e.message : e) }));
		}
		return true;
	}
	return false;
});
