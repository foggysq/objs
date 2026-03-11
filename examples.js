/**
 * Objs v2.0 — Runnable examples
 * <script src="objs.js"></script><script src="examples.js"></script>
 * Full architecture guide: EXAMPLES.md
 *
 * Sections:
 *   1. Atoms (reusable states objects)
 *   2. Molecules (assembled from atoms)
 *   3. Real-world examples
 */

// ─── SECTION 1: ATOMS ────────────────────────────────────────────────────────

const ButtonStates = {
	name: 'Button',
	render: ({ label = '', variant = 'default', size = 'md', disabled = false } = {}) => ({
		tag: 'button',
		class: `btn btn--${variant} btn--${size}`,
		html: label,
		...(disabled ? { disabled: 'true' } : {}),
	}),
	setLabel:    ({ self }, l) => { self.html(l); },
	setVariant:  ({ self }, v) => { self.el.className = `btn btn--${v}`; },
	setDisabled: ({ self }, v) => { v ? self.attr('disabled', 'true') : self.attr('disabled', null); },
	setLoading:  ({ self }, v) => {
		self.toggleClass('btn--loading', v);
		v ? self.attr('disabled', 'true') : self.attr('disabled', null);
	},
};

const BadgeStates = {
	name: 'Badge',
	render: ({ count = 0, variant = 'primary' } = {}) => ({
		tag: 'span',
		class: `badge badge--${variant}`,
		html: String(count),
		style: count === 0 ? 'display:none' : '',
	}),
	setCount: ({ self }, n) => {
		self.html(n);
		self.el.style.display = n === 0 ? 'none' : '';
	},
};

const FieldStates = {
	name: 'FormField',
	render: ({ name, label, type = 'text', placeholder = '' }) => ({
		tag: 'div',
		class: 'field',
		html: `<label class="field__label">${label}</label>
		       <input class="field__input" type="${type}" name="${name}" placeholder="${placeholder}">
		       <span class="field__error"></span>`,
	}),
	setError:   ({ self }, msg) => {
		self.first('.field__input').addClass('field__input--error');
		self.first('.field__error').html(msg || '');
	},
	setSuccess: ({ self }) => {
		self.first('.field__input').removeClass('field__input--error').addClass('field__input--ok');
		self.first('.field__error').html('');
	},
	setIdle:    ({ self }) => {
		self.first('.field__input').removeClass('field__input--error').removeClass('field__input--ok');
		self.first('.field__error').html('');
	},
	getValue:   ({ self }) => self.first('.field__input').el.value,
	show:       ({ self }) => { self.el.style.display = ''; },
	hide:       ({ self }) => { self.el.style.display = 'none'; },
};

// ─── SECTION 2: MOLECULES ─────────────────────────────────────────────────────

/**
 * Cart button molecule — icon + badge, assembled via append.
 * self.store.badge exposes targeted count updates.
 */
function createCartButton(initialCount = 0) {
	const badge = o.init(BadgeStates).render({ count: initialCount });
	const icon  = o.initState({ tag: 'span', class: 'cart-icon', html: '🛒' });

	const btn = o.init({
		name: 'CartButton',
		render: { tag: 'button', class: 'cart-btn', append: [icon, badge] },
		setCount:   ({ self }, n) => { self.store.badge.setCount(n); },
		setLoading: ({ self }, v) => { self.toggleClass('cart-btn--loading', v); },
	}).render();

	btn.store.badge = badge;
	btn.store.icon  = icon;
	return btn;
}

/**
 * Search bar molecule — input + button, events communicated via CustomEvent.
 * Callers: document.addEventListener('search', e => e.detail)
 */
