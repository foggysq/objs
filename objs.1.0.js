/**
 * @function ObjectSheets
 * DOM Modify and state control
 * 
 * @version 1.0 02 2023
 * @author Roman Torshin
 * @copyright
 * All Rights Reserved *
 * 
 * @param {any} query Selector, DOM element to use, an array of elements or nothing for creating an element
 * @return {object} ObjS
 */

const o = (query) => {
	const result = {els: [], ie: {}},
		ZERO = 0,
		ONE = 1,
		TWO = 2,
		THREE = 3,
		objectType = 'object',
		u = undefined,
		D = document;
	let start = -1,
		finish = 0,
		select = 0,
		initedStates = [],
		i = 0, j = 0;








	// shorten typeof
	const type = (obj) => {return typeof obj};
	// cycle from object
	const cycleObj = (obj, func) => {for (const item in obj) if (Object.hasOwnProperty.call(obj, item)) func(item, obj)};
	// error function
	const error = o.onError || (() => {return});
	// values returner
	const returner = (f) => {
		return (...a) => {
			try {
				return f(a[ZERO], a[ONE], a[TWO], a[THREE]) || result
			} catch (err) {
				error(err)
			}
		};
	};
	// running for each element
	const iterator = (f) => {for (i = start; i >= finish; i--) f()};
	// getting element from string
	const toEl = (el) => {
		if (type(el) !== objectType) {
			el = o.first(el).el;
		}
		return el;
	};
	// setting properties
	const setResultVals = (clearStates = true, els = result.els) => {
		const ln = els.length;
		result.length = ln;
		start = ln - ONE;
		finish = ZERO;
		result.el = ln ? els[ZERO] : u;
		result.last = ln ? els[start] : u;
		if (clearStates) {
			cycleObj(initedStates, (i, state) => {
				delete result[state[i]];
			});
			initedStates = [];
			result.ie = {};
		}
	};
	// getting element by query
	const getObjs = (innerQuery = '') => {return Array.from(D.querySelectorAll(innerQuery))};
	// sets new objects to operate
	result.reset = returner((innerQuery = '') => {
		result.els = getObjs(innerQuery);
		setResultVals();
	});







	/**
	 * Transformation of DOM elements
	 * 
	 * @param {object} el DOM element for transformation
	 * @param {object} state States data
	 * @param {object} props additional props and dynamic content
	 */
	const transform = (el, state, props = {}) => {
		cycleObj(state, (s) => {
			let value = state[s];
			props.el = el;
			props.element = el;
			props.o = o;

			if (type(value)  === 'function') {
				value = value(props);
			}

			if (value !== u) {
				['tag','sample','state'].includes(s) ? '' : 
				['html','innerHTML'].includes(s) ? el.innerHTML = value :
				s === 'dataset' && type(value) === objectType ?
					cycleObj(value, (data) => {
						el.dataset[data] = value[data];
					}) : 
				s === 'toggleClass' ? el.classList.toggle(value) :
				s === 'addClass' ? (type(value) === objectType ? el.classList.add(...value) : el.classList.add(value)) :
				s === 'removeClass' ? el.classList.remove(value) :
				s === 'style' && type(value) === objectType ?
					cycleObj(value, (data) => {
						el.style[data] = value[data];
					}) : 
				el.setAttribute(s, value);
			}
		});
		
		el.dataset['oState'] = state.state;
	};

	/**
	 * Creates states functions
	 * 
	 * @param {array} els DOM elements
	 * @param {object} states States object
	 */
	result.init = returner((states, fast = false) => {
		const initN = o.inits.length || ZERO;
		setResultVals();
		o.inits.push(result);

		// fast initialisation
		if (type(states) !== objectType || states.render === u) {
			states = {
				render: states,
			};
		} else {
			fast = false;
		}

		cycleObj(states, (state) => {
			initedStates.push(state);

			result[state] = returner((props) => {
				let data = states[state] || {tag: 'div'};
				const els =  result.els.slice(finish, start + ONE);

				props = props || {};

				if (type(data) === 'function' && els[ZERO]) {
					props.objs = result;
					props.o = o;
					data = data(props);
				} else if (type(data) === objectType) {
					data.state = state;
					data['data-o-init'] = initN;
				}

				const newEl = (n, prop = {}) => {
					if (type(data) === objectType) {
						return D.createElement(data.tag || 'div');
					} else {
						prop.objs = result;
						prop.o = o;
						i = D.createElement('div');
						i.innerHTML = type(data) === 'function' ? data(prop) : data;
						i.firstElementChild.dataset.oInit = n;
						return i.firstElementChild;
					}
				};

				// properties creation
				props !== u && !props.length 
					? props = [props] 
					: props === u 
						? props = [] 
						: '';

				// creating elements if no one was selected
				if (!els[ZERO] && state === 'render') {
					if (props[ZERO]) {
						props.map(() => {
							els.push(newEl(initN));
						});
					} else {
						els.push(newEl(initN));
					}
					result.els = els;
					setResultVals(false);
				}

				// changing element if there is data object
				if (els && type(data) === objectType) {
					j = els.length === props.length;
					els.map((el, i) => {
						transform(el, data, props[j ? i : ZERO]);
					});
				}
			});
		});

		if (fast) {
			result.render();
		}
	});

	result.initState = returner((state) => {
		result.init(state, ONE);
	});

	/**
	 * Gets state object from existing DOM element
	 *
	 * @param {string} state title, optional
	 * 
	 * @return {object} state
	 */
	result.sample = returner((state = 'render') => {
		const indx = start || ZERO,
			res = {},
			attrs = result.els[indx].attributes,
			ds = result.els[indx].dataset;

		res[state] = {
			tag: result.els[indx].tagName,
			html: result.els[indx].innerHTML,
			dataset: {},
		};

		for (const attr of attrs) {
			if (attr.nodeName.substring(ZERO, 5) !== 'data-') {
				res[state][attr.nodeName] = attr.value;
			}
		}

		cycleObj(ds, (data) => {
			res[state].dataset[data] = ds[data];
		});

		return res;
	});

	/**
	 * Gets HTML of DOM operated elements
	 * 
	 * @returns {string}
	 */
	result.html = returner(() => {
		let html = '';

		iterator(() => {
			html += result.els[i].outerHTML;
		});

		return html;
	});

	/**
	 * Run function for each element
	 * 
	 * @param {function} function
	 * @param {object} parameters
	 * 
	 * @returns {object} result
	 */
	result.forEach = returner((func, params) => {
		if (type(func) === 'function') {
			iterator(() => {
				func(result.els[result.length - i - ONE], params);
			});
		}
	});

	/**
	 * Select element to control
	 *
	 * @param {number} i index
	 */
	result.select = returner((i = 0) => {
		if (result.els[i]) {
			start = i;
			finish = i;
			result.el = result.els[i];
			select = ONE;
		}
	});

	/**
	 * Select all elements to control
	 */
	result.all = returner(() => {
		start = result.length - ONE;
		finish = ZERO;
		result.el = result.els[ZERO];
		select = ZERO;
	});

	/**
	 * Delete selected element or all from DOM
	 * 
	 * @param {number} j index
	 */
	result.remove = returner((j) => {
		if (j === u && start === finish) {
			j = start;
		}

		if (j !== u) {
			result.els[j].parentNode.removeChild(result.els[j]);
			result.els.splice(j, ONE);
		} else {
			iterator(() => {
				result.els[i].parentNode.removeChild(result.els[i]);
				result.els.splice(i, ONE);
			});
		}

		setResultVals();
	});

	/**
	 * Delete element from control list
	 */
	result.skip = returner((i) => {
		if (i === u && start === finish) {
			i = start;
		}

		result.els.splice(i, ONE);
		setResultVals();
	});

	/**
	 * Add element to control list
	 */
	result.add = returner((el) => {
		if (type(el) === 'string' && el !== '') {
			result.els.push(...getObjs(el));
		} else if (type(el) === objectType && el.tagName) {
			result.els.push(el);
		} else if (type(el) === objectType && el.length && el[ZERO].tagName) {
			result.els.push(...el);
		}
		
		setResultVals();
	});

	/**
	 * Functions to insert elements into DOM
	 */
	result.appendInside = returner((el) => {
		iterator(() => {
			toEl(el).appendChild(result.els[result.length - i - ONE]);
		});
	});
	result.appendBefore = returner((el) => {
		iterator(() => {
			toEl(el).parentNode.insertBefore(result.els[result.length - i - ONE], toEl(el));
		});
	});
	result.appendAfter= returner((el) => {
		iterator(() => {
			toEl(el).after(...result.els);
		});
	});

	/**
	 * Find child elements
	 */
	result.find = returner((innerQuery = '') => {
		const newEls = [];

		iterator(() => {
			newEls.push(...Array.from(result.els[i].querySelectorAll(':scope ' + innerQuery)));
		});

		result.els = newEls;
		setResultVals();
	});

	/**
	 * Find the first child element by query
	 */
	result.first = returner((innerQuery = '') => {
		let buff = u;
		const newEls = [];

		iterator(() => {
			buff = result.els[i].querySelector(innerQuery);
			if (buff) {
				newEls.push(buff);
			}
		});

		result.els = newEls;
		setResultVals();
	});

	/**
	 * Set, delete or get attribute
	 */
	result.attr = returner((attr, val) => {
		if (attr) {
			if (val !== u) {
				iterator(() => {
					result.els[i].setAttribute(attr, val)
				})
			} else {
				iterator(() => {
					result.els[i].removeAttribute(attr)
				})
			}
		} else if (select) {
			const obj = {};
			[...result.els[start].attributes].forEach((attr) => {
				obj[attr.nodeName] = attr.nodeValue;
			});
			return obj;
		} else {
			const res = [];
			iterator(() => {
				const obj = {};
				[...result.els[i].attributes].forEach((attr) => {
					obj[attr.nodeName] = attr.nodeValue;
				});
				res.push(obj);
			});
			return res;
		}
	});
	/**
	 * Dataset control
	 */
	result.dataset = returner((values) => {
		if (typeof values === objectType) {
			iterator(() => {
				cycleObj(values, (data) => {
					result.els[i].dataset[data] = values[data]
				});
			});
		} else if (select) {
			return result.els[start].dataset;
		} else {
			const res = [];
			iterator(() => {
				res.push({...result.els[i].dataset});
			});
			return res;
		}
	});
	/**
	 * Style attribute
	 */
	result.style = returner((val) => {
		result.attr('style', val)
	});
	/**
	 * CSS as object to create style attribute
	 */
	result.css = returner((styles = {}) => {
		let val = '';

		cycleObj(styles, (style) => {
			val += style + ':' + styles[style].replace('"', "'") + ';'
		});

		result.style(val)
	});
	/**
	 * Class control
	 */
	result.setClass = returner((cl) => {
		iterator(() => {
			result.els[i].setAttribute('class', cl)
		})
	});
	result.addClass = returner((cl) => {
		iterator(() => { 
			result.els[i].classList.add(cl)
		})
	});
	result.removeClass = returner((cl) => {
		iterator(() => {
			result.els[i].classList.remove(cl)
		})
	});
	result.toggleClass = returner((cl, check) => {
		iterator(() => {
			result.els[i].classList.toggle(cl, check)
		})
	});
	result.haveClass = (cl) => {
		let res = true;
		iterator(() => {
			if (!result.els[i].classList.contains(cl)) {
				res = false;
			}
		});
		return res;
	};
	/**
	 * Inner content control
	 */
	result.innerHTML = returner((html) => {
		if (html !== undefined) {
			iterator(() => {
				result.els[i].innerHTML = html;
			});
		} else {
			let res = '';
			iterator(() => {
				res += result.els[i].innerHTML;
			});
			return res;
		}
	});
	result.innerText = returner((text = '') => {
		iterator(() => {
			result.els[i].innerText = text;
		});
	});
	result.textContent = returner((text = '') => {
		iterator(() => {
			result.els[i].textContent = text;
		});
	});










	/**
	 * Event functions
	 */
	const splt = (a) => {
		let as = [];
		if (type(a) === objectType) {
			as = a;
		} else {
			as = a.split(', ');
		}
		return as;
	};
	result.on = returner((a, b, c, d) => {
		splt(a).forEach((ev) => {
			iterator(() => {
				result.els[i].addEventListener(ev, b, c, d);
			});
			if (!result.ie[ev]) {
				result.ie[ev] = [];
			}
			result.ie[ev].push([b, c, d]);
		});
	});
	result.off = returner((a, b, c) => {
		splt(a).forEach((ev) => {
			iterator(() => {
				result.els[i].removeEventListener(ev, b, c);
			});
			if (result.ie[ev]) {
				result.ie[ev] = result.ie[ev].filter(f => f[ZERO] !== b);
			}
		});
	});
	/**
	 * On and off listeners
	 */
	result.onAll = returner(() => {
		cycleObj(result.ie, (ev, events) => {
			events[ev].forEach((data) => {
				iterator(() => {
					result.els[i].addEventListener(ev, data[ZERO], data[ONE], data[TWO]);
				});
			});
		});
	});
	result.offAll = returner(() => {
		cycleObj(result.ie, (ev, events) => {
			events[ev].forEach((data) => {
				iterator(() => {
					result.els[i].removeEventListener(ev, data[ZERO]);
				});
			});
		});
	});

	/**
	 * Making result object
	 */
	result.add(query);
	if (result.els[ZERO]) {
		i = result.els[ZERO].dataset['o-init'];
		if (i && o.inits[i]) {
			if (o.inits[i].els === result.els) {
				result = o.inits[i];
			} else if (result.els.length === ONE && o.inits[i].els.includes(result.el)) {
				j = result.els;
				Object.assign(result, o.inits[i]);
				result.els = j;
				setResultVals(false);
			}
		}
	}

	return result;
};



















