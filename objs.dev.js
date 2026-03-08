/**
 * @fileoverview Objs-core library
 * @version 1.2
 * @author Roman Torshin
 * @license Apache-2.0
 */

/** @type {boolean} Replaced with false by the build step to strip all dev-only code in objs.prod.js */
const __DEV__ = true;

/**
 * Main Objs function for DOM manipulation and state control
 * @function Objs
 * @param {any} query - Selector, DOM element to use, an array of elements, inited ID or nothing for creating an element
 * @returns {Object} Objs instance with DOM manipulation methods
 */
const o = (query) => {
	let result = {
			els: [],
			ie: {},
			delegated: {},
			parented: {},
			store: {},
			refs: {},
			states: [],
			isDebug: false,
			currentState: "",
			savedStates: {},
			isRoot: false,
			_parent: null,
		},
		ONE = 1,
		TWO = 2,
		THREE = 3,
		booleanType = "boolean",
		objectType = "object",
		functionType = "function",
		stringType = "string",
		numberType = "number",
		notEmptyStringType = "notEmptyString",
		undefinedType = "undefined",
		_reactProp = "dangerouslySetInnerHTML",
		u,
		D = o.D,
		start = -1,
		finish = 0,
		select = 0,
		ssr = typeof process !== "undefined" || o.D === o.DocumentMVP,
		i = 0,
		j = 0;

	/**
	 * Shortcut for typeof operator
	 * @param {any} obj - Object to check type of
	 * @returns {string} Type of the object
	 */
	const type = (obj) => typeof obj;

	/**
	 * Iterate through object properties
	 * @param {Object} obj - Object to iterate through
	 * @param {Function} func - Function to execute for each property
	 */
	const cycleObj = (obj, func) => {
		for (const item in obj) if (Object.hasOwn(obj, item)) func(item, obj);
	};

	/**
	 * Error handling function
	 * @type {Function}
	 */
	const error = o.onError;
	const typeVerify = (pairs) => o.verify(pairs);

	/**
	 * Creates a function that returns values or the result object
	 * @param {Function} f - Function to wrap
	 * @returns {Function} Wrapped function that handles errors and returns
	 */
	const returner = (f, name = "") => {
		return (...a) => {
			if (__DEV__ && (o.debug || result.isDebug)) {
				console.log(
					name ? `${name}()` : f,
					a.length ? "with " + a.join(", ") : "without parameters",
				);
			}
			try {
				const res = f(a[0], a[ONE], a[TWO], a[THREE]);
				return res !== u ? res : result;
			} catch (err) {
				error(err, name);
			}
		};
	};

	/**
	 * Iterate through selected elements
	 * @param {Function} f - Function to execute for each element
	 */
	const iterator = (f) => {
		for (i = finish; i <= start; i++) f();
	};

	/**
	 * Convert query to DOM element
	 * @param {any} el - Element to convert
	 * @returns {Element} DOM element
	 */
	const toEl = (el) => {
		if (el?.els) return el.el; // ObjsInstance → first DOM element
		if (type(el) !== objectType) el = o.first(el).el;
		return el;
	};

	/**
	 * Set result object properties
	 * @param {boolean} clearStates - Whether to clear states
	 * @param {Array} els - Elements to set properties for
	 */
	const setResultVals = (clearStates = true, els = result.els) => {
		const ln = els.length;
		result.length = ln;
		start = ln - ONE;
		finish = 0;
		result.el = ln ? els[0] : u;
		result.last = ln ? els[start] : u;
		if (clearStates) {
			cycleObj(result.states, (i, state) => {
				delete result[state[i]];
			});
			result.states = [];
			result.ie = {};
		}
	};
	// sets new objects to operate
	result.reset = o;

	/**
	 * Transform DOM elements based on state and props
	 * @param {Element} el - DOM element to transform
	 * @param {Object} state - State data
	 * @param {Object} props - Additional props and dynamic content
	 */
	const transform = (el, state, props) => {
		// filter state vs current state
		cycleObj(state, (s) => {
			let value = state[s];

			// eval functions in attributes
			if (type(value) === functionType) {
				value = value(props);
			}

			// prepare objs to append
			if (s === "append" && type(value) === objectType) {
				if (value.els) {
					value = [value];
				}
				if (value[0]?.els) {
					valueBuff = [];
					cycleObj(value, (i) => {
						valueBuff.push(...value[i].els);
					});
					value = valueBuff;
				}
			}

			if (
				value !== u &&
				el.getAttribute(s) !== value &&
				![
					"tag",
					"tagName",
					"name",
					"sample",
					"state",
					"events",
					"ssr",
					"nodeName",
					"revertChildren",
					"root",
					"ref",
				].includes(s)
			) {
				// insert html
				["html", "innerHTML"].includes(s)
					? (el.innerHTML = value)
					: // className alias
						s === "className"
						? el.setAttribute("class", value)
						: // attach dataset
							s === "dataset" && type(value) === objectType
							? cycleObj(value, (data) => {
									el.dataset[data] = value[data];
								})
							: // classes
								s === "toggleClass"
								? el.classList.toggle(value)
								: s === "addClass"
									? type(value) === objectType
										? el.classList.add(...value)
										: el.classList.add(value)
									: s === "removeClass"
										? el.classList.remove(value)
										: // style attribute
											s === "style" && type(value) === objectType
											? cycleObj(value, (data) => {
													el.style[data] = value[data];
												})
											: // append DOM objects
												(s === "append" || s === "children" || s === "childNodes") &&
													type(value) === objectType
												? cycleObj(value.length ? value : [value], (j) => {
														if (s === "append" || !el.childNodes[j]) {
															el.appendChild(value[j]);
														} else if (el.childNodes[j] !== value[j]) {
															el.childNodes[j].replaceWith(value[j]);
														}
													})
												: // set attributes
													el.setAttribute(s, value);
			}
		});

		el.dataset["oState"] = state.state;
		// autotag: set data-{o.autotag}="component-name" from states.name
		if (o.autotag && state.name) {
			el.dataset[o.autotag] = o.camelToKebab(state.name);
		}
	};

	if (__DEV__) {
		/**
		 * Enable debug mode
		 */
		result.debug = returner(() => {
			result.isDebug = true;
		}, "debug ON");
	}

	/**
	 * Save object by key in o.getSaved{}
	 */
	result.saveAs = returner((key) => {
		typeVerify([[key, [notEmptyStringType]]]);
		if (!o.getSaved[key]) {
			o.getSaved[key] = result;
		} else if (o.debug || result.isDebug) {
			console.warn("the key exists (not saved):" + key);
		}
	}, "saveAs");

	/**
	 * Unmount the component
	 * @returns {boolean} True if the component was unmounted
	 */
	result.unmount = () => {
		if (o.debug || result.isDebug) {
			console.log("unmount() for initID:" + result.initID);
		}
		if (type(result.remove) === functionType) {
			result.remove();
		} else if (result.els?.length) {
			result.els.forEach((el) => {
				if (el?.parentNode) el.parentNode.removeChild(el);
			});
		}
		o.inits[result.initID] = undefined;
		result = {};
		return true;
	};

	/**
	 * Initialize states and create state functions
	 * @param {Object|Function|Component} states - States object or Component function
	 */
	result.init = returner((states) => {
		typeVerify([[states, [objectType, functionType]]]);
		const initN = result.initID || o.inits.length || 0;
		result.initID = initN;
		setResultVals();
		o.inits[result.initID] = result;

		// React Component usage for rendering
		if (type(states) === "function") {
			result.render = returner((props) => {
				const root = D.createElement("div");
				setTimeout(() => {
					o.reactRender(states, root, props);
				});
				result.add(root);
			});
			return;
		}

		// fast initialisation
		if (type(states) !== objectType || states.render === u) {
			states = {
				render: states,
			};
		}

		// cycle threw states
		cycleObj(states, (state) => {
			// prevent render override
			if (result?.render && state === "render") {
				return;
			}
			// save state name to clear object by reset();
			result.states.push(state);
			// add method named as state
			result[state] = returner((props = [{}]) => {
				result.currentState = state;
				const data = states[state] || { tag: "div" };
				const els = result.els.slice(finish, start + ONE);

				if (type(data) === objectType) {
					data.state = state;
					data["data-o-init"] = initN;
				}

				// creation elements for prop in props
				const newEl = (n, prop = {}) => {
					if (type(data) === objectType) {
						return D.createElement(data.tag || data.tagName || "div");
					} else {
						const newElem = D.createElement("div");
						newElem.innerHTML = type(data) === functionType ? data(prop) : data;
						if (newElem.children.length > ONE || !newElem.firstElementChild) {
							newElem.dataset.oInit = n;
							return newElem;
						} else {
							newElem.firstElementChild.dataset.oInit = n;
							return newElem.firstElementChild;
						}
					}
				};

				// properties creation
				const rawData = props; // raw argument before array-wrapping
				!props.length ? (props = [props]) : props;

				// creating elements if no one was selected
				const creation = !els[0] && state === "render";
				props = props.map((prop, i) => {
					const newProp = Object.assign({}, type(prop) === objectType ? prop : {}, {
						self: result,
						o,
						i: prop.i === u ? i : prop.i,
						parent: result._parent,
						data: Array.isArray(rawData) ? rawData[i] : rawData,
					});
					if (creation && (!data.ssr || ssr)) {
						els.push(newEl(initN, newProp));
					}
					return newProp;
				});
				if (creation) {
					result.els = els;
					setResultVals(false);
				}

				// initing events
				const initSSR = () => {
					cycleObj(data.events, (event) => {
						result.on(event, data.events[event]);
					});
				};

				// changing element if there is data object
				if (els) {
					j = els.length === props.length;
					els.map((el, i) => {
						props[j ? i : 0].i = i + finish;
						const buff = type(data) === functionType ? data(props[j ? i : 0]) : data;
						if (type(buff) === objectType) {
							buff["state"] = state;
							if (creation) {
								buff["data-o-init"] = initN;
								buff["data-o-init-i"] = i;
							}
							transform(el, buff, props[j ? i : 0]);
						}
					});
					if (creation) {
						result.refs = {};
						result.els.forEach((el) => {
							if (!el.querySelectorAll) return;
							el.querySelectorAll("[ref]").forEach((refEl) => {
								result.refs[refEl.getAttribute("ref")] = o(refEl);
								refEl.removeAttribute("ref");
							});
						});
					}
				}

				// init events if there is data object and events are defined
				if (creation && type(data) === objectType && data.events) {
					// check for SSR and SSR flag in data object to allow testing in browser
					if (!ssr && !data.ssr) {
						initSSR();
					}
				}
			});
		});
		const renderState = states.render || states;
		if (
			!ssr &&
			type(renderState) === objectType &&
			renderState.events &&
			renderState.ssr
		) {
			result.initSSRAfterGettingSSR = () => {
				result.refs = {};
				result.els.forEach((el) => {
					if (!el.querySelectorAll) return;
					el.querySelectorAll("[ref]").forEach((refEl) => {
						result.refs[refEl.getAttribute("ref")] = o(refEl);
						refEl.removeAttribute("ref");
					});
				});
				cycleObj(renderState.events, (event) => {
					result.on(event, renderState.events[event]);
				});
			};
		}
	}, "init");

	/**
	 * Connect loader to result
	 * @param {Object} loader - Loader object
	 * @param {string} state - State name
	 * @param {Function} fail - Fail state name
	 */
	result.connect = returner((loader, state = "render", fail) => {
		typeVerify([
			[loader, [objectType]],
			[state, [notEmptyStringType]],
			[fail, [stringType, undefinedType]],
		]);

		loader.connect(result, state, fail);
	}, "connect");

	/**
	 * Get SSR elements
	 * @param {number} initId - Initialization ID
	 */
	result.getSSR = returner((initId) => {
		typeVerify([[initId, [numberType, undefinedType]]]);
		const effectiveId = initId !== undefined ? initId : result.initID;
		if (
			ssr ||
			(type(initId) === undefinedType && type(result.initID) === undefinedType)
		) {
			return;
		}
		const ssrEls = o.D.querySelectorAll(`[data-o-init="${effectiveId}"]`);

		if (ssrEls.length && !result.els.length) {
			result.els = Array.from(ssrEls);
			result.initID = initId;
			o.inits[initId] = result;
			setResultVals(false);

			if (type(result.initSSRAfterGettingSSR) === functionType) {
				result.initSSRAfterGettingSSR();
				delete result.initSSRAfterGettingSSR;
			}
		}
	}, "getSSR");

	/**
	 * Initialize state with props
	 * @param {Object} state - State object
	 * @param {Object} props - Props to initialize with
	 */
	result.initState = returner((state, props) => {
		typeVerify([
			[state, [objectType]],
			[props, [objectType, undefinedType]],
		]);
		result.init(state).render(props);
	}, "initState");

	/**
	 * Parse state of element
	 * @param {Element} el - Element to parse
	 * @param {String} stateId - Title for state saving
	 * @param {boolean} root - Parse child elements if true
	 * @returns {Object} State object
	 */
	const parseState = (el, stateId, root) => {
		const attrs = el.attributes;
		const stateData = {
			tagName: el.tagName.toLowerCase(),
		};

		for (const attr of attrs) {
			stateData[attr.nodeName] = attr.value;
		}

		if (root) {
			stateData.innerHTML = el.innerHTML;
			stateData.revertChildren = [];
			const initedChildren = el.querySelectorAll("[data-o-init]");
			for (const child of initedChildren) {
				const initId = child.getAttribute("data-o-init");
				stateData.revertChildren.push(initId);
				// save state of children for revert
				o.inits[initId]?.saveState(stateId, false);
			}
		}

		return stateData;
	};

	/**
	 * Save state of elements
	 * @param {string|undefined} stateId - State string ID or will be 'fastSavedState'
	 * @param {boolean} root - Root element flag
	 * @returns {Object} State object
	 */
	result.saveState = returner((stateId, root = true) => {
		typeVerify([
			[stateId, [notEmptyStringType, undefinedType]],
			[root, [booleanType]],
		]);

		if (!result.el) {
			throw Error("saveState(): There are no elements to save");
		}

		const targetState = stateId ? stateId : "fastSavedState";
		const stateRevert = { els: [], parentNode: result.el.parentNode, root: root };

		iterator(() => {
			stateRevert.els.push(parseState(result.els[i], targetState, root));
		});

		stateRevert.ie = Object.assign({}, result.ie);
		stateRevert.delegated = Object.assign({}, result.delegated);
		stateRevert.store = Object.assign({}, result.store);

		// save the save flag
		result.isRoot = result.isRoot || root;
		result.savedStates[targetState] = stateRevert;
	}, "saveState");

	/**
	 * Revert state of elements
	 * @param {string|undefined} state - State name or will be 'fastSavedState'
	 */
	result.revertState = returner((state) => {
		typeVerify([[state, [notEmptyStringType, undefinedType]]]);

		const targetState = state ? state : "fastSavedState";

		if (!result.savedStates[targetState]) {
			throw Error(
				`revertState(): The state "${targetState}" should have been saved by saveState()`,
			);
		}

		const stateRevert = result.savedStates[targetState];

		// turn off all event listeners connected to the elements
		result.offAll();
		result.offDelegate();

		// revert elements
		result.store = Object.assign({}, stateRevert.store);
		stateRevert.els.forEach((elData, index) => {
			// create element if not exist
			if (!result.els[index]) {
				const newEl = o.D.createElement(elData.tagName);
				// if element was in DOM
				if (stateRevert.parentNode) {
					if (index) {
						result.els[index - 1].after(newEl);
					} else {
						stateRevert.parentNode.append(newEl);
					}
				}
				result.add(newEl);
			}
			transform(result.els[index], elData);
		});

		// revert event listeners
		result.delegated = Object.assign({}, stateRevert.delegated);
		result.ie = Object.assign({}, stateRevert.ie);
		result.onAll();
		cycleObj(stateRevert.delegated, (ev) => {
			stateRevert.delegated[ev].forEach((f) => {
				iterator(() => {
					result.els[i].addEventListener(ev, f);
				});
			});
		});

		result.currentState = targetState;

		// revert children from HTML
		if (stateRevert.root) {
			stateRevert.els.forEach(({ rootElement }) => {
				rootElement.revertChildren.forEach((initId) => {
					o.inits[initId]?.revertState(targetState);
					o('[data-o-init="' + initId + '"]').els.forEach((el, index) => {
						el.replaceWith(o.inits[initId]?.els[index]);
					});
				});
			});
		}
	}, "revertState");

	/**
	 * Lose state of elements
	 * @param {string} stateId - State ID
	 */
	result.loseState = returner((stateId) => {
		typeVerify([[stateId, [notEmptyStringType]]]);

		if (result.savedStates[stateId]) {
			delete result.savedStates[stateId];
			iterator(() => {
				const initedChildren = result.els[i].querySelectorAll("[data-o-init]");
				for (const child of initedChildren) {
					const initId = child.getAttribute("data-o-init");
					o.inits[initId]?.loseState(stateId);
				}
			});
		}
	}, "sample");

	/**
	 * Get state object from existing DOM element
	 * @param {string} state - State title (optional)
	 * @returns {Object} State object
	 */
	result.sample = returner((state = "render") => {
		typeVerify([[state, [notEmptyStringType]]]);
		return { [state]: parseState(result.els[finish]) };
	}, "sample");

	/**
	 * Select element to control
	 * @param {number} i - Index of element to select
	 */
	result.select = returner((i) => {
		typeVerify([[i, [numberType, undefinedType]]]);
		if (i === u) {
			i = result.length - ONE;
		}
		start = i;
		finish = i;
		result.el = result.els[i];
		select = ONE;
	}, "select");

	/**
	 * Select all elements to control
	 */
	result.all = returner(() => {
		start = result.length - ONE;
		finish = 0;
		result.el = result.els[0];
		select = 0;
	}, "all");

	/**
	 * Remove selected element or all elements from DOM
	 * @param {number} j - Index of element to remove
	 */
	result.remove = returner((j) => {
		typeVerify([[j, [numberType, undefinedType]]]);
		if (j === u && select) {
			j = finish;
		}

		if (j !== u) {
			const el = result.els[j];
			if (el?.parentNode) {
				el.parentNode.removeChild(el);
			} else if (el === undefined && j >= result.els.length) {
				if (o.onError) o.onError("remove(" + j + "): index out of bounds", "remove");
			}
		} else {
			iterator(() => {
				const el = result.els[i];
				if (el?.parentNode) el.parentNode.removeChild(el);
			});
		}
		setResultVals(false);
	}, "remove");

	/**
	 * Skip element from control list
	 * @param {number} j - Index of element to skip
	 */
	result.skip = returner((j) => {
		typeVerify([[j, [numberType, undefinedType]]]);
		if (j === u) {
			j = finish;
		}

		result.els.splice(i, ONE);
		setResultVals();
	}, "skip");

	/**
	 * Add element to control list
	 * @param {any} el - Element to add
	 */
	result.add = returner((el) => {
		typeVerify([[el, [stringType, objectType, numberType]]]);
		if (result.initID !== u) {
			return;
		}

		if (type(el) === "string" && el !== "") {
			result.els.push(...Array.from(D.querySelectorAll(el)));
		} else if (type(el) === objectType) {
			if (el.tagName) {
				result.els.push(el);
			} else if (el.els) {
				result.els.push(...el.els);
			} else if (el.length && el[0].tagName) {
				result.els.push(...el);
			}
		} else if (type(el) === "number" && o.inits[el]) {
			result = o.inits[el];
		}

		setResultVals(false);

		if (result.initID !== u) {
			result.dataset({ oInit: result.initID });
		}
	}, "add");

	/**
	 * Append elements inside another element
	 * @param {Element|String} el - Parent element
	 */
	result.appendInside = returner((el) => {
		typeVerify([[el, [objectType, notEmptyStringType]]]);
		if (el?.els) result._parent = el; // store ObjsInstance parent reference
		iterator(() => {
			toEl(el).appendChild(result.els[i]);
		});
	}, "appendInside");

	/**
	 * Append elements before another element
	 * @param {Element} el - Reference element
	 */
	result.appendBefore = returner((el) => {
		typeVerify([[el, [objectType, notEmptyStringType]]]);
		iterator(() => {
			toEl(el).parentNode.insertBefore(result.els[i], toEl(el));
		});
	}, "appendBefore");

	/**
	 * Append elements after another element
	 * @param {Element} el - Reference element
	 */
	result.appendAfter = returner((el) => {
		typeVerify([[el, [objectType, notEmptyStringType]]]);
		iterator(() => {
			toEl(el).after(...result.els);
		});
	}, "appendAfter");

	/**
	 * Find child elements
	 * @param {string} innerQuery - Query selector
	 * @returns {Object} Objs instance with found elements
	 */
	result.find = returner((innerQuery = "") => {
		typeVerify([[innerQuery, stringType]]);
		const newEls = [];

		iterator(() => {
			newEls.push(...Array.from(result.els[i].querySelectorAll(":scope " + innerQuery)));
		});

		return o(newEls);
	}, "find");

	/**
	 * Find first child element by query
	 * @param {string} innerQuery - Query selector
	 * @returns {Object} Objs instance with found element
	 */
	result.first = returner((innerQuery = "") => {
		typeVerify([[innerQuery, stringType]]);
		let buff = u;
		const newEls = [];

		iterator(() => {
			buff = result.els[i].querySelector(innerQuery);
			if (buff) {
				newEls.push(buff);
			}
		});

		return o(newEls);
	}, "first");

	/**
	 * Set, delete or get attribute
	 * @param {string} attr - Attribute name
	 * @param {any} val - Attribute value
	 */
	result.attr = returner((attr, val) => {
		if (val !== null) {
			typeVerify([
				[attr, stringType],
				[val, [stringType, undefinedType]],
			]);
		}
		if (val === u) {
			const attrs = [];
			iterator(() => {
				attrs[i] = result.els[i].getAttribute(attr);
			});
			return select ? attrs[0] : attrs;
		} else if (val !== null) {
			iterator(() => {
				result.els[i].setAttribute(attr, val);
			});
		} else {
			iterator(() => {
				result.els[i].removeAttribute(attr);
			});
		}
	}, "attr");

	/**
	 * Get all attributes
	 * @returns {Array|Object} Array of attribute objects or single attribute object
	 */
	result.attrs = returner(() => {
		const res = [];
		iterator(() => {
			const obj = {};
			[...result.els[i].attributes].forEach((attr) => {
				obj[attr.nodeName] = attr.nodeValue;
			});
			res.push(obj);
		});
		return select ? res[0] : res;
	}, "attrs");

	/**
	 * Control dataset
	 * @param {Object} values - Dataset values
	 */
	result.dataset = returner((values) => {
		typeVerify([[values, [objectType, undefinedType]]]);
		if (typeof values === objectType) {
			iterator(() => {
				cycleObj(values, (data) => {
					result.els[i].dataset[data] = values[data];
				});
			});
		} else {
			const res = [];
			iterator(() => {
				res.push({ ...result.els[i].dataset });
			});
			return select ? res[0] : res;
		}
	}, "dataset");

	/**
	 * Set style attribute
	 * @param {string} val - Style value
	 */
	result.style = returner((val) => {
		if (val !== null) typeVerify([[val, [stringType, undefinedType]]]);
		result.attr("style", val);
	}, "style");

	/**
	 * Set CSS styles from object. Pass null to remove the style attribute entirely.
	 * @param {Object|null} styles - CSS styles object, or null to remove
	 */
	result.css = returner((styles = {}) => {
		if (styles === null) {
			result.style(null);
			return;
		}
		typeVerify([[styles, objectType]]);
		let val = "";
		cycleObj(styles, (style) => {
			val += style + ":" + styles[style].replace('"', "'") + ";";
		});
		result.style(val || null);
	}, "css");

	/**
	 * Set class attribute
	 * @param {string} cl - Class name
	 */
	result.setClass = returner((cl) => {
		typeVerify([[cl, stringType]]);
		iterator(() => {
			result.els[i].setAttribute("class", cl);
		});
	}, "setClass");

	/**
	 * Add one or more classes to elements
	 * @param {...string} cls - Class names
	 */
	result.addClass = returner((...cls) => {
		iterator(() => {
			result.els[i].classList.add(...cls);
		});
	}, "addClass");

	/**
	 * Remove one or more classes from elements
	 * @param {...string} cls - Class names
	 */
	result.removeClass = returner((...cls) => {
		iterator(() => {
			result.els[i].classList.remove(...cls);
		});
	}, "removeClass");

	/**
	 * Toggle class on elements
	 * @param {string} cl - Class name
	 * @param {boolean} check - Whether to add or remove class
	 */
	result.toggleClass = returner((cl, check) => {
		typeVerify([
			[cl, notEmptyStringType],
			[check, [booleanType, undefinedType]],
		]);
		iterator(() => {
			result.els[i].classList.toggle(cl, check);
		});
	}, "toggleClass");

	/**
	 * Check if elements have class
	 * @param {string} cl - Class name
	 * @returns {boolean} Whether elements have the class
	 */
	result.haveClass = (cl) => {
		typeVerify([[cl, notEmptyStringType]]);
		let res = true;
		iterator(() => {
			if (!result.els[i].classList.contains(cl)) {
				res = false;
			}
		});
		if (result.isDebug || o.debug) {
			console.log("haveClass() with", cl);
		}
		return res;
	};

	/**
	 * Set or get innerHTML
	 * @param {string} html - HTML content
	 */
	result.innerHTML = returner((html) => {
		typeVerify([[html, [stringType, undefinedType]]]);
		if (html !== u) {
			iterator(() => {
				result.els[i].innerHTML = html;
			});
		} else {
			let res = "";
			iterator(() => {
				res +=
					ssr && result.els[i].innerHTML.length === 0
						? o.D.parseElement(result.els[i], false)
						: result.els[i].innerHTML;
			});
			return res;
		}
	}, "innerHTML");

	/**
	 * Set innerText
	 * @param {string} text - Text content
	 */
	result.innerText = returner((text) => {
		typeVerify([[text, [stringType]]]);
		iterator(() => {
			result.els[i].innerText = text;
		});
	}, "innerText");

	/**
	 * Set textContent
	 * @param {string} text - Text content
	 */
	result.textContent = returner((text) => {
		typeVerify([[text, [stringType]]]);
		iterator(() => {
			result.els[i].textContent = text;
		});
	}, "textContent");

	/**
	 * Get or set HTML of DOM elements
	 * @param {string} value - HTML value to set
	 * @returns {string} HTML content
	 */
	result.html = returner((value) => {
		typeVerify([[value, [stringType, undefinedType]]]);
		if (value !== undefined) {
			result.innerHTML(value);
		} else {
			let html = "";
			iterator(() => {
				html += ssr ? result.els[i].outerHTML() : result.els[i].outerHTML;
			});

			return html;
		}
	}, "html");

	/**
	 * Get or set the value property of form elements (input, textarea, select).
	 * @param {string} [value] - Value to set. Omit to get.
	 * @returns {string|ObjsInstance} Current value (getter) or instance (setter)
	 */
	result.val = returner((value) => {
		if (value === undefined) return result.el?.value;
		iterator(() => {
			result.els[i].value = value;
		});
	}, "val");

	/**
	 * Iterate through elements
	 * @param {Function} f - Function to execute for each element
	 */
	result.forEach = returner((f) => {
		typeVerify([[f, [functionType]]]);
		iterator(() => {
			f({ self: result, i, o, el: result.els[i] });
		});
	}, "forEach");

	/**
	 * Transform to React Element or Component
	 * @param {Object} reactObj - React
	 * @returns {Object} React Element or Component
	 */
	result.prepareFor = returner((reactArg, ReactComponent) => {
		typeVerify([
			[reactArg, [objectType, functionType, undefinedType]],
			[ReactComponent, [functionType, undefinedType]],
		]);

		// Accept either the full React object or React.createElement directly
		const isFullReact =
			reactArg && type(reactArg) === objectType && reactArg.createElement;
		if (!isFullReact && type(reactArg) !== functionType) {
			throw Error(
				"prepareFor(): pass React (full object) or React.createElement as first argument",
			);
		}

		const createElement = isFullReact ? reactArg.createElement : reactArg;
		const useEffect = isFullReact ? reactArg.useEffect : undefined;

		// Component function
		return (p) => {
			if (p.ref === u) {
				throw Error("No ref property to convert Objs to React");
			}

			const props = Object.assign({}, p);
			const reactElement = createElement("div", { ref: p.ref });
			delete props.ref;

			// render once
			useEffect(() => {
				cycleObj(props, (key) => {
					if (key.substring(0, 1) === "on") {
						const e = o.camelToKebab(key).split("-")[1];
						result.on(e, props[key]);
						delete props[key];
					}
				});

				// create elements
				result.render(props);
				result.appendInside(reactElement.ref.current);
			}, []);

			return reactElement;
		};
	}, "prepareFor");

	/**
	 * Add event listener
	 * @param {string} a - Event types
	 * @param {Function} b - Event handler
	 * @param {Object} c - Options
	 * @param {boolean} d - Use capture
	 */
	result.on = returner((a, b, c, d) => {
		typeVerify([
			[a, [notEmptyStringType]],
			[b, [functionType]],
			[c, [objectType, undefinedType]],
			[d, [booleanType, undefinedType]],
		]);
		a.split(", ").forEach((ev) => {
			iterator(() => {
				result.els[i].addEventListener(ev, b, c, d);
			});
			if (!result.ie[ev]) {
				result.ie[ev] = [];
			}
			result.ie[ev].push([b, c, d]);
		});
	}, "on");

	/**
	 * Remove event listener
	 * @param {string} a - Event types
	 * @param {Function} b - Event handler
	 * @param {Object} c - Options
	 */
	result.off = returner((a, b, c) => {
		typeVerify([
			[a, [notEmptyStringType]],
			[b, [functionType]],
			[c, [objectType, undefinedType]],
		]);
		a.split(", ").forEach((ev) => {
			iterator(() => {
				result.els[i].removeEventListener(ev, b, c);
			});
			if (result.ie[ev]) {
				result.ie[ev] = result.ie[ev].filter((f) => f[0] !== b);
			}
		});
	}, "off");

	/**
	 * Delegate event by selector
	 * @param {string} e - Event types
	 * @param {string} selector - CSS selector
	 * @param {Function} f - Event handler
	 */
	result.onDelegate = returner((e, selector, f) => {
		typeVerify([
			[e, [notEmptyStringType]],
			[selector, [notEmptyStringType]],
			[f, [functionType]],
		]);
		e.split(", ").forEach((ev) => {
			const delegateCheck = (event) => {
				const delegate = event.target.closest(selector);
				if (delegate) {
					event.delegate = delegate;
					event.objs = result;
					f(event);
				}
			};
			iterator(() => {
				result.els[i].addEventListener(ev, delegateCheck);
			});
			if (!result.delegated[ev]) {
				result.delegated[ev] = [];
			}
			result.delegated[ev].push(delegateCheck);
		});
	}, "onDelegate");

	/**
	 * Remove delegated events
	 * @param {string} e - Event type
	 */
	result.offDelegate = returner((e) => {
		typeVerify([[e, [notEmptyStringType]]]);
		cycleObj(result.delegated, (ev) => {
			if (!e || e === ev) {
				while (result.delegated[ev].length) {
					const f = result.delegated[ev].pop();
					iterator(() => {
						result.els[i].removeEventListener(ev, f);
					});
				}
			}
		});
		result.delegated = {};
	}, "offDelegate");

	/**
	 * Add parent event listener
	 * @param {string} e - Event types
	 * @param {string|Object} selector - CSS selector or parent element
	 * @param {Function} f - Event handler
	 */
	result.onParent = returner((e, selector, f) => {
		typeVerify([
			[e, [notEmptyStringType]],
			[selector, [notEmptyStringType, objectType]],
			[f, [functionType]],
		]);
		const parent = type(selector) === objectType ? selector : o.D.querySelector(selector);
		e.split(", ").forEach((ev) => {
			const parentCheck = (event) => {
				event.objs = result;
				f(event);
			};
			parent.addEventListener(ev, parentCheck);
			if (!result.parented[ev]) {
				result.parented[ev] = [];
			}
			result.parented[ev].push(parentCheck);
		});
	}, "onParent");

	/**
	 * Remove parent event listener
	 * @param {string} e - Event type
	 * @param {string|Object} query - CSS selector or parent element
	 */
	result.offParent = returner((e, query) => {
		typeVerify([
			[e, [notEmptyStringType]],
			[query, [notEmptyStringType, objectType]],
		]);
		const parent = type(query) === objectType ? query : o.D.querySelector(query);
		cycleObj(result.parented, (ev) => {
			if (!e || e === ev) {
				result.parented[ev].forEach((f) => {
					parent.removeEventListener(ev, f);
				});
				delete result.parented[ev];
			}
		});
	}, "offParent");

	/**
	 * Turn on or off all event listeners
	 * @param {string} type - Event type
	 * @param {boolean} off - Whether to remove listeners
	 */
	result.onAll = returner((type, off) => {
		typeVerify([
			[type, [notEmptyStringType, undefinedType]],
			[off, [booleanType, undefinedType]],
		]);
		cycleObj(result.ie, (ev, events) => {
			if (!type || type === ev) {
				events[ev].forEach((data) => {
					iterator(() => {
						if (off) {
							result.els[i].removeEventListener(ev, data[0]);
						} else {
							result.els[i].addEventListener(ev, data[0], data[ONE], data[TWO]);
						}
					});
				});
			}
		});
	}, "onAll");

	/**
	 * Turn off all event listeners
	 * @param {string} type - Event type
	 */
	result.offAll = returner((type) => {
		typeVerify([[type, [notEmptyStringType]]]);
		result.onAll(type, ONE);
	}, "offAll");

	/**
	 * Making result object
	 */
	if (query) {
		result.add(query);
	}

	result.take = (innerQuery) => {
		typeVerify([[innerQuery, [stringType, objectType, numberType]]]);
		result.add(innerQuery);

		if (result.el) {
			const initID = result.el.dataset["oInit"];

			if (initID !== u && o.inits[initID]) {
				if (result.length === ONE) {
					j = result.els[0];
					Object.assign(result, o.inits[initID]);
					result.els = [j];
				} else {
					result = o.inits[initID];
				}
				setResultVals(false, result.els);
				return result;
			}
		}
	};

	return result;
};

