# Objs v2.0 — AI Skill File

Use this file as a `.cursorrules` attachment, system prompt, or `@SKILL.md` reference to teach an AI assistant how to work with the Objs library.

---

## Library basics

### Loading

```html
<!-- Browser -->
<script src="objs.js"></script>
```

```js
// npm / bundler — correct file chosen automatically by package.json exports
import o from 'objs-core'; // resolves to objs.built.js
```

### The `o()` function

```js
o('#id')           // → ObjsInstance wrapping all matching elements
o('.class')        // → ObjsInstance wrapping all matching elements
o(domElement)      // → ObjsInstance wrapping one DOM element
o([el1, el2])      // → ObjsInstance wrapping element array
o(2)               // → ObjsInstance from o.inits[2] (previously inited component)
o()                // → empty ObjsInstance, used to start init chains
o.first('#id')     // → ObjsInstance, single element, same as querySelector
self.select(e)     // → select the element in state action or render with self in the parameters, returns Objs instance with e.target (e.g. the row); then .refs, .el apply to that row
```

---

## Running Objs in Node (SSR)

In Node, **o.D** is **o.DocumentMVP** — there is no real `document` or `window`. You can run Objs in Node to render components to HTML (e.g. for SSR or for verification): use `o.init(states).render()`; the result is a tree of plain objects; serialize with the same SSR path the app uses (e.g. `o.D.parseElement`). To self-check generated Objs code, you can run a Node script that requires Objs, calls `o.init(...).render()`, and inspects the output or HTML string — no browser or user review required for structure verification. Call **`.html()`** (no arguments) on the rendered ObjsInstance to get that HTML string (in Node it uses `o.D.parseElement` under the hood).

---

## Component model

A component is a **states object** passed to `o.init()`. Every key becomes a method on the component instance.

### State object keys

| Key | Meaning |
|---|---|
| `name` | Component name string — used for `o.autotag` data attribute |
| `render` | Reserved: defines the DOM element to create (tag, attributes, html) |
| `tag` / `tagName` | HTML element type (default: `div`) |
| `html` / `innerHTML` | Inner HTML of the element |
| `class` / `className` | CSS class (`className` is a React-familiar alias) |
| `style` | Inline style string or object |
| `dataset` | Object of `data-*` attributes |
| `events` | Object of `{eventName: handler}` added on creation |
| any other key | HTML attribute set via `setAttribute` |

**ObjsInstance properties after init:**

| Property | Description |
|---|---|
| `refs` | Object of `{ name: ObjsInstance }` — auto-populated from `ref="name"` child elements on `init` |
| `store` | Plain object for storing child components and other per-instance data |

### State function signature

Every non-render state is a function:

```js
stateName: ({ self, o, i, parent }, data) => {
  // self   — the ObjsInstance (has all methods: .first(), .html(), .attr(), .on(), etc.)
  // o      — the o() function for creating new instances or querying the global DOM
  // i      — index of current element in multi-element instances
  // parent — the ObjsInstance this component was appendInside() into, or null
  // data   — argument passed when the state is called: component.stateName(data)
}
```

Inside a state function, `self` is the ObjsInstance. Use `self.first()`, `self.html()`, `self.attr()` etc. directly — no need to re-wrap it with `o(self)`.

### Creating a component

```js
const buttonStates = {
  name: 'SubmitButton',                          // sets data-qa="submit-button" if o.autotag = "qa"
  render: { tag: 'button', class: 'btn', html: 'Submit' },
  disable: ({ self }) => { self.attr('disabled', 'true'); },
  enable:  ({ self }) => { self.attr('disabled', null); },  // null removes the attribute
  setLabel:({ self }, text) => { self.html(text); },
};

const btn = o.init(buttonStates).render();  // creates the DOM element
btn.appendInside('#form');                  // inserts it
btn.disable();                              // calls the disable state
btn.setLabel('Saving...');                  // calls with data
```

### Shorthand for simple elements

```js
// Render a single element without explicit states object
o.initState({ tag: 'span', class: 'badge', html: '3' }).appendInside('.nav');
```

---

## Selecting and querying elements