o.first = (query) => {
	return o(document.querySelector(query) || '');
};

o.inits = [];
o.onError = false;

/**
 * Creating elements from state
 * 
 * @param {object} states State, states or function/string
 */
o.init = (states) => {
	return o().init(states);
};
o.initState = (state) => {
	return o().init(state).render();
}

// Short values
o.Z = 0; o.N = 1; o.W = 2; o.H = 100; o.F = false;
o.C = (a, b) => {
	return Object.hasOwnProperty.call(a, b);
};


















/**
 * GET and POST
 * 
 * @argument {string} url link
 * @argument {object} props parameters
 * 
 * @returns {promise}
 */
o.ajax = (url, props = {}) => {
	let row = new URLSearchParams();
	if (props.data && typeof props.data === 'object') {
		for (const param in props.data) {
			if (o.C(props.data, param)) {
				if (typeof props.data[param] === 'object') {
					row.set(param, encodeURIComponent(JSON.stringify(props.data[param])));
				} else {
					row.set(param, props.data[param]);
				}
			}
		}
		if (props.method === 'GET' || props.method === 'get') {
			url += '?' + row.toString();
		} else if (!props.body) {
			props.body = row;
		}
		delete props.data;
	}

	return fetch(url, props);
};
o.get = (url, props = {}) => {
	return o.ajax(url, {...props, method: 'GET'});
};
o.post = (url, props = {}) => {
	return o.ajax(url, {...props, method: 'POST'});
};
o.getParams = () => {
	const params = {};
	const paramsRaw = new URLSearchParams(window.location.search).entries();

	for (const entry of paramsRaw) {
		params[entry[o.Z]] = entry[o.N];
	}

	return params;
};


