/**
 * Get first element matching query
 * @param {string} query - CSS selector
 * @returns {Object} Objs instance with found element
 */
o.first = (query) => {
	o.verify([[query, ["notEmptyString"]]]);
	if (__DEV__ && o.debug) {
		console.log(query, " -> ", "o.first()");
	}
	return o(o.D.querySelector(query)).select(0);
};

o.inits = []; // all initialised objects
o.getSaved = {}; // all saved elements for metrics
o.errors = []; // all errors
o.showErrors = false; // on and off errors
o.logErrors = () => {
	o.errors.length ? o.errors.forEach((e) => console.error(e)) : console.log("No errors");
}; // log errors
o.onError = (e, name) => {
	// function for errors
	if (o.showErrors) {
		console.error(e, name);
	} else {
		o.errors.push(e);
		if (name) {
			o.errors.push(name);
		}
	}
};
o.reactRender = () => new Error("React render function is not defined");
/**
 * When set to a string (e.g. "qa"), auto-sets data-{autotag}="component-name" on
 * rendered elements using states.name (camelCase → kebab-case).
 * @type {string|undefined}
 * @example o.autotag = "qa"; // adds data-qa="submit-button" if states.name = "SubmitButton"
 */
o.autotag = undefined;

/**
 * Returns a { 'data-{autotag}': 'kebab-name' } object for spreading onto React JSX elements.
 * @param {string} componentName - e.g. 'CheckoutButton'
 * @returns {Record<string, string>} e.g. { 'data-qa': 'checkout-button' }
 * @example <button {...o.reactQA('CheckoutButton')} onClick={fn}>Checkout</button>
 */
