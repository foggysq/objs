# Objs v2.0 — Examples & Architecture Guide

All examples work as-is with `<script src="objs.js"></script>` or `import o from 'objs-core'`.
Runnable paste-and-run code: [examples.js](examples.js). Rules and conventions: [SKILL.md](SKILL.md).

**Conventions (from SKILL):** Use **refs** and **self.select(e)** in event handlers — not `e.target`, raw DOM, or class selectors. Use `.val()` for input/textarea/select; `attr(name, null)` to remove an attribute; `css(null)` to remove the `style` attribute. One state method per data slice; never call `.render()` to update.

---

## Contents

0. [Framework comparison & migration guide](#0-framework-comparison--migration-guide)
1. [How render works](#1-how-render-works)
2. [Single components — atoms](#2-single-components--atoms)
3. [Nesting & composition — three patterns](#3-nesting--composition)
4. [Design system architecture](#4-design-system-architecture)
5. [Real-world examples](#5-real-world-examples)
6. [React integration](#6-react-integration)

---

## 0. Framework comparison & migration guide

Coming from React, Vue, or Solid? This section maps familiar patterns to their Objs equivalents, so you can start writing productive code immediately.

### Feature comparison

| | React 18 | Vue 3 | Solid | Objs 2.0 |
|---|---|---|---|---|
| **Min + gz size** | ~45 kB | ~22 kB | ~7 kB | ~6 kB |
| **DOM update model** | Virtual DOM diff | Virtual DOM diff | Fine-grained signals | Direct — explicit state calls |
| **Reactivity** | `useState` / hooks | `ref` / `reactive` | `createSignal` | None — you call update methods |
| **Component format** | JSX function | SFC `.vue` / `setup()` | JSX function | Plain JS `states` object |
| **Build step required** | Yes | Yes | Yes | No — works as a `<script>` tag |
| **TypeScript** | Full generics | Full generics | Full generics | `.d.ts` definitions |
| **SSR** | React Server / Next.js | Nuxt | SolidStart | Built-in `o.reactRender` |
| **Routing** | React Router | Vue Router | @solidjs/router | Built-in `o.route` |
| **State sharing** | Context / Zustand | Pinia | Signals / stores | Plain observer or `o.connectRedux` |
| **Data fetching** | `useEffect` + fetch | `onMounted` + fetch | `createResource` | `o.newLoader` + `.connect()` |
| **Testing** | Jest / RTL / Vitest | Vitest | Vitest | Built-in `o.addTest` |
| **QA selectors** | `data-testid` (manual) | `data-testid` (manual) | `data-testid` (manual) | Auto via `o.autotag` |
| **Action recording** | Playwright / Cypress | Playwright / Cypress | Playwright / Cypress | Built-in `o.startRecording` |
| **Dev/prod split** | Manual | Manual | Manual | Built-in `__DEV__` + `build.js` |
| **Integrates into existing projects** | `createRoot(el)` | `createApp().mount(el)` | `render(() => …, el)` | `.appendInside(el)` |

> **Key difference:** React, Vue, and Solid track state automatically and re-render when it changes.
> Objs does not — you explicitly call `component.stateMethod(data)`, which writes only the changed DOM nodes.
> This gives you O(1) updates without a reactivity system or virtual DOM.

---

### Pattern 1 — Define and mount a component

The most basic operation: create a component with initial data and insert it into the page.

**React**
```jsx
function Badge({ count }) {
  return <span className="badge">{count}</span>;
}
ReactDOM.createRoot(document.getElementById('nav')).render(<Badge count={3} />);
```

**Vue 3**
```vue
<!-- Badge.vue -->
<template><span class="badge">{{ count }}</span></template>
<script setup>
defineProps(['count']);
</script>
```
```js
// main.js
import { createApp } from 'vue';
import Badge from './Badge.vue';
createApp(Badge, { count: 3 }).mount('#nav');
```

**Solid**
```jsx
import { render } from 'solid-js/web';
function Badge(props) {
  return <span class="badge">{props.count}</span>;
}
render(() => <Badge count={3} />, document.getElementById('nav'));
```

**Objs**
```js
const badge = o.init({
  name: 'Badge',
  render: ({ count }) => ({ tag: 'span', class: 'badge', html: count }),
}).render({ count: 3 }).appendInside('#nav');
```

---

### Pattern 2 — Counter (click to increment)

State that changes on user interaction.

**React**
```jsx
function Counter() {
  const [count, setCount] = React.useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Vue 3**
```vue
<template><button @click="count++">{{ count }}</button></template>
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>
```

**Solid**
```jsx
import { createSignal } from 'solid-js';
function Counter() {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>;
}
```

**Objs**
```js
// State lives in the element; events in state — no separate .on() needed
let counterRef;
const counter = o.init({
  name: 'Counter',
  render: { tag: 'button', html: '0', events: { click: () => counterRef.inc() } },
  inc: ({ self }) => { self.html(+self.el.textContent + 1); },
}).render().appendInside('#app');
counterRef = counter;
```

> In React/Vue/Solid, the framework schedules a re-render when state changes.
> In Objs, `inc()` writes `innerHTML` directly — no scheduler, no diff.

---

### Pattern 3 — Props / parameterized component

Pass data in at creation time.

**React**
```jsx
function Card({ title, price }) {
  return (
    <article>
      <h3>{title}</h3>
      <p className="price">${price}</p>
    </article>
  );
}
<Card title="Laptop" price={999} />
```

**Vue 3**
```vue
<template>
  <article>
    <h3>{{ title }}</h3>
    <p class="price">${{ price }}</p>
  </article>
</template>
<script setup>
defineProps(['title', 'price']);
</script>
```

**Solid**
```jsx
function Card(props) {
  return (
    <article>
      <h3>{props.title}</h3>
      <p class="price">${props.price}</p>
    </article>
  );
}
<Card title="Laptop" price={999} />
```

**Objs**
```js
const cardStates = {
  name: 'Card',
  render: ({ title, price }) => ({
    tag: 'article',
    html: `<h3>${title}</h3><p class="price">$${price}</p>`,
  }),
};
o.init(cardStates).render({ title: 'Laptop', price: 999 }).appendInside('#app');
```

---

### Pattern 4 — Targeted partial update

Update one part of a component without touching the rest.

In React/Vue, the framework diffs and patches. In Solid, only the signal's text node updates. In Objs, you explicitly name which DOM node to write to.

**React**
```jsx
// The whole Card function re-runs; React reconciles the output
function Card({ title }) {
  const [price, setPrice] = React.useState(999);
  return (
    <article>
      <h3>{title}</h3>
      <p className="price">${price}</p>
    </article>
  );
  // Caller: setPrice(89) — triggers rerender, React diffs and patches <p>
}
```

**Vue 3**
```vue
<template>
  <article>
    <h3>{{ title }}</h3>
    <p class="price">${{ price }}</p>
  </article>
</template>
<script setup>
import { ref } from 'vue';
defineProps(['title']);
const price = ref(999);
// Caller: price.value = 89 — Vue updates only the <p> text node
</script>
```

**Solid**
```jsx
// Only the text node that reads price() is updated — no component re-run
function Card(props) {
  const [price, setPrice] = createSignal(999);
  return (
    <article>
      <h3>{props.title}</h3>
      <p class="price">${price()}</p>
    </article>
  );
  // Caller: setPrice(89) — only the text node inside <p> changes
}
```

**Objs**
```js
const cardStates = {
  name: 'Card',
  render: ({ title, price }) => ({
    tag: 'article',
    html: `<h3>${title}</h3><p class="price">$${price}</p>`,
  }),
  // Direct write — no reactivity system, no scheduler, no diff
  setPrice: ({ self }, p) => { self.first('.price').html(`$${p}`); },
};
const card = o.init(cardStates).render({ title: 'Laptop', price: 999 }).appendInside('#app');
card.setPrice(89); // one innerHTML write, nothing else evaluated
```

---

### Pattern 5 — List rendering

Render a collection of items. Handle adding and removing individual items without re-rendering the whole list.

**React**
```jsx
function ProductList({ products }) {
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
  // When products changes, React re-diffs the entire list
}
```

**Vue 3**
```vue
<template>
  <ul>
    <li v-for="p in products" :key="p.id">{{ p.name }}</li>
  </ul>
</template>
<script setup>
import { ref } from 'vue';
const products = ref([]);
// When products.value changes, Vue patches the list
</script>
```

**Solid**
```jsx
import { createSignal } from 'solid-js';
import { For } from 'solid-js';
function ProductList() {
  const [products, setProducts] = createSignal([]);
  return (
    <ul>
      <For each={products()}>
        {p => <li>{p.name}</li>}
      </For>
    </ul>
  );
  // For only patches the changed item rows
}
```

**Objs**
```js
// One init, render(array) — one element per item (native)
const listStates = { name: 'ProductList', render: { tag: 'li', html: (p) => p.name } };
const ul = o.init({ render: { tag: 'ul' } }).render().appendInside('#app');
const list = o.init(listStates).render(products);
list.appendInside(ul.el);
// Re-render: list.render(products). Append/remove: list.select(i).el.remove(), then list.render(newProducts), etc.
```

---

### Pattern 6 — Conditional rendering (show / hide)

Show or hide a field based on a checkbox.

**React**
```jsx
function Form() {
  const [showCompany, setShowCompany] = React.useState(false);
  return (
    <div>
      <label>
        <input type="checkbox" onChange={e => setShowCompany(e.target.checked)} />
        {' '}Business account
      </label>
      {showCompany && <input name="company" placeholder="Company name" />}
    </div>
  );
  // React unmounts / remounts the input element when showCompany toggles
}
```

**Vue 3**
```vue
<template>
  <div>
    <label><input type="checkbox" v-model="show" /> Business account</label>
    <input v-if="show" name="company" placeholder="Company name" />
  </div>
</template>
<script setup>
import { ref } from 'vue';
const show = ref(false);
// v-if removes / recreates the DOM node; v-show would toggle display
</script>
```

**Solid**
```jsx
import { createSignal, Show } from 'solid-js';
function Form() {
  const [show, setShow] = createSignal(false);
  return (
    <div>
      <label>
        <input type="checkbox" onChange={e => setShow(e.target.checked)} />
        {' '}Business account
      </label>
      <Show when={show()}>
        <input name="company" placeholder="Company name" />
      </Show>
    </div>
  );
}
```

**Objs**
```js
// The company field is a full atom — show/hide are state methods on it
const companyField = o.init(FieldStates).render({ name: 'company', label: 'Company name' });
companyField.hide();

// events in state — change bubbles from the input to the label root
const bizBox = o.initState({
  tag: 'label', class: 'field',
  html: '<input type="checkbox" class="biz-check"> Business account',
  events: { change: (e) => { e.target.checked ? companyField.show() : companyField.hide(); } },
});
// DOM node is never removed — toggled with display:none/''. To unmount/remount use .unmount() / .appendInside()
```

---

### Pattern 7 — Shared state between distant components

A cart badge in the header and an "Add to cart" button deep in a product card both need to read from and write to the same count.

**React** — lift state up / Context
```jsx
const CartContext = React.createContext(null);

function App() {
  const [count, setCount] = React.useState(0);
  const addItem = () => setCount(c => c + 1);
  return (
    <CartContext.Provider value={{ count, addItem }}>
      <Header />      {/* reads count via useContext — rerenders on every count change */}
      <ProductList /> {/* calls addItem — triggers App rerender → Header rerender */}
    </CartContext.Provider>
  );
}
function Header() {
  const { count } = React.useContext(CartContext);
  return <nav><span className="badge">{count}</span></nav>;
}
```

**Vue 3** — Pinia store
```js
// store.js
import { defineStore } from 'pinia';
export const useCartStore = defineStore('cart', () => {
  const count = ref(0);
  const add = () => count.value++;
  return { count, add };
});
// Header.vue: const { count } = storeToRefs(useCartStore()) — only badge text updates
// ProductCard.vue: useCartStore().add()
```

**Solid** — shared signal
```js
// cart.js
import { createSignal } from 'solid-js';
const [cartCount, setCartCount] = createSignal(0);
export const addToCart = () => setCartCount(c => c + 1);
export { cartCount };
// Header.jsx: <span class="badge">{cartCount()}</span> — only this text node updates
// ProductCard.jsx: import { addToCart }; <button onClick={addToCart}>Add</button>
```

**Objs** — plain observer, no library
```js
// cart.js — just a plain object
const cartStore = { count: 0, listeners: [] };
export const addToCart = () => {
  cartStore.count++;
  cartStore.listeners.forEach(fn => fn(cartStore.count));
};

// header.js — subscribe: only this one innerHTML write per add
const navBadge = o.init(BadgeStates).render({ count: 0 }).appendInside('.nav');
cartStore.listeners.push(n => navBadge.setCount(n));

// product-card.js — publish
card.first('.add-btn').on('click', () => addToCart());
// No parent re-renders. No context. No signals. One function call → one DOM write.
```

---

### Pattern 8 — Async data fetch

Load data from an API and render it. Handle the loading state.

**React**
```jsx
function ProductList() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); });
  }, []);
  if (loading) return <p>Loading…</p>;
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

**Vue 3**
```vue
<template>
  <p v-if="loading">Loading…</p>
  <ul v-else>
    <li v-for="p in products" :key="p.id">{{ p.name }}</li>
  </ul>
</template>
<script setup>
import { ref, onMounted } from 'vue';
const products = ref([]);
const loading  = ref(true);
onMounted(() =>
  fetch('/api/products').then(r => r.json()).then(data => {
    products.value = data;
    loading.value  = false;
  })
);
</script>
```

**Solid**
```jsx
import { createResource, Show, For } from 'solid-js';
function ProductList() {
  const [products] = createResource(() =>
    fetch('/api/products').then(r => r.json())
  );
  return (
    <Show when={!products.loading} fallback={<p>Loading…</p>}>
      <ul><For each={products()}>{p => <li>{p.name}</li>}</For></ul>
    </Show>
  );
}
```

**Objs**
```js
const listStates = {
  name: 'ProductList',
  render: { tag: 'div', html: '<p class="loading">Loading…</p>' },
  load: ({ self }, products) => {
    self.el.innerHTML = '';
    o.init({ render: { tag: 'p', html: (p) => p.name } }).render(products).appendInside(self.el);
  },
  loadFailed: ({ self }) => { self.el.innerHTML = '<p class="loading">Failed to load. Retry?</p>'; },
};

const list = o.init(listStates).render().appendInside('#app');
const loader = o.newLoader(o.get('/api/products'));
list.connect(loader, 'load', 'loadFailed');
```

---

### Concept map — if you think in framework X

| Your mental model | React | Vue 3 | Solid | Objs |
|---|---|---|---|---|
| Component definition | `function Foo(props)` | `<script setup>` + `<template>` | `function Foo(props)` | `states` object |
| Create & mount | `createRoot(el).render(<Foo/>)` | `createApp(Foo).mount(el)` | `render(()=><Foo/>, el)` | `o.init(states).render(props).appendInside(el)` |
| Reactive value | `const [v, setV] = useState(x)` | `const v = ref(x)` | `const [v, setV] = createSignal(x)` | State method writing directly to DOM |
| Update a value | `setV(newVal)` → re-render | `v.value = newVal` → patch | `setV(newVal)` → fine patch | `comp.setState(newVal)` → direct write |
| Read in template | `{v}` | `{{ v }}` | `{v()}` | Not needed — state methods write directly |
| Props | function parameter | `defineProps()` | function parameter | `render(props)` argument |
| Events | `onClick={handler}` | `@click="handler"` | `onClick={handler}` | `events: { click }` in state or `.on('click', handler)` |
| Child ref | `useRef()` | `ref="name"` | `let el` / `ref` | `self.store.child = childInstance` |
| Lifecycle: mount | `useEffect(fn, [])` | `onMounted(fn)` | `onMount(fn)` | `init` state method called after render |
| Lifecycle: unmount | `useEffect` return fn | `onBeforeUnmount(fn)` | `onCleanup(fn)` | `comp.unmount()` |
| Shared state | Context / Zustand | Pinia | Signals / store | Plain observer or `o.connectRedux` |
| Fetch on mount | `useEffect` + `useState` | `onMounted` + `ref` | `createResource` | `o.newLoader` + `.connect()` |
| Conditional render | `{flag && <El/>}` | `v-if="flag"` | `<Show when={flag}>` | `comp.show()` / `comp.hide()` |
| List render | `arr.map(x => <El key>)` | `v-for="x in arr"` | `<For each={arr}>` | `render(arr)` — one element per item; or forEach in a state method |
| CSS class toggle | `className={flag?'a':'b'}` | `:class="{a: flag}"` | `classList={{a: flag}}` | `comp.toggleClass('a', flag)` |

---

## 1. How render works

The `render` state is the creation state. It accepts five different forms.

### 1a. Plain object — static element

The simplest form. All keys become HTML attributes; special keys (`html`, `style`, `dataset`, `class`, `append`, `children`) are handled by `transform()`.

```js
const badge = o.init({
  name: 'Badge',
  render: { tag: 'span', class: 'badge', html: '3' },
  update: ({ self }, n) => { self.html(n); },
}).render();
badge.appendInside('.nav');
badge.update(7); // writes only to this span's innerHTML
```

### 1b. Function returning an object — dynamic attributes

The function receives `{self, o, i, ...originalProps}`. All extra keys passed to `render(props)` are merged in.

> **Note:** Inside all state functions, `self` is the ObjsInstance. Use `self.first()`, `self.html()` etc. directly — `o(self)` works too but is redundant wrapping.

```js
const buttonStates = {
  name: 'Button',
  render: ({ variant = 'default', size = 'md', label }) => ({
    tag: 'button',
    class: `btn btn--${variant} btn--${size}`,
    html: label,
  }),
  setVariant: ({ self }, v) => { self.el.className = `btn btn--${v}`; },
  setLabel:   ({ self }, l) => { self.html(l); },
  setDisabled:({ self }, v) => { v ? self.attr('disabled', 'true') : self.attr('disabled', null); },
};

const btn = o.init(buttonStates).render({ variant: 'primary', label: 'Submit' });
btn.appendInside('#toolbar');
btn.setLabel('Saving…');  // only this element's innerHTML changes
btn.setDisabled(true);    // only this element's disabled attribute changes
```

### 1c. HTML string — unwrapped template

If the string contains exactly one root element it is unwrapped; otherwise a `div` wrapper is kept.

```js
// Single root element — unwrapped to <a>
o.initState('<a href="/" class="logo">Brand</a>').appendInside('header');
```

### 1d. Multiple instances — one init, many elements

Pass an **array of props** to `render()`. One ObjsInstance manages all elements.
State methods operate on **all** elements by default. Use `.select(i)` for one.

```js
const navLinkStates = {
  name: 'NavLink',
  render: ({ label, path }) => ({ tag: 'a', class: 'nav-link', html: label, href: path }),
  setActive: ({ self }, activePath) => {
    // 'self.el' is the element being iterated — transform() handles the loop internally
    // For multi-element operations, use self.find/self.forEach
    self.forEach(({ el }) => {
      el.classList.toggle('nav-link--active', el.getAttribute('href') === activePath);
    });
  },
};

const links = o.init(navLinkStates).render([
  { label: 'Home',     path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'About',    path: '/about' },
]);
// links.els = [<a>Home</a>, <a>Products</a>, <a>About</a>]
links.appendInside('.nav');
links.setActive('/products');          // updates all three (each checks its own href)
links.select(0).setActive('/');        // only first link
links.all();                           // back to all-elements mode
```

### 1e. The `append` key — live child components

Pass pre-built ObjsInstances into the render object. Their DOM elements are appended into the parent. Children are created once; only state methods need to update them later.

```js
const iconEl  = o.initState({ tag: 'span', class: 'btn-icon', html: '🛒' });
const labelEl = o.initState({ tag: 'span', class: 'btn-label', html: 'Cart' });

const cartBtn = o.init({
  name: 'CartButton',
  render: { tag: 'button', class: 'cart-btn', append: [iconEl, labelEl] },
  // Targeted update — only the label span changes
  setCount: ({ self }, n) => { self.store.label.html(n > 0 ? `Cart (${n})` : 'Cart'); },
}).render();

cartBtn.store.label = labelEl; // store reference for later updates
cartBtn.appendInside('.nav');
cartBtn.setCount(3);  // one innerHTML write on labelEl, nothing else touched
```

### 1f. The `children` key — positional reconciliation

Unlike `append` (which always adds), `children` replaces DOM nodes at each position — like a minimal reconciler. Use it when the order or count of child components changes.

```js
const gridStates = {
  name: 'CardGrid',
  render: { tag: 'div', class: 'grid' },
  // Returns an object — transform() applies it to the existing element
  reconcile: ({ self }, cards) => ({ children: cards.map(c => c.el) }),
};

const grid = o.init(gridStates).render().appendInside('#app');
const cards = products.map(p => o.init(cardStates).render(p));
grid.reconcile(cards);

// Reorder: only moved nodes get replaceWith(), unchanged nodes are untouched
cards.sort((a, b) => a.store.price - b.store.price);
grid.reconcile(cards);
```

---

### 1g. `ref` attributes and `self.refs`

Add a `ref="name"` attribute to any element in an HTML-string render. After `init`, every such element is available on the component as `component.refs.name` — an ObjsInstance wrapper, not a raw DOM node.

```js
let cardRef;
const cardStates = {
  name: 'ProductCard',
  render: ({ title, price }) => ({
    tag: 'article',
    className: 'card',
    html: `<h3 ref="title">${title}</h3>
           <p ref="price">$${price}</p>
           <button ref="addBtn">Add to cart</button>`,
    events: { click: (e) => { if (e.target.closest('button')) cardRef?.setAdded(); } },
  }),
  setAdded: ({ self }) => {
    const { addBtn } = self.refs;
    addBtn.html('✓ Added').attr('disabled', '');
  },
  updatePrice: ({ self }, newPrice) => {
    self.refs.price.html('$' + newPrice);
  },
};

const card = o.init(cardStates).render({ title: 'Widget', price: 9.99 }).appendInside('#app');
cardRef = card;
// card.refs.addBtn, card.refs.title — refs for selector-free updates
```

> In React, `useRef` accesses a single DOM node. Objs `refs` auto-collects all named children at init time — no `useRef` call per element, no `ref={myRef}` on every JSX tag.

---

## 2. Single components — atoms

Atoms are self-contained components with no children. They define only their own element and targeted update states.

### Button atom

```js
const ButtonStates = {
  name: 'Button',
  render: ({ label, variant = 'default', size = 'md', disabled = false }) => ({
    tag: 'button',
    class: `btn btn--${variant} btn--${size}`,
    html: label,
    ...(disabled ? { disabled: 'true' } : {}),
  }),
  setLabel:    ({ self }, l) => { self.html(l); },
  setVariant:  ({ self }, v) => { self.addClass(`btn--${v}`); },
  setDisabled: ({ self }, v) => { v ? self.attr('disabled', 'true') : self.attr('disabled', null); },
  setLoading:  ({ self }, v) => {
    self.toggleClass('btn--loading', v);
    v ? self.attr('disabled', 'true') : self.attr('disabled', null);
  },
};
```

### Badge atom

```js
const BadgeStates = {
  name: 'Badge',
  render: ({ count = 0, variant = 'primary' }) => ({
    tag: 'span',
    class: `badge badge--${variant}`,
    html: String(count),
    style: count === 0 ? 'display:none' : '',
  }),
  setCount: ({ self }, n) => {
    self.html(n);
    n === 0 ? self.css({ display: 'none' }) : self.css(null);  // css(null) removes style attribute
  },
};
```

### Input field atom

Use `ref="input"` and `ref="error"` so updates use refs (no class selectors). Use `.val()` for input value.

```js
const FieldStates = {
  name: 'FormField',
  render: ({ name, label, type = 'text', placeholder = '' }) => ({
    tag: 'div',
    class: 'field',
    html: `<label class="field__label">${label}</label>
           <input ref="input" type="${type}" name="${name}" placeholder="${placeholder}">
           <span ref="error" class="field__error"></span>`,
  }),
  setError:   ({ self }, msg) => {
    self.refs.input.addClass('field__input--error');
    self.refs.error.html(msg || '');
  },
  setSuccess: ({ self }) => {
    self.refs.input.removeClass('field__input--error').addClass('field__input--ok');
    self.refs.error.html('');
  },
  setIdle:    ({ self }) => {
    self.refs.input.removeClass('field__input--error').removeClass('field__input--ok');
    self.refs.error.html('');
  },
  getValue:   ({ self }) => self.refs.input.val(),
  show:       ({ self }) => { self.css(null); },
  hide:       ({ self }) => { self.css({ display: 'none' }); },
};
```

---

## 3. Nesting & composition

Four patterns for building composite components. Choose based on how the parent and children relate.

### Pattern A — refs (`ref` attribute in innerHTML)

Best for: a single component whose render output has named regions you need to update or wire (buttons, labels, blocks). No child components — just one root element with marked descendants.

Add `ref="name"` to elements in the `html` string. After init, `self.refs.name` is an ObjsInstance for that element — use it in state methods for selector-free updates and events.

```js
let cardRef;
const cardStates = {
  name: 'ProductCard',
  render: ({ self, title, price }) => ({
    tag: 'article',
    className: 'card',
    html: `<h3 ref="title">${title}</h3>
           <p ref="price">$${price}</p>
           <button ref="addBtn">Add to cart</button>`,
    events: { click: (e) => { if (e.target === self.refs?.addBtn?.el) cardRef?.setAdded(); } },
  }),
  setAdded: ({ self }) => {
    self.refs.addBtn.html('✓ Added').attr('disabled', 'true');  // use attr('disabled', null) to remove
  },
  updatePrice: ({ self }, newPrice) => {
    self.refs.price.html('$' + newPrice);
  },
};

const card = o.init(cardStates).render({ title: 'Widget', price: 9.99 }).appendInside('#app');
cardRef = card;
```

**When to update:** call `self.refs.name.html(...)`, `.attr()`, `.on()`, etc. No selectors, no child components to mount.

### Pattern B — Slot pattern

Best for: containers with named regions (cards, dialogs, panels, toolbars).

Parent defines named slot containers in `html`. Children fill them via `appendInside`. Parent tracks children in `self.store`.

**When to update:** call child's own state methods directly. The parent DOM is never touched.

```js
const CardStates = {
  name: 'Card',
  render: {
    tag: 'article',
    class: 'card',
    html: `<div class="card__header"></div>
           <div class="card__body"></div>
           <div class="card__footer"></div>`,
  },
  // Each slot setter unmounts the previous occupant and mounts the new one
  setHeader: ({ self }, comp) => {
    self.store.header?.unmount();
    self.store.header = comp;
    const slot = self.first('.card__header').el;
    slot.innerHTML = '';
    comp.appendInside(slot);
  },
  setBody: ({ self }, comp) => {
    self.store.body?.unmount();
    self.store.body = comp;
    const slot = self.first('.card__body').el;
    slot.innerHTML = '';
    comp.appendInside(slot);
  },
  setFooter: ({ self }, comp) => {
    self.store.footer?.unmount();
    self.store.footer = comp;
    const slot = self.first('.card__footer').el;
    slot.innerHTML = '';
    comp.appendInside(slot);
  },
};

// Assembly — each component is independent, card just hosts them
const card = o.init(CardStates).render().appendInside('#app');
const title   = o.init(ButtonStates).render({ label: 'Product Title', variant: 'ghost' });
const price   = o.init(BadgeStates).render({ count: 49 });
const buyBtn  = o.init(ButtonStates).render({ label: 'Add to cart', variant: 'primary' });

card.setHeader(title);
card.setBody(price);
card.setFooter(buyBtn);

// Update — zero DOM above the component
title.setLabel('New Product Name');  // only touches card__header's <button>
price.setCount(39);                  // only touches card__body's <span>
```

### Pattern C — append in render

Best for: molecules assembled from known atoms at creation time. Children are immutable after render.

Children are created before the parent and passed via `append`. The parent is a structural wrapper only.

```js
function createSearchBar() {
  // Build atoms first
  const input = o.init({
    name: 'SearchInput',
    render: { tag: 'input', class: 'search__input', placeholder: 'Search…', type: 'search' },
    clear: ({ self }) => { self.val(''); },
  }).render();

  const btn = o.init(ButtonStates).render({ label: '🔍', variant: 'icon' });

  // Parent wraps them via append — no html needed
  const bar = o.init({
    name: 'SearchBar',
    render: { tag: 'div', class: 'search-bar', append: [input, btn] },
    clear:    ({ self }) => { self.store.input.clear(); },
    getValue: ({ self }) => self.store.input.val(),
    focus:    ({ self }) => { self.store.input.el.focus(); },
  }).render();

  // Store references after render
  bar.store.input = input;
  bar.store.btn   = btn;

  // Wire events using stored refs — no DOM queries needed
  btn.on('click', () => {
    bar.el.dispatchEvent(new CustomEvent('search', { detail: bar.getValue(), bubbles: true }));
  });

  return bar;
}

const searchBar = createSearchBar().appendInside('.toolbar');
document.addEventListener('search', (e) => console.log('query:', e.detail));
```

### Pattern D — factory function with lazy child creation

Best for: dynamic lists with **complex per-item components** (e.g. cards with slots), O(1) per-item updates, or when children change at runtime.

For **simple lists** (one element per item, e.g. `<li>` text), use native `render(array)` and `.appendInside(ul.el)` — see Pattern 5.

Children are created inside a state method (not in render). The parent stores all child references and exposes methods to add, update, or remove individual items.

```js
const ListStates = {
  name: 'ProductList',
  render: { tag: 'ul', class: 'product-list' },

  // Called once when data arrives
  load: ({ self }, products) => {
    self.el.innerHTML = ''; // clear
    self.store.items = {};  // reset map

    products.forEach((product) => {
      const card = o.init(CardStates).render();
      const titleComp = o.init(ButtonStates).render({ label: product.title, variant: 'ghost' });
      const priceComp = o.init(BadgeStates).render({ count: product.price });

      card.setHeader(titleComp);
      card.setBody(priceComp);
      card.appendInside(self.el);

      // Store by product ID for O(1) targeted updates
      self.store.items[product.id] = { card, titleComp, priceComp, product };
    });
  },

  // Update a single item — only its components are touched
  updatePrice: ({ self }, { id, price }) => {
    self.store.items[id]?.priceComp.setCount(price);
  },

  // Remove a single item — only its node is removed
  remove: ({ self }, id) => {
    self.store.items[id]?.card.unmount();
    delete self.store.items[id];
  },

  // Add one item without re-rendering the list
  addItem: ({ self }, product) => {
    const card = o.init(CardStates).render();
    card.setHeader(o.init(ButtonStates).render({ label: product.title, variant: 'ghost' }));
    card.setBody(o.init(BadgeStates).render({ count: product.price }));
    card.appendInside(self.el);
    self.store.items[product.id] = { card, product };
  },
};

const list = o.init(ListStates).render().appendInside('#products');
const loader = o.newLoader(o.get('/api/products'));
list.connect(loader, 'load');

// Later — only the changed item's badge is touched
list.updatePrice({ id: 42, price: 39 });
```

---

## 4. Design system architecture

Objs maps naturally to Atomic Design. Each layer uses the composition pattern appropriate to its role.

```
Atoms      →  pure state objects, no children, no store
Molecules  →  append pattern (atoms assembled at creation)
Organisms  →  slot pattern (molecules mounted into named regions)
Templates  →  factory functions wiring organisms to data stores
```

### Layer 1 — Atoms (reusable state objects)

An atom is just a states object. Export it, share it, extend it.

```js
// atoms.js
export const ButtonStates   = { name: 'Button',   render: ..., setLabel: ..., setDisabled: ... };
export const BadgeStates    = { name: 'Badge',     render: ..., setCount: ... };
export const FieldStates    = { name: 'FormField', render: ..., setError: ..., setSuccess: ... };
export const AvatarStates   = { name: 'Avatar',    render: ({ src, alt }) => ({ tag:'img', class:'avatar', src, alt }) };
export const SpinnerStates  = { name: 'Spinner',   render: { tag:'div', class:'spinner' } };
```

Atoms should have **no `self.store` usage** and **no child components**. Every state method writes directly to the element or its immediate children (via `self.first()`).

### Layer 2 — Molecules (assembled atoms)

A molecule is a factory function that builds atoms, wires them together, and returns the parent component.

```js
// molecules.js
import { ButtonStates, BadgeStates } from './atoms.js';

export function createCartButton(initialCount = 0) {
  const badge  = o.init(BadgeStates).render({ count: initialCount });
  const icon   = o.initState({ tag: 'span', class: 'cart-icon', html: '🛒' });

  const btn = o.init({
    name: 'CartButton',
    render: { tag: 'button', class: 'cart-btn', append: [icon, badge] },
    setCount: ({ self }, n) => { self.store.badge.setCount(n); },
    setLoading: ({ self }, v) => { self.toggleClass('cart-btn--loading', v); },
  }).render();

  btn.store.badge = badge;
  btn.store.icon  = icon;
  return btn;
}

export function createIconButton(icon, label) {
  const iconEl  = o.initState({ tag: 'span', class: 'btn__icon', html: icon });
  const labelEl = o.initState({ tag: 'span', class: 'btn__label', html: label });

  const btn = o.init({
    name: 'IconButton',
    render: { tag: 'button', class: 'btn btn--icon', append: [iconEl, labelEl] },
    setIcon:  ({ self }, v) => { self.store.icon.html(v); },
    setLabel: ({ self }, v) => { self.store.label.html(v); },
  }).render();

  btn.store.icon  = iconEl;
  btn.store.label = labelEl;
  return btn;
}
```

### Layer 3 — Organisms (slot-based containers)

An organism uses the slot pattern. It defines its structure and exposes methods to mount molecules into named regions.

```js
// organisms.js
import { createCartButton, createSearchBar } from './molecules.js';

export const ToolbarStates = {
  name: 'Toolbar',
  render: {
    tag: 'header',
    class: 'toolbar',
    html: `<div class="toolbar__start"></div>
           <div class="toolbar__center"></div>
           <div class="toolbar__end"></div>`,
  },
  mount: ({ self }, { slot, comp }) => {
    const slotEl = self.first(`.toolbar__${slot}`).el;
    self.store[slot]?.unmount();
    self.store[slot] = comp;
    slotEl.innerHTML = '';
    comp.appendInside(slotEl);
  },
  // Expose slot accessors
  getSlot: ({ self }, slot) => self.store[slot],
};

// Template — assembles the toolbar, wires it to stores
export function createAppToolbar(cartStore) {
  const logo     = o.initState({ tag: 'a', class: 'logo', href: '/', html: 'Brand' });
  const search   = createSearchBar();
  const cartBtn  = createCartButton(0);

  const toolbar = o.init(ToolbarStates).render().appendInside('body');
  toolbar.mount({ slot: 'start',  comp: logo });
  toolbar.mount({ slot: 'center', comp: search });
  toolbar.mount({ slot: 'end',    comp: cartBtn });

  // Wire cart store — only the badge updates on change
  cartStore.listeners.push((items) => cartBtn.setCount(items.length));

  return { toolbar, search, cartBtn };
}
```

### Extending states (variant inheritance)

Extend an atom's states object with `Object.assign` to create specialised variants:

```js
// atoms.js
export const ButtonStates = { name: 'Button', render: ..., setLabel: ..., setDisabled: ... };

// Add a variant — extends without modifying the base
export const SubmitButtonStates = {
  ...ButtonStates,
  name: 'SubmitButton',
  render: ({ label = 'Submit', ...rest }) => ButtonStates.render({ label, variant: 'primary', ...rest }),
  // Adds loading state on top of atom's states
  submit: ({ self }) => {
    self.setDisabled(true);
    self.setLabel('Saving…');
    self.toggleClass('btn--loading', true);
  },
  reset: ({ self }) => {
    self.setDisabled(false);
    self.setLabel('Submit');
    self.toggleClass('btn--loading', false);
  },
};
```

### Update efficiency summary

| Update target | How to do it | DOM writes |
|---|---|---|
| Atom attribute | `atom.setLabel('x')` | 1 — direct innerHTML or setAttribute |
| Atom in molecule | `molecule.store.atom.setLabel('x')` | 1 — same atom write |
| Slot in organism | `organism.store.slot.stateMethod()` | 1 or more — only that slot's subtree |
| List item | `list.store.items[id].comp.update(data)` | 1+ — only that card |
| All list items | `list.reconcile(newOrder)` | replaceWith per changed position only |
| Full list reload | `list.load(newProducts)` | clears and re-creates |

---

## 5. Real-world examples

### 5a. Site navigation menu

Active route highlighting, mobile toggle. Uses multi-instance render for links.

```js
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

const toggleStates = {
  name: 'NavToggle',
  render: { tag: 'button', class: 'nav-toggle', html: '☰' },
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
    const toggle = o.init(toggleStates).render();

    links.appendInside(self.el);
    toggle.appendInside(self.el);

    // Store for later access
    self.store.links  = links;
    self.store.toggle = toggle;

    links.setActive(window.location.pathname);
    toggle.on('click', () => self.toggleClass('nav--open'));
  },
};

const menu = o.init(menuStates).render().appendInside('header');
menu.init(); // sets up children
```

### 5b. Product card list + cart badge

One shared cart store, two components subscribing to different state methods. Neither rerenders when the other updates.

```js
// ── Shared cart store (plain object with listeners) ───────────────────────
const cartStore = { items: [], listeners: [] };
const cartAdd = (product) => { cartStore.items.push(product); cartStore.listeners.forEach(fn => fn(cartStore.items)); };

// ── Cart badge in nav ─────────────────────────────────────────────────────
const cartBadge = o.init(BadgeStates).render({ count: 0 }).appendInside('.nav');
cartStore.listeners.push((items) => cartBadge.setCount(items.length));

// ── Product card ──────────────────────────────────────────────────────────
const productCardStates = {
  name: 'ProductCard',
  render: ({ title, price }) => ({
    tag: 'article',
    class: 'card',
    html: `<h3 ref="title">${title}</h3>
           <p ref="price">$${price}</p>
           <button ref="addBtn">Add to cart</button>`,
  }),
  setAdded: ({ self }) => {
    self.refs.addBtn.html('✓ Added').attr('disabled', 'true');
  },
};

// ── Product list (complex items: each row is a card with button; store refs for O(1) updates)
// For a simple list (e.g. just names), use render(products) and appendInside(ul.el) — see Pattern 5.
const productListStates = {
  name: 'ProductList',
  render: { tag: 'div', class: 'card-list' },
  load: ({ self }, products) => {
    self.store.cards = {};
    products.forEach((product) => {
      const card = o.init(productCardStates).render(product);
      card.appendInside(self.el);
      card.refs.addBtn.on('click', () => { cartAdd(product); card.setAdded(); });
      self.store.cards[product.id] = card;
    });
  },
};

const productList = o.init(productListStates).render().appendInside('#products');
productList.connect(o.newLoader(o.get('/api/products')), 'load');
```

### 5c. Overlay dialog with UTM auto-open

Promo dialog triggered by `?promo=CODE` URL parameter. sessionStorage prevents repeat shows.

```js
const PROMO_KEY = 'oTest-promo-shown';

let dialogRef;
const dialogStates = {
  name: 'PromoDialog',
  render: {
    tag: 'div', class: 'dialog-overlay', style: 'display:none',
    html: `<div class="dialog">
      <button ref="closeBtn">✕</button>
      <h2 ref="title"></h2>
      <p ref="body"></p>
      <a ref="cta" href="#">Get offer</a>
    </div>`,
    events: {
      click: (e) => { if (e.target === dialogRef?.refs?.closeBtn?.el || e.target === dialogRef?.el) dialogRef?.close(); },
    },
  },
  open: ({ self }, { title, body, cta, ctaUrl }) => {
    self.refs.title.html(title);
    self.refs.body.html(body);
    self.refs.cta.html(cta).attr('href', ctaUrl);
    self.css({ display: 'flex' });
    sessionStorage.setItem(PROMO_KEY, '1');
  },
  close: ({ self }) => { self.css(null); },
};

const dialog = o.init(dialogStates).render().appendInside('body');
dialogRef = dialog;

const promoCode = o.getParams('promo');
if (promoCode && !sessionStorage.getItem(PROMO_KEY)) {
  o.get('/api/promos/' + promoCode).then(r => r.json()).then(data => dialog.open(data));
}
```

### 5d. Filter drawer with two-way URL sync

Filters write to the URL and restore from it on page load. No reload needed.

```js
const getFilters = () => {
  const p = o.getParams();
  return { category: p.category || '', minPrice: p.minPrice || '', maxPrice: p.maxPrice || '' };
};

const applyFilters = (filters, productsLoader) => {
  const params = new URLSearchParams(filters);
  for (const [k, v] of [...params]) { if (!v) params.delete(k); }
  history.pushState({}, '', params.toString() ? '?' + params : window.location.pathname);
  productsLoader.reload(o.get('/api/products?' + params.toString()));
};

let drawerRef;
const drawerStates = {
  name: 'FilterDrawer',
  render: {
    tag: 'aside', class: 'drawer', style: 'transform:translateX(-100%)',
    html: `<button ref="closeBtn">✕</button>
           <h3>Filters</h3>
           <select ref="cat"><option value="">All</option><option value="electronics">Electronics</option></select>
           <input ref="min" type="number" placeholder="Min $">
           <input ref="max" type="number" placeholder="Max $">
           <button ref="applyBtn">Apply</button>
           <button ref="resetBtn">Reset</button>`,
    events: {
      click: (e) => {
        const d = drawerRef;
        if (!d?.refs) return;
        if (e.target === d.refs.closeBtn.el) d.close();
        else if (e.target === d.refs.applyBtn.el) { applyFilters(d.getValues(), productsLoader); d.close(); }
        else if (e.target === d.refs.resetBtn.el) { applyFilters({ category: '', minPrice: '', maxPrice: '' }, productsLoader); d.restore({ category: '', minPrice: '', maxPrice: '' }); }
      },
    },
  },
  open:    ({ self }) => { self.css({ transform: 'translateX(0)' }); },
  close:   ({ self }) => { self.css({ transform: 'translateX(-100%)' }); },
  restore: ({ self }, { category, minPrice, maxPrice }) => {
    self.refs.cat.val(category);
    self.refs.min.val(minPrice);
    self.refs.max.val(maxPrice);
  },
  getValues: ({ self }) => ({
    category: self.refs.cat.val(),
    minPrice:  self.refs.min.val(),
    maxPrice:  self.refs.max.val(),
  }),
};

const drawer = o.init(drawerStates).render().appendInside('body');
drawerRef = drawer;
drawer.restore(getFilters());

o.first('#open-filters').on('click', () => drawer.open());
```

### 5e. Complex form — validation, conditional fields, live preview

Each field is an independent atom. Validation state and submit gate are pure JS, not in the DOM.

```js
const validators = {
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email address',
  name:    v => v.trim().length >= 2                  || 'Minimum 2 characters',
  company: v => v.trim().length >= 1                  || 'Required for business accounts',
};

// ── Field atom (reuses FieldStates from section 2) ────────────────────────
const emailField   = o.init(FieldStates).render({ name: 'email',   label: 'Email',       placeholder: 'you@example.com' });
const nameField    = o.init(FieldStates).render({ name: 'name',    label: 'Full name',    placeholder: 'Jane Smith' });
const companyField = o.init(FieldStates).render({ name: 'company', label: 'Company name', placeholder: 'Acme Inc' });

// ── Checkbox (simple initState — no custom methods needed) ────────────────
const bizBox = o.initState({
  tag: 'label', class: 'field',
  html: '<input type="checkbox" name="isBusiness" class="biz-check"> Business account',
});

// ── Live preview ──────────────────────────────────────────────────────────
const previewStates = {
  name: 'FormPreview',
  render: { tag: 'div', class: 'preview', html: 'Preview: <b class="pv-name">—</b> &lt;<span class="pv-email">—</span>&gt;' },
  update: ({ self }, { name, email }) => {
    self.first('.pv-name').html(name || '—');
    self.first('.pv-email').html(email || '—');
  },
};
const preview = o.init(previewStates).render();

// ── Form organism (slot pattern) ──────────────────────────────────────────
const formStates = {
  name: 'RegistrationForm',
  render: {
    tag: 'form', class: 'form',
    html: '<div class="form__fields"></div><div class="form__preview"></div><button ref="submitBtn" type="submit" class="btn btn--primary" disabled>Submit</button>',
  },
  init: ({ self }) => {
    const fieldsRoot   = self.first('.form__fields').el;
    const previewRoot  = self.first('.form__preview').el;

    emailField.appendInside(fieldsRoot);
    nameField.appendInside(fieldsRoot);
    bizBox.appendInside(fieldsRoot);
    companyField.appendInside(fieldsRoot);
    preview.appendInside(previewRoot);

    companyField.hide();

    self.store.fields   = { emailField, nameField, companyField };
    self.store.preview  = preview;
    self.store.valid    = { email: false, name: false, company: true, isBiz: false };
  },
  checkSubmit: ({ self }) => {
    const v = self.store.valid;
    const ok = v.email && v.name && (!v.isBiz || v.company);
    self.refs.submitBtn.attr('disabled', ok ? null : 'true');
  },
};

const form = o.init(formStates).render().appendInside('#form-container');
form.init();

// ── Validation wiring ─────────────────────────────────────────────────────
const validate = (fieldComp, rule, value) => {
  const res = validators[rule](value);
  res === true ? fieldComp.setSuccess() : fieldComp.setError(res);
  return res === true;
};

emailField.refs.input
  .on('blur',  () => { form.store.valid.email = validate(emailField, 'email', emailField.getValue()); form.checkSubmit(); })
  .on('input', () => { preview.update({ name: nameField.getValue(), email: emailField.getValue() }); });

nameField.refs.input
  .on('blur',  () => { form.store.valid.name = validate(nameField, 'name', nameField.getValue()); form.checkSubmit(); })
  .on('input', () => { preview.update({ name: nameField.getValue(), email: emailField.getValue() }); });

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

companyField.refs.input
  .on('blur', () => { form.store.valid.company = validate(companyField, 'company', companyField.getValue()); form.checkSubmit(); });

form.on('submit', (e) => {
  e.preventDefault();
  const submitBtn = form.refs.submitBtn;
  submitBtn.setLoading?.(true);
  o.post('/api/register', { data: Object.fromEntries(new FormData(e.target)) })
    .then(r => r.json())
    .then(() => submitBtn.setLoading?.(false));
});
```

---

## 6. React integration

### Mode 1 — Objs inside a React ref (most common)

Mount an Objs component into a React-managed DOM node via `useRef`. Always unmount in the cleanup function.

```jsx
function ProductSection() {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    // Create Objs components inside useEffect — NOT in component body
    const list = o.init(productListStates).render().appendInside(containerRef.current);
    list.connect(o.newLoader(o.get('/api/products')), 'load');

    return () => list.unmount(); // required — prevents memory leak on unmount
  }, []); // empty deps — run once

  return <div ref={containerRef} />;
}
```

### Mode 2 — React context bridge (shared state, no React rerender)

`o.withReactContext` returns a React component that calls an Objs state method when context changes. It renders nothing — it is a pure side-effect bridge.

```jsx
// CartContext.js
export const CartContext = React.createContext({ items: [], addItem: () => {} });

// App.jsx
import { CartContext } from './CartContext';

function App() {
  const [items, setItems] = React.useState([]);
  const addItem = React.useCallback((item) => setItems(prev => [...prev, item]), []);

  return (
    <CartContext.Provider value={{ items, addItem }}>
      <Header />
      <ProductSection addItem={addItem} />
    </CartContext.Provider>
  );
}

// ProductSection.jsx — Objs grid with React context bridge
function ProductSection({ addItem }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    // All Objs components created inside useEffect
    const cartBadge = o.init(BadgeStates).render({ count: 0 });
    const grid = o.init(productListStates).render().appendInside(containerRef.current);

    // Wire the add-to-cart action to React's state setter
    grid.store.onAdd = (product) => {
      addItem(product); // React's useState → React header rerenders with new count
    };

    grid.connect(o.newLoader(o.get('/api/products')), 'load');

    // Store cartBadge on the ref so the bridge component can access it
    containerRef.current._cartBadge = cartBadge;

    return () => { grid.unmount(); cartBadge.unmount(); };
  }, []);

  // Bridge: CartContext.items → cartBadge.setCount (no React subtree rerender)
  // Created inline — React creates it once, re-runs only when context changes
  const CartBridge = React.useMemo(
    () => o.withReactContext(
      React,
      CartContext,
      ctx => ctx.items.length,
      // cartBadge may not exist yet on first render — the bridge handles undefined gracefully
      { setCount: (n) => containerRef.current?._cartBadge?.setCount(n) },
      'setCount'
    ),
    []
  );

  return (
    <div>
      <CartBridge />  {/* renders null — pure side effect */}
      <div ref={containerRef} />
    </div>
  );
}
```

### Mode 3 — Objs element as React element

Use `prepareFor(React)` to export a rendered Objs element into a React render tree.

```jsx
function AnimatedBadge({ count }) {
  const badge = React.useMemo(() => o.init(BadgeStates).render({ count }), []);

  React.useEffect(() => {
    badge.setCount(count);
  }, [count]);

  // Returns a React element that mounts the Objs DOM node
  return badge.prepareFor(React);
}
```

### Mode 4 — Bolt-on Playwright test generation for existing React apps

Live demo: [Recording & Test Generation](examples/recording/index.html) — task app with scoped `o.startRecording(observe)`, auto-generated assertions in the export, and the dev-only manual check overlay `o.testConfirm` after replay.

Add one script tag to `index.html` (dev/staging only, stripped from prod via the `__DEV__` block):

```html
<script src="objs.js"></script>
<script> o.autotag = 'qa'; </script>
```

Mark key React elements with stable QA selectors — three options:

```jsx
// A) Manual attribute
<button data-qa="checkout-btn" onClick={handleCheckout}>Checkout</button>

// B) o.reactQA() utility — converts CamelCase to kebab-case automatically
<button {...o.reactQA('CheckoutButton')} onClick={handleCheckout}>Checkout</button>
// → <button data-qa="checkout-button">

// C) Inline hook (no import needed)
const useQA = n => ({ 'data-qa': n.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') });
<button {...useQA('CheckoutButton')} onClick={handleCheckout}>Checkout</button>
```

From the browser console (or a QA toolbar injected into staging):

```js
o.startRecording();
// QA tester uses the app normally — clicks, fills forms, navigates
const rec = o.stopRecording();
console.log(o.exportPlaywrightTest(rec, { testName: 'Checkout flow' }));
```

Generated output — paste into `tests/checkout.spec.ts`:

```ts
// Auto-generated by o.exportPlaywrightTest() — review and anonymize mocks before committing
// Prerequisites: npm install @playwright/test && npx playwright install chromium
// Run: npx playwright test checkout.spec.ts
import { test, expect } from '@playwright/test';

test('Checkout flow', async ({ page }) => {
  // Network mocks — edit/anonymize before committing
  await page.route('**/api/cart', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ items: [], total: 0 }) });
  });

  // Set baseURL in playwright.config.ts: { use: { baseURL: 'https://staging.example.com' } }
  await page.goto('/checkout');

  await page.locator('[data-qa="email-field"]').fill('jane@example.com');
  await page.locator('[data-qa="checkout-button"]').click();

  // TODO: Add assertions before committing, e.g.:
  // await expect(page.locator('[data-qa="success-panel"]')).toBeVisible();
  // await expect(page).toHaveURL(/\/confirmation/);
});
```

> The `data-qa` selectors set by `o.autotag` or `o.reactQA()` are stable across deploys — they don't change when class names are renamed or elements are restructured.

### Key rules for React coexistence

| Rule | Reason |
|---|---|
| Create Objs components inside `useEffect`, not component body | Component body re-runs on every React render — Objs components would be recreated |
| Always call `component.unmount()` in the useEffect return | Prevents memory leaks and orphaned event listeners |
| Do not use `appendInside` with React-managed selectors | React may move or replace the DOM node — use `ref.current` |
| Use `o.withReactContext` for context→Objs data flow | Zero React rerender; direct Objs state call |
| Use React's `useState`/`useCallback` for Objs→React data flow | `addItem(product)` calls React's setter which triggers React's rerender in its own tree |
| Use `o.reactQA(name)` for stable test selectors | `data-qa` attributes survive CSS refactors and component restructuring |