/**
 * Include functions
 * 
 * @param {object} sources array of name:src values
 * @param {function} callBack function for success
 * @param {function} callBad function for error
 * 
 * @returns {bool}
 */

/* parameters */
o.incCache = true;// cache in localStorage
o.incCacheExp = 1000 * 60 * 60 * 24;// cache time
o.incTimeout = 6000;// ms for timing to load function
o.incSource = '';// link to source folder
o.incForce = o.F;// reload loaded files or not
o.incAsync = true;// async or in order loading
o.incCors = o.F;// allow loading from other domains

/* service values */
o.incFns = {};// array of name:status for all functions
o.incSet = [o.Z];// saving callbacks and change them for 1 value if executed
o.incReady = [o.Z];// array of all included sets and statuses
o.incN = o.Z;// index of the next set

/**
 * Check the state status or a function in it, also checks its status to true
 * 
 * @param {number} set index
 * @param {number} fnId index
 * @returns {boolean}
 */
o.incCheck = (set = 0, fnId, loaded = 0) => {
	if (!loaded && set && fnId === o.U && o.incReady[set]) {
		return o.incSet[set] === o.N;
	}

	if (o.incReady[set] === o.U || o.incReady[set][fnId] === o.U) {
		return o.F;
	}

	o.incReady[set][fnId].loaded = loaded;
	o.incFns[o.incReady[set][fnId].name] = loaded;
	o.incReady[set][o.Z] += loaded;
	
	if (set && o.incReady[set].length === o.incReady[set][o.Z]) {
		if (typeof o.incSet[set] === 'function') {
			o.incSet[set](set);
		}
		o.incSet[set] = o.N;
	}

	return o.incSet[set] === o.N;
};
/* Clear all cache and all loaded sets info */
o.incCacheClear = (all = o.F) => {
	for (const name in o.incFns) {
		if (o.C(o.incFns, name)) {
			localStorage.removeItem('inc-' + name);
			localStorage.removeItem('inc-' + name + 'Expires');
		}
	}
	if (all) {
		o.incReady.forEach((val, i) => {
			if (i) {
				val.forEach((a, j) => {
					if (j) {
						o('#oInc-' + i + '-' + j).remove();
					}
				});
			}
		});

		o.incN = o.Z
		o.incFns = {};
		o.incSet = [o.Z];
		o.incReady = [o.Z];
	}
	return true;
};
/* Main function to include */
o.inc = (sources, callBack, callBad) => {
	let sourcesN = o.Z,
		sourcesReady = o.Z;
	const f = 'function',
		FOUR = 4,
		no = -1;

	if (typeof sources !== 'object' || !sources) {
		return o.incSet[o.Z];
	}

	o.incSet[o.Z]++;
	const setN = o.incSet[o.Z];
	o.incSet[setN] = callBack || o.Z;
	o.incReady[setN] = [];
	const fnsStatus = o.incReady[setN];
	fnsStatus[o.Z] = o.N;
	const fnId = {};

	for (let name in sources) {
		if (o.C(sources, name)) {
			sourcesN++;
			o.incN++;

			let tag = sources[name].indexOf('.css') > no ? 'style' : 'script';
			sources[name] = (o.incSource ? o.incSource + '/' : '') + sources[name];
			// skip loading if already loaded and not forced
			if (isNaN(name) && o.C(o.incFns, name) && o.incFns[name] && !o.incForce) {
				fnsStatus[sourcesN] = {
					name,
					loaded: o.N,
				};
				sourcesReady++;
				continue;
			}

			// fixing if loaded needed
			fnsStatus[sourcesN] = {
				name,
				loaded: o.Z,
			};

			if (isNaN(name)) {
				o.incFns[name] = o.Z;
			}

			if (
				isNaN(name) && 
				o.incCache && 
				sources[name].substring(o.Z, FOUR) !== 'http' && 
				window.location.protocol !== 'file:' &&
				(sources[name].indexOf('.css') > no || sources[name].indexOf('.js') > no)
			) {
				// if cache is enabled
				const ls = localStorage,
					script = ls.getItem('inc-' + name),
					cacheSavedTill = ls.getItem('inc-' + name + 'Expires');

				if (
					script && 
					cacheSavedTill && 
					new Date().getTime() < cacheSavedTill
				) {
					// load from cache
					o.initState({
						tag,
						id: 'oInc-' + setN + '-' + sourcesN,
						innerHTML: script,
						'data-o-inc': setN,
					}).appendInside('head');
					fnsStatus[sourcesN].loaded = o.N;
					o.incFns[name] = o.N;
					sourcesReady++;
				} else {
					// loading and caching new files
					fnId[name] = sourcesN;
					o.get(sources[name], {mode: o.incCors ? 'cors' : 'same-origin'}).then((response) => {
						if (response.status !== 200) {
							o.onError ? o.onError({message: o.incSource + sources[name] + ' was not loaded'}) : '';
							return;
						}
						response.text().then((script) => {
							ls.setItem('inc-' + name, script);
							ls.setItem('inc-' + name + 'Expires', new Date().getTime() + o.incCacheExp);
							o.initState({
								tag,
								id: 'oInc-' + setN + '-' + fnId[name],
								innerHTML: script,
								'data-o-inc': setN,
							}).appendInside('head');
							o.incCheck(setN, fnId[name], o.N);
						});
					});
				}
			} else {
				// standart loading without caching
				const state = {
					tag,
					id: 'oInc-' + setN + '-' + sourcesN,
					'data-o-inc': setN,
					async: o.incAsync,
					onload: 'o.incCheck(' + setN + ',' + sourcesN + ',1)',
				};
				if (sources[name].indexOf('.css') > no) {
					state.tag = 'link';
					state.rel = 'stylesheet';
					state.href = sources[name];
				} else if (sources[name].indexOf('.js') > no) {
					state.src = sources[name];
				} else {
					state.tag = 'img';
					state.style = 'display:none;';
					state.src = sources[name];
				}
				o.initState(state).appendInside(state.style ? document.body : document.head);
			}
		}
	}

	fnsStatus[o.Z] += sourcesReady;

	if (sourcesN !== o.Z) {
		if (sourcesReady === sourcesN) {
			// if everything included
			if (typeof callBack === f) {
				callBack(setN);
			}
		} else {
			// starting timeout for loading
			setTimeout((set) => {
				if (o.incReady[set] && o.incReady[set].length < o.incReady[set][o.Z]) {
					o.incSet[set] = o.Z;
					if (typeof callBad === f) {
						callBad(setN);
					}
				}
			}, o.incTimeout, setN);
		}
	}

	return o.incSet[o.Z];
};






