```js
o('.card').first('h3').html('New title');    // find first h3 inside each .card, set text
o('.card').find('button').on('click', fn);   // find all buttons inside all .cards
o('.card').select(0).addClass('featured');   // operate only on first .card

const el = o.first('.card').el;             // raw DOM element
const els = o('.card').els;                 // raw DOM array
```

---

## Events

```js
o(component).on('click', handler);
o(component).on('click, mouseover', handler);     // multiple events
o(component).off('click', handler);
o(component).offAll();                            // remove all listeners
o(component).offAll('click');                     // remove all click listeners

// Event delegation (listen on parent, match children)
o('#list').onDelegate('click', '.item', handler);
o('#list').offDelegate('click');  // removes all delegated listeners for event type

// Parent listener (one parent element; listener runs when event.target is inside Objs elements)
o('#list').onParent('click', '.parentBlock', handler);
o('#list').offParent('click', '.parentBlock');
```

---

## Granular store updates — the key pattern

**Rule: define one state method per data slice. Never call `.render()` to update — it recreates the element. Use targeted state methods for updates.**

```js
// WRONG — recreates the entire DOM element on every store change
o.connectRedux(store, s => s, card, 'render');

// CORRECT — each update only touches the affected part
const cardStates = {
  render: { tag: 'div', html: '<span class="name"></span> <span class="score"></span>' },
  updateName:  ({ self }, data) => { self.first('.name').html(data); },
  updateScore: ({ self }, data) => { self.first('.score').html(data); },
};
const card = o.init(cardStates).render();
o.connectRedux(store, s => s.userName,  card, 'updateName');   // only .name updates
o.connectRedux(store, s => s.userScore, card, 'updateScore');  // only .score updates
```

The `transform()` function inside the library already skips attributes whose value hasn't changed. Targeted state methods give you direct writes — O(1) per update, no diff.

---

## Store adapters

### Redux

```js
// Returns an unsubscribe function
const unsub = o.connectRedux(
  store,                      // Redux store
  state => state.cartItems,   // selector
  menuCart,                   // Objs component
  'updateCount'               // state method to call
);
unsub(); // disconnect
```

### MobX

```js
// Returns a disposer function
const dispose = o.connectMobX(
  mobx,                       // MobX instance
  appStore,                   // observable
  obs => obs.cartItems,       // accessor
  menuCart,
  'updateCount'
);
dispose();
```

### o.newLoader (built-in, for fetch/promise)

```js
const loader = o.newLoader(o.get('/api/data'));  // fires the request
component.connect(loader, 'render');             // calls component.render(data) when ready
component.connect(loader, 'render', 'showError'); // optional fail state
loader.reload(o.get('/api/data?page=2'));         // refetch with new request
```

### o.createStore (built-in reactive store)

```js
const cartStore = o.createStore({ items: [], total: 0 });

// Subscribe components — they receive store props merged into their state context
cartStore.subscribe(cartBadge, 'sync');    // cartBadge.sync({ items, total, self, o, i }) on each notify
cartStore.subscribe(cartDrawer, 'sync');

// Update and notify all subscribers
cartStore.items.push(product);
cartStore.total += product.price;
cartStore.notify(); // fires both cartBadge.sync() and cartDrawer.sync()

// Reset to original defaults
cartStore.reset();
```

### Plain callback (no adapter needed)

```js
const store = { value: 0, listeners: [] };
const notify = () => store.listeners.forEach(fn => fn(store.value));

store.listeners.push((v) => counter.updateCount(v));
store.value++;
notify();
```

---

## Component composition — nesting

A parent component stores child instances in its `.store` object. Children append inside the parent's element.

```js
const parentStates = {
  name: 'ParentCard',
  render: { tag: 'div', class: 'card', html: '<div class="header"></div><div class="body"></div>' },
  init: ({ self }) => {
    // Create children and store references
    self.store.header = o.init(headerStates).render().appendInside(self.first('.header').el);
    self.store.body   = o.init(bodyStates).render().appendInside(self.first('.body').el);
  },
  // Update only the relevant child — no rerender of parent
  updateTitle: ({ self }, title) => { self.store.header.setTitle(title); },
};

const card = o.init(parentStates).render().appendInside('#app');
card.init(); // sets up children
card.updateTitle('New title');
```

