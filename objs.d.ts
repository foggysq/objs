/**
 * Objs-core v2.0 TypeScript definitions
 * @license Apache-2.0
 */

// ─── Core instance types ──────────────────────────────────────────────────

/** State definition object for o.init(). `render` is the reserved creation state. */
export interface StateObject {
	tag?: string;
	tagName?: string;
	/** Component name — used for o.autotag data-* attribute (camelCase → kebab-case) */
	name?: string;
	class?: string;
	/** React-style alias for `class` */
	className?: string;
	id?: string;
	html?: string;
	innerHTML?: string;
	style?: string | Record<string, string>;
	dataset?: Record<string, string>;
	events?: Record<string, EventListener>;
	[attr: string]: unknown;
}

/** Parameter object passed to every state function.
 *
 * State functions receive ONE merged object: { ...passedProps, self, o, i, parent, data }.
 * - Properties from the calling argument are spread into the context.
 * - `data` holds the raw first argument (useful for primitives: `comp.setState(5)` → `data = 5`).
 * - `parent` is the ObjsInstance that this component was `appendInside()` into (if any).
 *
 * @example
 * // Passing an object — destructure its keys:
 * sync: ({ self, values, errors }) => { ... }  // comp.sync(store)
 * // Passing a primitive — use `data`:
 * setCount: ({ self, data }) => { self.html(data); }  // comp.setCount(5)
 */
export interface StateParams {
	self: ObjsInstance;
	o: typeof o;
	i: number;
	/** The ObjsInstance this component was appendInside() into, or null */
	parent: ObjsInstance | null;
	/** The raw first argument passed when the state method was called */
	data: unknown;
	[key: string]: unknown;
}

/** State function signature */
export type StateFunction = (params: StateParams) => void | unknown;

/** States map passed to o.init() */
export type StatesMap = {
	render?: StateObject | StateFunction | string;
	[stateName: string]: StateObject | StateFunction | string | undefined;
};

/** Test case tuple: [title, testFn | true | false | string] */
export type TestCase = [string, ((info: TestInfo) => boolean | string | undefined) | boolean | string | undefined];

export interface TestInfo {
	n: number;
	i: number;
	title: string;
	tShowOk: boolean;
	tStyled: boolean;
}

/** Object returned by o.addTest() */
export interface TestHandle {
	testId: number;
	run(): void;
	autorun(): void;
}

/** Object returned by o.newLoader() */
export interface ObjsLoader<T = unknown> {
	reload(promise: Promise<T>): void;
	isObjsLoader: true;
	listeners: Array<[ObjsInstance, string, string?]>;
	isFinished(): boolean;
	getStore(): T | null;
	connect(listener: ObjsInstance, state?: string, fail?: string): void;
	disconnect(listener: ObjsInstance): void;
}

/** Element measurement result from o.measure() */
export interface MeasureResult {
	width: number;
	height: number;
	top: number;
	left: number;
	visible: boolean;
	opacity: string;
	zIndex: string;
}

/** Recorded action entry */
export interface RecordedAction {
	type: string;
	target: string;
	time: number;
	scrollY?: number;
	value?: string;
	checked?: boolean;
	key?: string;
	code?: string;
	targetType?: string;
	/** When target matches multiple elements, selector for the repeated list item container */
	listSelector?: string;
	/** Index within listSelector matches for replay by index */
	targetIndex?: number;
}

export type Assertion = {
	actionIdx: number;
	type: 'visible' | 'class' | 'style' | 'hidden' | 'disabled' | 'aria-expanded' | 'aria-checked';
	selector: string;
	text?: string;
	className?: string;
	style?: string;
	hidden?: boolean;
	disabled?: boolean;
	ariaExpanded?: string | null;
	ariaChecked?: string | null;
	/** When selector matches multiple, selector for the list item container */
	listSelector?: string;
	/** Index within listSelector matches */
	index?: number;
};

/** WebSocket connection and message capture */
export interface WebSocketEvent {
	url: string;
	protocol?: string;
	open: boolean;
	messages: Array<{ dir: 'in' | 'out'; data: string }>;
}

/** Optional strict replay defaults saved with the recording (from startRecording options) */
export interface RecordingStrictCapture {
	assertions?: boolean;
	network?: boolean;
	websocket?: boolean;
}