/**
 * Test function
 * 
 * @param {string} title
 * @param {array} tests array with name:function to test - true is success, false/string for failure
 * 
 * @returns {number} test session number in o.tLog
 */

/* parameters */
o.tLog = [];// test sessions and results
o.tRes = [];// test results
o.tStatus = [];// test statuses
o.tFns = [];// callbacks
o.tShowOk = o.F;// show success tests or only errors
o.tStyled = o.F;// styled HTML results or plain style
o.tTime = 2000;// timeout for async tests

// service
o.tPre = '<div style="font-family:monospace;text-align:left;">';
o.tOk = '<span style="background:#cfc;padding: 0 15px;">OK</span> ';
o.tXx = '<div style="background:#fcc;padding:3px;">';
o.tDc = '</div>';

/* Main function for testing */
o.test = (title = '', ...tests) => {
	const testN = o.tLog.length;
	let waits = 0, 
		preOk = '├ OK: ',
		preXx = '├ ✘ ',
		posOk = '\n',
		posXx = '\n',
		num = tests.length,
		done = o.Z;
	
	if (typeof tests[num - o.N] === 'function') {
		o.tFns[testN] = tests[num - o.N];
		num--;
	}

	if (o.tStyled) {
		o.tLog[testN] = '<div><b>' + title + ' #' + testN + '</b></div>';
		preOk = o.tPre + o.tOk;
		preXx = o.tPre + o.tXx;
		posOk = o.tDc;
		posXx = posOk + posOk;
	} else {
		o.tLog[testN] = title + ' #' + testN + '\n';
	}

	o.tRes[testN] = o.F;
	o.tStatus[testN] = [];

	for (let i = o.Z; i < num; i++) {
		const testInfo = {
			n: testN, 
			i, 
			title: tests[i][o.Z],
			tShowOk: o.tShowOk,
			tStyled: o.tStyled,
		};
		let res = tests[i][o.N];
		if (typeof res === 'function') {
			try {
				res = res(testInfo);
			} catch (error) {
				res = error.message;
				if (o.onError) {
					o.onError(error);
				}
			}
		}
		o.tStatus[testN][i] = typeof res === 'string' ? o.F : res;
		if (res === true) {
			done++;
			if (o.tShowOk) {
				o.tLog[testN] += preOk + tests[i][o.Z] + posOk;
			}
		} else if (res !== o.U) {
			o.tLog[testN] += preXx + tests[i][o.Z] + (res !== o.F ? ': <i>' + res + '</i>' : '') + posXx;
		} else {
			waits++;
			setTimeout((info) => {
				info.title += ' (timeout)';
				o.testUpdate(info);
			}, o.tTime, testInfo);
		}
	}

	o.tRes[testN] = done === num;

	if (o.tStyled) {
		o.tLog[testN] += o.tPre + '<div style="color:' + (done + waits !== num ? 'red' : 'green') + ';"><b>';
	} else {
		o.tLog[testN] += waits ? '├' : '└ ';
	}

	o.tLog[testN] += 'DONE ' + done + '/' + (num - waits);
	
	if (waits) {
		o.tLog[testN] += ', waiting: ' + waits;
	}

	if (o.tStyled) {
		o.tLog[testN] += '</b>' + o.tDc + o.tDc;
	} else {
		o.tLog[testN] += '\n';
	}

	if (!waits && typeof o.tFns[testN] === 'function') {
		o.tFns[testN](testN);
	}
	
	return testN;
};