o.reactQA = (name) => ({
	["data-" + (o.autotag || "qa")]: name
		.replace(/([A-Z])/g, (_, l) => "-" + l.toLowerCase())
		.replace(/^-/, ""),
});

o.specialTypes = {
	notEmptyString: (val, type) => {
		return type === "string" && val.length;
	},
	array: (val) => {
		return Array.isArray(val);
	},
	promise: (val) => {
		return val instanceof Promise || Boolean(val && typeof val.then === "function");
	},
};

/**
 * Verify types of pairs
 * @param {Array} pairs - Array of pairs
 * @param {boolean} safe - Whether to return false if type verification fails
 * @returns {boolean} True if type verification passes, false if safe is true, otherwise Error
 */
o.verify = (pairs, safe = false) => {
	for (const pair of pairs) {
		const type = typeof pair[0];
		let expectedTypes = Array.isArray(pair[1]) ? pair[1] : [pair[1]];
		let isValid = false;

		// Check if type matches any of the remaining expected types
		if (expectedTypes.includes(type)) {
			return true;
		} else {
			expectedTypes = expectedTypes.filter((t) => !!o.specialTypes[t]);
		}

		// Check for special types
		for (const expectedType of expectedTypes) {
			isValid = o.specialTypes[expectedType](pair[0], type);
			if (isValid) {
				return true;
			}
		}
	}

	if (safe) {
		return false;
	}
	return new Error("Type verification failed");
};
o.safeVerify = (pairs) => {
	return o.verify(pairs, true);
};

/**
 * Creating elements from state
 *
 * @param {object} states State, states or function/string
 */
o.init = (states, reactRender) => o().init(states, reactRender);

/**
 * Initialize state with props
 * @param {Object} state - State object
 * @param {Object} props - Props to initialize with
 */
o.initState = (state, props) => o().init(state).render(props);

/**
 * Take query
 * @param {string} query - Query
 * @returns {Object} Objs instance with found elements
 */
o.take = (query) => o().take(query);

/**
 * Get states
 * @returns {Array} States
 */
o.getStates = () =>
	o.inits.reduce((acc, result) => {
		acc.push(result?.states);
		return acc;
	}, []);

/**
 * Get stores
 * @returns {Array} Stores
 */
o.getStores = () =>
	o.inits.reduce((acc, result) => {
		acc.push(result?.store);
		return acc;
	}, []);

/**
 * Get listeners
 * @returns {Array} Listeners
 */
