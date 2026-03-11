// ─── 1. Validation rules ─────────────────────────────────────────────────────

const rules = {
	name: (v) => v.trim().length >= 2 || "Enter at least 2 characters",
	email: (v) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Enter a valid email address",
	message: (v) => v.trim().length >= 10 || "Enter at least 10 characters",
};

const FIELDS = Object.keys(rules);

// ─── 2. Store ─────────────────────────────────────────────────────────────────

const formStore = o.createStore({
	values: { name: "", email: "", message: "", promo: "" },
	errors: { name: null, email: null, message: null, promo: null },
	touched: { name: false, email: false, message: false },
	status: "idle", // 'idle' | 'submitting' | 'success' | 'error'
	promoStatus: "idle", // 'idle' | 'checking' | 'valid' | 'invalid'
	discount: 0,

	set(field, value) {
		this.values[field] = value;
		if (this.touched[field]) this._validateField(field);
		this.notify();
	},

	blur(field) {
		this.touched[field] = true;
		this._validateField(field);
		this.notify();
	},

	_validateField(field) {
		const result = rules[field](this.values[field]);
		this.errors[field] = result === true ? null : result;
	},

	_validateAll() {
		for (const f of FIELDS) {
			this.touched[f] = true;
			this._validateField(f);
		}
	},

	isValid() {
		const fieldsOk = FIELDS.every(
			(f) => this.values[f].length > 0 && this.errors[f] === null,
		);
		return fieldsOk && this.promoStatus !== "checking";
	},

	// Valid codes: any 4-digit number not starting with 0.
	// Discount varies by last digit: 10 / 15 / 20 / 25 %.
	async checkPromo(code) {
		const trimmed = code.trim();

		if (!trimmed) {
			this.promoStatus = "idle";
			this.discount = 0;
			this.errors.promo = null;
			this.notify();
			return;
		}

		if (!/^\d{4}$/.test(trimmed)) {
			this.promoStatus = "idle";
			this.notify();
			return;
		}

		this.promoStatus = "checking";
		this.notify();

		await new Promise((r) => setTimeout(r, 700));

		if (trimmed[0] === "0") {
			this.discount = 0;
			this.promoStatus = "invalid";
			this.errors.promo = "This code has expired";
		} else {
			this.discount = [10, 15, 20, 25][Number.parseInt(trimmed.slice(-1), 10) % 4];
			this.promoStatus = "valid";
			this.errors.promo = null;
		}
		this.notify();
	},

	async submit() {
		this._validateAll();
		if (!this.isValid()) {
			this.notify();
			return;
		}

		this.status = "submitting";
		this.notify();

		try {
			await new Promise((r) => setTimeout(r, 1400));
			this.status = "success";
		} catch {
			this.status = "error";
		}
		this.notify();
	},

	reset() {
		this.values = { name: "", email: "", message: "", promo: "" };
		this.errors = { name: null, email: null, message: null, promo: null };
		this.touched = { name: false, email: false, message: false };
		this.status = "idle";
		this.promoStatus = "idle";
		this.discount = 0;
		this.notify();
	},
});

// ─── 3. Field atom ────────────────────────────────────────────────────────────

function createField(fieldName, cfg) {
	const isTextarea = cfg.tag === "textarea";

	const inputMarkup = isTextarea
		? `<textarea
        class="field__input"
        ref="input"
        id="f-${fieldName}"
        name="${fieldName}"
        placeholder="${cfg.placeholder || ""}"
        rows="${cfg.rows || 4}"></textarea>`
		: `<input
        class="field__input"
        ref="input"
        id="f-${fieldName}"
        type="${cfg.type || "text"}"
        name="${fieldName}"
        placeholder="${cfg.placeholder || ""}"
        autocomplete="${cfg.autocomplete || "off"}">`;

	const field = o
		.init({
			name: "FormField",
			render: () => ({
				className: "field",
				html: `<label class="field__label" for="f-${fieldName}">${cfg.label}</label>
             ${inputMarkup}
             <span class="field__error" ref="error" role="alert"></span>`,
			}),

			sync: ({ self, errors, touched, status }) => {
				const { input, error: errorEl } = self.refs;
				const isTouched = touched[fieldName];
				const error = errors[fieldName];

				if (status === "idle" && !isTouched) {
					input.val("").removeClass("field__input--error", "field__input--ok");
					errorEl.html("");
					return;
				}

				if (!isTouched) return;

				if (error) {
					input.addClass("field__input--error").removeClass("field__input--ok");
					errorEl.html(error);
				} else {
					input.addClass("field__input--ok").removeClass("field__input--error");
					errorEl.html("");
				}
			},
		})
		.render();

	const { input } = field.refs;
	input
		.on("input", (e) => formStore.set(fieldName, e.target.value))
		.on("blur", () => formStore.blur(fieldName));

	formStore.subscribe(field, "sync");
	return field;
}

// ─── 4. Promo code atom ───────────────────────────────────────────────────────