/** Entry when a node was removed during recording (for lenient assertion skip or strict absence checks) */
export interface RecordingRemovedEntry {
	actionIdx: number;
	type: 'removed';
	selector: string;
	text?: string;
	listSelector?: string;
	index?: number;
}

/** Full recording object */
export interface Recording {
	actions: RecordedAction[];
	mocks: Record<string, { url: string; method: string; request: unknown; response: unknown; status: number }>;
	initialData: Record<string, unknown>;
	stepDelays?: Record<string, number>;
	assertions: Assertion[];
	observeRoot: string | null;
	websocketEvents?: WebSocketEvent[];
	removedElements?: RecordingRemovedEntry[];
	strictCapture?: RecordingStrictCapture;
}

/**
 * Reactive store returned by o.createStore().
 * Components subscribe via store.subscribe(component, stateName).
 * When store.notify() is called, each subscribed component's state method
 * receives the full store object, whose properties are merged into the
 * state context: { ...storeProps, self, o, i, parent, data }.
 */
export interface ObjsStore<T extends object = Record<string, unknown>> {
	_listeners: Array<(store: this) => void>;
	/** Subscribe an Objs component state to this store.
	 *  On every notify(), component[stateName](store) is called. */
	subscribe(component: ObjsInstance, stateName: string): this;
	/** Notify all subscribers — passes `this` store as the argument. */
	notify(): void;
	/** Restore store data from initial defaults; does not replace subscribe, notify, _listeners. */
	reset(): void;
}

// ─── ObjsInstance (chainable result of o() / o.init()) ────────────────────

export interface ObjsInstance {
	// Properties
	els: Element[];
	el: Element | undefined;
	last: Element | undefined;
	length: number;
	initID: number | undefined;
	ie: Record<string, Array<[EventListener, unknown?, unknown?]>>;
	delegated: Record<string, EventListener[]>;
	store: Record<string, unknown>;
	states: string[];
	isDebug: boolean;
	currentState: string;
	savedStates: Record<string, unknown>;
	isRoot: boolean;
	/** The ObjsInstance this component was appendInside() into, or null */
	_parent: ObjsInstance | null;
	/**
	 * Named sub-elements collected from `ref="name"` attributes in the rendered HTML.
	 * Populated automatically on first render; `ref` attributes are removed from the DOM.
	 * @example
	 * // In render: html: `<div ref="body"></div>`
	 * // After render: component.refs.body  → ObjsInstance wrapping that div
	 */
	refs: Record<string, ObjsInstance>;

	// Selection
	reset(query: QueryArg): ObjsInstance;
	/** Select by index or by event: select(e) selects the element in this instance that contains e.target. */
	select(i?: number | Event): ObjsInstance;
	all(): ObjsInstance;
	find(query: string): ObjsInstance;
	first(query?: string): ObjsInstance;
	add(el: QueryArg): ObjsInstance;
	skip(i?: number): ObjsInstance;
	remove(i?: number): ObjsInstance;

	// State
	init(states: StatesMap | StateFunction | string): ObjsInstance;
	initState(state: StateObject, props?: Record<string, unknown>): ObjsInstance;
	sample(state?: string): StatesMap;
	saveState(stateId?: string, root?: boolean): ObjsInstance;
	revertState(stateId?: string): ObjsInstance;
	loseState(stateId: string): ObjsInstance;

	// DOM manipulation
	html(html?: string): string | ObjsInstance;
	toString(): string;
	[Symbol.toPrimitive](hint: string): string | number;
	innerHTML(html?: string): string[] | ObjsInstance;
	innerText(text: string): ObjsInstance;
	textContent(content: string): ObjsInstance;
	val(value?: string): string | ObjsInstance;
	attr(attr: string, value?: string | null): string | string[] | ObjsInstance;
	attrs(): Record<string, string> | Array<Record<string, string>>;
	dataset(values?: Record<string, string>): Record<string, string> | Array<Record<string, string>> | ObjsInstance;
	style(value?: string | null): ObjsInstance;
	css(styles: Record<string, string> | null): ObjsInstance;
	cssMerge(styles: Record<string, string | null | undefined> | null): ObjsInstance;
	setClass(value: string): ObjsInstance;
	addClass(...cls: string[]): ObjsInstance;
	removeClass(...cls: string[]): ObjsInstance;
	toggleClass(cls: string, rule?: boolean): ObjsInstance;
	haveClass(cls: string): boolean;