o.getListeners = () =>
	o.inits.reduce((acc, result) => {
		acc.push(result?.ie);
		return acc;
	}, []);

/**
 * Create a reactive store with built-in subscribe / notify.
 * @param {Object} defaults - Initial state and methods
 * @returns {Object} Store with .subscribe(component, stateName), .notify(), and .reset()
 */
o.createStore = (defaults) => {
	const store = Object.assign({}, defaults);
	store._defaults = Object.assign({}, defaults);
	store._listeners = [];
	store.subscribe = function (component, stateName) {
		this._listeners.push((data) => component[stateName]?.(data));
		return this;
	};
	store.notify = function () {
		this._listeners.forEach((fn) => fn(this));
	};
	store.reset = function () {
		const skip = { _listeners: 1, subscribe: 1, notify: 1, _defaults: 1, reset: 1 };
		for (const key of Object.keys(this._defaults)) {
			if (!skip[key]) this[key] = this._defaults[key];
		}
	};
	return store;
};

// Short values
o.W = 2;
o.H = 100;
o.F = false;

/**
 * Check if object has property
 * @param {Object} a - Object
 * @param {string} b - Property
 * @returns {boolean} Whether object has property
 */
o.C = (a, b) => {
	return Object.hasOwn(a, b);
};

/**
 * Convert kebab case to camel case
 * @param {string} str - String
 * @returns {string} Converted string
 */
o.kebabToCamel = (str) => str.replace(/-./g, (m) => m.toUpperCase()[1]);

/**
 * Convert camel case to kebab case
 * @param {string} str - String
 * @returns {string} Converted string
 */
o.camelToKebab = (str) => str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * Route
 * @param {string|function|boolean} path - Path or function returning path
 * @param {function|object} task - Callback function or state object (optional)
 * @returns {boolean|Object} True/false for path match current path and callback is provided, otherwise object with objs instance or empty object for inline logic
 */
o.route = (path, task) => {
	o.verify([
		[path, ["notEmptyString", "function", "boolean"]],
		[task, ["function", "object"]],
	]);
	const result = typeof path === "function" ? path(window.location.pathname) : path;

	if (result === true || window.location.pathname === result) {
		if (task) {
			if (typeof task === "function") {
				task();
				return true;
			} else {
				return task;
			}
		} else {
			return o;
		}
	} else {
		return typeof task === "function" ? false : {};
	}
};

/**
 * Router
 * @param {Object} routes - Routes
 * @returns {boolean} True if path matches any path
 */
o.router = (routes = {}) => {
	o.verify([[routes, ["object"]]]);
	for (const route in routes) {
		if (o.C(routes, route)) {
			if (window.location.pathname === route) {
				if (typeof routes[route] === "function") {
					routes[route]();
					return true;
				} else {
					return routes[route];
				}
			}
		}
	}
	return false;
};

/**
 * DocumentMVP parser for Objs SSR core function
 */
o.DocumentMVP = {
	addEventListener: () => {},
	parseElement: (elem, outer = true) => {
		o.verify([
			[elem, ["object", "string"]],
			[outer, ["boolean"]],
		]);
		const attrToStr = (attrs, prefix = "") => {
			let attrStr = "";
			for (const attr in attrs) {
				if (o.C(attrs, attr)) {
					attrStr += ` ${prefix}${o.camelToKebab(attr)}="${
						typeof attrs[attr] !== "object"
							? attrs[attr]
							: Object.entries(attrs[attr])
									.map((e) => `${e[0]}: ${e[1]};`)
									.join(" ")
					}"`;
				}
			}
			return attrStr;
		};

		if (typeof elem === "string") {
			return elem;
		}

		if (outer) {
			const selfClosing = [
				"area",
				"base",
				"br",
				"col",
				"embed",
				"hr",
				"img",
				"input",
				"link",
				"meta",
				"param",
				"source",
				"track",
				"wbr",
			];
			const tagName = elem.tagName.toLowerCase();
			// Ensure data-o-init is always serialized (SSR hydration)
			const dataOInit = elem.attributes["data-o-init"];
			const dataOInitAttr = dataOInit !== undefined ? ` data-o-init="${dataOInit}"` : "";
			return `<${tagName}${elem.className ? ` class="${elem.className}"` : ""}${attrToStr(elem.attributes)}${dataOInitAttr}${attrToStr(elem.dataset, "data-")}${selfClosing.includes(tagName) ? "/" : ""}>${selfClosing.includes(tagName) ? "" : elem.innerHTML.length ? elem.innerHTML : elem.children.map((el) => o.D.parseElement(el)).join("")}${!selfClosing.includes(tagName) ? `</${tagName}>` : ""}`;
		}

		return elem.innerHTML.length
			? elem.innerHTML
			: elem.children.map((el) => o.D.parseElement(el)).join("");
	},
	createElement: (tag) => {
		o.verify([[tag, ["notEmptyString"]]]);
		const elem = {
			tagName: tag.toUpperCase(),
			attributes: {},
			innerHTML: "",
			children: [],
			dataset: {},
			className: "",
			classArray: [],
			style: {},
			addEventListener: () => {},
			removeEventListener: () => {},
		};
		elem.classList = {
			add: (...cl) => {
				o.verify([[cl, ["array"]]]);
				elem.classArray.push(cl);
				elem.className = elem.classArray.join(" ");
			},
			has: (cl) => {
				o.verify([[cl, ["notEmptyString"]]]);
				return elem.classArray.includes(cl);
			},
			remove: (cl) => {
				o.verify([[cl, ["notEmptyString"]]]);
				elem.classArray = elem.classArray.filter((listed) => cl !== listed);
				elem.className = elem.classArray.join(" ");
			},
		};
		elem.classList.toggle = (cl) => {
			o.verify([[cl, ["notEmptyString"]]]);
			if (elem.classList.has(cl)) {
				elem.classList.remove(cl);
			} else {
				elem.classList.add(cl);
			}
		};
		elem.setAttribute = (attr, val) => {
			o.verify([
				[attr, ["notEmptyString"]],
				[val, ["string", "number", "boolean", "undefined"]],
			]);
			elem.attributes[attr] = val;
		};
		elem.getAttribute = (attr) => {
			o.verify([[attr, ["notEmptyString"]]]);
			return elem.attributes[attr];
		};
		elem.removeAttribute = (attr) => {
			o.verify([[attr, ["notEmptyString"]]]);
			delete elem.attributes[attr];
		};
		elem.appendChild = (el) => {
			o.verify([[el, ["object"]]]);
			elem.children.push(el);
			elem.firstElementChild = elem.children[0];
		};
		elem.outerHTML = () => o.D.parseElement(elem);
		return elem;
	},
};

/**
 * Document object
 * @type {Object}
 */
o.D =
	typeof document !== "undefined" && typeof process === "undefined"
		? document
		: o.DocumentMVP;

/**
 * Cookies
 * Minimal version. You can set your own functions for more comfortable usage.
 *
 * @argument {string} title Cookie name
 * @argument {string} value Cookie name
 * @argument {object} params parameters
 *
 * @returns {void}
 */
o.setCookie = (title, value = "", params = {}) => {
	o.verify([
		[title, ["notEmptyString"]],
		[value, ["string", "number", "boolean"]],
		[params, ["object"]],
	]);
	if (o.D.cookie === undefined) {
		console.log("Cookies are not supported on server side");
		return;
	}
	let str = encodeURIComponent(title) + "=" + encodeURIComponent(value);
	params = {
		path: "/",
		...params,
	};
	if (params.expires instanceof Date) {
		params.expires = params.expires.toUTCString();
	} else if (typeof params.expires === "number") {
		params.expires = new Date(params.expires).toUTCString();
	}
	for (const key in params) {
		str += "; " + key;
		const r = params[key];
		if (r !== true) {
			str += "=" + r;
		}
	}
	o.D.cookie = str;
};

/**
 * Get cookie value
 * @param {string} title - Cookie name
 * @returns {string|undefined} Cookie value
 */
o.getCookie = (title) => {
	o.verify([[title, ["notEmptyString"]]]);
	if (o.D.cookie === undefined) {
		console.log("Cookies are not supported on server side");
		return;
	}
	const val = o.D.cookie.match(
		RegExp("(?:^|; )" + title.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
	);
	return val ? decodeURIComponent(val[1]) : void 0;
};

/**
 * Delete cookie
 * @param {string} title - Cookie name
 */
o.deleteCookie = (title) => {
	o.verify([[title, ["notEmptyString"]]]);
	o.setCookie(title, "", { "max-age": 0 });
};

/**
 * Clear all cookies
 */
o.clearCookies = () => {
	if (o.D.cookie === undefined) {
		console.log("Cookies are not supported on server side");
		return;
	}
	const ca = document.cookie.split(";");
	while (ca.length) {
		let c = ca.pop();
		while (c.charAt(0) === " ") {
			c = c.substring(1);
		}
		const key = c.split("=")[0];
		o.deleteCookie(key);
	}
};

/**
 * Clear localStorage
 * @param {boolean} all - Whether to clear all items
 */
o.clearLocalStorage = (all) => {
	o.verify([[all, ["boolean", "undefined"]]]);
	if (typeof localStorage === "undefined") {
		return;
	}
	if (all) {
		localStorage.clear();
	} else {
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key.indexOf("oInc-") === -1 && key.indexOf("oTest-") === -1) {
				localStorage.removeItem(key);
			}
		}
	}
};

/**
 * Clear sessionStorage
 * @param {boolean} onlyTests - Whether to clear only test items
 */
o.clearSessionStorage = (onlyTests) => {
	o.verify([[onlyTests, ["boolean", "undefined"]]]);
	if (typeof sessionStorage === "undefined") {
		return;
	}
	if (!onlyTests) {
		sessionStorage.clear();
	} else {
		for (let i = sessionStorage.length - 1; i >= 0; i--) {
			const key = sessionStorage.key(i);
			if (key && key.indexOf("oTest-") === 0) {
				sessionStorage.removeItem(key);
			}
		}
	}
};

/**
 * Clear test storage
 */
o.clearTestsStorage = () => {
	o.clearSessionStorage(1);
};

/**
 * Clear cookies, localStorage (non-inc/test keys), and test-related sessionStorage.
 * Call after Cookies/LS/SS tests for a clean slate.
 */
o.clearAfterTests = () => {
	o.clearCookies();
	o.clearLocalStorage(false);
	o.clearTestsStorage();
};

/**
 * Make AJAX request
 * @param {string} url - Request URL
 * @param {Object} props - Request properties
 * @returns {Promise} Fetch promise
 */
o.ajax = (url, props = {}) => {
	o.verify([
		[url, ["notEmptyString"]],
		[props, ["object"]],
	]);
	const row = new URLSearchParams();
	if (props.data && typeof props.data === "object") {
		for (const param in props.data) {
			if (o.C(props.data, param)) {
				if (typeof props.data[param] === "object") {
					row.set(param, encodeURIComponent(JSON.stringify(props.data[param])));
				} else {
					row.set(param, props.data[param]);
				}
			}
		}
		if (props.method.toLowerCase() === "get") {
			url += "?" + row.toString();
		} else if (!props.body) {
			props.body = row;
		}
		delete props.data;
	}
	if (!props.headers) {
		props.headers = { "X-Requested-With": "XMLHttpRequest" };
	}

	return fetch(url, props);
};

/**
 * Make GET request
 * @param {string} url - Request URL
 * @param {Object} props - Request properties
 * @returns {Promise} Fetch promise
 */
o.get = (url, props = {}) => {
	o.verify([
		[url, ["notEmptyString"]],
		[props, ["object"]],
	]);
	return o.ajax(url, { ...props, method: "GET" });
};

/**
 * Make POST request
 * @param {string} url - Request URL
 * @param {Object} props - Request properties
 * @returns {Promise} Fetch promise
 */
o.post = (url, props = {}) => {
	o.verify([
		[url, ["notEmptyString"]],
		[props, ["object"]],
	]);
	return o.ajax(url, { ...props, method: "POST" });
};

/**
 * New loader
 * @param {Promise|undefined} promise - Promise
 * @returns {Object} Loader object
 */