function createSearchBar() {
	const input = o.init({
		name: 'SearchInput',
		render: { tag: 'input', class: 'search__input', placeholder: 'Search…', type: 'search' },
		clear:    ({ self }) => { self.el.value = ''; },
		getValue: ({ self }) => self.el.value,
	}).render();

	const btn = o.init(ButtonStates).render({ label: '🔍', variant: 'icon' });

	const bar = o.init({
		name: 'SearchBar',
		render: { tag: 'div', class: 'search-bar', append: [input, btn] },
		clear:    ({ self }) => { self.store.input.clear(); },
		getValue: ({ self }) => self.store.input.getValue(),
		focus:    ({ self }) => { self.store.input.el.focus(); },
	}).render();

	bar.store.input = input;
	bar.store.btn   = btn;

	btn.el.addEventListener('click', () => {
		bar.el.dispatchEvent(new CustomEvent('search', { detail: bar.getValue(), bubbles: true }));
	});

	return bar;
}

// ─── SECTION 3: REAL-WORLD EXAMPLES ──────────────────────────────────────────

// ─── 3a. Site navigation menu ─────────────────────────────────────────────────
function exampleMenu(mountSelector = 'header') {
	o.autotag = 'qa';

	const navLinkStates = {
		name: 'NavLink',
		render: ({ label, path }) => ({ tag: 'a', class: 'nav-link', html: label, href: path }),
		setActive: ({ self }, activePath) => {
			self.forEach(({ el }) => {
				el.classList.toggle('nav-link--active', el.getAttribute('href') === activePath);
			});
		},
	};

	const menuStates = {
		name: 'SiteMenu',
		render: { tag: 'nav', class: 'nav' },
		init: ({ self }) => {
			const links = o.init(navLinkStates).render([
				{ label: 'Home',     path: '/' },
				{ label: 'Products', path: '/products' },
				{ label: 'About',    path: '/about' },
			]);
			const toggle = o.init(ButtonStates).render({ label: '☰', variant: 'ghost' });

			links.appendInside(self.el);
			toggle.appendInside(self.el);

			self.store.links  = links;
			self.store.toggle = toggle;

			links.setActive(window.location.pathname);
			toggle.el.addEventListener('click', () => self.el.classList.toggle('nav--open'));
		},
	};

	const menu = o.init(menuStates).render().appendInside(mountSelector);
	menu.init();
	return menu;
}

// ─── 3b. Product card list + cart badge ──────────────────────────────────────
function exampleCartAndCards(listSelector = '#products', navSelector = '.nav') {
	const cartStore = { items: [], listeners: [] };
	const cartAdd   = (product) => {
		cartStore.items.push(product);
		cartStore.listeners.forEach(fn => fn(cartStore.items));
	};

	// Cart badge — granular: only its count changes on add
	const cartBadge = o.init(BadgeStates).render({ count: 0 }).appendInside(navSelector);
	cartStore.listeners.push((items) => cartBadge.setCount(items.length));

	const productCardStates = {
		name: 'ProductCard',
		render: ({ title, price }) => ({
			tag: 'article', class: 'card',
			html: `<h3 class="card__title">${title}</h3>
			       <p class="card__price">$${price}</p>
			       <button class="card__btn">Add to cart</button>`,
		}),
		// Granular: only button changes; card root never touched
		setAdded: ({ self }) => {
			self.first('.card__btn').html('✓ Added').attr('disabled', 'true');
		},
	};

	const productListStates = {
		name: 'ProductList',
		render: { tag: 'div', class: 'card-list' },
		load: ({ self }, products) => {
			self.store.cards = {};
			products.forEach((product) => {
				const card = o.init(productCardStates).render(product);
				card.appendInside(self.el);
				// card is already an ObjsInstance — use .first() directly
				card.first('.card__btn').on('click', () => {
					cartAdd(product);
					card.setAdded();
				});
				self.store.cards[product.id] = card;
			});
		},
	};

	const productList = o.init(productListStates).render().appendInside(listSelector);
	const loader = o.newLoader(o.get('/api/products'));
	productList.connect(loader, 'load');

	return { cartBadge, productList, cartStore };
}