function createPromoField() {
	const field = o
		.init({
			name: "PromoField",
			render: () => ({
				className: "field",
				html: `<label class="field__label" for="f-promo">
               Promo code <span class="field__optional">optional — try any 4-digit number</span>
             </label>
             <input
               class="field__input"
               ref="input"
               id="f-promo"
               type="text"
               name="promo"
               placeholder="e.g. 1234"
               maxlength="4"
               inputmode="numeric"
               autocomplete="off">
             <span class="promo-badge" ref="badge" role="status"></span>`,
			}),

			sync: ({ self, promoStatus, discount, errors, status, values }) => {
				const { input, badge } = self.refs;

				if (status === "idle" && !values.promo) {
					input.val("").removeClass("field__input--error", "field__input--ok");
					badge.html("").setClass("promo-badge");
					return;
				}

				input.removeClass("field__input--error", "field__input--ok");

				if (promoStatus === "checking") {
					badge
						.html('<span class="spinner spinner--sm"></span>Checking…')
						.setClass("promo-badge promo-badge--checking");
				} else if (promoStatus === "valid") {
					badge
						.html(`✓ ${discount}% off applied!`)
						.setClass("promo-badge promo-badge--valid");
					input.addClass("field__input--ok");
				} else if (promoStatus === "invalid") {
					badge
						.html(errors.promo || "Code not found")
						.setClass("promo-badge promo-badge--invalid");
					input.addClass("field__input--error");
				} else {
					badge.html("").setClass("promo-badge");
				}
			},
		})
		.render();

	const { input: promoInput } = field.refs;
	promoInput.on("input", (e) => {
		clearTimeout(field.store.promoTimer);
		formStore.values.promo = e.target.value;
		if (!e.target.value.trim()) {
			formStore.checkPromo("");
		} else {
			field.store.promoTimer = setTimeout(
				() => formStore.checkPromo(e.target.value),
				500,
			);
		}
	});

	formStore.subscribe(field, "sync");
	return field;
}

// ─── 5. Submit button atom ────────────────────────────────────────────────────

const submitBtn = o
	.init({
		name: "SubmitButton",
		render: {
			tag: "button",
			className: "btn btn--primary btn--full",
			html: "Send message",
			type: "submit",
		},
		sync: ({ self, status, promoStatus, data }) => {
			if (status === "submitting") {
				self.html('<span class="spinner"></span>Sending…').attr("disabled", "true");
			} else if (promoStatus === "checking") {
				self
					.html('<span class="spinner spinner--dark"></span>Checking promo…')
					.attr("disabled", "true");
			} else {
				self.html("Send message").attr("disabled", data.isValid() ? null : "true");
			}
		},
	})
	.render();

formStore.subscribe(submitBtn, "sync");

// ─── 6. Success panel atom ────────────────────────────────────────────────────

const successPanel = o
	.init({
		name: "SuccessPanel",
		render: {
			className: "form__success",
			html: `<div class="success-icon">✓</div>
           <h3 class="success-title">Message sent!</h3>
           <p class="success-body">We'll get back to you shortly.</p>
           <div ref="discount"></div>
           <button type="button" class="btn btn--ghost" ref="reset">Send another message</button>`,
		},
		sync: ({ self, status, discount }) => {
			const { discount: discountEl } = self.refs;
			discountEl.html(
				discount > 0
					? `<span class="discount-badge">🎉 ${discount}% discount applied</span>`
					: "",
			);
			self.css(status === "success" ? { display: "flex" } : null);
		},
	})
	.render();

successPanel.css({ display: "none" });
const { reset } = successPanel.refs;
reset.on("click", () => formStore.reset());
formStore.subscribe(successPanel, "sync");

// ─── 7. Fields panel molecule ─────────────────────────────────────────────────

const submitRow = o
	.init({
		render: { className: "form__submit-row", append: [submitBtn] },
	})
	.render();

const fieldsPanel = o
	.init({
		name: "FieldsPanel",
		render: {
			className: "form__fields",
			append: [
				createField("name", {
					label: "Full name",
					placeholder: "Jane Smith",
					autocomplete: "name",
				}),
				createField("email", {
					label: "Email address",
					placeholder: "you@example.com",
					type: "email",
					autocomplete: "email",
				}),
				createField("message", {
					label: "Message",
					placeholder: "What's on your mind…",
					tag: "textarea",
					rows: 5,
				}),
				createPromoField(),
				submitRow,
			],
		},
		sync: ({ self, status }) => {
			self.css(status === "success" ? { display: "none" } : null);
		},
	})
	.render();

formStore.subscribe(fieldsPanel, "sync");

// ─── 8. Contact form organism ─────────────────────────────────────────────────

const contactForm = o
	.init({
		name: "ContactForm",
		render: {
			tag: "form",
			className: "contact-form",
			novalidate: "true",
			append: [fieldsPanel, successPanel],
		},
	})
	.render();

contactForm.on("submit", (e) => {
	e.preventDefault();
	formStore.submit();
});

// ─── 9. Drawer ────────────────────────────────────────────────────────────────

const drawer = o
	.init({
		name: "Drawer",
		render: {
			className: "drawer",
			html: `<div class="drawer__backdrop" ref="backdrop"></div>
           <div class="drawer__panel">
             <div class="drawer__header">
               <h2 class="drawer__title">Contact us</h2>
               <button type="button" class="btn btn--icon" aria-label="Close" ref="close">✕</button>
             </div>
             <div class="drawer__body" ref="body"></div>
           </div>`,
		},
		open: ({ self }) => {
			self.addClass("drawer--open");
			o("body").css({ overflow: "hidden" });
		},
		close: ({ self }) => {
			self.removeClass("drawer--open");
			o("body").css(null);
			formStore.reset();
		},
	})
	.render()
	.appendInside("body");

const { body, close, backdrop } = drawer.refs;
contactForm.appendInside(body);

close.on("click", () => drawer.close());
backdrop.on("click", () => drawer.close());
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && drawer.haveClass("drawer--open")) drawer.close();
});

// ─── 10. Page button ──────────────────────────────────────────────────────────

o.first("#open-drawer").on("click", () => drawer.open());