	// Events
	on(events: string, handler: EventListener, options?: EventListenerOptions): ObjsInstance;
	off(events: string, handler: EventListener, options?: EventListenerOptions): ObjsInstance;
	offAll(event?: string): ObjsInstance;
	onAll(event?: string): ObjsInstance;
	onDelegate(events: string, selector: string, handler: EventListener): ObjsInstance;
	offDelegate(event?: string): ObjsInstance;
	onParent(events: string, selectorOrEl: string | Element, handler: EventListener): ObjsInstance;
	offParent(events: string, query: string): ObjsInstance;

	// DOM insertion
	appendInside(el: QueryArg): ObjsInstance;
	appendBefore(el: QueryArg): ObjsInstance;
	appendAfter(el: QueryArg): ObjsInstance;

	// Misc
	forEach(fn: (ctx: { o: typeof o; self: ObjsInstance; i: number; el: Element }) => void): ObjsInstance;
	connect(loader: ObjsLoader, state?: string, fail?: string): ObjsInstance;
	getSSR(initId?: number): ObjsInstance;
	saveAs(key: string): ObjsInstance;
	unmount(): boolean;
	take(query: QueryArg): ObjsInstance;

	// React
	prepareFor(createElement: Function, component?: Function): unknown;

	// Debug (behind __DEV__ in build)
	debug?: () => ObjsInstance;

	// Dynamic state methods added by init()
	render?: (props?: Record<string, unknown> | Array<Record<string, unknown>>) => ObjsInstance;
	[stateName: string]: unknown;
}

type QueryArg = string | Element | Element[] | ObjsInstance | number;

// ─── o() function and static API ─────────────────────────────────────────

declare function o(query?: QueryArg): ObjsInstance;

declare namespace o {
	// Core
	const inits: ObjsInstance[];
	const getSaved: Record<string, ObjsInstance>;
	const errors: Error[];
	let debug: boolean;
	let showErrors: boolean;
	function logErrors(): void;
	function onError(error: Error, name?: string): void;
	function reactRender(...args: unknown[]): unknown;

	// Autotag
	let autotag: string | undefined;

	function reactQA(componentName: string): Record<string, string>;

	// Element selection
	function first(query: string): ObjsInstance;
	function take(query: QueryArg): ObjsInstance;
	
	// State
	function init(states: StatesMap | StateFunction | string): ObjsInstance;
	function initState(state: StateObject, props?: Record<string, unknown>): ObjsInstance;
	function getStates(): (string[] | undefined)[];
	function getStores(): (Record<string, unknown> | undefined)[];
	function getListeners(): (Record<string, unknown> | undefined)[];

	/**
	 * Create a reactive store — plain object with built-in subscribe / notify.
	 * Components subscribed via store.subscribe(comp, 'state') receive the store
	 * as their merged state context: { ...storeProps, self, o, i, parent, data }.
	 * @example
	 * const store = o.createStore({ count: 0, inc() { this.count++; this.notify(); } });
	 * store.subscribe(badge, 'sync'); // badge.sync(store) on every notify
	 */
	function createStore<T extends object>(defaults: T): T & ObjsStore<T>;

	// AJAX
	function ajax(url: string, props?: Record<string, unknown>): Promise<Response>;
	function get(url: string, props?: Record<string, unknown>): Promise<Response>;
	function post(url: string, props?: Record<string, unknown>): Promise<Response>;
	function getParams(key?: string): Record<string, string> | string;

	// Loader
	function newLoader<T = unknown>(promise?: Promise<T>): ObjsLoader<T>;

	// Include
	let incCache: boolean;
	let incCacheExp: number;
	let incTimeout: number;
	let incSource: string;
	let incForce: boolean;
	let incAsync: boolean;
	let incCors: boolean;
	let incFns: Record<string, number>;
	function inc(sources: Record<string, string>, callBack?: (setId: number) => void, callBad?: (setId: number) => void): number;
	function incCheck(set?: number, fnId?: number, loaded?: number): boolean;
	function incCacheClear(all?: boolean): boolean;

	// Routing
	function route(path: string | boolean | ((path: string) => boolean), task?: Function | object): boolean | object;
	function router(routes: Record<string, Function | object>): boolean;

