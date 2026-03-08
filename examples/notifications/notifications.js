o.autotag = "qa";

// ─── Global notification store ────────────────────────────────────────────
// Any module calls notify.push() — no imports, no context, no hooks.
const notifyStore = o.createStore({ queue: [] });

const notify = {
	push({ type = "info", message = "", duration = 3500 }) {
		const id = Date.now() + Math.random();
		notifyStore.queue.push({ id, type, message, duration });
		notifyStore.notify();
		// Auto-dismiss
		setTimeout(() => {
			notifyStore.queue = notifyStore.queue.filter((t) => t.id !== id);
			notifyStore.notify();
		}, duration);
	},
};

// ─── Toast atom ───────────────────────────────────────────────────────────
const ToastStates = {
	name: "Toast",
	render: ({ id, type, message }) => ({
		tag: "div",
		className: `toast toast--${type}`,
		"data-id": id,
		html: `<span class="toast__icon">${{ success: "✓", error: "✕", info: "ℹ", warn: "⚠" }[type] || "ℹ"}</span>
           <span class="toast__msg">${message}</span>
           <button class="toast__close" aria-label="Dismiss">✕</button>
           <span class="toast__progress"></span>`,
	}),
};

// ─── Toast container organism ─────────────────────────────────────────────
const containerStates = {
	name: "ToastContainer",
	render: {
		tag: "div",
		className: "toast-container",
	},
	sync: ({ self }) => {
		// Reconcile current toasts with DOM
		const existing = {};
		self.find(".toast").forEach(({ el }) => {
			existing[el.dataset.id] = el;
		});

		// Remove dismissed
		Object.keys(existing).forEach((id) => {
			if (!notifyStore.queue.find((t) => String(t.id) === id)) {
				const el = existing[id];
				el.classList.add("toast--out");
				setTimeout(() => el.remove(), 300);
			}
		});

		// Add new
		notifyStore.queue.forEach((item) => {
			if (!existing[item.id]) {
				const toast = o.init(ToastStates).render(item);
				toast.appendInside(self.el);
				// Wire dismiss button
				toast.first(".toast__close").on("click", () => {
					notifyStore.queue = notifyStore.queue.filter((t) => t.id !== item.id);
					notifyStore.notify();
				});
			}
		});
	},
};

const toastContainer = o.init(containerStates).render().appendInside("#toast-root");
notifyStore.subscribe(toastContainer, "sync");

// ─── Demo buttons ─────────────────────────────────────────────────────────
o("#btn-success").on("click", () =>
	notify.push({ type: "success", message: "Changes saved successfully!" }),
);
o("#btn-error").on("click", () =>
	notify.push({ type: "error", message: "Failed to save. Please try again." }),
);
o("#btn-info").on("click", () =>
	notify.push({ type: "info", message: "Your session expires in 5 minutes." }),
);
o("#btn-warn").on("click", () =>
	notify.push({ type: "warn", message: "Unsaved changes will be lost." }),
);

o("#btn-async").on("click", (e) => {
	o(e.target).attr("disabled", "").html("Saving…");
	notify.push({ type: "info", message: "Saving to server…", duration: 2000 });

	// Simulate async operation
	setTimeout(() => {
		o(e.target).attr("disabled", null).html("Simulate async save");
		const success = Math.random() > 0.35;
		notify.push({
			type: success ? "success" : "error",
			message: success ? "Saved to server!" : "Server error — changes not saved.",
			duration: 4000,
		});
	}, 2000);
});