o.newLoader = (promise) => {
	o.verify([[promise, ["promise", "undefined"]]]);
	let listeners = [];
	let data = null;
	let finished = false;
	let error = false;

	const reload = (p) => {
		finished = false;
		error = false;
		data = null;
		setTimeout(() => {
			p.then((response) => {
				finished = true;
				if (!response.ok && typeof response.ok !== "undefined") {
					error = true;
					listeners.forEach(([listener, _state, fail]) => {
						fail ? listener[fail](response) : "";
					});
				} else if (typeof response.json === "function") {
					response.json().then((jsonData) => {
						data = jsonData;
						listeners.forEach(([listener, state]) => {
							listener[state](data);
						});
					});
				} else {
					data = response;
					listeners.forEach(([listener, state]) => {
						listener[state](data);
					});
				}
			}).catch((err) => {
				error = true;
				listeners.forEach(([listener, _state, fail]) => {
					fail ? listener[fail](err) : "";
				});
			});
		}, 33);
	};

	if (promise) {
		reload(promise);
	}

	return {
		reload,
		isObjsLoader: true,
		listeners,
		isFinished: () => finished,
		getStore: () => data,
		connect: (listener, state = "render", fail) => {
			o.verify([
				[listener, ["object"]],
				[state, ["notEmptyString"]],
				[fail, ["string", "undefined"]],
			]);
			if (finished) {
				if (error) {
					fail ? listener[fail]() : "";
				} else {
					listener[state](data);
				}
			} else {
				listeners.push([listener, state, fail]);
			}
		},
		disconnect: (listener) => {
			o.verify([[listener, ["object"]]]);
			listeners = listeners.filter(([l]) => l !== listener);
		},
	};
};

/**
 * Get URL parameters
 * @param {string} key - Parameter key
 * @returns {Object|string} Parameters object or specific parameter value
 */
o.getParams = (key) => {
	o.verify([[key, ["string", "undefined"]]]);
	const params = {};
	const paramsRaw = new URLSearchParams(window.location.search).entries();

	for (const entry of paramsRaw) {
		params[entry[0]] = entry[1];
	}

	return key ? params[key] : params;
};

/* include function parameters */
o.incCache = true; // cache in localStorage
o.incCacheExp = 1000 * 60 * 60 * 24; // cache time
o.incTimeout = 6000; // ms for timing to load function
o.incSource = ""; // link to source folder
o.incForce = o.F; // reload loaded files or not
o.incAsync = true; // async or in order loading
o.incCors = o.F; // allow loading from other domains
o.incSeparator = "?"; // separator for file hash cache
o.incFns = {}; // array of name:status for all functions
o.incSet = [0]; // saving callbacks and change them for 1 value if executed
o.incReady = [0]; // array of all included sets and statuses
o.incN = 0; // index of the next set
o.incGetHash = (path) => path.split(o.incSeparator)[1] || "";

/**
 * Check the state status or a function in it, also checks its status to true
 *
 * @param {number} set index
 * @param {number} fnId index
 * @returns {boolean}
 */
o.incCheck = (set = 0, fnId, loaded = 0) => {
	o.verify([
		[set, ["number"]],
		[fnId, ["number", "undefined"]],
		[loaded, ["number"]],
	]);
	if (!loaded && set && fnId === o.U && o.incReady[set]) {
		return o.incSet[set] === 1;
	}

	if (o.incReady[set] === o.U || o.incReady[set][fnId] === o.U) {
		return o.F;
	}

	o.incReady[set][fnId].loaded = loaded;
	o.incFns[o.incReady[set][fnId].name] = loaded;
	o.incReady[set][0] += loaded;

	if (set && o.incReady[set].length === o.incReady[set][0]) {
		if (typeof o.incSet[set] === "function") {
			o.incSet[set](set);
		}
		o.incSet[set] = 1;
	}

	return o.incSet[set] === 1;
};

/**
 * Clear all cache and all loaded files info
 * @param {boolean} all - Whether to clear cache or cache and DOM elements
 */
o.incCacheClear = (all = o.F) => {
	o.verify([[all, ["boolean"]]]);
	for (const name in o.incFns) {
		if (o.C(o.incFns, name)) {
			localStorage.removeItem("oInc-" + name);
			localStorage.removeItem("oInc-" + name + "-expires");
		}
	}
	if (all) {
		o.incReady.forEach((val, i) => {
			if (i) {
				val.forEach((_a, j) => {
					if (j) {
						o("#oInc-" + i + "-" + j).remove();
					}
				});
			}
		});

		o.incN = 0;
		o.incFns = {};
		o.incSet = [0];
		o.incReady = [0];
	}
	return true;
};

/**
 * Include external resources
 * @param {Object} sources - Resources to include
 * @param {Function} callBack - Success callback
 * @param {Function} callBad - Error callback
 * @returns {boolean} Whether inclusion was successful
 */
o.inc = (sources, callBack, callBad) => {
	o.verify([
		[sources, ["object", "undefined"]],
		[callBack, ["function", "undefined"]],
		[callBad, ["function", "undefined"]],
	]);
	if (typeof localStorage === "undefined") {
		return;
	}
	let sourcesN = 0,
		sourcesReady = 0,
		hash = "",
		preload = false;
	const f = "function",
		no = -1;

	if (typeof sources !== "object" || !sources) {
		return o.incSet[0];
	}

	o.incSet[0]++;
	const setN = o.incSet[0];
	o.incSet[setN] = callBack || 0;
	o.incReady[setN] = [];
	const fnsStatus = o.incReady[setN];
	fnsStatus[0] = 1;
	const fnId = {};

	for (const name in sources) {
		if (o.C(sources, name)) {
			// preload and cache functionality
			if (name === "preload") {
				preload = true;
				continue;
			}

			hash = o.incGetHash(sources[name]);
			sourcesN++;
			o.incN++;

			const tag = sources[name].indexOf(".css") > no ? "style" : "script";
			sources[name] = (o.incSource ? o.incSource + "/" : "") + sources[name];

			// skip loading if already loaded with page and not forced
			if (
				Number.isNaN(Number(name)) &&
				o.C(o.incFns, name) &&
				o.incFns[name] &&
				!o.incForce
			) {
				fnsStatus[sourcesN] = {
					name,
					loaded: 1,
				};
				sourcesReady++;
				continue;
			}

			// fixing if loaded needed
			fnsStatus[sourcesN] = {
				name,
				loaded: 0,
			};

			if (Number.isNaN(Number(name))) {
				o.incFns[name] = 0;
			}

			if (
				Number.isNaN(Number(name)) &&
				o.incCache &&
				(sources[name].substring(0, 4) !== "http" || !o.incCors) &&
				window.location.protocol !== "file:" &&
				(sources[name].indexOf(".css") > no || sources[name].indexOf(".js") > no)
			) {
				// if cache is enabled
				const ls = localStorage,
					script = ls.getItem("oInc-" + name),
					cacheSavedTill = ls.getItem("oInc-" + name + "-expires"),
					cacheHash = ls.getItem("oInc-" + name + "-hash");

				if (
					script &&
					cacheSavedTill &&
					Date.now() < cacheSavedTill &&
					cacheHash === hash
				) {
					// load from cache if not preload
					if (!preload) {
						o.initState({
							tag,
							id: "oInc-" + setN + "-" + sourcesN,
							innerHTML: script,
							"data-o-inc": setN,
						}).appendInside("head");
					}
					fnsStatus[sourcesN].loaded = 1;
					o.incFns[name] = 1;
					sourcesReady++;
				} else {
					// loading and caching new files
					fnId[name] = sourcesN;
					o.get(sources[name], { mode: o.incCors ? "cors" : "same-origin" }).then(
						(response) => {
							if (response.status !== 200) {
								o.onError
									? o.onError({
											message: o.incSource + sources[name] + " was not loaded",
										})
									: "";
								return;
							}
							response.text().then((script) => {
								ls.setItem("oInc-" + name, script);
								ls.setItem("oInc-" + name + "-expires", Date.now() + o.incCacheExp);
								ls.setItem("oInc-" + name + "-hash", hash);
								// execute if not preload
								if (!preload) {
									o.initState({
										tag,
										id: "oInc-" + setN + "-" + fnId[name],
										innerHTML: script,
										"data-o-inc": setN,
									}).appendInside("head");
								}
								o.incCheck(setN, fnId[name], 1);
							});
						},
					);
				}
			} else {
				// standart loading without caching
				const state = {
					tag,
					id: "oInc-" + setN + "-" + sourcesN,
					"data-o-inc": setN,
					async: o.incAsync,
					onload: "o.incCheck(" + setN + "," + sourcesN + ",1)",
				};
				if (sources[name].indexOf(".css") > no) {
					state.tag = "link";
					state.rel = "stylesheet";
					state.href = sources[name];
				} else if (sources[name].indexOf(".js") > no) {
					state.src = sources[name];
				} else {
					state.tag = "img";
					state.style = "display:none;";
					state.src = sources[name];
				}
				o.initState(state).appendInside(state.style ? "body" : "head");
			}
		}
	}

	fnsStatus[0] += sourcesReady;

	if (sourcesN !== 0) {
		if (sourcesReady === sourcesN) {
			// if everything included
			if (typeof callBack === f) {
				callBack(setN);
			}
		} else {
			// starting timeout for loading
			setTimeout(
				(set) => {
					if (o.incReady[set] && o.incReady[set].length < o.incReady[set][0]) {
						o.incSet[set] = 0;
						if (typeof callBad === f) {
							callBad(setN);
						}
					}
				},
				o.incTimeout,
				setN,
			);
		}
	}

	return o.incSet[0];
};

// ─── Store adapters (always present, prod + dev) ──────────────────────────

/**
 * Connect a Redux store to an Objs component state.
 * Calls component[state](selector(store.getState())) immediately and on every store change.
 * Multiple connections per component are allowed — each covers a different state/slice.
 *
 * @param {Object} store - Redux store (must have .getState() and .subscribe())
 * @param {Function} selector - (storeState) => sliceData
 * @param {Object} component - Objs instance (result of o.init(...).render())
 * @param {string} [state='render'] - Name of the component state method to call with the data
 * @returns {Function} Unsubscribe function
 * @example
 * const card = o.init(cardStates).render();
 * const unsub = o.connectRedux(store, s => s.userName, card, 'updateName');
 * // later: unsub() to disconnect
 */
o.connectRedux = (store, selector, component, state = "render") => {
	o.verify([
		[store, ["object"]],
		[selector, ["function"]],
		[component, ["object"]],
		[state, ["notEmptyString"]],
	]);
	const update = () => {
		if (typeof component[state] === "function") {
			const val = selector(store.getState());
			component[state](val !== null && typeof val === "object" ? val : { value: val });
		}
	};
	update(); // fire immediately with current state
	return store.subscribe(update);
};

/**
 * Connect a MobX observable to an Objs component state via autorun.
 * Accepts mobx as first param to avoid a hard dependency.
 *
 * @param {Object} mobx - MobX instance (must have .autorun())
 * @param {Object} observable - MobX observable object
 * @param {Function} accessor - (observable) => sliceData
 * @param {Object} component - Objs instance
 * @param {string} [state='render'] - Component state method name
 * @returns {Function} Disposer function (call to stop observing)
 * @example
 * const unsub = o.connectMobX(mobx, appStore, s => s.count, counter, 'updateCount');
 */
o.connectMobX = (mobx, observable, accessor, component, state = "render") => {
	o.verify([
		[mobx, ["object"]],
		[observable, ["object"]],
		[accessor, ["function"]],
		[component, ["object"]],
		[state, ["notEmptyString"]],
	]);
	return mobx.autorun(() => {
		if (typeof component[state] === "function") {
			const val = accessor(observable);
			component[state](val !== null && typeof val === "object" ? val : { value: val });
		}
	});
};

/**
 * Default React context object for bridging Objs with React trees.
 * Use as the value of React.createContext() in your app.
 * @type {Object}
 */
o.ObjsContext = null;

/**
 * Create a React HOC that connects a React Context value to an Objs component.
 * The returned component renders nothing — it is a pure side-effect bridge.
 *
 * @param {Object} React - React instance
 * @param {Object} Context - React context created with React.createContext()
 * @param {Function} selector - (contextValue) => data to pass to component state
 * @param {Object} component - Objs instance
 * @param {string} [state='render'] - Component state method name
 * @returns {Function} React functional component (bridge)
 * @example
 * const CartBridge = o.withReactContext(React, CartContext, ctx => ctx.count, menuCart, 'updateCount');
 * // Mount <CartBridge /> anywhere inside <CartContext.Provider>
 */
o.withReactContext = (React, Context, selector, component, state = "render") => {
	return function ObjsContextBridge() {
		const value = React.useContext(Context);
		React.useEffect(() => {
			if (typeof component[state] === "function") {
				const val = selector(value);
				component[state](val !== null && typeof val === "object" ? val : { value: val });
			}
		}, [value]);
		return null;
	};
};