	// Cookies
	function setCookie(title: string, value?: string | number | boolean, params?: Record<string, unknown>): void;
	function getCookie(title: string): string | undefined;
	function deleteCookie(title: string): void;
	function clearCookies(): void;
	/** Clear cookies, localStorage, and test-related sessionStorage. Call after Cookies/LS/SS tests. */
	function clearAfterTests(): void;

	// Storage
	function clearLocalStorage(all?: boolean): void;
	function clearSessionStorage(onlyTests?: boolean): void;
	function clearTestsStorage(): void;

	// Utilities
	function camelToKebab(str: string): string;
	function kebabToCamel(str: string): string;
	function verify(pairs: Array<[unknown, string | string[]]>, safe?: boolean): boolean | Error;
	function safeVerify(pairs: Array<[unknown, string | string[]]>): boolean;
	const C: (obj: object, key: string) => boolean;
	const F: false;
	const U: undefined;

	// Store adapters (always present, prod + dev)
	function connectRedux<S = unknown>(
		store: { getState(): S; subscribe(listener: () => void): () => void },
		selector: (state: S) => unknown,
		component: ObjsInstance,
		state?: string
	): () => void;

	function connectMobX<T = unknown>(
		mobx: { autorun(fn: () => void): () => void },
		observable: T,
		accessor: (obs: T) => unknown,
		component: ObjsInstance,
		state?: string
	): () => void;

	let ObjsContext: unknown;

	function withReactContext<C = unknown>(
		React: { useContext(ctx: unknown): C; useEffect(fn: () => void, deps: unknown[]): void },
		Context: unknown,
		selector: (value: C) => unknown,
		component: ObjsInstance,
		state?: string
	): () => null;

	// SSR
	const DocumentMVP: {
		createElement(tag: string): unknown;
		addEventListener(): void;
		parseElement(elem: unknown, outer?: boolean): string;
	};
	let D: Document | typeof DocumentMVP;

	const recorder: {
		active: boolean;
		actions: RecordedAction[];
		mocks: Recording['mocks'];
		initialData: Record<string, unknown>;
		assertions: Assertion[];
		observeRoot: string | null;
		strictCapture: RecordingStrictCapture | null;
		_observer: MutationObserver | null;
	};
	/** Options object form for o.startRecording (observe/events/timeouts + optional strict capture flags on the recording) */
	interface StartRecordingOptions {
		observe?: string;
		events?: string[];
		timeouts?: Record<string, number>;
		strictCaptureAssertions?: boolean;
		strictCaptureNetwork?: boolean;
		strictCaptureWebSocket?: boolean;
	}
	/**
	 * Start recording user interactions.
	 * Available in all builds — QA testers can record on staging/production.
	 */
	function startRecording(options: StartRecordingOptions): void;
	/**
	 * @param observe CSS selector to scope the MutationObserver (reduces assertion noise)
	 * @param events Events to record (default: click, mouseover, scroll, input, change)
	 * @param timeouts Debounce delays per event type in ms
	 */
	function startRecording(observe?: string, events?: string[], timeouts?: Record<string, number>): void;
	function stopRecording(): Recording;
	function clearRecording(id?: number): void;
	function exportTest(
		recording: Recording,
		options?: { delay?: number; extensionExport?: boolean },
	): string;
	/** Optional filters and strict modes for o.runRecordingAssertions */
	interface RunRecordingAssertionsOpts {
		assertions?: Assertion[];
		removedElements?: Recording['removedElements'];
		strictAssertions?: boolean;
		/** When omitted, defaults to strictAssertions */
		strictRemoved?: boolean;
	}
	/**
	 * Run recording assertions against the current DOM.
	 * @param recording Recording with assertions
	 * @param root Root element or selector (default: document)
	 * @param actionIdx When provided, run only assertions for this action index
	 * @param opts Optional assertion subset, removedElements, and strict DOM/removed flags
	 */
	function runRecordingAssertions(
		recording: Recording,
		root?: Element | string,
		actionIdx?: number,
		opts?: RunRecordingAssertionsOpts
	): { passed: number; total: number; failures: Array<{ selector: string; message: string }> };
	function exportPlaywrightTest(
		recording: Recording,
		options?: { testName?: string; baseUrl?: string }
	): string;

