o.autotag = "qa";

// ─── Mock data generator ──────────────────────────────────────────────────
const STATUSES = ["Active", "Pending", "Inactive", "Suspended"];
const NAMES = [
	"Alice",
	"Bob",
	"Carol",
	"Dan",
	"Eva",
	"Frank",
	"Grace",
	"Hank",
	"Iris",
	"Jack",
	"Kate",
	"Leo",
	"Mia",
	"Ned",
	"Ora",
	"Paul",
	"Quinn",
	"Rose",
	"Sam",
	"Tara",
];
const DEPTS = [
	"Engineering",
	"Marketing",
	"Sales",
	"Support",
	"Finance",
	"Design",
	"Legal",
	"HR",
];

function makeRows(count) {
	return Array.from({ length: count }, (_, i) => ({
		id: i + 1,
		name: `${NAMES[i % NAMES.length]} ${NAMES[(i * 7 + 3) % NAMES.length]}`,
		dept: DEPTS[i % DEPTS.length],
		status: STATUSES[i % STATUSES.length],
		score: Math.round(40 + Math.random() * 60),
		joined: new Date(2018 + (i % 6), i % 12, (i % 28) + 1).toISOString().slice(0, 10),
	}));
}

// ─── Store ────────────────────────────────────────────────────────────────
const tableStore = o.createStore({
	rows: [],
	filteredRows: [],
	sort: { col: "id", dir: "asc" },
	filter: "",
	statusFilter: "",
	page: 1,
	pageSize: 10,
	loading: false,
	error: null,
});

const COLUMNS = [
	{ key: "id", label: "#", width: "4rem" },
	{ key: "name", label: "Name", width: "12rem" },
	{ key: "dept", label: "Department", width: "10rem" },
	{ key: "status", label: "Status", width: "8rem" },
	{ key: "score", label: "Score", width: "6rem" },
	{ key: "joined", label: "Joined", width: "8rem" },
];

function applyFiltersAndSort() {
	let rows = tableStore.rows.slice();
	if (tableStore.filter) {
		const q = tableStore.filter.toLowerCase();
		rows = rows.filter(
			(r) => r.name.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q),
		);
	}
	if (tableStore.statusFilter) {
		rows = rows.filter((r) => r.status === tableStore.statusFilter);
	}
	const { col, dir } = tableStore.sort;
	rows.sort((a, b) => {
		const av = a[col],
			bv = b[col];
		if (av < bv) return dir === "asc" ? -1 : 1;
		if (av > bv) return dir === "asc" ? 1 : -1;
		return 0;
	});
	tableStore.filteredRows = rows;
}

function pageRows() {
	const start = (tableStore.page - 1) * tableStore.pageSize;
	return tableStore.filteredRows.slice(start, start + tableStore.pageSize);
}

// ─── Row cache — create once, reuse ──────────────────────────────────────
const rowCache = {};
function getRow(row) {
	if (!rowCache[row.id]) {
		rowCache[row.id] = o.initState({
			tag: "tr",
			className: "dt-row",
			"data-id": row.id,
			html: COLUMNS.map((col) => {
				const val = row[col.key];
				// Status class goes on a <span> inside the <td>, not the <td> itself,
				// so row hover background doesn't override the badge color.
				const inner =
					col.key === "status"
						? `<span class="status status--${val.toLowerCase()}">${val}</span>`
						: String(val);
				return `<td>${inner}</td>`;
			}).join(""),
		});
	}
	return rowCache[row.id];
}

// ─── Sort header ──────────────────────────────────────────────────────────
const sortHeaderStates = {
	name: "SortHeader",
	render: {
		tag: "tr",
		html: COLUMNS.map(
			(col) =>
				`<th data-col="${col.key}" style="width:${col.width}" class="th-sortable">${col.label} <span class="sort-icon"></span></th>`,
		).join(""),
	},
	sync: ({ self }) => {
		self.find(".sort-icon").forEach(({ el }) => {
			el.textContent = "";
		});
		const th = self.first(`[data-col="${tableStore.sort.col}"]`);
		if (th.el) {
			th.first(".sort-icon").html(tableStore.sort.dir === "asc" ? " ▲" : " ▼");
		}
	},
};

const sortHeader = o.init(sortHeaderStates).render().appendInside("#sort-thead");
tableStore.subscribe(sortHeader, "sync");

sortHeader.on("click", (e) => {
	const th = e.target.closest("[data-col]");
	if (!th) return;
	const col = th.dataset.col;
	tableStore.sort = {
		col,
		dir: tableStore.sort.col === col && tableStore.sort.dir === "asc" ? "desc" : "asc",
	};
	tableStore.page = 1;
	applyFiltersAndSort();
	tableStore.notify();
});

// ─── Filter bar ───────────────────────────────────────────────────────────
const filterBarStates = {
	name: "FilterBar",
	render: {
		tag: "div",
		className: "filter-bar",
		html: `<input class="filter-input" type="search" placeholder="Search by name or department…">
           <select class="status-select">
             <option value="">All statuses</option>
             ${STATUSES.map((s) => `<option value="${s}">${s}</option>`).join("")}
           </select>
           <span class="filter-count"></span>
           <button class="btn btn--sm btn--danger" id="simulate-error">Simulate error</button>`,
	},
	sync: ({ self }) => {
		const total = tableStore.filteredRows.length;
		self
			.first(".filter-count")
			.html(
				tableStore.loading
					? "Loading…"
					: tableStore.error
						? "Error"
						: `${total} row${total !== 1 ? "s" : ""}`,
			);
	},
};