To access all components:
```js
o.inits          // array of all inited components
o.getStores()    // array of all .store objects
o.getListeners() // array of all .ie (event listener maps)
```

---

## React integration — three modes

### Mode 1: Objs inside a React ref (most common)

```jsx
function ProductSection() {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const grid = o.init(gridStates).render().appendInside(ref.current);
    return () => grid.unmount(); // cleanup on unmount
  }, []);

  return <div ref={ref} />;
}
```

### Mode 2: Objs element as a React element

```jsx
// In a React component:
const badge = o.init(badgeStates).render();
const reactEl = badge.prepareFor(React.createElement); // returns React element
return <div>{reactEl}</div>;
```

### Mode 3: Context bridge (shared state)

```jsx
const CartContext = React.createContext(null);

// In the React tree:
const CartBridge = o.withReactContext(React, CartContext, ctx => ctx.items, menuCart, 'updateCount');
// Mount anywhere inside <CartContext.Provider>:
return <CartContext.Provider value={cartState}><CartBridge /><OtherComponents /></CartContext.Provider>;
```

`CartBridge` renders nothing (`return null`). It calls `menuCart.updateCount(ctx.items)` on every context change — no React rerender of anything.

---

## QA autotag & React integration

```js
o.autotag = 'qa'; // set once, globally, before init() calls

// Each component with states.name gets data-qa="kebab-name" automatically
const btn = o.init({ name: 'SubmitButton', render: { tag: 'button' } }).render();
// Result: <button data-qa="submit-button" data-o-state="render" ...>

// Use in Playwright / Cypress:
// page.getByTestId('submit-button')  (with testIdAttribute: 'data-qa')
// cy.get('[data-qa="submit-button"]')
```

`o.autotag` is present in all builds — QA teams need stable selectors in staging/production.

### o.reactQA — bolt-on for React projects

```jsx
// Returns { 'data-qa': 'kebab-name' } for spreading onto React JSX elements
// Converts CamelCase to kebab-case. Respects o.autotag value.
<button {...o.reactQA('CheckoutButton')} onClick={fn}>Checkout</button>
// → <button data-qa="checkout-button">

// Works even when o.autotag is undefined (defaults to 'data-qa')
```

---

## Dev/prod split

`objs.js` is the source; `node build.js` produces `objs.built.js` and `objs.built.min.js`. Only the debug flag and debug logging are behind `__DEV__`; all other API is present in every build.

**Behind `__DEV__` (stripped when `__DEV__` is false):**
- `o.debug` flag and debug logging in `returner()`, `result.debug()`

**Always present (all builds — objs.js, objs.built.js, objs.built.min.js):**
- All DOM manipulation methods, states, events (including `onDelegate`, `offDelegate`, `onParent`, `offParent`)
- `o.autotag`, `o.reactQA`
- `o.startRecording`, `o.stopRecording`, `o.exportTest`, `o.exportPlaywrightTest`, `o.clearRecording`, `o.playRecording`
- `o.test`, `o.addTest`, `o.runTest`, `o.testUpdate`, `o.testOverlay`, `o.testConfirm` (assessors on staging can replay and see auto + manual results)
- `o.measure`, `o.assertVisible`, `o.assertSize` (layout assertions for tests)
- `o.newLoader`, `o.connectRedux`, `o.connectMobX`, `o.withReactContext`
- `o.route`, `o.router`, `o.inc`, `o.ajax`, `o.get`, `o.post`
- `o.setCookie`, `o.getCookie`, storage helpers
- `o.verify`, `o.safeVerify`, `o.specialTypes`

> **Security note:** `o.startRecording()` intercepts `window.fetch` and captures request/response bodies. Appropriate for staging; review before enabling on production.

---

## Testing patterns

### Unit test

```js
o.addTest('Button states',
  ['renders correctly', () => {
    const btn = o.init(buttonStates).render();
    return btn.el?.tagName === 'BUTTON';
  }],
  ['disable works', () => {
    btn.disable();
    return btn.el?.disabled === true;
  }],
);
```

### With lifecycle hooks

```js
o.addTest('Cart updates',
  ['adds item', () => { cartAdd({ id: 1 }); return cartStore.items.length === 1; }],
  { before: () => { cartStore.items = []; }, after: () => { cartStore.items = []; } }
);
```