	// Test framework
	function sleep(ms: number): Promise<void>;
	let tLog: string[];
	let tRes: boolean[];
	let tStatus: Array<Array<boolean | undefined>>;
	let tFns: Array<((testN: number) => void) | undefined>;
	let tShowOk: boolean;
	let tStyled: boolean;
	let tTime: number;
	let tests: Array<{ title: string; tests: TestCase[]; hooks: { before?: Function; after?: Function } }>;
	let tAutolog: boolean;
	let tBeforeEach: ((info: TestInfo) => void) | undefined;
	let tAfterEach: ((info: TestInfo, result: unknown) => void) | undefined;

	/** Options for o.test when sync or confirmOnFailure is needed */
	interface TestOptions {
		sync?: boolean;
		confirmOnFailure?: boolean;
		confirmOnFailureTimeout?: number;
	}
	function test(
		title: string,
		...cases: Array<TestCase | TestOptions | (() => void)>
	): number;
	function addTest(title: string, ...cases: Array<TestCase | { before?: Function; after?: Function }>): TestHandle;
	function runTest(testId?: number, autoRun?: boolean, savePrev?: boolean): void;
	function testUpdate(info: TestInfo, result?: boolean | string, suffix?: string): void;
	function updateLogs(): string[];

	// Measurements
	function measure(el: Element): MeasureResult;
	function assertVisible(el: Element): boolean;
	/** Expected size/padding/margin for design system or UI verification. All values in px. */
	function assertSize(
		el: Element,
		expected?: {
			w?: number;
			h?: number;
			padding?: number;
			paddingTop?: number;
			paddingRight?: number;
			paddingBottom?: number;
			paddingLeft?: number;
			margin?: number;
			marginTop?: number;
			marginRight?: number;
			marginBottom?: number;
			marginLeft?: number;
		}
	): boolean | string;

	// Dev-only replay + overlay (depend on o.test framework)
	/** Manual check inserted after an action or at end of playback */
	interface ManualCheck {
		afterAction: number | 'end';
		label: string;
		items: string[];
	}
	/** Options for o.playRecording when runAssertions is used */
	interface PlayRecordingOptions {
		runAssertions?: boolean;
		root?: string;
		actionDelay?: number;
		manualChecks?: ManualCheck[];
		mockOverrides?: Recording['mocks'];
		skipWebSocketMock?: boolean;
		skipNetworkMocks?: boolean;
		recordingAssertionDebug?: boolean;
		/** When true, enables strictAssertions, strictNetwork, and strictWebSocket (and strictRemoved follows strictAssertions). Per-flag opts still override when set. */
		strictPlay?: boolean;
		/** Exact list index, visible text equality (normalized), style/className equality, no list rescan */
		strictAssertions?: boolean;
		/** Require request body to match mock.request when replaying a mocked fetch/XHR */
		strictNetwork?: boolean;
		/** Require outbound WebSocket frames to match recorded order and payload */
		strictWebSocket?: boolean;
		/** When true, removed-element assertions verify absence instead of auto-pass */
		strictRemoved?: boolean;
		onComplete?: (assertionResult?: { passed: number; total: number; failures: Array<{ selector: string; message: string }> }) => void;
	}
	function playRecording(
		recording: Recording,
		opts?: Recording['mocks'] | PlayRecordingOptions
	): number | { testId: number };
	function testOverlay(): void;
	/** Common draggable overlay; used by testConfirm, testOverlay, confirmOnFailure */
	function overlay(opts: {
		innerHTML: string;
		onClose?: (result?: { ok?: boolean; errors?: string[]; continue?: boolean }) => void;
		timeout?: number;
		excludeDragSelector?: string;
		removeExisting?: boolean;
		className?: string;
		id?: string;
	}): ObjsInstance;
	/**
	 * Pause an Objs browser test; shows a draggable bar with "Test title: Paused", optional checklist (labels + checkboxes), and Continue.
	 * Dev-only. Returns ok: true if all items checked; ok: false with errors = list of unchecked item texts.
	 */
	function testConfirm(
		label: string,
		items?: string[],
		opts?: { confirm?: string; timeout?: number }
	): Promise<{ ok: boolean; errors?: string[] }>;
}

export { o };
export default o;
