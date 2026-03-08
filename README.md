# Objs
> Fast and simple library to speed up developing by AI context friendly architecture, auto-tests recording, cache control and other. Develop new features without rewriting anything. Works standalone or alongside React. Examples and full documentation: [Full Documentation](https://en.fous.name/objs)

**AI-friendly** — one file, `SKILL.md` primer (~6,000 tokens). An LLM generates correct Objs code from a description without JSX, virtual DOM, or React lifecycle knowledge.

**React-developer-friendly** — familiar `className`, `ref`/`refs`, `o.createStore`. Add one script tag to an existing React app and get Playwright test generation without touching any components.

**Live examples** — real patterns in [`examples/`](examples/index.html), narrative walkthroughs in [`EXAMPLES.md`](EXAMPLES.md).

---

## Why Objs

**Already on React?** Add one script tag. Get Playwright test generation for your existing app — no architecture changes, no test IDs to write by hand.

- **Record → Playwright test in any React project** — `o.startRecording()` works across any DOM, React or not. `o.exportPlaywrightTest()` outputs a ready-to-run `.spec.ts` file. Add `{...o.reactQA('MyComponent')}` to React elements for stable selectors; `o.autotag` handles it automatically for Objs components.
- **~6,000 tokens to fully prime an AI** — attach `SKILL.md`, start generating correct code immediately. The React ecosystem needs 10–20× more context before an AI produces runnable output.
- **No stale closures, no dependency arrays, no re-render cascades** — the three most common React patterns AI generates broken code for, eliminated by design.

→ [Full comparison and live demo](examples/ai-workflow/index.html)

---

### Update v.1.2: New features for micro-service architecture and AI development

#### New
- **`val([value])`** `NEW` — Get/set `.value` on `input`/`textarea`/`select`
- **`refs` on ObjsInstance** `NEW` — Auto-collects `ref="name"` child elements as ObjsInstances on `init`
- **`className` in render** `NEW` — Alias for `class` in render descriptors (React familiarity)
- **`o.createStore(obj)`** `NEW` — Reactive store with `subscribe` / `notify` / `reset`
- **`o.reactQA(name)`** `NEW` — Returns `{ 'data-qa': 'kebab-name' }` for React JSX spread
- **`o.exportPlaywrightTest(recording, options?)`** `NEW` — Generates a ready-to-run Playwright `.spec.ts` from a recording
- **Tests auto-generation from user recordings** — record interactions, export as committed test code
- **Redux / MobX / React Context adapters** with granular-update listener pattern
- **TypeScript definitions** (`objs.d.ts`) covering the full public API
- **QA autotag** (`o.autotag`) — auto-sets `data-qa` from component name
- **Test overlay** — fixed UI panel with results and JSON export
- Data loaders/stores and connection to component state updates
- SSR (Server side render) and in-browser hydration
- Tests with page reload, Cookies and SS/LS deletion for e2e

#### Updated
- **`attr(attr, value)`** `UPDATED` — `null` removes the attribute; `""` sets it to empty string — _breaking change_
- **`style(value)`** `UPDATED` — `null` removes the `style` attribute entirely
- **`css(object|null)`** `UPDATED` — `null` removes the `style` attribute entirely
- **`addClass(...cls)`** `UPDATED` — Spread: `addClass('a', 'b', 'c')` applies all in one call
- **`removeClass(...cls)`** `UPDATED` — Spread: `removeClass('a', 'b', 'c')` removes all in one call
- **`o.startRecording()`** `UPDATED` — Now ships in all builds (not dev-only) — QA testers can record on staging
- **`o.stopRecording()`** `UPDATED` — Now ships in all builds
- **`o.exportTest()`** `UPDATED` — Now ships in all builds
- **Dev/prod build split** — `objs.js` (full) → `objs.prod.js` (dev code stripped via esbuild)

#### Fixes
- Object.assign() for state props to save input consistency
- `attr(name, null)` now correctly removes attributes; `attr(name, '')` sets empty string
- if test() gets a verification title without test function, it logs it as a text divider
- `.html('')` sets innerHTML to `''`
- append attribute in state adds child nodes, childNodes/children — replace and add children
- `.add(element)` works only for got elements (not inited)
- all Objs Cookies/LS/SS names start with `'oTest-'` or `'oInc-'`
- use `o().store = {}` to save component data instead of root properties
- `console.error()` for error output by default
- `o.inc()` can cache files from urls starting with protocol, if `o.incCors` is false (default)
- `o.first()` gets one element and runs `select(0)` automatically
- added parent check for `remove()` method


## Get started
Just import in your project or include script on the page.
```
npm i objs-core
```
```
<script src="objs.1.2.min.js" type="text/javascript"></script>
```




## Features

#### Develop
- Samples and state control
- Data store, Cookies and LS/SS control
- Events delegation

#### Test
- Sync/async, tests with reload
- Console & HTML output
- Autotests

#### Optimize
- Separate logic and samples
- Native micro-service architecture
- Async loading and preloading, cache




## Main principles

### Dynamic content

#### Create sample

To control elements Objs uses states. State - it's an information how to create or change DOM element. To create an element use `render` state with html (inner HTML) and tag attributes:
```
// state called render for timer example
const timerStates = {
	render: {
		tag: 'div',
		class: 'timer',
		html: 'Seconds: <span>0</span>',
	}
}
```
- `render` could be a string if you use HTML samples (see [documentation](https://fous.name/objs/documentation/?parameter=value#states)): 
`'<div class="timer">Seconds:<span>0</span></div>'`
- default tag is `div` (if tag is undefined)
- attributes `dataset` and `style` can be object type
- to append elements inside - use `append` with DOM element/Objs or an array of them as a value

#### States

Then add a new state that will start and finish counting. Number will be stored in the object itself - `self` object. So the state will be a function that gets `self`, creates a variable, increments it by interval and shows as innerHTML of `span`:
```
// new timer states object
const timerStates = {
	render: {
		class: 'timer',
		html: 'Seconds: <span>0</span> ',
	},
	start: ({self}) => {
		// save number or create
		self.n = self.n || 0;
		// start interval
		self.interval = setInterval(() => {
			self.n++;
			o(self).first('span').html(self.n);
		}, 1000);
	},
	stop: ({self}) => {
		clearInterval(self.interval);
	}
}
```
- every state gets object with
`self` - Objs object
`o` - o-function to use inside
`i` - index of the current element in Objs object

#### Append in DOM

The last thing is to create and append element on the page. To do this - init states, render object and start timer... And also - append it.
```
// create and start timer
const timer = o.init(timerStates)
	.render()
	.start()
	.appendInside('#simpleTimer');

// stop timer
timer.stop();
```

#### Main settings

`o.showErrors` – turn on/off showing errors (false)
`o.errors` – an array of all hidden errors, can be logged by `o.logErrors()` for debug
`o.onError` – a function than will be called with an error as an argument

> This and some more complex live examples are in the [full documentation](https://fous.name/objs). There are lots of useful methods and settings.





## Functions
Almost all functions return control object with methods, let's call it **Objs**.

### Core functions
`o(q)` – gets elements to control object. If [string] - by **querySelectorAll(q)** into control object, if DOM element or an array of them - gets them, if [number] - gets control object from **o.inits[q]**.

`o.first(q)` – gets element to control by **querySelector(q)**.

`o.take(q)` – gets elements like **o(q)** from DOM but if there is just one element or equal number of elements to inited in **o.inits[]** before, gets all inited elements and their methods.

#### States control
`o.init(states)` – returns **Objs**, creates method(s) for each state to create, change elements. State called **render** is reserved for creation elements. **states** can be [string], [object], [function] that returns [string] or [object]. After **init()** **Objs** gets a **initID** parameter for a saved object in **o.inits**. More info about structure and features [here](https://fous.name/objs).

`o.initState(state, [props])` – inite method and call it with props, e.g. to render/create element. **Objs** gets a **.initID** parameter for a saved object in **o.inits[]**.

`o.inits[initID]` – an array of all inited objects. Available by index **initID** or **o.take()**.

`o.showErrors` – false as default, but all errors are saved in **o.errors[]**

`o.errors` – an array of all errors

`o.logErrors()` – a function to log all hidden errors in console

`o.onError(error)` – a function that called if an error happens, set it for your needs

#### AJAX
`o.get(url, [props])` – returns promise for GET AJAX, **data** in **props** as an [object] will be converted to string parameters.

`o.post(url, props)` – returns promise for POST AJAX, **data** in **props** as an [object] will be converted to body.

`o.ajax(url, props)` – returns propmise for AJAX, needs **method** in **props** equal to GET or POST, **data** will be converted for GET/POST format.

`o.getParams([key])` – returns GET **key** value or an object with all GET parameters.

#### Include / load JS, CSS, images
`o.inc(sources, [callBack, callBad])` – returns [number] **setID**, gets **souces** is an object like {nameID: url, ...} where **nameID** is unique ID, **url** link to JS, CSS or image, **callBack** – function to run after everything is loaded successfully, **callBad** - function to run on failure. Functions gets **setN** as the first argument.

`o.incCheck(setID)` – true if include files set number **setID** is loaded.

`o.incCacheClear([all])` – true. Clears localStorage JS, CSS cache. If **all** is true, removes DOM elements of include and clears all include data.

`o.incCache` – true, cache in localStorage enabled.

`o.incCacheExp` – 1000 * 60 * 60 * 24, cache for 24 hours.

`o.incTimeout` – 6000, ms timeout to load function.

`o.incSource` – '', prefix for urls.

`o.incForce` – false, do not load already loaded files.

`o.incAsync` – true, async loading, set to false for in order loading.

`o.incCors` – false, do not allow loading from other domains

`o.incFns` – object, array of name:status for all loaded functions.

#### Unit tests
`o.test(title, test1, test2, ..., callBack)` – returns [number] **testID**, gets [string] **title** and tests like ["Test title", testFunction], where **testFunction** should return true for success and false or string for failure. If test is async, **testFunction** should get the first parameter and use it in **o.testUpdate()**.

`o.testUpdate(info, result, [description])` – returns undefined, gets **info** object (the first parameter of any **testFunction**) to update test status and set it to **result** (true or false/string), **description** - additional text if needed. Used for test status update for async tests. More info [here](https://fous.name/objs).

`o.tLog[testID]` – test sessions and text results.

`o.tRes[testID]` – test sets results as true/false.

`o.tStatus[testID: [functionID: true/false],...]` – an array of set test functions statuses. 

`o.tShowOk` – false, success tests are hidden, only errors. Set to **true** to see success results before **o.test()**.

`o.tStyled` – false, logs are in console view. Set to **true** to make logs HTML styled before **o.test()**.

`o.tTime` – 2000, milliseconds timeout for async tests.

### Methods
Here are methods, **o()** means that they are available after getting elements from DOM or after init and render functions (after creating elements). 

#### Select / DOM
`o().reset(q)` – clears **Objs** and get new elements by **q**, works as **o()**.

`o().select([i])` – selects number **i** element from 0 to change only it, if **i** is undefined selects the last index element.

`o().all()` – selects all elements to operate again.

`o().remove([i])` – removes all or **i** element from DOM.

`o().skip(i)` – removes **i** element from control set of this **Objs**.

`o().add()` – adds element to control set.

`o().find(q)` – finds all children elements by q-query in each element.

`o().first(q)` – finds only the first child element by q-query in each element.

`o().length` – number of elements of control set.

`o().el` – the first DOM element in the set.

`o().els` – all DOM elements of the set.

`o().last` – the last DOM element in the set.

#### States
`o().init()` – equal to **o.init()** but with elements to control.

`o().initState()` – equal to **o.initState()** but with elements to control.

`o().sample()` – returns states object with render state for creation such elements.

`o().html([html])` – returns html string of all elements or sets innerHTML as **html**.

`o().initID` – undefined or number. After **o().init(), o().initState()** **Objs** sets this parameter as index in **o.inits[]** to get ready elements. If elements were removed from DOM, they still there for re-use.

#### Direct DOM edit
`o().attr(attribute, [value])` – `UPDATED` sets **attribute** to **value**. Pass `null` to remove the attribute. Pass `""` to set an empty string. Returns **attribute** value if **value** is undefined. If **.select()** was not used before — returns an array of values.

`o().attrs()` – returns an array of all elements attributes, if **.select()** was used before - returns an object with values of one element.

`o().dataset([object])` – Sets dataset values due to the **object** data. It will not delete other dataset values. If **.select()** was used before - returns an object with dataset of one element or changes just one element.

`o().style(value)` – `UPDATED` sets style attribute to [string] **value**. Pass `null` to remove the `style` attribute entirely.

`o().css(object|null)` – `UPDATED` sets style from **object** like `{width: '100px', 'font-family': 'Arial'}`. Pass `null` to remove the `style` attribute entirely.

`o().val([value])` – `NEW` gets or sets the `.value` property of `input`/`textarea`/`select`. Returns current value when called without argument; sets and returns `Objs` for chaining when called with argument.

`o().setClass(value)` – sets class attribute to **value**.

`o().addClass(...cls)` – `UPDATED` adds one or more classes: `addClass('foo', 'bar', 'baz')`.

`o().removeClass(...cls)` – `UPDATED` removes one or more classes: `removeClass('foo', 'bar')`.

`o().toggleClass(class, rule)` – switch having and not having **class** by **rule**. If **rule** set **class**.

`o().haveClass(class)` – returns true if all elements have **class**.

`o().innerHTML([html])` – if **html** is set, sets innerHTML of all elements. If not set, returns array with innerHTML of each element.

`o().innerText(text)` – sets innerText for all elements.

`o().textContent(content)` – sets textContent for all elements.

`o().refs` – `NEW` object populated on `init` — every child element with a `ref="name"` attribute is available as `component.refs.name` (an ObjsInstance wrapper). Use for direct access without selectors.

#### System
`o().forEach(function)` – runs **function** with an object as the first parameter: {o, self, i, el} where is o-function, self Objs object, i-index of current element and el - DOM element.

#### Events
`o().on(events, function, [options])` – adds **events** listeners separated by ', ' to elements.

`o().off(events, function, [options])` – removes **events** listeners separated by ', ' to elements.

`o().offAll([event])` – removes all listeners or for special **event** from elements.

`o().onAll([event])` – adds all inited listeners from cache for all or for special **event**.

`o().ie` – object with all ever added listeners like {click: [[function, options], ...], ...}.

#### DOM insert
`o().appendInside(q)` – append elements inside element **q** or got by **q** query.

`o().appendBefore(q)` – append elements before element **q** or got by **q** query.

`o().appendAfter(q)` – append elements after element **q** or got by **q** query.

`o().prepareFor(React.createElement, [React.Component])` – clones and returns React element or JSX Component if React.Component is given. Allows to use Objs in React Apps. Objs states should be inited on rendered elements.




#### Store adapters

`o.createStore(defaults)` – `NEW` creates a reactive plain-object store. Returns the defaults object extended with `subscribe(component, stateName)`, `notify()`, and `reset()`. Subscribed components receive `{ ...storeProps, self, o, i }` merged into their state context on every `notify()`.

```
Objs update cycle (vs React):

React:    setState(newVal)
          → component function re-runs entirely
          → virtual DOM diff
          → patch (1–N nodes, including unchanged ones)

Objs:     store.notify()
          → each subscribed component's sync() fires
          → each sync() writes only its own DOM nodes
          → O(1) per subscriber — no diff, no cascade
```

`o.connectRedux(store, selector, component, [state])` – connects a Redux store slice to a component state method. Fires immediately and on every store change. Returns unsubscribe function.

`o.connectMobX(mobx, observable, accessor, component, [state])` – wraps `mobx.autorun()` to connect a MobX observable to a component state method. Returns disposer.

`o.withReactContext(React, Context, selector, component, [state])` – returns a React bridge component that calls `component[state](selector(contextValue))` on every context change. Mount it inside the Provider to connect.

`o.ObjsContext` – default context value placeholder for `React.createContext()`.

#### QA autotag & React integration

`o.autotag` – set to a string (e.g. `"qa"`) to auto-add `data-{autotag}="component-name"` to all rendered elements. Component name comes from `states.name` (camelCase → kebab-case). Ships in all builds — QA teams can target stable selectors with Playwright/Cypress.

`o.reactQA(componentName)` – `NEW` returns a `{ 'data-qa': 'kebab-name' }` object for spreading onto React JSX elements. Converts CamelCase to kebab-case. Respects `o.autotag` value. Ships in all builds.

```jsx
<button {...o.reactQA('CheckoutButton')} onClick={fn}>Checkout</button>
// → <button data-qa="checkout-button">
```

#### Recording pipeline — available in all builds

Available in all builds so QA testers/assessors can record on staging or production environments.

> **Security note:** `o.startRecording()` intercepts `window.fetch` and captures request/response bodies including auth tokens. Appropriate for staging environments; review before enabling on production.

`o.startRecording(observe?, events?, timeouts?)` – `UPDATED` starts capturing user interactions and network requests as mocks. Optional `observe` is a CSS selector to scope the MutationObserver (e.g. `'#task-app'`). Defaults: events `['click','mouseover','scroll','input','change']`, timeouts `{click:100, mouseover:50}`.

`o.stopRecording()` – `UPDATED` stops recording, returns `{actions, mocks, initialData, assertions, observeRoot}`. When scoped recording was used, `assertions` is an array of `{actionIdx, type, selector, text?|className?}` (from the MutationObserver), and `observeRoot` is the selector string or null.

`o.exportTest(recording)` – `UPDATED` returns generated `o.addTest()` source code string ready to review and commit.

`o.exportPlaywrightTest(recording, [options])` – `NEW` returns a complete Playwright `.spec.ts` file string with network mocks, `page.goto()`, typed locator steps, and TODO assertion comments. `options.testName` and `options.baseUrl` are optional.

```js
o.startRecording();
// QA tester uses the app normally
const rec = o.stopRecording();
console.log(o.exportPlaywrightTest(rec, { testName: 'Checkout flow' }));
// paste → tests/checkout.spec.ts → npx playwright test
```

`o.clearRecording([id])` – removes recording from sessionStorage.

#### Dev-only (stripped in objs.prod.js)

```
Always in prod:  DOM methods, states, events, routing, AJAX, stores,
                 o.autotag, o.reactQA, o.startRecording, o.stopRecording,
                 o.exportTest, o.exportPlaywrightTest, o.clearRecording

Dev-only:        o.test framework, o.playRecording, o.testOverlay, o.testConfirm,
                 o.measure/assertVisible/assertSize, debug logging
```

`o.measure(el)` – returns `{width, height, top, left, visible, opacity, zIndex}`. Use in test assertions.

`o.assertVisible(el)` – returns `true/false` for use inside `o.test()`.

`o.assertSize(el, {w?, h?})` – returns `true` or a descriptive error string.

`o.tBeforeEach` / `o.tAfterEach` – global hooks called before/after each test case. Set to a function.

`o.playRecording(recording, [mockOverrides])` – dev-only. Replays recording as a test with intercepted fetch. Depends on `o.test` framework.

`o.testOverlay()` – dev-only. Renders a fixed overlay button. Click to see pass/fail results per test and download as JSON.

`o.testConfirm(label, items?, opts?)` – dev-only. Shows a draggable overlay titled "Label: Paused" with an optional checklist; returns `Promise<{ ok: boolean, errors?: string[] }>`. Use after replay for manual checks (e.g. hover effects). See the [recording example](examples/recording/index.html) for a live demo.




## Why Objs for AI-assisted development

### The complete loop in one script

```
develop → o.autotag / o.reactQA → o.startRecording() → o.stopRecording()
        → o.exportPlaywrightTest() → paste → npx playwright test
```

No Playwright config to set up manually. No test IDs to maintain. The entire pipeline — component, QA tag, behavior capture, and Playwright test generation — runs inside the same library. Works in React projects too: add one script tag, sprinkle `{...o.reactQA('MyComponent')}`, record.

### Dev/prod build split

`objs.js` is the full development version. `objs.prod.js` is auto-generated by esbuild — all `if (__DEV__)` blocks (test framework, `o.playRecording`, overlay, debug logging) are eliminated entirely.

The **recording pipeline** (`startRecording`, `stopRecording`, `exportTest`, `exportPlaywrightTest`, `reactQA`) ships in all builds so QA assessors can use it on staging.

Bundlers pick the right file automatically via `package.json` exports conditions:

```js
// Vite, webpack, esbuild — no config needed
import o from 'objs-core'; // dev server → objs.js, build → objs.prod.js

// Script tag — explicit choice
<script src="objs.js"></script>       // dev/staging
<script src="objs.prod.js"></script>  // production (recording still available)
```

### States as AI-natural data structures

Every Objs component is a plain JS object. An LLM can generate correct components from a description without knowing JSX, virtual DOM, or React lifecycle rules:

```js
// AI prompt: "create a counter with increment and reset"
const counterStates = {
  name: 'Counter',
  render: { tag: 'div', html: '<span class="n">0</span> <button class="inc">+</button> <button class="rst">Reset</button>' },
  updateCount: ({ self }, n) => { o(self).first('.n').html(n); },
};
const counter = o.init(counterStates).render().appendInside('#app');
o(counter).first('.inc').on('click', () => counter.updateCount(++n));
o(counter).first('.rst').on('click', () => counter.updateCount(n = 0));
```

No compiler. No build step to try the above. No framework knowledge needed to generate it.

### Granular reactive updates — no virtual DOM diff

Each store subscription calls exactly one targeted DOM write:

```js
// React with Redux: entire subtree re-renders, React diffs it
// Objs: one function call, one innerHTML assignment
o.connectRedux(store, s => s.userName, profileCard, 'updateName');
o.connectRedux(store, s => s.score,    profileCard, 'updateScore');
```

Similar philosophy to Solid.js signals — but the update logic is a plain function, not a reactive primitive. An AI generates it without any framework knowledge.

### Comparison

| | Objs v1.2 | React ecosystem |
|---|---|---|
| **Setup** | `<script src="objs.js">` or `npm i objs-core` | React + Babel/Vite + config |
| **State management** | Built-in states + loaders | Redux / Zustand / MobX (separate) |
| **Routing** | `o.route()` built-in | React Router (separate) |
| **Testing** | Built-in `o.test()` + recording | Jest + Testing Library + Playwright |
| **Dev tools** | Built-in overlay, recording | React DevTools extension |
| **TypeScript** | `objs.d.ts` included | @types/react + separate config |
| **SSR** | Built-in DocumentMVP | Next.js / separate hydration setup |
| **AI context size** | ~2500 lines, one file | Dozens of packages, thousands of files |
| **Prod bundle overhead** | Dev code fully stripped | Depends on tree-shaking config |

### Real-world patterns

See [EXAMPLES.md](EXAMPLES.md) for complete runnable examples:
- Site menu with active route state
- Product card list + cart with shared store (granular update pattern)
- Overlay dialog with UTM auto-open and session persistence
- Drawer with filters and two-way URL sync
- Complex form with per-field validation and live preview
- React coexistence with shared context bridge




## License
Apache 2.0