/* Function to update test state for async tests */
o.testUpdate = (info, res = o.F, suff = '') => {
	if (o.tStatus[info.n][info.i] === o.U) {
		o.tStatus[info.n][info.i] = res === true;
		if (res === true) {
			if (info.tShowOk) {
				if (info.tStyled) {
					o.tLog[info.n] += o.tPre + o.tOk + info.title + suff + o.tDc;
				} else {
					o.tLog[info.n] += '└ OK: ' + info.title + suff;
				}
			}
		} else {
			o.tRes[info.n] = o.F;
			if (info.tStyled) {
				o.tLog[info.n] += o.tPre + o.tXx + info.title + suff + (res ? ': ' + res : '') + o.tDc + o.tDc;
			} else {
				o.tLog[info.n] += '└ ✘ ' + info.title + (res ? ': ' + res : '') + suff;
			}
		}

		let fails = o.Z,
			n = fails;
		
		for (let s of o.tStatus[info.n]) {
			if (s === o.U) {
				return;
			}
			if (!s) {
				fails++;
			}
			n++;
		}

		o.tRes[info.n] = !fails;
		const text = fails ? 'FAILED ' + fails + '/' + n : 'DONE ' + n + '/' + n;
		if (info.tStyled) {
			o.tLog[info.n] += o.tPre + '<b style="color:' + (!fails ? 'green' : 'red') + ';">' + text + '</b>' + o.tDc;
		} else {
			o.tLog[info.n] += '└ ' + text;
		}

		if (typeof o.tFns[info.n] === 'function') {
			o.tFns[info.n](info.n);
		}
	}
};