if (__DEV__) {
	o.debug = false; // on and off debug output; stripped in prod

	/* tests function parameters */
	o.tLog = []; // test sessions and results
	o.tRes = []; // test results
	o.tStatus = []; // test statuses
	o.tFns = []; // callbacks
	o.tShowOk = o.F; // show success tests or only errors
	o.tStyled = o.F; // styled HTML results or plain style
	o.tTime = 2000; // timeout for async tests
	o.tests = []; // tests with storage
	o.tAutolog = o.F; // auto log to console
	o.tBeforeEach = undefined; // called before each test case
	o.tAfterEach = undefined; // called after each test case

	/**
	 * Add test
	 * @param {string} title - Test title
	 * @param {...Array} tests - Test cases
	 * @returns {Object} Test object with run method and testId
	 */
	o.addTest = (title, ...tests) => {
		o.verify([
			[title, ["notEmptyString"]],
			[tests, ["array"]],
		]);
		// Support {before, after} hooks object as last argument
		let hooks = {};
		if (
			tests.length &&
			typeof tests[tests.length - 1] === "object" &&
			!Array.isArray(tests[tests.length - 1])
		) {
			hooks = tests.pop();
		}
		const testId = o.tests.length;
		o.tests[testId] = { title, tests, hooks };

		return {
			run: () => {
				if (typeof hooks.before === "function") {
					o.tBeforeEach = hooks.before;
				}
				if (typeof hooks.after === "function") {
					o.tAfterEach = hooks.after;
				}
				o.runTest(testId);
			},
			autorun: () => {
				if (typeof hooks.before === "function") {
					o.tBeforeEach = hooks.before;
				}
				if (typeof hooks.after === "function") {
					o.tAfterEach = hooks.after;
				}
				o.runTest(testId, true);
			},
			testId,
		};
	};

	/**
	 * Load Logs from session storage
	 * @returns {Array} Logs from sessionStorage
	 */
	o.updateLogs = () => {
		for (let i = 0; i < o.tests.length; i++) {
			o.tLog[i] = o.tLog[testN] = sessionStorage.getItem(`oTest-Log-${testN}`) || "";
		}
		return o.tLog;
	};

	/**
	 * Run test by ID and autorun
	 * @param {number} testId - Test ID
	 * @param {boolean} autoRun - Whether to autorun for reload page tests
	 */
	o.runTest = (testId = 0, autoRun, savePrev) => {
		o.verify([
			[testId, ["number"]],
			[autoRun, ["boolean", "undefined"]],
			[savePrev, ["boolean", "undefined"]],
		]);
		if (!o.tests[testId]) {
			return;
		}

		if (!savePrev) {
			sessionStorage?.removeItem(`oTest-Log-${testId}`);
			sessionStorage?.removeItem(`oTest-Res-${testId}`);
			sessionStorage?.removeItem(`oTest-Status-${testId}`);
		}

		// run with sessionStorage cache
		sessionStorage?.setItem(`oTest-Run`, testId);

		if (autoRun) {
			sessionStorage?.setItem(`oTest-Autorun`, autoRun);
		} else {
			sessionStorage?.removeItem(`oTest-Autorun`);
		}

		const testSession = o.tests[testId];
		let lastTest = testSession.tests.pop();

		// creates callback function with autostop/autorun
		if (typeof lastTest !== "function") {
			testSession.tests.push(lastTest);
			lastTest = () => {};
		}

		testSession.tests.push((testN) => {
			lastTest(testN);
			sessionStorage.setItem("dddd", 1);
			sessionStorage?.removeItem(`oTest-Run`);
			if (autoRun) {
				o.runTest(testId + 1, autoRun);
			}
		});

		o.test(testSession.title, ...testSession.tests);
	};

	// service
	o.tPre = '<div style="font-family:monospace;text-align:left;">';
	o.tOk = '<span style="background:#cfc;padding: 0 15px;">OK</span> ';
	o.tXx = '<div style="background:#fcc;padding:3px;">';
	o.tDc = "</div>";

	/**
	 * Run test with title and test cases
	 * @param {string} title - Test title
	 * @param {...Array} tests - Array of test cases, each containing test title and test function/result
	 * @returns {Object} Test control object with run method and testId
	 */
	o.test = (title = "", ...tests) => {
		o.verify([
			[title, ["notEmptyString"]],
			[tests, ["array"]],
		]);
		// get test ID from sessionStorage
		const testSession = sessionStorage?.getItem(`oTest-Run`);
		const testN = testSession || o.tLog.length;
		let waits = 0,
			preOk = "├ OK: ",
			preXx = "├ ✘ ",
			posOk = "\n",
			posXx = "\n",
			row = "",
			num = tests.length,
			done = 0;

		const log = (line = "", error = false, log = false) => {
			if (o.tAutolog) {
				if (error) {
					console.error(line);
				} else if (o.tShowOk || log) {
					console.log(line);
				}
			}
		};

		if (typeof tests[num - 1] === "function") {
			o.tFns[testN] = tests[num - 1];
			num--;
		}

		// get tLog from sessionStorage
		if (testSession) {
			o.tLog[testN] = sessionStorage.getItem(`oTest-Log-${testN}`) || "";
			o.tRes[testN] = sessionStorage.getItem(`oTest-Res-${testN}`) || false;
			o.tStatus[testN] = JSON.parse(
				sessionStorage.getItem(`oTest-Status-${testN}`) || "[]",
			);
			for (let i = 0; i < o.tStatus[testN].length; i++) {
				if (o.tStatus[testN]) {
					done++;
				}
			}
		}

		if (o.tStyled) {
			preOk = o.tPre + o.tOk;
			preXx = o.tPre + o.tXx;
			posOk = o.tDc;
			posXx = posOk + posOk;
		}

		if (!testSession || o.tLog[testN].length === 0) {
			log("╒ " + title + " #" + testN, false, true);

			if (o.tStyled) {
				o.tLog[testN] = "<div><b>" + title + " #" + testN + "</b></div>";
			} else {
				o.tLog[testN] = "╒ " + title + " #" + testN + "\n";
			}

			o.tRes[testN] = o.F;
			o.tStatus[testN] = [];
		}

		for (let i = o.tStatus[testN].length; i < num; i++) {
			const testInfo = {
				n: testN,
				i,
				title: tests[i][0],
				tShowOk: o.tShowOk,
				tStyled: o.tStyled,
			};

			// test or title only
			let res = tests[i][1];
			if (typeof res === "undefined") {
				if (o.tStyled) {
					o.tLog[testN] += "<div>" + testInfo.title + "</div>";
				} else {
					o.tLog[testN] += testInfo.title + "\n";
				}
				log("├ " + testInfo.title, false, true);
				o.tStatus[testN][i] = true;
				done++;
				continue;
			}

			if (typeof o.tBeforeEach === "function") {
				o.tBeforeEach(testInfo);
			}

			if (typeof res === "function") {
				try {
					res = res(testInfo);
				} catch (error) {
					res = error.message;
					if (o.onError) {
						o.onError(error);
					}
				}
			}

			if (typeof o.tAfterEach === "function") {
				o.tAfterEach(testInfo, res);
			}

			// test processing
			if (typeof o.tStatus[testN][i] === "undefined") {
				o.tStatus[testN][i] = typeof res === "string" ? o.F : res;
			} else {
				// stop for reload test
				sessionStorage.setItem(`oTest-Status-${testN}`, JSON.stringify(o.tStatus[testN]));
				return; // reloading...
			}
			if (res === true) {
				done++;
				if (o.tShowOk) {
					o.tLog[testN] += preOk + tests[i][0] + posOk;
					log("├ OK: " + tests[i][0]);
				}
			} else if (res !== o.U) {
				o.tLog[testN] += preXx + tests[i][0] + (res !== o.F ? ": " + res : "") + posXx;
				log("├ ✘ " + tests[i][0] + (res !== o.F ? ": " + res : ""), true);
			} else {
				waits++;
				setTimeout(
					(info) => {
						info.title += " (timeout)";
						o.testUpdate(info);
					},
					o.tTime,
					testInfo,
				);
			}
		}

		o.tRes[testN] = done === num;
		row = waits ? "├ " : "╘ ";
		row += "DONE " + done + "/" + num + (waits ? ", waiting: " + waits : "");
		log(row, done + waits !== num);
		if (!waits) {
			log();
		}

		if (o.tStyled) {
			o.tLog[testN] +=
				o.tPre +
				'<div style="color:' +
				(done + waits !== num ? "red" : "green") +
				';"><b>DONE ' +
				done +
				"/" +
				num +
				(waits ? ", waiting: " + waits : "") +
				"</b>" +
				o.tDc +
				o.tDc;
		} else {
			o.tLog[testN] += row + "\n";
		}

		// Save test results to sessionStorage
		if (testSession) {
			sessionStorage.setItem(`oTest-Log-${testN}`, o.tLog[testN]);
			sessionStorage.setItem(`oTest-Res-${testN}`, o.tRes[testN]);
			sessionStorage.setItem(`oTest-Status-${testN}`, JSON.stringify(o.tStatus[testN]));
		}

		if (!waits && typeof o.tFns[testN] === "function") {
			o.tFns[testN](testN);
		}

		return testN;
	};

	/**
	 * Update test state
	 * @param {Object} info - Test info
	 * @param {boolean} res - Test result
	 * @param {string} suff - Suffix
	 */
	o.testUpdate = (info, res = o.F, suff = "") => {
		o.verify([
			[info, ["object"]],
			[res, ["boolean", "string"]],
			[suff, ["string"]],
		]);
		let row = "";
		const testN = info.n;
		const log = (line = "", error = false) => {
			if (o.tAutolog) {
				if (error) {
					console.error(line);
				} else {
					console.log(line);
				}
			}
		};

		if (o.tStatus[testN][info.i] === o.U) {
			o.tStatus[testN][info.i] = res === true;
			if (res === true) {
				if (info.tShowOk) {
					row = "├ OK: " + info.title + suff;
					log(row);
					if (info.tStyled) {
						o.tLog[testN] += o.tPre + o.tOk + info.title + suff + o.tDc;
					} else {
						o.tLog[testN] += row + "\n";
					}
				}
			} else {
				o.tRes[testN] = o.F;
				row = "├ ✘ " + info.title + (res ? ": " + res : "") + suff;
				log(row, true);
				if (info.tStyled) {
					o.tLog[testN] +=
						o.tPre + o.tXx + info.title + suff + (res ? ": " + res : "") + o.tDc + o.tDc;
				} else {
					o.tLog[testN] += row + "\n";
				}
			}

			let fails = 0,
				n = 0;

			for (const s of o.tStatus[testN]) {
				if (s === o.U) {
					// if waiting tests there
					return;
				}
				if (!s) {
					fails++;
				}
				n++;
			}

			// if test is in progress and not completed
			if (sessionStorage?.getItem("oTest-Run") === testN) {
				// save test results to sessionStorage
				sessionStorage.setItem(`oTest-Log-${testN}`, o.tLog[testN]);
				sessionStorage.setItem(`oTest-Res-${testN}`, o.tRes[testN]);
				sessionStorage.setItem(`oTest-Status-${testN}`, JSON.stringify(o.tStatus[testN]));

				if (n < o.tests[testN].tests.length) {
					return;
				}
			}

			o.tRes[testN] = !fails;
			row = fails ? "FAILED " + fails + "/" + n : "DONE " + n + "/" + n;
			log("╘ " + row, Boolean(fails));
			log();

			if (info.tStyled) {
				o.tLog[testN] +=
					o.tPre +
					'<b style="color:' +
					(!fails ? "green" : "red") +
					';">' +
					row +
					"</b>" +
					o.tDc;
			} else {
				o.tLog[testN] += "╘ " + row + "\n";
			}

			if (typeof o.tFns[testN] === "function") {
				o.tFns[testN](testN);
			}
		}
	};

	if (sessionStorage?.getItem("oTest-Run")) {
		window?.addEventListener(
			"load",
			() => {
				o.runTest(
					sessionStorage?.getItem("oTest-Run"),
					sessionStorage?.getItem("oTest-Autorun") || o.F,
					true,
				);
			},
			false,
		);
	}

	// ─── Dev-only: measurements, recording, overlay ───────────────────────────

	/**
	 * Measure element dimensions and visibility
	 * @param {Element} el - DOM element
	 * @returns {{width:number, height:number, top:number, left:number, visible:boolean, opacity:string, zIndex:string}}
	 */
	o.measure = (el) => {
		if (!el) {
			return {};
		}
		const rect = el.getBoundingClientRect();
		const style = window.getComputedStyle(el);
		return {
			width: rect.width,
			height: rect.height,
			top: rect.top,
			left: rect.left,
			visible:
				style.display !== "none" && style.visibility !== "hidden" && rect.width > 0,
			opacity: style.opacity,
			zIndex: style.zIndex,
		};
	};

	/**
	 * Assert element is visible — returns true/false for use in o.test()
	 * @param {Element} el
	 * @returns {boolean}
	 */
	o.assertVisible = (el) => {
		const m = o.measure(el);
		return Boolean(m.visible);
	};

	/**
	 * Assert element matches expected size
	 * @param {Element} el
	 * @param {{w?: number, h?: number}} expected
	 * @returns {boolean|string}
	 */
	o.assertSize = (el, expected = {}) => {
		const m = o.measure(el);
		if (expected.w !== undefined && Math.round(m.width) !== expected.w) {
			return `width: expected ${expected.w}, got ${Math.round(m.width)}`;
		}
		if (expected.h !== undefined && Math.round(m.height) !== expected.h) {
			return `height: expected ${expected.h}, got ${Math.round(m.height)}`;
		}
		return true;
	};
}

