# Objs
> Fast and simple library to speed up developing by AI context friendly architecture, auto-tests recording, cache control and other. Develop new features without rewriting anything. Works standalone or alongside React. Examples and full documentation: [Full Documentation](https://en.fous.name/objs/documentation)

**AI-friendly** — one file, `SKILL.md` primer (~6,000 tokens). An LLM generates correct Objs code from a description without JSX, virtual DOM, or React lifecycle knowledge.

**React-developer-friendly** — familiar `className`, `ref`/`refs`, `o.createStore`. Add one script tag to an existing React app and get Playwright test generation without touching any components.

**Live examples** — real patterns in [`examples/`](https://foggysq.github.io/objs/examples/), narrative walkthroughs in EXAMPLES.md. For AI assistants: use SKILL.md as `@SKILL.md` or system prompt.

---

## Why Objs

**Objs is built so one dependency spans the whole loop—UI, reactive state, in-browser recording, replay with mocks, and export to standard Playwright**—instead of stitching together a framework, a separate recorder product, and a second test stack just to lock regressions in CI.

**Core functionality** — Record user actions in the browser, export ready-to-commit tests, and run them in CI or **run in the browser extension**. One script; no separate recorder or test-ID maintenance.

- **Record → Playwright in one pipeline** — `o.startRecording()` captures click, input, change, scroll; `o.stopRecording()` returns actions and auto-generated assertions; `o.exportPlaywrightTest(recording)` outputs a `.spec.ts` with locators and network mocks. Paste into your repo and run `npx playwright test`.
- **CI support** — Export runs in all builds (including prod). QA or assessors record on staging; paste the generated Playwright test into your test suite; CI runs it with no extra config. Optional `o.exportTest(recording)` for Objs-style tests.
- **Store and update model** — `o.createStore()` + `subscribe`/`notify`: no virtual DOM, no re-render cascade; only subscribed components update their own DOM (O(1) per subscriber).
- **One library, many roles** — DOM + state + routing + AJAX + cache (`o.inc`) + tests + recording + SSR. No extra test runner or recorder product. Built-in `o.route()` / `o.router()` — no separate router dependency.
- **Stable selectors and UI checks** — `{...o.reactQA('ComponentName')}` or `o.autotag`; recorder uses `data-qa` and list indices. `o.assertSize(el, { w, h, padding, margin })` for design system verification; `o.testConfirm()` for manual/hover checks after replay.
- **Works standalone or with React** — Add one script tag to an existing React app; no architecture change. Familiar `className`, `ref`/`refs`, `o.createStore`. Built-in SSR (Node) with `DocumentMVP` and in-browser hydration.
- **AI-friendly** — One file, ~6,000-token `SKILL.md` primer. No JSX, virtual DOM, or React lifecycle; fewer tokens than typical React context for runnable output. No stale closures, dependency arrays, or re-render cascades. Same code runs in Node (SSR) so tools can verify output without a browser — **verify generated code without user review**: run `o.init(states).render()` in Node, serialize or assert structure before returning to the user.

→ [Full comparison and live demo](https://foggysq.github.io/objs/examples/ai-workflow/index.html)

---

### Update v2.4: Chrome extension + native WebSocket replay

- **Strict record / replay** — `o.startRecording({ … strictCaptureAssertions?, strictCaptureNetwork?, strictCaptureWebSocket? })` stores **`strictCapture`** on the recording; **`o.playRecording`** accepts **`strictPlay`** and per-feature **`strictAssertions`**, **`strictNetwork`**, **`strictWebSocket`**, **`strictRemoved`** (see README “Recording and export”). The extension **Recording settings** accordion includes matching toggles for JSON replay.
- **Chrome extension (`objs-extension/`)** — Manifest V3 toolbar popup with an **accordion** per test: edit **`o.exportTest()` JS** (same as the recording example’s “Export Objs test”), **Play** runs `addTest`/`run`, **Stop** after recording fills the script + snapshot for Playwright. Legacy **JSON** recordings still **Play** via `o.playRecording` (replay with network mocks). Import/export `.js` / `.json`, download Playwright. Load unpacked from `chrome://extensions` (Developer mode) or **package and sign it yourself** for internal distribution.
- **Distribution** — The Objs project does **not** publish this extension to the **public Chrome Web Store**. Enterprises and teams zip or policy-deploy the folder to match their **host permissions, signing, and compliance** requirements.
- **Native WebSocket mocking** — During `o.playRecording`, when `recording.websocketEvents` is present, Objs installs a mock `WebSocket` that replays captured in/out messages (same teardown as fetch/XHR mocks). Use `skipWebSocketMock: true` in play options to force a live connection.
- **Extension setup** — See [`objs-extension/README.md`](objs-extension/README.md) for load-unpacked steps and packaging notes.
- **`o().cssMerge(object|null)`** — Merges into the existing inline `style` attribute instead of replacing it (unlike `css()`, which overwrites the whole attribute). Properties in the object **add** or **replace**; pass **`null`** or **`undefined`** for a property to **remove** that property only. Pass **`null`** for the whole argument to clear the style attribute (same as `css(null)`). Keys may be **camelCase** or **kebab-case**; they are normalized to kebab-case when serializing.

---

## Get started

**Browser** — source with test tools:
```html
<script src="objs.js" type="text/javascript"></script>
```

**Browser (smaller)** — minified `objs.built.min.js` for production. Use `type="module"`:
```html
<script src="objs.min.js" type="module"></script>
```

**npm / bundler** — correct file chosen automatically via `package.json` exports:
```js
import o from 'objs-core';  // resolves to objs.built.js
```

```
npm i objs-core
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
		class: 'timer',
		html: 'Seconds: <span ref="n">0</span>',
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
		html: 'Seconds: <span ref="n">0</span>',
	},
	start: ({self}) => {
		self.n = self.n || 0;
		self.interval = setInterval(() => {
			self.n++;
			self.refs.n.html(self.n);
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

> This and some more complex live examples are in the [full documentation](https://fous.name/objs/documentation). There are lots of useful methods and settings.


### Tests - unit tests, e2e, recording etc.

Testing is a first-class part of Objs: use `o.test()` and `o.addTest()` for sync and async unit tests, including tests with page reload and autorun. Record user sessions with `o.startRecording()` / `o.stopRecording()`, then export to Objs-style tests (`o.exportTest()`) or Playwright (`.spec.ts`) with `o.exportPlaywrightTest()` for e2e in CI. Replay with `o.playRecording()` (all builds); call `o.testOverlay()` to show a results panel so assessors can see if all auto tests passed and which manual checks failed. Use `o.testConfirm()` for manual checks (e.g. hover effects). Dev-only: `o.assertSize()` / `o.assertVisible()` for layout assertions. See the [recording example](https://foggysq.github.io/objs/examples/recording/index.html) and the full documentation for details.




## Functions
Almost all functions return control object with methods, let's call it **Objs**. Full API and TypeScript types: [objs.d.ts](objs.d.ts).

### Element selection
`o(q)` – gets elements to control object. If [string] - by **querySelectorAll(q)** into control object, if DOM element or an array of them - gets them, if [number] - gets control object from **o.inits[q]**.

`o.first(q)` – gets element to control by **querySelector(q)**.

`o.take(q)` – gets elements like **o(q)** from DOM but if there is just one element or equal number of elements to inited in **o.inits[]** before, gets all inited elements and their methods.

### Component control
`o.init(states)` – returns **Objs**, creates method(s) for each state to create, change elements. State called **render** is reserved for creation elements. **states** can be [string], [object], [function] that returns [string] or [object]. After **init()** **Objs** gets a **initID** parameter for a saved object in **o.inits**. More info about structure and features [here](https://fous.name/objs).

`o.initState(state, [props])` – inite method and call it with props, e.g. to render/create element. **Objs** gets a **.initID** parameter for a saved object in **o.inits[]**.

`o.inits[initID]` – an array of all inited objects. Available by index **initID** or **o.take()**.

Instance: `o().init()` – equal to **o.init()** but with elements to control. `o().initState()` – equal to **o.initState()** but with elements to control. `o().sample()` – returns states object with render state for creation such elements. `o().getSSR(initId, [fromEls])` – bind this instance to DOM nodes by initId; optional **fromEls** (e.g. from a container) skips document query; used by auto-hydration when parent sets innerHTML. `o().saveState([id])`, `o().revertState([id])`, `o().loseState(id)` – save/restore DOM state. `o().unmount()` – remove from DOM and **o.inits**. `o().connect(loader, state, fail)` – connect a loader to this instance (state/fail method names). `o().initID` – undefined or number in **o.inits[]**. **`toString()` / `Symbol.toPrimitive`** — an Objs instance stringifies to its HTML (same as **`.html()`**), so you can use **`${child}`** in template literals and when the parent sets **innerHTML** from composed instance markup, children auto-hydrate. `o().html([html])` – returns html string of all elements or sets innerHTML as **html**; when **html** is set, any `[data-o-init]` nodes inside are auto-hydrated (inited instances bound to those nodes).

### DOM manipulation
`o().reset(q)` – clears **Objs** and get new elements by **q**, works as **o()**.

`o().select([i])` – selects number **i** element from 0 to change only it, if **i** is undefined selects the last index element. Pass an **Event** to select the element in the set that contains **event.target** (use in handlers to get **`self.select(e).refs…`**).

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

`o().attr(attribute, [value])` – `UPDATED` sets **attribute** to **value**. Pass `null` to remove the attribute. Pass `""` to set an empty string. Returns **attribute** value if **value** is undefined. If **.select()** was not used before — returns an array of values.

`o().attrs()` – returns an array of all elements attributes, if **.select()** was used before - returns an object with values of one element.

`o().dataset([object])` – Sets dataset values due to the **object** data. It will not delete other dataset values. If **.select()** was used before - returns an object with dataset of one element or changes just one element.

`o().style(value)` – `UPDATED` sets style attribute to [string] **value**. Pass `null` to remove the `style` attribute entirely.

`o().css(object|null)` – `UPDATED` sets style from **object** like `{width: '100px', 'font-family': 'Arial'}`. Pass `null` to remove the `style` attribute entirely.

`o().cssMerge(object|null)` – `NEW` merges into the existing inline `style`: properties add or replace; `null` or `undefined` for a property removes that property only. Pass `null` for the whole argument to remove the `style` attribute (same as `css(null)`). Keys may be camelCase or kebab-case.

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

`o().forEach(function)` – runs **function** with an object as the first parameter: {o, self, i, el} where is o-function, self Objs object, i-index of current element and el - DOM element.

### Events
`o().on(events, function, [options])` – adds **events** listeners separated by ', ' to elements.

`o().off(events, function, [options])` – removes **events** listeners separated by ', ' to elements.

`o().offAll([event])` – removes all listeners or for special **event** from elements.

`o().onAll([event])` – adds all inited listeners from cache for all or for special **event**.

`o().ie` – object with all ever added listeners like {click: [[function, options], ...], ...}.

### DOM insert
`o().appendInside(q)` – append elements inside element **q** or got by **q** query.

`o().appendBefore(q)` – append elements before element **q** or got by **q** query.

`o().appendAfter(q)` – append elements after element **q** or got by **q** query.

`o().prepareFor(React.createElement, [React.Component])` – clones and returns React element or JSX Component if React.Component is given. Allows to use Objs in React Apps. Objs states should be inited on rendered elements.

### State and store
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

### Routing
`o.route(path, task)` – register a route: **path** is string, boolean, or function(path); **task** is function or object. Returns match result. Built-in; no separate router dependency.

`o.router(routes)` – run routing: **routes** is object of path → task. Returns true if a route matched.

Use **o.getParams([key])** to read GET (query) parameters in route callbacks or when initialising components—e.g. pass `o.getParams()` to `render(data)` or read `o.getParams('id')` for component state or data loading.

### HTTP and parameters
`o.get(url, [props])` – returns promise for GET AJAX, **data** in **props** as an [object] will be converted to string parameters.

`o.post(url, props)` – returns promise for POST AJAX, **data** in **props** as an [object] will be converted to body.

`o.ajax(url, props)` – returns propmise for AJAX, needs **method** in **props** equal to GET or POST, **data** will be converted for GET/POST format.

`o.getParams([key])` – returns GET **key** value or an object with all GET parameters.

### Include and cache
`o.inc(sources, [callBack, callBad])` – returns [number] **setID**, gets **souces** is an object like {nameID: url, ...} where **nameID** is unique ID, **url** link to JS, CSS or image, **callBack** – function to run after everything is loaded successfully, **callBad** - function to run on failure. Functions gets **setN** as the first argument.

`o.incCheck(setID)` – true if include files set number **setID** is loaded.

`o.incCacheClear([all])` – true. Clears localStorage JS, CSS cache. If **all** is true, removes DOM elements of include and clears all include data.

`o.newLoader(promise)` – create a loader for async data; use with `o().connect(loader, state, fail)`.

`o.incCache` – true, cache in localStorage enabled.

`o.incCacheExp` – 1000 * 60 * 60 * 24, cache for 24 hours.

`o.incTimeout` – 6000, ms timeout to load function.

`o.incSource` – '', prefix for urls.

`o.incForce` – false, do not load already loaded files.

`o.incAsync` – true, async loading, set to false for in order loading.

`o.incCors` – false, do not allow loading from other domains

`o.incFns` – object, array of name:status for all loaded functions.

### Cookies and storage
`o.setCookie(name, value, [options])` – set a cookie.

`o.getCookie(name)` – get cookie value.

`o.deleteCookie(name)` – delete a cookie.

`o.clearCookies()` – clear all cookies.

`o.clearLocalStorage()`, `o.clearSessionStorage()`, `o.clearTestsStorage()` – clear respective storage.

`o.clearAfterTests()` – clear cookies and test-related storage after test run (e.g. in tAfterEach).

### Testing
`o.test(title, test1, test2, ..., callBack)` – returns [number] **testID**, gets [string] **title** and tests like ["Test title", testFunction], where **testFunction** should return true for success and false or string for failure. If test is async, **testFunction** should get the first parameter and use it in **o.testUpdate()**. Optional **options object** (same argument list as a test case): **`{ sync: true }`** runs steps one after another synchronously (typical with **o.playRecording**); **`{ confirmOnFailure: true, confirmOnFailureTimeout?: number }`** shows a Continue/Stop overlay when a step fails instead of stopping immediately.

`o.sleep(ms)` – returns a **Promise** that resolves after **ms** milliseconds (used by **o.exportTest** and **o.playRecording** action delays).

`o.addTest(title, ...cases)` – add a test suite; returns handle for **o.runTest()**.

`o.runTest(testId?, autoRun?, savePrev?)` – run test(s). **savePrev** true keeps existing sessionStorage for that testId so the run can resume.

`o.testUpdate(info, result, [description])` – returns undefined, gets **info** object (the first parameter of any **testFunction**) to update test status and set it to **result** (true or false/string), **description** - additional text if needed. Used for test status update for async tests. More info [here](https://fous.name/objs).

`o.updateLogs()` – return test log lines (e.g. for assertions).

`o.tLog[testID]` – test sessions and text results.

`o.tRes[testID]` – test sets results as true/false.

`o.tStatus[testID: [functionID: true/false],...]` – an array of set test functions statuses.

`o.tShowOk` – false, success tests are hidden, only errors. Set to **true** to see success results before **o.test()**.

`o.tStyled` – false, logs are in console view. Set to **true** to make logs HTML styled before **o.test()**.

`o.tTime` – 2000, milliseconds timeout for async tests.

`o.tBeforeEach` / `o.tAfterEach` – global hooks called before/after each test case. Set to a function.

### Recording and export
Available in all builds so QA testers/assessors can record on staging or production environments.

> **Security note:** `o.startRecording()` intercepts `window.fetch` and captures request/response bodies including auth tokens. Appropriate for staging environments; review before enabling on production.

`o.startRecording(observe?, events?, timeouts?)` – `UPDATED` starts capturing user interactions and network requests as mocks (**fetch** and **XMLHttpRequest**). Optional `observe` is a CSS selector to scope the MutationObserver (e.g. `'#task-app'`). Default events: **`click`**, **`mouseover`**, **`scroll`**, **`input`**, **`change`**, **`submit`**, **`keydown`**, **`focus`**, **`blur`** (override with the **`events`** array). Default per-event debounce/step delays include **`{ click: 100, mouseover: 50, scroll: 30, input: 50, change: 50, submit: 100, keydown: 50, focus: 50, blur: 50 }`** (merge with **`timeouts`**). **Blur**/**focus** on a target removed by the **immediately preceding** recorded action are not captured. Check **o.recorder.active** to see if recording is on.

`o.startRecording({ observe?, events?, timeouts?, strictCaptureAssertions?, strictCaptureNetwork?, strictCaptureWebSocket? })` – Same as above using an options object. The optional **strictCapture\*** booleans are stored on the returned recording as **`strictCapture`** and used as defaults for **`o.playRecording`** strict modes when you do not override them in play options.

`o.stopRecording()` – `UPDATED` stops recording, returns `{actions, mocks, initialData, assertions, observeRoot, stepDelays, removedElements?, websocketEvents?, strictCapture?}`. Assertions are driven by the MutationObserver: types include **`visible`**, **`class`**, **`style`**, **`hidden`**, **`disabled`**, **`aria-expanded`**, **`aria-checked`**, with fields matching the type (e.g. **`text`**, **`className`**, **`style`**, **`listSelector`**, **`index`**). **`removedElements`** records removed nodes for lenient replay (skip or **strictRemoved**). **`websocketEvents`** holds captured WebSocket URLs and in/out messages when used. **`observeRoot`** is the selector string or null. **`stepDelays`** is the per-event delay map used when replaying.

`o.exportTest(recording, options?)` – `UPDATED` returns generated **`o.addTest()`** (or extension-oriented **`o.test`** when **`extensionExport: true`**) source string ready to review and commit. **`options.delay`** is the pause in ms after each action (default **16**; use **`{ delay: 0 }`** to omit **`o.sleep`** in emitted steps).

`o.exportPlaywrightTest(recording, [options])` – `NEW` returns a complete Playwright `.spec.ts` file string with network **route** mocks (method/body checks for POST/PUT where applicable), **`page.goto()`**, typed locator steps, real **`expect()`** for DOM (**toHaveClass**, **toHaveCSS**, **toBeHidden**, **toBeDisabled**, **toHaveAttribute**, etc.), and **WebSocket** **`framereceived`/`framesent`** expectations when messages were recorded. **`options.testName`** and **`options.baseUrl`** are optional.

```js
o.startRecording();
// QA tester uses the app normally
const rec = o.stopRecording();
console.log(o.exportPlaywrightTest(rec, { testName: 'Checkout flow' }));
// paste → tests/checkout.spec.ts → npx playwright test
```

`o.clearRecording([id])` – removes recording from sessionStorage.

`o.playRecording(recording, [mockOverrides])` – Replays recording as a test with intercepted fetch. Available in all builds (for assessors on staging).

`o.playRecording(recording, { … })` – Options include **`runAssertions`**, **`root`**, **`actionDelay`**, **`manualChecks`**, **`mockOverrides`**, **`skipWebSocketMock`**, **`skipNetworkMocks`**, **`recordingAssertionDebug`**, **`onComplete`**, and strict replay: **`strictPlay`** (shorthand for all strict toggles below), **`strictAssertions`** (exact list index and text, normalized style/class match, no fuzzy list rescan), **`strictNetwork`** (mocked fetch/XHR body must match **`mock.request`**), **`strictWebSocket`** (outbound frames must match recording order and payload), **`strictRemoved`** (assertions tied to **`removedElements`** verify absence instead of auto-pass; defaults to **`strictAssertions`** when omitted). With **`runAssertions: true`**, the return value is **`{ testId }`** (object), not a bare numeric id.

`o.runRecordingAssertions(recording, root?, actionIdx?, opts?)` – **`opts`** may include **`assertions`**, **`removedElements`**, **`strictAssertions`**, **`strictRemoved`** (same semantics as play). **`removedElements`** / skip logic applies only when **`actionIdx`** is set (as **o.playRecording** does per step); omitting **`actionIdx`** runs all matching assertions without removed-element bypass.

### QA and selectors
`o.autotag` – set to a string (e.g. `"qa"`) to auto-add `data-{autotag}="component-name"` to all rendered elements. Component name comes from `states.name` (camelCase → kebab-case). Ships in all builds — QA teams can target stable selectors with Playwright/Cypress.

`o.reactQA(componentName)` – `NEW` returns a `{ 'data-qa': 'kebab-name' }` object for spreading onto React JSX elements. Converts CamelCase to kebab-case. Respects `o.autotag` value. Ships in all builds.

```jsx
<button {...o.reactQA('CheckoutButton')} onClick={fn}>Checkout</button>
// → <button data-qa="checkout-button">
```

### Measurement and UI assertions (dev)
All builds include the full API (test framework, playRecording, testOverlay, testConfirm, measure/assertVisible/assertSize). Only the debug flag and debug logging are behind `__DEV__`.

`o.measure(el)` – returns `{width, height, top, left, visible, opacity, zIndex}`. Use in test assertions.

`o.assertVisible(el)` – returns `true/false` for use inside `o.test()`.

`o.assertSize(el, expected)` – returns `true` or a descriptive error string. `expected` can include:
- `w`, `h` – width and height (px)
- `padding` – same value for all four sides (px), or `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` individually
- `margin` – same value for all four sides (px), or `marginTop`, `marginRight`, `marginBottom`, `marginLeft` individually  

Use for design system or UI verification tests (e.g. button height 24px, container padding 20px).

`o.testOverlay()` – Renders a fixed overlay button (🧪 Tests). Click to see pass/fail results for all test runs (auto steps and manual checks). Drag handle uses **`grab`**; panel height is capped (**e.g. 90vh**). For assessors: after replay, open the overlay to see if all auto tests passed and which manual checks failed. **`onComplete`** from **o.playRecording** runs after async manual checks (**testConfirm** promises) settle so counts stay accurate. Available in all builds.

`o.testConfirm(label, items?, opts?)` – Shows a draggable overlay titled "Label: Paused" with an optional checklist; returns `Promise<{ ok: boolean, errors?: string[] }>`. **`opts.timeout`** (ms) enables a countdown before auto-close. Use after replay for manual checks (e.g. hover effects). Available in all builds. See the [recording example](https://foggysq.github.io/objs/examples/recording/index.html) for a live demo.

`o.overlay(opts)` – Low-level draggable overlay: **`innerHTML`**, **`onClose`**, **`timeout`**, **`excludeDragSelector`**, **`removeExisting`**, **`className`**, **`id`**. Shared by **testConfirm**, **testOverlay**, and **confirmOnFailure** test options.

### SSR and Node
In Node, **o.D** is **o.DocumentMVP** (no real DOM); **o.init().render()** builds a virtual tree and you can serialize with the same code path that produces HTML for SSR. See full docs for getSSR and hydration.

### Utilities and debug
**o.verify / o.safeVerify / o.specialTypes** — Runtime type checking for arguments, config, or API responses. Useful in projects to fail fast at API boundaries, validate options before use, or keep generated code safe.

- **o.verify(pairs, safe?)** — **pairs** is an array of `[value, expectedTypes]`, where **expectedTypes** is a string or array of strings (e.g. `'string'`, `['number','undefined']`). Uses built-in `typeof` checks plus **o.specialTypes**. On failure: throws (default) or returns an Error if **safe** is true. On success: returns `true`.
- **o.safeVerify(pairs)** — Same as **o.verify(pairs, true)**; returns `true` or `false` (no throw).
- **o.specialTypes** — Object of custom validators used by **o.verify()**. Built-in: `notEmptyString`, `array`, `promise`. **Developers can add global validators here**: assign a function `(value, typeofValue) => boolean` to **o.specialTypes.myType**. That validator is then available everywhere—in your app and inside Objs—so you can use `o.verify([x, ['myType']])` consistently.

`o.showErrors` – false as default, but all errors are saved in **o.errors[]**.

`o.errors` – an array of all errors.

`o.logErrors()` – log all hidden errors in console.

`o.onError` – set a function that is called when an error happens.

`o.getStates()` – returns array of state info per init.

`o.getStores()` – returns array of store refs.

`o.getListeners()` – returns array of listener refs.

`o.camelToKebab(str)`, `o.kebabToCamel(str)` – convert between naming conventions.

`o.C(obj, key)` – safe `Object.hasOwn`-style check; returns whether `obj` has own property `key`. Used internally; available for app code. `o.F` and `o.U` are internal constants (false, undefined). `o.W` and `o.H` exist but are reserved; do not rely on them.




## Why Objs for AI-assisted development

### The complete loop in one script

```
develop → o.autotag / o.reactQA → o.startRecording() → o.stopRecording()
        → o.exportPlaywrightTest() → paste → npx playwright test
```

No Playwright config to set up manually. No test IDs to maintain. The entire pipeline — component, QA tag, behavior capture, and Playwright test generation — runs inside the same library. Works in React projects too: add one script tag, sprinkle `{...o.reactQA('MyComponent')}`, record.

### Dev/prod build split

`objs.js` is the source for development or script tag. `objs.built.js` and `objs.built.min.js` are produced by `node build.js` (ESM + window.o). Only the debug flag is behind `__DEV__`.

The **recording pipeline** (`startRecording`, `stopRecording`, `exportTest`, `exportPlaywrightTest`, `reactQA`) ships in all builds so QA assessors can use it on staging.

Bundlers pick the right file automatically via `package.json` exports conditions:

```js
// Vite, webpack, esbuild — no config needed
import o from 'objs-core'; // dev server → objs.js, build → objs.built.js

// Script tag
<script src="objs.js"></script>
```

### States as AI-natural data structures

Every Objs component is a plain JS object. An LLM can generate correct components from a description without knowing JSX, virtual DOM, or React lifecycle rules:

```js
// AI prompt: "create a counter with increment and reset"
// Hack: render as function sets the entity store and returns the init object (no globals, no post-init wiring)
const counterStates = {
  name: 'Counter',
  render: ({ self }) => {
    self.store.n = self.store.n ?? 0;
    return {
      html: '<span ref="n">0</span> <button ref="inc">+</button> <button ref="rst">Reset</button>',
      events: {
        click: (e) => {
          if (e.target === self.refs?.inc?.el) self.updateCount(++self.store.n);
          else if (e.target === self.refs?.rst?.el) self.updateCount(self.store.n = 0);
        },
      },
    };
  },
  updateCount: ({ self }, num) => {
    self.store.n = num;
    self.refs.n.html(num);
  },
};
o.init(counterStates).render().appendInside('#app');
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

| | Objs v2.0 | React ecosystem |
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

See [EXAMPLES.md](EXAMPLES.md) for the architecture guide and runnable examples (aligned with [SKILL.md](SKILL.md)):
1. **How render works** — plain object, function, HTML string, multi-instance, `append`, `children`, `ref`/`refs`
2. **Single components (atoms)** — Button, Badge, Field with `val()`, `css(null)`, `addClass` spread
3. **Nesting & composition** — slot pattern, `append` in render, factory with dynamic children
4. **Design system** — Atoms → Molecules → Organisms, `self.store`, update efficiency
5. **Real-world** — menu, cart+cards, dialog, drawer+URL, complex form
6. **React integration** — four modes including bolt-on Playwright recording with `o.reactQA`

**Rule (from SKILL):** Define one state method per data slice; never call `.render()` to update — use targeted state methods. In event handlers use **self.select(e)** and **refs** (e.g. `row.refs.input.val()`), not `e.target`/class selectors or raw DOM.




## License
Apache 2.0