### Measurement assertions

```js
o.addTest('Layout',
  ['menu is visible', () => o.assertVisible(menu.el)],
  ['button has correct width', () => o.assertSize(btn.el, { w: 120 })],
);
```

### Recording → Objs test

```js
// Available in all builds — record a session
o.startRecording();
// ... user interacts ...
const recording = o.stopRecording();
console.log(o.exportTest(recording)); // paste into your codebase as o.addTest()
```

### Recording → Playwright CI test

```js
// Available in all builds — works on any DOM including React
o.startRecording('#app');  // optional: scope MutationObserver to selector; returns observeRoot in recording
// ... QA tester uses the app ...
const recording = o.stopRecording();
// recording.assertions, recording.observeRoot when scoped
console.log(o.exportPlaywrightTest(recording, { testName: 'Checkout flow' }));
// → paste into tests/checkout.spec.ts → npx playwright test

// Options:
// { testName: 'My flow' }   — sets test() name
// { baseUrl: '/app' }       — overrides page.goto() path
```

Generated output includes:
- `page.route()` mocks for every intercepted `fetch` call
- `page.goto(relativePath)` — needs `baseURL` in playwright.config.ts
- Typed locator steps: `.fill()`, `.click()`, `.check()`, `.selectOption()`, `.hover()`
- Auto-inserted `expect()` from `recording.assertions` (visible, toContainText, class comments)

### Manual check overlay

`o.testConfirm(label, items?, opts?)` — All builds. Shows a draggable overlay "Label: Paused" with an optional checklist; returns `Promise<{ ok, errors? }>`. Use after replay for items that can't be asserted automatically (e.g. hover).

```js
const r = await o.testConfirm('Manual check', ['Hover effect exists']);
if (!r.ok) console.warn(r.errors);
```

### Reload-based e2e

```js
// Survives page reloads — useful for testing navigation
const { autorun } = o.addTest('Page flow',
  ['page title is correct', () => document.title === 'Home'],
  ['nav link works', (info) => {
    // mark as async, navigate, check on next load
    o.testUpdate(info, document.title === 'Products');
  }],
);
autorun(); // runs all tests in sequence, reloading between steps
```

### Test overlay (auto tests + manual results)

`o.testOverlay()` — All builds. Call once per page; shows a fixed 🧪 Tests button. For assessors: after replay, open the overlay to see if all auto tests passed and which manual checks failed.

```js
o.testOverlay(); // call once — shows a fixed button with live results (o.tLog / o.tRes)
```

---

## Runtime verification (o.verify, o.specialTypes)

Use **o.verify(pairs, safe?)** to check types at runtime—useful for function arguments, config, or API responses. **pairs** is an array of `[value, expectedTypes]` (e.g. `[[id, ['number']], [opts, ['object','undefined']]]`). Built-in: `typeof` names plus **o.specialTypes**: `notEmptyString`, `array`, `promise`. On failure: throws (or returns Error if **safe** true). **o.safeVerify(pairs)** returns boolean.

**Add global validators** by extending **o.specialTypes**: `o.specialTypes.myType = (val, type) => ...`. They are then available everywhere (your code and Objs internals), so you can use `o.verify([x, ['myType']])` consistently.

---

## Do / Don't