/**
 * Recorder state for user action capture.
 * Available in all builds so QA testers can record on staging/production.
 * Note: intercepts window.fetch and captures request/response data — review before using on production.
 */
o.recorder = {
	active: false,
	actions: [],
	mocks: {},
	initialData: {},
	assertions: [],
	observeRoot: null,
	_originalFetch: null,
	_listeners: [],
	_observer: null,
};

/**
 * Start recording user interactions
 * @param {string} [observe] - CSS selector to scope the MutationObserver (reduces assertion noise)
 * @param {string[]} [events] - Events to record (default: click, mouseover, scroll, input, change)
 * @param {{[event: string]: number}} [timeouts] - Debounce delays per event type in ms
 */
o.startRecording = (observe, events, timeouts) => {
	if (o.recorder.active) {
		return;
	}
	const defaultEvents = ["click", "mouseover", "scroll", "input", "change"];
	const defaultStepDelays = {
		click: 100,
		mouseover: 50,
		scroll: 30,
		input: 50,
		change: 50,
	};
	const listenEvents = events || defaultEvents;
	const stepDelays = Object.assign({}, defaultStepDelays, timeouts || {});
	const captureDebounce = { scroll: 30, mouseover: 50 };
	const rec = o.recorder;
	rec.active = true;
	rec.actions = [];
	rec.mocks = {};
	rec.stepDelays = stepDelays;
	rec.initialData = { url: window.location.href, timestamp: Date.now() };

	rec.observeRoot = observe || null;
	rec.assertions = [];

	// snapshot current o.inits data
	o.inits.forEach((inst, idx) => {
		if (inst?.store) {
			rec.initialData["init_" + idx] = JSON.parse(JSON.stringify(inst.store));
		}
	});

	// intercept fetch
	rec._originalFetch = window.fetch;
	window.fetch = async (url, opts = {}) => {
		const method = (opts.method || "GET").toUpperCase();
		let reqBody;
		try {
			reqBody = opts.body ? JSON.parse(opts.body) : undefined;
		} catch (_e) {
			reqBody = opts.body;
		}
		const response = await rec._originalFetch(url, opts);
		const clone = response.clone();
		let respBody;
		try {
			respBody = await clone.json();
		} catch (_e) {
			respBody = await clone.text().catch(() => null);
		}
		const key = method + ":" + url;
		rec.mocks[key] = {
			url,
			method,
			request: reqBody,
			response: respBody,
			status: response.status,
		};
		return response;
	};

	// Internal Objs attributes must not be used for selectors (they change across restores).
	const unstableDataAttrs = { "data-o-init": 1, "data-o-init-i": 1, "data-o-state": 1 };
	const qualify = (sel, fromNode) => {
		if (document.querySelectorAll(sel).length <= 1) return sel;
		let node = fromNode;
		while (node && node !== document.body) {
			let ancestorSel = node.id ? "#" + node.id : null;
			if (!ancestorSel && node.attributes) {
				const autotagAttr = o.autotag ? "data-" + o.autotag : null;
				if (autotagAttr) {
					const val = node.getAttribute(autotagAttr);
					if (val != null) ancestorSel = `[${autotagAttr}="${val}"]`;
				}
				if (!ancestorSel) {
					for (const attr of node.attributes) {
						if (attr.name.startsWith("data-") && !unstableDataAttrs[attr.name]) {
							ancestorSel = `[${attr.name}="${attr.value}"]`;
							break;
						}
					}
				}
			}
			if (ancestorSel) {
				const q = ancestorSel + " " + sel;
				if (document.querySelectorAll(q).length === 1) return q;
			}
			node = node.parentElement;
		}
		return sel;
	};

	// Build a selector string for a DOM node (reuses qualify logic)
	const buildSelector = (node) => {
		if (!node || node.nodeType !== 1) return "";
		let sel = "";
		if (node.dataset) {
			const qaKey = o.autotag && node.dataset[o.autotag];
			if (qaKey) {
				sel = qualify(`[data-${o.autotag}="${qaKey}"]`, node.parentElement);
			}
		}
		if (!sel && node.tagName) {
			const base = node.id
				? "#" + node.id
				: node.className
					? node.tagName.toLowerCase() + "." + [...node.classList].join(".")
					: node.tagName.toLowerCase();
			sel = node.id ? base : qualify(base, node.parentElement);
		}
		return sel;
	};

	// Scoped MutationObserver: captures DOM mutations tied to the last recorded action
	const observeTarget = (observe && document.querySelector(observe)) || document.body;
	rec._observer = new MutationObserver((mutations) => {
		const actionIdx = rec.actions.length - 1;
		if (actionIdx < 0) return;
		mutations.forEach((m) => {
			if (m.type === "childList") {
				m.addedNodes.forEach((node) => {
					if (node.nodeType !== 1) return;
					if (!node.offsetParent) return;
					const sel = buildSelector(node);
					if (!sel) return;
					if (
						rec.assertions.some(
							(a) =>
								a.actionIdx === actionIdx && a.selector === sel && a.type === "visible",
						)
					)
						return;
					const text = node.textContent?.trim().slice(0, 80) || undefined;
					rec.assertions.push({ actionIdx, type: "visible", selector: sel, text });
				});
			}
			if (m.type === "attributes") {
				const sel = buildSelector(m.target);
				if (!sel) return;
				if (
					rec.assertions.some(
						(a) => a.actionIdx === actionIdx && a.selector === sel && a.type === "class",
					)
				)
					return;
				rec.assertions.push({
					actionIdx,
					type: "class",
					selector: sel,
					className: m.target.className,
				});
			}
		});
	});
	rec._observer.observe(observeTarget, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: [
			"class",
			"style",
			"hidden",
			"disabled",
			"aria-expanded",
			"aria-checked",
		],
	});

	// attach DOM listeners
	const timers = {};
	listenEvents.forEach((ev) => {
		const handler = (e) => {
			const target = e.target;
			if (
				observe &&
				observeTarget &&
				target?.nodeType === 1 &&
				!observeTarget.contains(target)
			) {
				return;
			}
			// Capture selector and values EAGERLY in the capture phase, before any
			// bubble listener can mutate the DOM (e.g. a delete button removing its own li).
			let selector = "";
			if (target?.dataset) {
				const qaKey = o.autotag && target.dataset[o.autotag];
				if (qaKey) {
					selector = qualify(`[data-${o.autotag}="${qaKey}"]`, target.parentElement);
				}
			}
			if (!selector && target?.tagName) {
				const base = target.id
					? "#" + target.id
					: target.className
						? target.tagName.toLowerCase() + "." + [...target.classList].join(".")
						: target.tagName.toLowerCase();
				selector = target.id ? base : qualify(base, target.parentElement);
			}
			const targetType = target?.tagName
				? target.tagName.toLowerCase() + (target.type ? ":" + target.type : "")
				: undefined;
			// For scroll, capture position at event time (before page may jump)
			const scrollY = ev === "scroll" ? window.scrollY : undefined;
			// For input/change, capture value; for checkboxes also capture checked state
			const value = ev === "input" || ev === "change" ? target?.value : undefined;
			const checked =
				ev === "change" && (target?.type === "checkbox" || target?.type === "radio")
					? target?.checked
					: undefined;

			const delay = captureDebounce[ev] || 0;
			clearTimeout(timers[ev]);
			timers[ev] = setTimeout(() => {
				const action = { type: ev, target: selector, time: Date.now() };
				if (targetType) action.targetType = targetType;
				if (scrollY !== undefined) action.scrollY = scrollY;
				if (value !== undefined) action.value = value;
				if (checked !== undefined) action.checked = checked;
				rec.actions.push(action);
			}, delay);
		};
		document.addEventListener(ev, handler, true);
		rec._listeners.push({ ev, handler });
	});
};

/**
 * Stop recording and return captured data
 * @returns {{actions: Array, mocks: Object, initialData: Object}}
 */
o.stopRecording = () => {
	const rec = o.recorder;
	rec.active = false;
	if (rec._originalFetch) {
		window.fetch = rec._originalFetch;
		rec._originalFetch = null;
	}
	rec._listeners.forEach(({ ev, handler }) => {
		document.removeEventListener(ev, handler, true);
	});
	rec._listeners = [];
	if (rec._observer) {
		rec._observer.disconnect();
		rec._observer = null;
	}
	return {
		actions: [...rec.actions],
		mocks: { ...rec.mocks },
		initialData: { ...rec.initialData },
		stepDelays: { ...rec.stepDelays },
		assertions: [...(rec.assertions || [])],
		observeRoot: rec.observeRoot || null,
	};
};

/**
 * Clear recording from sessionStorage
 * @param {number} [id] - Recording ID, or clears all if omitted
 */
o.clearRecording = (id) => {
	if (id !== undefined) {
		sessionStorage?.removeItem("oTest-Recording-" + id);
	} else {
		for (let i = sessionStorage?.length - 1; i >= 0; i--) {
			const key = sessionStorage?.key(i);
			if (key && key.indexOf("oTest-Recording-") === 0) {
				sessionStorage?.removeItem(key);
			}
		}
	}
};

/**
 * Export a recording as a ready-to-commit o.addTest() code string.
 * Available in all builds so QA testers can export tests from staging.
 * @param {{actions: Array, mocks: Object, initialData: Object}} recording
 * @returns {string}
 */
o.exportTest = (recording) => {
	const cases = recording.actions
		.map((a) => {
			let body;
			if (a.type === "scroll") {
				body = `    window.scrollTo(0, ${a.scrollY || 0}); return true;\n`;
			} else if (a.type === "input" || a.type === "change") {
				body =
					(a.value !== undefined ? `    el.value = ${JSON.stringify(a.value)};\n` : "") +
					(a.checked !== undefined ? `    el.checked = ${a.checked};\n` : "") +
					`    el.dispatchEvent(new Event('${a.type}', {bubbles:true})); return true;\n`;
			} else {
				const useNativeClick = a.type === "click";
				body = useNativeClick
					? `    el.click(); return true;\n`
					: `    el.dispatchEvent(new MouseEvent('${a.type}', {bubbles:true,cancelable:true})); return true;\n`;
			}
			return (
				`  ['${a.type} on ${a.target}', () => {\n` +
				`    const el = document.querySelector('${a.target}');\n` +
				`    if (!el) return 'element not found';\n` +
				body +
				`  }],`
			);
		})
		.join("\n");

	const mocksStr = Object.keys(recording.mocks).length
		? JSON.stringify(recording.mocks, null, 2)
		: "{}";

	return (
		`// Auto-generated by o.exportTest() — review and anonymize mocks before committing\n` +
		`const recordingMocks = ${mocksStr};\n\n` +
		`o.addTest('Recorded test', [\n${cases}\n], () => {\n` +
		`  // teardown\n});\n`
	);
};

/**
 * Export a recording as a ready-to-run Playwright .spec.ts file string.
 * Available in all builds so QA testers can generate Playwright tests from staging.
 * @param {{actions: Array, mocks: Object, initialData: Object}} recording
 * @param {{testName?: string, baseUrl?: string}} [options]
 * @returns {string}
 */