// ─── 3c. Promo overlay with UTM auto-open ─────────────────────────────────────
function examplePromoDialog() {
	const PROMO_KEY = 'oTest-promo-shown';

	const dialogStates = {
		name: 'PromoDialog',
		render: {
			tag: 'div', class: 'dialog-overlay', style: 'display:none',
			html: `<div class="dialog">
				<button class="dialog__close">✕</button>
				<h2 class="dialog__title"></h2>
				<p class="dialog__body"></p>
				<a class="dialog__cta" href="#">Get offer</a>
			</div>`,
		},
		open: ({ self }, { title, body, cta, ctaUrl }) => {
			self.first('.dialog__title').html(title);
			self.first('.dialog__body').html(body);
			self.first('.dialog__cta').html(cta).attr('href', ctaUrl);
			self.el.style.display = 'flex';
			sessionStorage.setItem(PROMO_KEY, '1');
		},
		close: ({ self }) => { self.el.style.display = 'none'; },
	};

	const dialog = o.init(dialogStates).render().appendInside('body');
	// Direct .first()/.on() — no o(dialog) wrapper needed
	dialog.first('.dialog__close').on('click', () => dialog.close());
	dialog.on('click', (e) => { if (e.target === dialog.el) dialog.close(); });

	const promoCode = o.getParams('promo');
	if (promoCode && !sessionStorage.getItem(PROMO_KEY)) {
		o.get('/api/promos/' + promoCode).then(r => r.json()).then(data => dialog.open(data));
	}

	return dialog;
}

// ─── 3d. Filter drawer with URL sync ─────────────────────────────────────────
function exampleFilterDrawer(productsLoader, toggleSelector = '#open-filters') {
	const getFilters = () => {
		const p = o.getParams();
		return { category: p.category || '', minPrice: p.minPrice || '', maxPrice: p.maxPrice || '' };
	};
	const applyFilters = (filters) => {
		const params = new URLSearchParams(filters);
		for (const [k, v] of [...params]) { if (!v) params.delete(k); }
		const qs = params.toString();
		history.pushState({}, '', qs ? '?' + qs : window.location.pathname);
		productsLoader.reload(o.get('/api/products' + (qs ? '?' + qs : '')));
	};

	const drawerStates = {
		name: 'FilterDrawer',
		render: {
			tag: 'aside', class: 'drawer', style: 'transform:translateX(-100%)',
			html: `<button class="drawer__close">✕</button>
			       <select class="drawer__cat"><option value="">All</option><option value="electronics">Electronics</option></select>
			       <input class="drawer__min" type="number" placeholder="Min $">
			       <input class="drawer__max" type="number" placeholder="Max $">
			       <button class="drawer__apply">Apply</button>
			       <button class="drawer__reset">Reset</button>`,
		},
		open:      ({ self }) => { self.el.style.transform = 'translateX(0)'; },
		close:     ({ self }) => { self.el.style.transform = 'translateX(-100%)'; },
		restore:   ({ self }, { category, minPrice, maxPrice }) => {
			self.first('.drawer__cat').el.value = category;
			self.first('.drawer__min').el.value = minPrice;
			self.first('.drawer__max').el.value = maxPrice;
		},
		getValues: ({ self }) => ({
			category: self.first('.drawer__cat').el.value,
			minPrice:  self.first('.drawer__min').el.value,
			maxPrice:  self.first('.drawer__max').el.value,
		}),
	};

	const drawer = o.init(drawerStates).render().appendInside('body');
	drawer.restore(getFilters());

	drawer.first('.drawer__close').on('click', () => drawer.close());
	drawer.first('.drawer__apply').on('click', () => { applyFilters(drawer.getValues()); drawer.close(); });
	drawer.first('.drawer__reset').on('click', () => {
		const empty = { category: '', minPrice: '', maxPrice: '' };
		applyFilters(empty);
		drawer.restore(empty);
	});

	if (toggleSelector) { o.first(toggleSelector).on('click', () => drawer.open()); }

	return drawer;
}