let filterTimer;
const filterBar = o.init(filterBarStates).render().appendInside("#filter-bar");
tableStore.subscribe(filterBar, "sync");

filterBar.first(".filter-input").on("input", (e) => {
	clearTimeout(filterTimer);
	filterTimer = setTimeout(() => {
		tableStore.filter = e.target.value;
		tableStore.page = 1;
		applyFiltersAndSort();
		tableStore.notify();
	}, 300);
});

filterBar.first(".status-select").on("change", (e) => {
	tableStore.statusFilter = e.target.value;
	tableStore.page = 1;
	applyFiltersAndSort();
	tableStore.notify();
});

o("#simulate-error").on("click", () => {
	tableStore.error = tableStore.error ? null : "Server error — could not load data.";
	tableStore.notify();
});

// ─── Table body ───────────────────────────────────────────────────────────
const tableBodyStates = {
	name: "TableBody",
	render: { tag: "tbody" },
	sync: ({ self }) => {
		if (tableStore.loading || tableStore.error) {
			self.html("");
			return;
		}
		const rows = pageRows();
		// Reconcile — only move nodes that changed position
		const rowEls = rows.map((r) => getRow(r).el);
		// Remove rows not on this page
		const currentIds = new Set(rows.map((r) => r.id));
		self.find(".dt-row").forEach(({ el }) => {
			if (!currentIds.has(Number(el.dataset.id))) el.remove();
		});
		// Insert in order
		rowEls.forEach((el, i) => {
			const existing = self.el.children[i];
			if (!existing) {
				self.el.appendChild(el);
			} else if (existing !== el) {
				self.el.insertBefore(el, existing);
			}
		});
	},
};

const tableBody = o.init(tableBodyStates).render().appendInside(".data-table");
tableStore.subscribe(tableBody, "sync");

// ─── Overlay (loading / error) ────────────────────────────────────────────
const tableOverlay = o
	.init({
		name: "TableOverlay",
		render: { tag: "div", className: "table-overlay table-overlay--hidden" },
		sync: ({ self }) => {
			if (tableStore.loading) {
				self.removeClass("table-overlay--hidden");
				self.html('<div class="spinner"></div><p>Loading…</p>');
			} else if (tableStore.error) {
				self.removeClass("table-overlay--hidden");
				self.html(
					`<p class="error-msg">⚠ ${tableStore.error}</p><button class="btn btn--sm btn--primary" id="retry-btn">Retry</button>`,
				);
				o("#retry-btn").on("click", loadData);
			} else {
				self.addClass("table-overlay--hidden");
				self.html("");
			}
		},
	})
	.render()
	.appendInside(".table-wrap");
tableStore.subscribe(tableOverlay, "sync");

// ─── Pagination ───────────────────────────────────────────────────────────
const paginationStates = {
	name: "Pagination",
	render: {
		tag: "div",
		className: "pagination",
		html: `<div class="pagination__info"></div>
           <div class="pagination__controls">
             <button class="btn btn--sm btn--outline" id="pg-prev">← Prev</button>
             <span class="pagination__pages"></span>
             <button class="btn btn--sm btn--outline" id="pg-next">Next →</button>
           </div>
           <select class="page-size-select">
             <option value="10">10 / page</option>
             <option value="25">25 / page</option>
             <option value="50">50 / page</option>
           </select>`,
	},
	sync: ({ self }) => {
		const total = tableStore.filteredRows.length;
		const totalPages = Math.max(1, Math.ceil(total / tableStore.pageSize));
		const cur = tableStore.page;
		self
			.first(".pagination__info")
			.html(
				`${(cur - 1) * tableStore.pageSize + 1}–${Math.min(cur * tableStore.pageSize, total)} of ${total}`,
			);
		self.first(".pagination__pages").html(`Page ${cur} / ${totalPages}`);
		cur <= 1
			? self.first("#pg-prev").attr("disabled", "")
			: self.first("#pg-prev").attr("disabled", null);
		cur >= totalPages
			? self.first("#pg-next").attr("disabled", "")
			: self.first("#pg-next").attr("disabled", null);
	},
};

const pagination = o.init(paginationStates).render().appendInside("#pagination");
tableStore.subscribe(pagination, "sync");

pagination.first("#pg-prev").on("click", () => {
	if (tableStore.page > 1) {
		tableStore.page--;
		tableStore.notify();
	}
});
pagination.first("#pg-next").on("click", () => {
	const total = Math.ceil(tableStore.filteredRows.length / tableStore.pageSize);
	if (tableStore.page < total) {
		tableStore.page++;
		tableStore.notify();
	}
});
pagination.first(".page-size-select").on("change", (e) => {
	tableStore.pageSize = Number(e.target.value);
	tableStore.page = 1;
	tableStore.notify();
});

// ─── Load data (async simulation) ────────────────────────────────────────
function loadData() {
	tableStore.loading = true;
	tableStore.error = null;
	tableStore.notify();

	setTimeout(() => {
		tableStore.rows = makeRows(200);
		tableStore.loading = false;
		applyFiltersAndSort();
		tableStore.notify();
	}, 600);
}

loadData();