o.exportPlaywrightTest = (recording, options = {}) => {
	const testName = options.testName || "Recorded session";
	const rawUrl = recording.initialData?.url ?? "/";
	let path = "/";
	try {
		path = new URL(rawUrl).pathname || "/";
	} catch (_e) {
		path = rawUrl;
	}
	const baseUrl = options.baseUrl || path;

	const routes = Object.values(recording.mocks)
		.map((mock) => {
			const urlPath = mock.url.startsWith("/") ? mock.url : "/" + mock.url;
			const body = JSON.stringify(mock.response);
			return (
				`  await page.route('**${urlPath}', async route => {\n` +
				`    await route.fulfill({ status: ${mock.status || 200}, contentType: 'application/json',\n` +
				`      body: JSON.stringify(${body}) });\n` +
				`  });`
			);
		})
		.join("\n");

	const sd = Object.assign(
		{ click: 100, mouseover: 50, scroll: 30, input: 50, change: 50 },
		recording.stepDelays || {},
	);
	const steps = recording.actions
		.map((action, i) => {
			const loc = `page.locator('${action.target}')`;
			const wait = `  await page.waitForTimeout(${sd[action.type] || 50});`;
			let step;
			if (action.type === "scroll") {
				step = `  await page.evaluate(() => window.scrollTo(0, ${action.scrollY || 0}));`;
			} else if (action.type === "mouseover") {
				step = `  await ${loc}.hover();\n  // Pure CSS :hover — no DOM mutation to assert.\n  // Fix: toggle a class in a mouseover handler, or add a page.screenshot() visual check.`;
			} else if (action.type === "input") {
				step = `  await ${loc}.fill(${JSON.stringify(action.value || "")});`;
			} else if (action.type === "change") {
				const tt = action.targetType || "";
				if (tt.indexOf(":checkbox") !== -1 || tt.indexOf(":radio") !== -1) {
					const on =
						action.checked !== undefined
							? action.checked
							: action.value === "true" || action.value === "on";
					step = `  await ${loc}.${on ? "check" : "uncheck"}();`;
				} else if (tt.indexOf("select") !== -1) {
					step = `  await ${loc}.selectOption(${JSON.stringify(action.value || "")});`;
				} else {
					step = `  await ${loc}.fill(${JSON.stringify(action.value || "")});`;
				}
			} else {
				step = `  await ${loc}.click();`;
			}

			const asserts = (recording.assertions || [])
				.filter((a) => a.actionIdx === i)
				.filter(
					(a, j, arr) =>
						arr.findIndex((x) => x.selector === a.selector && x.type === a.type) === j,
				)
				.map((a) => {
					if (a.type === "visible") {
						let s = `  await expect(page.locator(${JSON.stringify(a.selector)})).toBeVisible();`;
						if (a.text)
							s += `\n  await expect(page.locator(${JSON.stringify(a.selector)})).toContainText(${JSON.stringify(a.text)});`;
						return s;
					}
					if (a.type === "class") {
						return `  // class on ${a.selector} changed to: "${a.className}"`;
					}
					return "";
				})
				.filter(Boolean)
				.join("\n");

			return step + "\n" + wait + (asserts ? "\n" + asserts : "");
		})
		.join("\n");

	const hasAutoAssertions = (recording.assertions || []).length > 0;
	return (
		`// Auto-generated by o.exportPlaywrightTest() — review and anonymize mocks before committing\n` +
		`// Prerequisites: npm install @playwright/test && npx playwright install chromium\n` +
		`// Run: npx playwright test recorded.spec.ts\n` +
		`import { test, expect } from '@playwright/test';\n\n` +
		`test(${JSON.stringify(testName)}, async ({ page }) => {\n` +
		(routes
			? `  // Network mocks — edit/anonymize before committing\n` + routes + "\n\n"
			: "") +
		`  // Set baseURL in playwright.config.ts: { use: { baseURL: 'https://staging.example.com' } }\n` +
		`  await page.goto(${JSON.stringify(baseUrl)});\n\n` +
		(steps ? steps + "\n\n" : "") +
		(!hasAutoAssertions
			? `  // TODO: Add assertions before committing, e.g.:\n` +
				`  // await expect(page.locator('[data-qa="success-panel"]')).toBeVisible();\n` +
				`  // await expect(page).toHaveURL(/\\/confirmation/);\n` +
				`  // await expect(page.locator('[data-qa="error-banner"]')).not.toBeVisible();\n`
			: `  // Auto-generated assertions above — review for correctness before committing\n`) +
		`});\n`
	);
};

if (__DEV__) {
	/**
	 * Play back a recording as an automated test sequence
	 * @param {{actions: Array, mocks: Object}} recording
	 * @param {Object} [mockOverrides] - Additional mock overrides (anonymized data)
	 * @returns {number} testId
	 */
	o.playRecording = (recording, mockOverrides = {}) => {
		const allMocks = Object.assign({}, recording.mocks, mockOverrides);
		// install mock fetch
		const origFetch = window.fetch;
		window.fetch = (url, opts = {}) => {
			const method = (opts.method || "GET").toUpperCase();
			const key = method + ":" + url;
			if (allMocks[key]) {
				const mock = allMocks[key];
				const body =
					typeof mock.response === "string"
						? mock.response
						: JSON.stringify(mock.response);
				return Promise.resolve(new Response(body, { status: mock.status || 200 }));
			}
			return origFetch(url, opts);
		};

		const testCases = recording.actions.map((action) => [
			`${action.type} on ${action.target}`,
			() => {
				const el = action.target ? document.querySelector(action.target) : null;
				if (!el && action.type !== "scroll") {
					return `element not found: ${action.target}`;
				}
				if (action.type === "scroll") {
					window.scrollTo(0, action.scrollY || 0);
				} else if (action.type === "input" || action.type === "change") {
					if (action.value !== undefined) el.value = action.value;
					if (action.checked !== undefined) el.checked = action.checked;
					el.dispatchEvent(new Event(action.type, { bubbles: true }));
				} else {
					if (action.type === "click") {
						el.click();
					} else {
						el.dispatchEvent(
							new MouseEvent(action.type, { bubbles: true, cancelable: true }),
						);
					}
				}
				return true;
			},
		]);

		const testId = o.test("Recorded playback", ...testCases, () => {
			window.fetch = origFetch;
		});
		return testId;
	};

	// ─── Dev-only: test results overlay ───────────────────────────────────────

	/**
	 * Render a fixed overlay button that shows test results.
	 * Call once per page load in dev/staging environments.
	 */
	o.testOverlay = () => {
		const btnId = "o-test-overlay-btn";
		const panelId = "o-test-overlay-panel";
		if (document.getElementById(btnId)) {
			return;
		}

		const updatePanel = () => {
			const panel = document.getElementById(panelId);
			if (!panel) {
				return;
			}
			const total = o.tRes.length;
			const passed = o.tRes.filter(Boolean).length;
			let html = `<b>Tests: ${passed}/${total}</b><hr style="margin:4px 0">`;
			o.tLog.forEach((log, i) => {
				const ok = o.tRes[i];
				html += `<div style="margin:2px 0;padding:2px 4px;border-radius:3px;background:${ok ? "#d4edda" : "#f8d7da"};color:${ok ? "#155724" : "#721c24"};font-size:11px;white-space:pre-wrap">${log || "Test #" + i}</div>`;
			});
			// export button
			html += `<button id="o-test-export" style="margin-top:6px;padding:4px 8px;font-size:11px;cursor:pointer">Export results</button>`;
			panel.innerHTML = html;
			const exportBtn = document.getElementById("o-test-export");
			if (exportBtn) {
				exportBtn.addEventListener("click", () => {
					const data = JSON.stringify({ results: o.tRes, logs: o.tLog }, null, 2);
					const blob = new Blob([data], { type: "application/json" });
					const a = document.createElement("a");
					a.href = URL.createObjectURL(blob);
					a.download = "objs-test-results.json";
					a.click();
				});
			}
		};

		// overlay container
		o.initState({
			tag: "div",
			id: btnId,
			style: "position:fixed;bottom:12px;right:12px;z-index:99999;font-family:monospace;",
			html:
				`<button id="o-test-toggle" style="padding:6px 12px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">🧪 Tests</button>` +
				`<div id="${panelId}" style="display:none;margin-top:4px;padding:8px;background:#fff;border:1px solid #ccc;border-radius:4px;max-width:420px;max-height:60vh;overflow-y:auto;box-shadow:0 2px 8px rgba(0,0,0,.15)"></div>`,
		}).appendInside("body");

		document.getElementById("o-test-toggle")?.addEventListener("click", () => {
			const panel = document.getElementById(panelId);
			if (!panel) {
				return;
			}
			const isOpen = panel.style.display !== "none";
			panel.style.display = isOpen ? "none" : "block";
			if (!isOpen) {
				updatePanel();
			}
		});

		// patch o.tFns to refresh panel after each test completes
		const origTest = o.test.bind(o);
		o.test = (...args) => {
			const id = origTest(...args);
			const origFn = o.tFns[id];
			o.tFns[id] = (n) => {
				if (typeof origFn === "function") {
					origFn(n);
				}
				const panel = document.getElementById(panelId);
				if (panel && panel.style.display !== "none") {
					updatePanel();
				}
			};
			return id;
		};
	};

	/**
	 * Pause an Objs browser test; minimal draggable bar so operator can see the page.
	 * Only available in dev builds. NOT referenced in exportPlaywrightTest.
	 * @param {string} label - Test title (shown as "Test title: Paused")
	 * @param {string[]} [items] - Optional checklist for the operator (e.g. hover effects to verify); use labels so clicking text toggles checkbox
	 * @param {{ confirm?: string }} [opts] - Continue button label (default "Continue")
	 * @returns {Promise<{ ok: boolean, errors?: string[] }>} ok true if all items checked; errors = list of unchecked item texts when ok false
	 */
	o.testConfirm = (label, items = [], opts = {}) =>
		new Promise((resolve) => {
			const btnLabel = opts.confirm || "Continue";
			const hasCheckboxes = items.length > 0;
			const btnBg = hasCheckboxes ? "#dc2626" : "#2563eb";
			const itemIds = items.map((_, idx) => "o-tc-cb-" + idx);
			const checkboxStyle =
				".o-tc-item-cb{appearance:none;-webkit-appearance:none;width:16px;height:16px;border:2px solid #ef4444;border-radius:3px;background:#fef2f2;flex-shrink:0;cursor:pointer;}" +
				".o-tc-item-cb:checked{border-color:#22c55e;background:#22c55e;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E\");background-size:12px 12px;background-position:center;}";
			const itemsHtml = hasCheckboxes
				? `<style>${checkboxStyle}</style><ul class="o-tc-list" style="margin:8px 0 0;padding:0;list-style:none;font-size:13px;color:#cbd5e1;">` +
					items
						.map(
							(i, idx) =>
								`<li style="margin-bottom:4px;"><label for="${itemIds[idx]}" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;"><input type="checkbox" id="${itemIds[idx]}" class="o-tc-item-cb"> <span>${i}</span></label></li>`,
						)
						.join("") +
					"</ul>"
				: "";
			const box = o
				.initState({
					tag: "div",
					className: "o-tc-overlay",
					style:
						"position:fixed;left:50%;bottom:50px;transform:translateX(-50%);z-index:999999;width:fit-content;max-width:min(90vw,400px);font-family:system-ui,sans-serif;cursor:grab;user-select:text;",
					html:
						`<div class="o-tc-bar" style="display:flex;flex-direction:column;align-items:stretch;padding:10px 14px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;font-size:14px;cursor:grab;min-width:280px;">` +
						`<div style="display:flex;align-items:center;gap:12px;">` +
						`<span class="o-tc-label" style="flex:1;">${label}: Paused</span>` +
						`<button type="button" class="o-tc-ok" style="padding:6px 14px;background:${btnBg};color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;flex-shrink:0;">${btnLabel}</button>` +
						`</div>` +
						itemsHtml +
						`</div>`,
				})
				.appendInside("body");

			const okBtnStyles = {
				padding: "6px 14px",
				background: hasCheckboxes ? "#dc2626" : "#2563eb",
				color: "#fff",
				border: "none",
				"border-radius": "6px",
				"font-weight": "600",
				cursor: "pointer",
				"font-size": "13px",
				"flex-shrink": "0",
			};
			if (hasCheckboxes) {
				const okBtn = box.first(".o-tc-ok");
				const cbs = o(".o-tc-overlay .o-tc-item-cb");
				const updateBtn = () => {
					const allChecked = cbs.length > 0 && cbs.els.every((el) => el.checked);
					okBtn.css({ ...okBtnStyles, background: allChecked ? "#16a34a" : "#dc2626" });
				};
				cbs.on("change", updateBtn);
			}

			let drag = null;
			const overlayStyle = {
				position: "fixed",
				left: "50%",
				bottom: "50px",
				transform: "translateX(-50%)",
				"z-index": "999999",
				width: "fit-content",
				"max-width": "min(90vw, 400px)",
				"font-family": "system-ui,sans-serif",
				cursor: "grab",
				"user-select": "text",
			};
			const applyOverlayStyle = () => {
				box.css(overlayStyle);
			};
			const onMove = (e) => {
				if (!drag) return;
				overlayStyle.left = drag.left + (e.clientX - drag.startX) + "px";
				overlayStyle.top = drag.top + (e.clientY - drag.startY) + "px";
				delete overlayStyle.bottom;
				overlayStyle.transform = "none";
				applyOverlayStyle();
			};
			const onUp = () => {
				if (drag) {
					overlayStyle.cursor = "grab";
					applyOverlayStyle();
				}
				drag = null;
			};
			box.on("mousedown", (e) => {
				if (e.target.closest(".o-tc-ok")) return;
				const r = box.el.getBoundingClientRect();
				drag = { startX: e.clientX, startY: e.clientY, left: r.left, top: r.top };
				overlayStyle.cursor = "grabbing";
				applyOverlayStyle();
			});
			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onUp);

			box.first(".o-tc-ok").on("click", () => {
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("mouseup", onUp);
				let unchecked = [];
				if (hasCheckboxes) {
					const cbsList = o(".o-tc-overlay .o-tc-item-cb");
					cbsList.els.forEach((el, idx) => {
						if (!el.checked && items[idx] !== undefined) unchecked.push(items[idx]);
					});
				}
				box.remove();
				if (unchecked.length === 0) {
					resolve({ ok: true });
				} else {
					resolve({ ok: false, errors: unchecked });
				}
			});
		});
} // end if (__DEV__)

export { o };
export default o;
if (typeof window !== "undefined") window.o = o;