// ─── 3e. Complex form — validation, conditional fields, live preview ──────────
function exampleForm(mountSelector = '#form-container') {
	const validators = {
		email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email address',
		name:    v => v.trim().length >= 2                  || 'Minimum 2 characters',
		company: v => v.trim().length >= 1                  || 'Required for business accounts',
	};

	// Atoms (FieldStates defined in section 1)
	const emailField   = o.init(FieldStates).render({ name: 'email',   label: 'Email',       placeholder: 'you@example.com' });
	const nameField    = o.init(FieldStates).render({ name: 'name',    label: 'Full name',    placeholder: 'Jane Smith' });
	const companyField = o.init(FieldStates).render({ name: 'company', label: 'Company name', placeholder: 'Acme Inc' });

	const bizBox = o.initState({
		tag: 'label', class: 'field',
		html: '<input type="checkbox" name="isBusiness" class="biz-check"> Business account',
	});

	const preview = o.init({
		name: 'FormPreview',
		render: { tag: 'div', class: 'preview', html: 'Preview: <b class="pv-name">—</b> &lt;<span class="pv-email">—</span>&gt;' },
		update: ({ self }, { name, email }) => {
			self.first('.pv-name').html(name || '—');
			self.first('.pv-email').html(email || '—');
		},
	}).render();

	// Form organism
	const formStates = {
		name: 'RegistrationForm',
		render: {
			tag: 'form', class: 'form',
			html: '<div class="form__fields"></div><div class="form__preview"></div><button type="submit" class="btn btn--primary" disabled>Submit</button>',
		},
		init: ({ self }) => {
			const fieldsRoot  = self.first('.form__fields').el;
			const previewRoot = self.first('.form__preview').el;

			emailField.appendInside(fieldsRoot);
			nameField.appendInside(fieldsRoot);
			bizBox.appendInside(fieldsRoot);
			companyField.appendInside(fieldsRoot);
			preview.appendInside(previewRoot);

			companyField.hide();
			self.store.valid = { email: false, name: false, company: true, isBiz: false };
		},
		checkSubmit: ({ self }) => {
			const v = self.store.valid;
			self.first('button[type="submit"]').el.disabled = !(v.email && v.name && (!v.isBiz || v.company));
		},
	};

	const form = o.init(formStates).render().appendInside(mountSelector);
	form.init();

	// Validation helper — pure JS, no DOM
	const validate = (fieldComp, rule, value) => {
		const res = validators[rule](value);
		res === true ? fieldComp.setSuccess() : fieldComp.setError(res);
		return res === true;
	};

	// Wire fields
	emailField.first('input')
		.on('blur',  (e) => { form.store.valid.email = validate(emailField, 'email', e.target.value); form.checkSubmit(); })
		.on('input', (e) => { preview.update({ name: nameField.getValue(), email: e.target.value }); });

	nameField.first('input')
		.on('blur',  (e) => { form.store.valid.name = validate(nameField, 'name', e.target.value); form.checkSubmit(); })
		.on('input', (e) => { preview.update({ name: e.target.value, email: emailField.getValue() }); });

	bizBox.first('.biz-check').on('change', (e) => {
		form.store.valid.isBiz = e.target.checked;
		if (e.target.checked) {
			companyField.show();
		} else {
			companyField.hide();
			companyField.setIdle();
			form.store.valid.company = true;
		}
		form.checkSubmit();
	});

	companyField.first('input')
		.on('blur', (e) => { form.store.valid.company = validate(companyField, 'company', e.target.value); form.checkSubmit(); });

	form.el.addEventListener('submit', (e) => {
		e.preventDefault();
		const submitBtn = form.first('button[type="submit"]');
		submitBtn.el.disabled = true;
		submitBtn.html('Saving…');
		o.post('/api/register', { data: Object.fromEntries(new FormData(e.target)) })
			.then(r => r.json())
			.then(() => { submitBtn.el.disabled = false; submitBtn.html('Submit'); });
	});

	return { form, emailField, nameField, companyField, preview };
}

// ─── 3f. React coexistence — see EXAMPLES.md section 6 for full JSX version ───
// Key APIs:
//   o.withReactContext(React, Context, selector, component, state) → bridge component
//   component.prepareFor(React)                                    → React element
//   component.unmount()                                            → useEffect cleanup
//   Create Objs components inside useEffect, NOT in component body