| Do | Don't |
|---|---|
| Use `self.first()`, `self.html()` etc. directly inside state functions | Re-wrap self: `o(self).first()` — works but is redundant |
| Call `.render()` once to create the element | Call `.render()` again to update — re-evaluates the render function, recreating any child components built inside it |
| Define one state method per data slice | Put all update logic in a single `update` state |
| Build child components in an `init` state or factory, store in `self.store` | Build child components inside the `render` function — they duplicate on every re-render |
| Set `o.autotag` before any `o.init()` calls | Set `o.autotag` after components have already rendered |
| Use `self.store` to hold child component references | Store children in external variables that may close over stale refs |
| Call `grid.unmount()` in React `useEffect` cleanup | Leave Objs components running after their React parent unmounts |
| Create Objs components inside `useEffect`, not in the React component body | Create Objs components in the React component body — they are recreated on every React render |
| Use `o.connectRedux` / `o.connectMobX` for live store connections | Manually subscribe and call `component.render()` on each change |
| Use `objs.built.js` or `objs.built.min.js` for distribution | Rely on `objs.prod.js` / `objs.dev.js` (no longer generated) |
| Use `states.name` for QA autotag | Manually add `data-qa` attributes — autotag keeps them in sync |
| Use `.val()` to get/set input value: `field.first('input').val('new')` | Access raw DOM: `field.first('input').el.value = 'new'` |
| Use `self.refs.name` to access named child elements | Use `self.first('[ref="name"]')` — refs gives ObjsInstance directly |
| Use `ref="name"` for elements the component needs to access (then `self.refs.name`) | Use `id` for component-owned elements — prefer ref so the instance owns the reference and avoids global id collisions |
| Use `attr('disabled', null)` to remove an attribute | Use `attr('disabled', '')` — empty string now _sets_ the attribute to `""` |
| Use `css(null)` to remove the `style` attribute entirely | Use `css({})` or `style('')` — those no longer remove the style |
| Use `o.reactQA('ComponentName')` for stable React test selectors | Write `data-testid` manually — `reactQA` converts CamelCase to kebab automatically |
| Use **self.select(e)** and **refs** in event handlers (close over `self` from render) | Use CSS classes (e.g. `e.target.closest('.field')`, `wrap.querySelector('.error')`) — brittle when classes are hashed (Nano CSS etc.) |
| Use Objs instances in handlers: **self.select(e).refs.input.val()**, **row.refs.error.html()** | Use global selectors, **e.target** and native DOM (`.value`, `.textContent`, `.classList`) — stay in Objs API for consistency and refs |

---

## Common mistakes

### Using global selectors, e.target and native DOM in event handlers

**Antipattern:** In event handlers, using `e.target` and raw DOM (e.g. `e.target.value`, `el.textContent`, `el.classList.add`) or global/document selectors to find and update elements. This bypasses Objs refs and the component instance.

```js
// BAD — raw DOM and e.target
handler: (e) => {
  const wrap = e.target.closest('.form-atom__field');
  const errEl = wrap?.querySelector('.form-atom__field-error');
  const valid = emailValid(e.target.value);
  if (!valid) errEl.textContent = 'Invalid email';
  wrap.classList.add('form-atom__field--error');
}
```

**Fix:** Close over **self** from render, use **self.select(e)** to get the row/component that contains the event, then use **refs** and Objs API (`.val()`, `.html()`, `.css()`, `.el` only when needed for e.g. classList).

```js
// GOOD — Objs instances and refs
render: ({ self, ...p }) => ({
  html: `<input ref="input" ...><span ref="error"></span>`,
  events: {
    blur: { targetRef: 'input', handler: (e) => {
      const row = self.select(e);
      if (!row.refs?.error) return;
      const value = row.refs.input.val();
      const valid = emailValid(value);
      if (!valid && value.trim()) {
        row.refs.error.html('Invalid email');
        row.el?.classList.add('form-atom__field--error');
      } else {
        row.refs.error.html(''); row.el?.classList.remove('form-atom__field--error');
      }
    } },
  },
}),
```

### Using CSS classes to find elements from an event target

**Antipattern:** Using `e.target.closest('.some-class')` or `wrap.querySelector('.child-class')` to find the component root or siblings. Class names are often generated (e.g. Nano CSS) and are brittle for structure.

**Fix:** Use **self.select(e)** (with `self` from render) so refs are updated for the row that contains the event; then use **row.refs.name** — no class-based lookups. Add `ref="name"` to elements you need to access.

---

## Full examples

See [EXAMPLES.md](EXAMPLES.md) for architecture guide and complete walkthroughs, and [examples.js](examples.js) for paste-and-run code.

**EXAMPLES.md sections:**
1. How render works — plain object, function, HTML string, multi-instance, `append`, `children`, `ref`/`refs`
2. Single components — atoms (Button, Badge, Field) with `val()`, `css(null)`, `addClass` spread
3. Nesting & composition — slot pattern, `append` in render, factory with dynamic children
4. Design system architecture — Atoms → Molecules → Organisms, `self.store`, update efficiency table
5. Real-world examples — menu, cart+cards, dialog, drawer+URL, complex form
6. React integration — four modes including bolt-on Playwright recording with `o.reactQA`
