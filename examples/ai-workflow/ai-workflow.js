o.autotag = "qa";

// ─── Section 3: Anti-patterns data ───────────────────────────────────────
const ANTI_PATTERNS = [
	{
		title: "1. Stale closure in useEffect",
		react: `// AI generates this — looks correct, breaks at runtime
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // stale! always increments from initial 0
  }, 1000);
  return () => clearInterval(id);
}, []); // missing 'count' in deps`,
		objs: `// Objs: state functions receive fresh context on every call
const timerStates = {
  tick: ({ self }) => {
    self.n = (self.n || 0) + 1; // no closure — always fresh
    self.first('.count').html(self.n);
  },
};
setInterval(() => timer.tick(), 1000);`,
		note: "No closure — state functions receive fresh context on every call.",
	},
	{
		title: "2. useEffect dependency loop",
		react: `// AI adds the missing dep — now it loops forever
useEffect(() => {
  setFiltered(items.filter(fn));
}, [items, fn]); // fn is a new object every render → infinite loop`,
		objs: `// Objs: filtering is a plain function call, not an effect
filter: ({ self }, query) => {
  const results = self.store.items.filter(
    item => item.name.includes(query)
  );
  self.first('.results').html(renderList(results));
},`,
		note: "No effects, no dependency arrays — filtering is just a function.",
	},
	{
		title: "3. Context re-render cascade",
		react: `// AI wraps state in context — all consumers re-render on any change
const CartContext = createContext();
function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  // Every consumer re-renders when ANY cart field changes
  return <CartContext.Provider value={{ cart, setCart }}>
    {children}
  </CartContext.Provider>;
}`,
		objs: `// Objs: each subscriber calls only its own state method
const cartStore = o.createStore({ items: [], total: 0 });
cartStore.subscribe(cartBadge,  'updateCount'); // → only count changes
cartStore.subscribe(cartDrawer, 'updateItems'); // → only items list
cartStore.subscribe(checkout,   'updateTotal'); // → only total field`,
		note: "Granular subscriptions — each component updates only its own DOM.",
	},
	{
		title: "4. setState called during render",
		react: `// AI generates conditional state — React throws warning/infinite loop
function UserList({ users }) {
  const [sorted, setSorted] = useState([]);
  if (sorted.length !== users.length) {
    setSorted([...users].sort(...)); // setState during render!
  }
  return sorted.map(u => <User key={u.id} {...u} />);
}`,
		objs: `// Objs: no render phase — state is explicit, called when needed
const listStates = {
  load: ({ self }, users) => {
    self.store.sorted = [...users].sort((a,b) => a.name.localeCompare(b.name));
    self.store.sorted.forEach(u => createUser(u).appendInside(self.el));
  },
};`,
		note: "No render phase — state updates are explicit function calls.",
	},
	{
		title: "5. Missing key prop / reconciliation bug",
		react: `// AI forgets keys — React uses index, DOM mutations break animations
function List({ items }) {
  return items.map((item, i) => (
    <Item key={i} data={item} /> // index key: wrong on reorder
  ));
}
// After sorting: every item re-renders, transitions break`,
		objs: `// Objs reconcile() uses actual DOM node identity — no keys needed
reconcile: ({ self }, items) => ({
  // DOM nodes are moved, not recreated
  // Animations on existing nodes continue uninterrupted
  children: items.map(item => getOrCreateItem(item).el),
}),`,
		note: "reconcile() moves DOM nodes by identity — no keys, no broken animations.",
	},
];

const patternsContainer = o.first("#patterns-list");
ANTI_PATTERNS.forEach(({ title, react, objs, note }) => {
	const el = o.initState({
		tag: "div",
		className: "pattern",
		html: `<h3 class="pattern__title">${title}</h3>
           <div class="pattern__compare">
             <div class="pattern__col pattern__col--react">
               <div class="pattern__label">React (AI output)</div>
               <pre class="pattern__code">${react.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
             </div>
             <div class="pattern__col pattern__col--objs">
               <div class="pattern__label">Objs (problem doesn't exist)</div>
               <pre class="pattern__code">${objs.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
             </div>
           </div>
           <p class="pattern__note">✓ ${note}</p>`,
	});
	el.appendInside(patternsContainer.el);
});

// ─── Section 4: Recording demo moved to examples/recording/ ──────────────
// The live task app + dev panel + export functionality live at:
// examples/recording/index.html (recording.js)
