/**
 * @fileoverview Objs-core library
 * @version 2.4.0
 * @author Roman Torshin
 * @license Apache-2.0
 */
const __DEV__ = true;
const o = (query) => {
  let result = {
    els: [],
    ie: {},
    delegated: {},
    parented: {},
    store: {},
    refs: {},
    _refsByIndex: [],
    states: [],
    isDebug: false,
    currentState: "",
    savedStates: {},
    isRoot: false,
    _parent: null
  }, ONE = 1, TWO = 2, THREE = 3, booleanType = "boolean", objectType = "object", functionType = "function", stringType = "string", numberType = "number", notEmptyStringType = "notEmptyString", undefinedType = "undefined", _reactProp = "dangerouslySetInnerHTML", u, D = o.D, start = -1, finish = 0, select = 0, ssr = typeof process !== "undefined" || o.D === o.DocumentMVP, i = 0, j = 0;
  const self = result;
  const type = (obj) => typeof obj;
  const cycleObj = (obj, func) => {
    for (const item in obj) if (Object.hasOwn(obj, item)) func(item, obj);
  };
  const error = o.onError;
  const typeVerify = (pairs) => o.verify(pairs);
  const returner = (f, name = "") => {
    return (...a) => {
      if (__DEV__ && (o.debug || result.isDebug)) {
        console.log(
          name ? `${name}()` : f,
          a.length ? "with " + a.join(", ") : "without parameters"
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
  const iterator = (f) => {
    for (i = finish; i <= start; i++) f();
  };
  const toEl = (el) => {
    if (el?.els) return el.el;
    if (type(el) !== objectType) el = o.first(el).el;
    return el;
  };
  const setResultVals = (clearStates = true, els = result.els) => {
    const ln = els.length;
    result.length = ln;
    start = ln - ONE;
    finish = 0;
    result.el = ln ? els[0] : u;
    result.last = ln ? els[start] : u;
    if (clearStates) {
      cycleObj(result.states, (i2, state) => {
        delete result[state[i2]];
      });
      result.states = [];
      result.ie = {};
    }
    if (Array.isArray(result._refsByIndex)) {
      const currentLen = result._refsByIndex.length;
      if (currentLen > ln) {
        cycleObj(result._refsByIndex, (k) => {
          const idx = +k;
          if (idx >= ln) {
            delete result._refsByIndex[idx];
          }
        });
        result._refsByIndex.length = ln;
      } else if (currentLen < ln) {
        for (let idx = currentLen; idx < ln; idx++) {
          result._refsByIndex[idx] = {};
        }
      }
    }
  };
  result.reset = o;
  const hydrateDataOInitIn = (containerEl) => {
    if (ssr || !containerEl.querySelectorAll) return;
    const nodes = containerEl.querySelectorAll("[data-o-init]");
    const byId = {};
    nodes.forEach((node) => {
      const id = node.getAttribute("data-o-init");
      if (id === null) return;
      if (!byId[id]) byId[id] = [];
      byId[id].push(node);
    });
    cycleObj(byId, (id) => {
      const inst = o.inits[id];
      if (!inst) return;
      inst.getSSR(Number(id), byId[id]);
    });
  };
  const transform = (el, state, props) => {
    cycleObj(state, (s) => {
      let value = state[s];
      if (type(value) === functionType) {
        value = value(props);
      }
      if (s === "append" && type(value) === objectType) {
        if (value.els) {
          value = [value];
        }
        if (value[0]?.els) {
          valueBuff = [];
          cycleObj(value, (i2) => {
            valueBuff.push(...value[i2].els);
          });
          value = valueBuff;
        }
      }
      if (value !== u && el.getAttribute(s) !== value && ![
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
        "ref"
      ].includes(s)) {
        ["html", "innerHTML"].includes(s) ? (el.innerHTML = value, !ssr && hydrateDataOInitIn(el)) : (
          // className alias
          s === "className" ? el.setAttribute("class", value) : (
            // attach dataset
            s === "dataset" && type(value) === objectType ? cycleObj(value, (data) => {
              el.dataset[data] = value[data];
            }) : (
              // classes
              s === "toggleClass" ? el.classList.toggle(value) : s === "addClass" ? type(value) === objectType ? el.classList.add(...value) : el.classList.add(value) : s === "removeClass" ? el.classList.remove(value) : (
                // style attribute
                s === "style" && type(value) === objectType ? cycleObj(value, (data) => {
                  el.style[data] = value[data];
                }) : (
                  // append DOM objects
                  (s === "append" || s === "children" || s === "childNodes") && type(value) === objectType ? cycleObj(value.length ? value : [value], (j2) => {
                    if (s === "append" || !el.childNodes[j2]) {
                      el.appendChild(value[j2]);
                    } else if (el.childNodes[j2] !== value[j2]) {
                      el.childNodes[j2].replaceWith(value[j2]);
                    }
                  }) : (
                    // set attributes
                    el.setAttribute(s, value)
                  )
                )
              )
            )
          )
        );
      }
    });
    el.dataset["oState"] = state.state;
    if (o.autotag && state.name) {
      el.dataset[o.autotag] = o.camelToKebab(state.name);
    }
  };
  if (__DEV__) {
    result.debug = returner(() => {
      result.isDebug = true;
    }, "debug ON");
  }
  result.saveAs = returner((key) => {
    typeVerify([[key, [notEmptyStringType]]]);
    if (!o.getSaved[key]) {
      o.getSaved[key] = result;
    } else if (o.debug || result.isDebug) {
      console.warn("the key exists (not saved):" + key);
    }
  }, "saveAs");
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
    o.inits[result.initID] = void 0;
    result = {};
    return true;
  };
  result.init = returner((states) => {
    typeVerify([[states, [objectType, functionType]]]);
    const initN = result.initID || o.inits.length || 0;
    result.initID = initN;
    setResultVals();
    o.inits[result.initID] = result;
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
    if (type(states) !== objectType || states.render === u) {
      states = {
        render: states
      };
    }
    cycleObj(states, (state) => {
      if (result?.render && state === "render") {
        return;
      }
      result.states.push(state);
      result[state] = returner((props = [{}]) => {
        result.currentState = state;
        const data = states[state] || { tag: "div" };
        const slice = Array.isArray(result.els) ? result.els.slice(finish, start + ONE) : [];
        const els = slice.length ? slice : result.els || [];
        if (type(data) === objectType) {
          data.state = state;
          data["data-o-init"] = initN;
        }
        const newEl = (n, prop = {}) => {
          const resolved = type(data) === functionType ? data(prop) : data;
          if (type(resolved) === objectType) {
            return D.createElement(resolved.tag || resolved.tagName || "div");
          }
          const newElem = D.createElement("div");
          newElem.innerHTML = resolved;
          if (newElem.children.length > ONE || !newElem.firstElementChild) {
            newElem.dataset.oInit = n;
            return newElem;
          }
          newElem.firstElementChild.dataset.oInit = n;
          return newElem.firstElementChild;
        };
        const rawData = props;
        if (!Array.isArray(props)) props = [props];
        !props.length ? props = [props] : props;
        const creation = !els[0] && state === "render";
        props = props.map((prop, i2) => {
          const newProp = Object.assign({}, type(prop) === objectType ? prop : {}, {
            self: result,
            o,
            i: prop.i === u ? i2 : prop.i,
            parent: result._parent,
            data: Array.isArray(rawData) ? rawData[i2] : rawData
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
        const initSSR = () => {
          cycleObj(data.events, (event) => {
            result.on(event, data.events[event]);
          });
        };
        if (els) {
          j = els.length === props.length;
          els.map((el, i2) => {
            props[j ? i2 : 0].i = i2 + finish;
            const buff = type(data) === functionType ? data(props[j ? i2 : 0]) : data;
            if (type(buff) === objectType) {
              buff["state"] = state;
              if (creation) {
                buff["data-o-init"] = initN;
                buff["data-o-init-i"] = i2;
                if (buff.events) {
                  result._hydrateEvents = result._hydrateEvents || [];
                  result._hydrateEvents[i2] = buff.events;
                }
              }
              transform(el, buff, props[j ? i2 : 0]);
            }
          });
          if (creation) {
            result._refsByIndex = [];
            result.refs = {};
            result.els.forEach((el, idx) => {
              if (!el.querySelectorAll) return;
              const refsForEl = {};
              el.querySelectorAll("[ref]").forEach((refEl) => {
                const refName = refEl.getAttribute("ref");
                const refInstance = o(refEl);
                refsForEl[refName] = refInstance;
                if (idx === 0) result.refs[refName] = refInstance;
              });
              result._refsByIndex[idx] = refsForEl;
            });
            if (!ssr && result._hydrateEvents) {
              result._hydrateEvents.forEach((evts, idx) => {
                if (!evts) return;
                result.select(idx);
                cycleObj(evts, (event) => {
                  const spec = evts[event];
                  if (type(spec) === objectType && spec.targetRef && type(spec.handler) === functionType) {
                    const refsForIdx = result._refsByIndex?.[idx] ?? result.refs;
                    const ref = refsForIdx?.[spec.targetRef];
                    if (ref) ref.on(event, spec.handler);
                  } else if (type(spec) === functionType) {
                    result.on(event, spec);
                  }
                });
              });
              result.all();
            }
          }
        }
        if (creation && type(data) === objectType && data.events) {
          if (!ssr && !data.ssr) {
            initSSR();
          }
        }
      });
    });
    const renderState = states.render || states;
    const hasStateEvents = !ssr && type(renderState) === objectType && renderState.events;
    const hasHydrateEvents = !ssr && result._hydrateEvents && result._hydrateEvents.length;
    if (hasStateEvents || hasHydrateEvents) {
      result.initSSRAfterGettingSSR = () => {
        result._refsByIndex = [];
        result.refs = {};
        result.els.forEach((el, idx) => {
          if (!el.querySelectorAll) return;
          const refsForEl = {};
          el.querySelectorAll("[ref]").forEach((refEl) => {
            const refName = refEl.getAttribute("ref");
            const refInstance = o(refEl);
            refsForEl[refName] = refInstance;
            if (idx === 0) result.refs[refName] = refInstance;
            refEl.removeAttribute("ref");
          });
          result._refsByIndex[idx] = refsForEl;
          if (idx === 0) result.refs = refsForEl;
        });
        if (hasStateEvents) {
          cycleObj(renderState.events, (event) => {
            result.on(event, renderState.events[event]);
          });
        }
        if (result._hydrateEvents) {
          result._hydrateEvents.forEach((evts, idx) => {
            if (!evts) return;
            result.select(idx);
            cycleObj(evts, (event) => {
              const spec = evts[event];
              if (type(spec) === objectType && spec.targetRef && type(spec.handler) === functionType) {
                const refsForIdx = result._refsByIndex?.[idx] ?? result.refs;
                const ref = refsForIdx?.[spec.targetRef];
                if (ref) ref.on(event, spec.handler);
              } else if (type(spec) === functionType) {
                result.on(event, spec);
              }
            });
          });
          result.all();
        }
      };
    }
  }, "init");
  result.connect = returner((loader, state = "render", fail) => {
    typeVerify([
      [loader, [objectType]],
      [state, [notEmptyStringType]],
      [fail, [stringType, undefinedType]]
    ]);
    loader.connect(self, state, fail);
  }, "connect");
  result.getSSR = returner((initId, fromEls) => {
    typeVerify([[initId, [numberType, undefinedType]]]);
    const effectiveId = initId !== void 0 ? initId : result.initID;
    if (ssr || type(initId) === undefinedType && type(result.initID) === undefinedType) {
      return;
    }
    const ssrEls = fromEls && fromEls.length ? fromEls : o.D.querySelectorAll(`[data-o-init="${effectiveId}"]`);
    if (ssrEls.length) {
      result.els = Array.from(ssrEls);
      if (initId !== void 0) {
        result.initID = initId;
        o.inits[initId] = result;
      }
      setResultVals(false);
      if (type(result.initSSRAfterGettingSSR) === functionType) {
        result.initSSRAfterGettingSSR();
      } else if (fromEls && fromEls.length) {
        result._refsByIndex = [];
        result.refs = {};
        result.els.forEach((el, idx) => {
          if (!el.querySelectorAll) return;
          const refsForEl = {};
          el.querySelectorAll("[ref]").forEach((refEl) => {
            const refName = refEl.getAttribute("ref");
            refsForEl[refName] = o(refEl);
            if (idx === 0) result.refs[refName] = refsForEl[refName];
            refEl.removeAttribute("ref");
          });
          result._refsByIndex[idx] = refsForEl;
          if (idx === 0) result.refs = refsForEl;
        });
      }
    }
  }, "getSSR");
  result.initState = returner((state, props) => {
    typeVerify([
      [state, [objectType]],
      [props, [objectType, undefinedType]]
    ]);
    result.init(state).render(props);
  }, "initState");
  const parseState = (el, stateId, root) => {
    const attrs = el.attributes;
    const stateData = {
      tagName: el.tagName.toLowerCase()
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
        o.inits[initId]?.saveState(stateId, false);
      }
    }
    return stateData;
  };
  result.saveState = returner((stateId, root = true) => {
    typeVerify([
      [stateId, [notEmptyStringType, undefinedType]],
      [root, [booleanType]]
    ]);
    if (!result.el) {
      throw Error("saveState(): There are no elements to save");
    }
    const targetState = stateId ? stateId : "fastSavedState";
    const stateRevert = { els: [], parentNode: result.el.parentNode, root };
    iterator(() => {
      stateRevert.els.push(parseState(result.els[i], targetState, root));
    });
    stateRevert.ie = Object.assign({}, result.ie);
    stateRevert.delegated = Object.assign({}, result.delegated);
    stateRevert.store = Object.assign({}, result.store);
    result.isRoot = result.isRoot || root;
    result.savedStates[targetState] = stateRevert;
  }, "saveState");
  result.revertState = returner((state) => {
    typeVerify([[state, [notEmptyStringType, undefinedType]]]);
    const targetState = state ? state : "fastSavedState";
    if (!result.savedStates[targetState]) {
      throw Error(
        `revertState(): The state "${targetState}" should have been saved by saveState()`
      );
    }
    const stateRevert = result.savedStates[targetState];
    result.offAll();
    result.offDelegate();
    result.store = Object.assign({}, stateRevert.store);
    stateRevert.els.forEach((elData, index) => {
      if (!result.els[index]) {
        const newEl = o.D.createElement(elData.tagName);
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
  result.sample = returner((state = "render") => {
    typeVerify([[state, [notEmptyStringType]]]);
    return { [state]: parseState(result.els[finish]) };
  }, "sample");
  result.select = returner((i2) => {
    let idx = i2;
    if (idx != null && type(idx) === objectType && idx.target && result.els.length) {
      idx = result.els.findIndex((el) => el === idx.target || el.contains(idx.target));
      if (idx < 0) idx = 0;
    }
    typeVerify([[idx, [numberType, undefinedType]]]);
    if (idx === u) {
      idx = result.length - ONE;
    }
    start = idx;
    finish = idx;
    result.el = result.els[idx];
    select = ONE;
    if (Array.isArray(result._refsByIndex) && result._refsByIndex[idx]) {
      result.refs = result._refsByIndex[idx];
    }
  }, "select");
  result.all = returner(() => {
    start = result.length - ONE;
    finish = 0;
    result.el = result.els[0];
    select = 0;
    if (Array.isArray(result._refsByIndex) && result._refsByIndex.length) {
      result.refs = result._refsByIndex[0] || {};
    }
  }, "all");
  result.remove = returner((j2) => {
    typeVerify([[j2, [numberType, undefinedType]]]);
    if (j2 === u && select) {
      j2 = finish;
    }
    if (j2 !== u) {
      const el = result.els[j2];
      if (el?.parentNode) {
        el.parentNode.removeChild(el);
      } else if (el === void 0 && j2 >= result.els.length) {
        if (o.onError) o.onError("remove(" + j2 + "): index out of bounds", "remove");
      }
    } else {
      iterator(() => {
        const el = result.els[i];
        if (el?.parentNode) el.parentNode.removeChild(el);
      });
    }
    setResultVals(false);
  }, "remove");
  result.skip = returner((j2) => {
    typeVerify([[j2, [numberType, undefinedType]]]);
    if (j2 === u) {
      j2 = finish;
    }
    result.els.splice(j2, ONE);
    if (Array.isArray(result._refsByIndex)) {
      result._refsByIndex.splice(j2, ONE);
    }
    setResultVals();
  }, "skip");
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
  result.appendInside = returner((el) => {
    typeVerify([[el, [objectType, notEmptyStringType]]]);
    if (el?.els) result._parent = el;
    iterator(() => {
      toEl(el).appendChild(result.els[i]);
    });
  }, "appendInside");
  result.appendBefore = returner((el) => {
    typeVerify([[el, [objectType, notEmptyStringType]]]);
    iterator(() => {
      toEl(el).parentNode.insertBefore(result.els[i], toEl(el));
    });
  }, "appendBefore");
  result.appendAfter = returner((el) => {
    typeVerify([[el, [objectType, notEmptyStringType]]]);
    iterator(() => {
      toEl(el).after(...result.els);
    });
  }, "appendAfter");
  result.find = returner((innerQuery = "") => {
    typeVerify([[innerQuery, stringType]]);
    const newEls = [];
    iterator(() => {
      newEls.push(...Array.from(result.els[i].querySelectorAll(":scope " + innerQuery)));
    });
    return o(newEls);
  }, "find");
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
  result.attr = returner((attr, val) => {
    if (val !== null) {
      typeVerify([
        [attr, stringType],
        [val, [stringType, undefinedType]]
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
  result.style = returner((val) => {
    if (val !== null) typeVerify([[val, [stringType, undefinedType]]]);
    result.attr("style", val);
  }, "style");
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
  result.cssMerge = returner((styles = {}) => {
    if (styles === null) {
      result.style(null);
      return;
    }
    typeVerify([[styles, objectType]]);
    const normKey = (k) => k.indexOf("-") !== -1 ? k : o.camelToKebab(k);
    const parseStyleAttr = (s) => {
      const out = {};
      if (!s || typeof s !== stringType) return out;
      const parts = s.split(";");
      for (let p = 0; p < parts.length; p++) {
        const part = parts[p];
        const idx = part.indexOf(":");
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        if (key) out[key] = val;
      }
      return out;
    };
    iterator(() => {
      const el = result.els[i];
      const merged = parseStyleAttr(el.getAttribute("style"));
      cycleObj(styles, (style) => {
        const k = normKey(style);
        const v = styles[style];
        if (v === null || v === u) delete merged[k];
        else merged[k] = String(v).replace('"', "'");
      });
      let serialized = "";
      cycleObj(merged, (k) => {
        serialized += k + ":" + merged[k] + ";";
      });
      if (serialized) el.setAttribute("style", serialized);
      else el.removeAttribute("style");
    });
  }, "cssMerge");
  result.setClass = returner((cl) => {
    typeVerify([[cl, stringType]]);
    iterator(() => {
      result.els[i].setAttribute("class", cl);
    });
  }, "setClass");
  result.addClass = returner((...cls) => {
    iterator(() => {
      result.els[i].classList.add(...cls);
    });
  }, "addClass");
  result.removeClass = returner((...cls) => {
    iterator(() => {
      result.els[i].classList.remove(...cls);
    });
  }, "removeClass");
  result.toggleClass = returner((cl, check) => {
    typeVerify([
      [cl, notEmptyStringType],
      [check, [booleanType, undefinedType]]
    ]);
    iterator(() => {
      result.els[i].classList.toggle(cl, check);
    });
  }, "toggleClass");
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
  result.innerHTML = returner((html) => {
    typeVerify([[html, [stringType, undefinedType]]]);
    if (html !== u) {
      iterator(() => {
        result.els[i].innerHTML = html;
      });
    } else {
      let res = "";
      iterator(() => {
        res += ssr && result.els[i].innerHTML.length === 0 ? o.D.parseElement(result.els[i], false) : result.els[i].innerHTML;
      });
      return res;
    }
  }, "innerHTML");
  result.innerText = returner((text) => {
    typeVerify([[text, [stringType]]]);
    iterator(() => {
      result.els[i].innerText = text;
    });
  }, "innerText");
  result.textContent = returner((text) => {
    typeVerify([[text, [stringType]]]);
    iterator(() => {
      result.els[i].textContent = text;
    });
  }, "textContent");
  result.html = returner((value) => {
    typeVerify([[value, [stringType, undefinedType]]]);
    if (value !== void 0) {
      result.innerHTML(value);
    } else {
      let html = "";
      iterator(() => {
        html += ssr ? result.els[i].outerHTML() : result.els[i].outerHTML;
      });
      return html;
    }
  }, "html");
  result.toString = function() {
    return result.html();
  };
  result[Symbol.toPrimitive] = function(hint) {
    if (hint === "string" || hint === "default") return result.html();
    if (hint === "number") return result.els?.length ?? 0;
    return result.html();
  };
  result.val = returner((value) => {
    if (value === void 0) return result.el?.value;
    iterator(() => {
      result.els[i].value = value;
    });
  }, "val");
  result.forEach = returner((f) => {
    typeVerify([[f, [functionType]]]);
    iterator(() => {
      f({ self: result, i, o, el: result.els[i] });
    });
  }, "forEach");
  result.prepareFor = returner((reactArg, ReactComponent) => {
    typeVerify([
      [reactArg, [objectType, functionType, undefinedType]],
      [ReactComponent, [functionType, undefinedType]]
    ]);
    const isFullReact = reactArg && type(reactArg) === objectType && reactArg.createElement;
    if (!isFullReact && type(reactArg) !== functionType) {
      throw Error(
        "prepareFor(): pass React (full object) or React.createElement as first argument"
      );
    }
    const createElement = isFullReact ? reactArg.createElement : reactArg;
    const useEffect = isFullReact ? reactArg.useEffect : void 0;
    return (p) => {
      if (p.ref === u) {
        throw Error("No ref property to convert Objs to React");
      }
      const props = Object.assign({}, p);
      const reactElement = createElement("div", { ref: p.ref });
      delete props.ref;
      useEffect(() => {
        cycleObj(props, (key) => {
          if (key.substring(0, 1) === "on") {
            const e = o.camelToKebab(key).split("-")[1];
            result.on(e, props[key]);
            delete props[key];
          }
        });
        result.render(props);
        result.appendInside(reactElement.ref.current);
      }, []);
      return reactElement;
    };
  }, "prepareFor");
  result.on = returner((a, b, c, d) => {
    typeVerify([
      [a, [notEmptyStringType]],
      [b, [functionType]],
      [c, [objectType, undefinedType]],
      [d, [booleanType, undefinedType]]
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
  result.off = returner((a, b, c) => {
    typeVerify([
      [a, [notEmptyStringType]],
      [b, [functionType]],
      [c, [objectType, undefinedType]]
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
  result.onDelegate = returner((e, selector, f) => {
    typeVerify([
      [e, [notEmptyStringType]],
      [selector, [notEmptyStringType]],
      [f, [functionType]]
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
  result.onParent = returner((e, selector, f) => {
    typeVerify([
      [e, [notEmptyStringType]],
      [selector, [notEmptyStringType, objectType]],
      [f, [functionType]]
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
  result.offParent = returner((e, query2) => {
    typeVerify([
      [e, [notEmptyStringType]],
      [query2, [notEmptyStringType, objectType]]
    ]);
    const parent = type(query2) === objectType ? query2 : o.D.querySelector(query2);
    cycleObj(result.parented, (ev) => {
      if (!e || e === ev) {
        result.parented[ev].forEach((f) => {
          parent.removeEventListener(ev, f);
        });
        delete result.parented[ev];
      }
    });
  }, "offParent");
  result.onAll = returner((type2, off) => {
    typeVerify([
      [type2, [notEmptyStringType, undefinedType]],
      [off, [booleanType, undefinedType]]
    ]);
    cycleObj(result.ie, (ev, events) => {
      if (!type2 || type2 === ev) {
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
  result.offAll = returner((type2) => {
    typeVerify([[type2, [notEmptyStringType]]]);
    result.onAll(type2, ONE);
  }, "offAll");
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
o.first = (query) => {
  o.verify([[query, ["notEmptyString"]]]);
  if (__DEV__ && o.debug) {
    console.log(query, " -> ", "o.first()");
  }
  return o(o.D.querySelector(query)).select(0);
};
o.inits = [];
o.getSaved = {};
o.errors = [];
o.showErrors = false;
o.logErrors = () => {
  o.errors.length ? o.errors.forEach((e) => console.error(e)) : console.log("No errors");
};
o.onError = (e, name) => {
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
o.autotag = void 0;
o.reactQA = (name) => ({
  ["data-" + (o.autotag || "qa")]: name.replace(/([A-Z])/g, (_, l) => "-" + l.toLowerCase()).replace(/^-/, "")
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
  }
};
o.verify = (pairs, safe = false) => {
  for (const pair of pairs) {
    const type = typeof pair[0];
    let expectedTypes = Array.isArray(pair[1]) ? pair[1] : [pair[1]];
    let isValid = false;
    if (expectedTypes.includes(type)) {
      return true;
    } else {
      expectedTypes = expectedTypes.filter((t) => !!o.specialTypes[t]);
    }
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
o.init = (states, reactRender) => o().init(states, reactRender);
o.initState = (state, props) => o().init(state).render(props);
o.take = (query) => o().take(query);
o.getStates = () => o.inits.reduce((acc, result) => {
  acc.push(result?.states);
  return acc;
}, []);
o.getStores = () => o.inits.reduce((acc, result) => {
  acc.push(result?.store);
  return acc;
}, []);
o.getListeners = () => o.inits.reduce((acc, result) => {
  acc.push(result?.ie);
  return acc;
}, []);
o.createStore = (defaults) => {
  const store = Object.assign({}, defaults);
  store._defaults = Object.assign({}, defaults);
  store._listeners = [];
  store.subscribe = function(component, stateName) {
    this._listeners.push((data) => component[stateName]?.(data));
    return this;
  };
  store.notify = function() {
    this._listeners.forEach((fn) => fn(this));
  };
  store.reset = function() {
    const skip = { _listeners: 1, subscribe: 1, notify: 1, _defaults: 1, reset: 1 };
    for (const key of Object.keys(this._defaults)) {
      if (!skip[key]) this[key] = this._defaults[key];
    }
  };
  return store;
};
o.U = void 0;
o.W = 2;
o.H = 100;
o.F = false;
o.C = (a, b) => {
  return Object.hasOwn(a, b);
};
o.kebabToCamel = (str) => str.replace(/-./g, (m) => m.toUpperCase()[1]);
o.camelToKebab = (str) => str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
o.route = (path, task) => {
  o.verify([
    [path, ["notEmptyString", "function", "boolean"]],
    [task, ["function", "object"]]
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
o.DocumentMVP = {
  addEventListener: () => {
  },
  parseElement: (elem, outer = true) => {
    o.verify([
      [elem, ["object", "string"]],
      [outer, ["boolean"]]
    ]);
    const attrToStr = (attrs, prefix = "") => {
      let attrStr = "";
      for (const attr in attrs) {
        if (o.C(attrs, attr)) {
          attrStr += ` ${prefix}${o.camelToKebab(attr)}="${typeof attrs[attr] !== "object" ? attrs[attr] : Object.entries(attrs[attr]).map((e) => `${e[0]}: ${e[1]};`).join(" ")}"`;
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
        "wbr"
      ];
      const tagName = elem.tagName.toLowerCase();
      const dataOInit = elem.attributes["data-o-init"];
      const dataOInitAttr = dataOInit !== void 0 ? ` data-o-init="${dataOInit}"` : "";
      return `<${tagName}${elem.className ? ` class="${elem.className}"` : ""}${attrToStr(elem.attributes)}${dataOInitAttr}${attrToStr(elem.dataset, "data-")}${selfClosing.includes(tagName) ? "/" : ""}>${selfClosing.includes(tagName) ? "" : elem.innerHTML.length ? elem.innerHTML : elem.children.map((el) => o.D.parseElement(el)).join("")}${!selfClosing.includes(tagName) ? `</${tagName}>` : ""}`;
    }
    return elem.innerHTML.length ? elem.innerHTML : elem.children.map((el) => o.D.parseElement(el)).join("");
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
      addEventListener: () => {
      },
      removeEventListener: () => {
      }
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
      }
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
        [val, ["string", "number", "boolean", "undefined"]]
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
  }
};
o.D = typeof document !== "undefined" && typeof process === "undefined" ? document : o.DocumentMVP;
o.setCookie = (title, value = "", params = {}) => {
  o.verify([
    [title, ["notEmptyString"]],
    [value, ["string", "number", "boolean"]],
    [params, ["object"]]
  ]);
  if (o.D.cookie === void 0) {
    console.log("Cookies are not supported on server side");
    return;
  }
  let str = encodeURIComponent(title) + "=" + encodeURIComponent(value);
  params = {
    path: "/",
    ...params
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
o.getCookie = (title) => {
  o.verify([[title, ["notEmptyString"]]]);
  if (o.D.cookie === void 0) {
    console.log("Cookies are not supported on server side");
    return;
  }
  const val = o.D.cookie.match(
    RegExp("(?:^|; )" + title.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return val ? decodeURIComponent(val[1]) : void 0;
};
o.deleteCookie = (title) => {
  o.verify([[title, ["notEmptyString"]]]);
  o.setCookie(title, "", { "max-age": 0 });
};
o.clearCookies = () => {
  if (o.D.cookie === void 0) {
    console.log("Cookies are not supported on server side");
    return;
  }
  const ca = o.D.cookie.split(";");
  while (ca.length) {
    let c = ca.pop();
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    const key = c.split("=")[0];
    o.deleteCookie(key);
  }
};
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
o.clearTestsStorage = () => {
  o.clearSessionStorage(1);
};
o.clearAfterTests = () => {
  o.clearCookies();
  o.clearLocalStorage(false);
  o.clearTestsStorage();
};
o.ajax = (url, props = {}) => {
  o.verify([
    [url, ["notEmptyString"]],
    [props, ["object"]]
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
o.get = (url, props = {}) => {
  o.verify([
    [url, ["notEmptyString"]],
    [props, ["object"]]
  ]);
  return o.ajax(url, { ...props, method: "GET" });
};
o.post = (url, props = {}) => {
  o.verify([
    [url, ["notEmptyString"]],
    [props, ["object"]]
  ]);
  return o.ajax(url, { ...props, method: "POST" });
};
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
        [fail, ["string", "undefined"]]
      ]);
      if (finished) {
        if (error) {
          fail ? listener[fail]() : "";
        } else if (typeof listener[state] === "function") {
          listener[state](data);
        }
      } else {
        listeners.push([listener, state, fail]);
      }
    },
    disconnect: (listener) => {
      o.verify([[listener, ["object"]]]);
      listeners = listeners.filter(([l]) => l !== listener);
    }
  };
};
o.getParams = (key) => {
  o.verify([[key, ["string", "undefined"]]]);
  const params = {};
  const paramsRaw = new URLSearchParams(window.location.search).entries();
  for (const entry of paramsRaw) {
    params[entry[0]] = entry[1];
  }
  return key ? params[key] : params;
};
o.incCache = true;
o.incCacheExp = 1e3 * 60 * 60 * 24;
o.incTimeout = 6e3;
o.incSource = "";
o.incForce = o.F;
o.incAsync = true;
o.incCors = o.F;
o.incSeparator = "?";
o.incFns = {};
o.incSet = [0];
o.incReady = [0];
o.incN = 0;
o.incGetHash = (path) => path.split(o.incSeparator)[1] || "";
o.incCheck = (set = 0, fnId, loaded = 0) => {
  o.verify([
    [set, ["number"]],
    [fnId, ["number", "undefined"]],
    [loaded, ["number"]]
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
o.inc = (sources, callBack, callBad) => {
  o.verify([
    [sources, ["object", "undefined"]],
    [callBack, ["function", "undefined"]],
    [callBad, ["function", "undefined"]]
  ]);
  if (typeof localStorage === "undefined") {
    return;
  }
  let sourcesN = 0, sourcesReady = 0, hash = "", preload = false;
  const f = "function", no = -1;
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
      if (name === "preload") {
        preload = true;
        continue;
      }
      hash = o.incGetHash(sources[name]);
      sourcesN++;
      o.incN++;
      const tag = sources[name].indexOf(".css") > no ? "style" : "script";
      sources[name] = (o.incSource ? o.incSource + "/" : "") + sources[name];
      if (Number.isNaN(Number(name)) && o.C(o.incFns, name) && o.incFns[name] && !o.incForce) {
        fnsStatus[sourcesN] = {
          name,
          loaded: 1
        };
        sourcesReady++;
        continue;
      }
      fnsStatus[sourcesN] = {
        name,
        loaded: 0
      };
      if (Number.isNaN(Number(name))) {
        o.incFns[name] = 0;
      }
      if (Number.isNaN(Number(name)) && o.incCache && (sources[name].substring(0, 4) !== "http" || !o.incCors) && window.location.protocol !== "file:" && (sources[name].indexOf(".css") > no || sources[name].indexOf(".js") > no)) {
        const ls = localStorage, script = ls.getItem("oInc-" + name), cacheSavedTill = ls.getItem("oInc-" + name + "-expires"), cacheHash = ls.getItem("oInc-" + name + "-hash");
        if (script && cacheSavedTill && Date.now() < cacheSavedTill && cacheHash === hash) {
          if (!preload) {
            o.initState({
              tag,
              id: "oInc-" + setN + "-" + sourcesN,
              innerHTML: script,
              "data-o-inc": setN
            }).appendInside("head");
          }
          fnsStatus[sourcesN].loaded = 1;
          o.incFns[name] = 1;
          sourcesReady++;
        } else {
          fnId[name] = sourcesN;
          o.get(sources[name], { mode: o.incCors ? "cors" : "same-origin" }).then(
            (response) => {
              if (response.status !== 200) {
                o.onError ? o.onError({
                  message: o.incSource + sources[name] + " was not loaded"
                }) : "";
                return;
              }
              response.text().then((script2) => {
                ls.setItem("oInc-" + name, script2);
                ls.setItem("oInc-" + name + "-expires", Date.now() + o.incCacheExp);
                ls.setItem("oInc-" + name + "-hash", hash);
                if (!preload) {
                  o.initState({
                    tag,
                    id: "oInc-" + setN + "-" + fnId[name],
                    innerHTML: script2,
                    "data-o-inc": setN
                  }).appendInside("head");
                }
                o.incCheck(setN, fnId[name], 1);
              });
            }
          );
        }
      } else {
        const state = {
          tag,
          id: "oInc-" + setN + "-" + sourcesN,
          "data-o-inc": setN,
          async: o.incAsync,
          onload: "o.incCheck(" + setN + "," + sourcesN + ",1)"
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
      if (typeof callBack === f) {
        callBack(setN);
      }
    } else {
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
        setN
      );
    }
  }
  return o.incSet[0];
};
o.connectRedux = (store, selector, component, state = "render") => {
  o.verify([
    [store, ["object"]],
    [selector, ["function"]],
    [component, ["object"]],
    [state, ["notEmptyString"]]
  ]);
  const update = () => {
    if (typeof component[state] === "function") {
      const val = selector(store.getState());
      component[state](val !== null && typeof val === "object" ? val : { value: val });
    }
  };
  update();
  return store.subscribe(update);
};
o.connectMobX = (mobx, observable, accessor, component, state = "render") => {
  o.verify([
    [mobx, ["object"]],
    [observable, ["object"]],
    [accessor, ["function"]],
    [component, ["object"]],
    [state, ["notEmptyString"]]
  ]);
  return mobx.autorun(() => {
    if (typeof component[state] === "function") {
      const val = accessor(observable);
      component[state](val !== null && typeof val === "object" ? val : { value: val });
    }
  });
};
o.ObjsContext = null;
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
  o.debug = false;
}
o.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
o.tLog = [];
o.tRes = [];
o.tStatus = [];
o.tFns = [];
o.tShowOk = o.F;
o.tStyled = o.F;
o.tTime = 2e3;
o.tests = [];
o.tExpectedSteps = {};
o.tFinalized = {};
o.tAutolog = o.F;
o.tBeforeEach = void 0;
o.tAfterEach = void 0;
o.addTest = (title, ...tests) => {
  o.verify([
    [title, ["notEmptyString"]],
    [tests, ["array"]]
  ]);
  let hooks = {};
  if (tests.length && typeof tests[tests.length - 1] === "object" && !Array.isArray(tests[tests.length - 1])) {
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
    testId
  };
};
o.updateLogs = () => {
  for (let i = 0; i < o.tests.length; i++) {
    o.tLog[i] = o.tLog[testN] = sessionStorage.getItem(`oTest-Log-${testN}`) || "";
  }
  return o.tLog;
};
o.runTest = (testId = 0, autoRun, savePrev) => {
  o.verify([
    [testId, ["number"]],
    [autoRun, ["boolean", "undefined"]],
    [savePrev, ["boolean", "undefined"]]
  ]);
  if (!o.tests[testId]) {
    return;
  }
  if (!savePrev) {
    sessionStorage?.removeItem(`oTest-Log-${testId}`);
    sessionStorage?.removeItem(`oTest-Res-${testId}`);
    sessionStorage?.removeItem(`oTest-Status-${testId}`);
  }
  sessionStorage?.setItem(`oTest-Run`, testId);
  if (autoRun) {
    sessionStorage?.setItem(`oTest-Autorun`, autoRun);
  } else {
    sessionStorage?.removeItem(`oTest-Autorun`);
  }
  const testSession = o.tests[testId];
  let lastTest = testSession.tests.pop();
  if (typeof lastTest !== "function") {
    testSession.tests.push(lastTest);
    lastTest = () => {
    };
  }
  testSession.tests.push((testN2) => {
    lastTest(testN2);
    sessionStorage.setItem("dddd", 1);
    sessionStorage?.removeItem(`oTest-Run`);
    if (autoRun) {
      o.runTest(testId + 1, autoRun);
    }
  });
  o.test(testSession.title, ...testSession.tests);
};
o.tPre = '<div style="font-family:monospace;text-align:left;">';
o.tOk = '<span style="background:#cfc;padding: 0 15px;">OK</span> ';
o.tXx = '<div style="background:#fcc;padding:3px;">';
o.tDc = "</div>";
o.test = (title = "", ...tests) => {
  o.verify([
    [title, ["notEmptyString"]],
    [tests, ["array"]]
  ]);
  const testSession = sessionStorage?.getItem(`oTest-Run`);
  const testN2 = testSession || o.tLog.length;
  let waits = 0, preOk = "\u251C OK: ", preXx = "\u251C \u2718 ", posOk = "\n", posXx = "\n", row = "", num = tests.length, done = 0;
  const log = (line = "", error = false, log2 = false) => {
    if (o.tAutolog) {
      if (error) {
        console.error(line);
      } else if (o.tShowOk || log2) {
        console.log(line);
      }
    }
  };
  let opts = {};
  if (typeof tests[num - 1] === "function") {
    o.tFns[testN2] = tests[num - 1];
    num--;
  }
  if (num > 0 && typeof tests[num - 1] === "object" && !Array.isArray(tests[num - 1]) && (tests[num - 1].sync !== void 0 || tests[num - 1].confirmOnFailure !== void 0)) {
    opts = tests[num - 1];
    num--;
  }
  if (testSession) {
    o.tLog[testN2] = sessionStorage.getItem(`oTest-Log-${testN2}`) || "";
    o.tRes[testN2] = sessionStorage.getItem(`oTest-Res-${testN2}`) || false;
    o.tStatus[testN2] = JSON.parse(
      sessionStorage.getItem(`oTest-Status-${testN2}`) || "[]"
    );
    for (let i = 0; i < o.tStatus[testN2].length; i++) {
      const s = o.tStatus[testN2][i];
      if (s === true || s === false) done++;
    }
  }
  if (o.tStyled) {
    preOk = o.tPre + o.tOk;
    preXx = o.tPre + o.tXx;
    posOk = o.tDc;
    posXx = posOk + posOk;
  }
  if (!testSession || o.tLog[testN2].length === 0) {
    log("\u2552 " + title + " #" + testN2, false, true);
    if (o.tStyled) {
      o.tLog[testN2] = "<div><b>" + title + " #" + testN2 + "</b></div>";
    } else {
      o.tLog[testN2] = "\u2552 " + title + " #" + testN2 + "\n";
    }
    o.tRes[testN2] = o.F;
    o.tStatus[testN2] = [];
  }
  o.tExpectedSteps[testN2] = num;
  o.tFinalized[testN2] = false;
  const showConfirmOnFailureOverlay = (stepIdx, msg) => new Promise((resolve) => {
    const box = o.overlay({
      innerHTML: `<div style="display:flex;flex-direction:column;gap:8px;"><div style="cursor:grab;">Step ${stepIdx + 1} failed: ${msg || "error"}. Continue testing?</div><div style="display:flex;gap:8px;"><button class="o-cf-continue" style="padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;">Continue</button><button class="o-cf-stop" style="padding:6px 12px;background:#dc2626;color:#fff;border:none;border-radius:6px;cursor:pointer;">Stop</button></div></div>`,
      timeout: opts.confirmOnFailureTimeout || void 0,
      onClose: (r) => resolve(r || { continue: false }),
      excludeDragSelector: ".o-cf-continue, .o-cf-stop"
    });
    box.first(".o-cf-continue").on("click", () => {
      box._overlayCleanup();
      resolve({ continue: true });
    });
    box.first(".o-cf-stop").on("click", () => {
      box._overlayCleanup();
      resolve({ continue: false });
    });
  });
  const finalize = () => {
    if (o.tFinalized[testN2]) return;
    if (waits > 0) {
      row = "\u251C ";
      row += "DONE " + done + "/" + num + ", waiting: " + waits;
      log(row, true);
      if (o.tStyled) {
        o.tLog[testN2] += o.tPre + '<div style="color:orange;"><b>DONE ' + done + "/" + num + ", waiting: " + waits + "</b>" + o.tDc + o.tDc;
      } else {
        o.tLog[testN2] += row + "\n";
      }
      return;
    }
    o.tFinalized[testN2] = true;
    const anyFailed = o.tStatus[testN2].some((s) => s === false);
    o.tRes[testN2] = !anyFailed && done === num;
    row = "\u2558 ";
    row += "DONE " + done + "/" + num;
    log(row, done !== num);
    log();
    if (o.tStyled) {
      o.tLog[testN2] += o.tPre + '<div style="color:' + (done !== num ? "red" : "green") + ';"><b>DONE ' + done + "/" + num + "</b>" + o.tDc + o.tDc;
    } else {
      o.tLog[testN2] += row + "\n";
    }
    if (testSession) {
      sessionStorage.setItem(`oTest-Log-${testN2}`, o.tLog[testN2]);
      sessionStorage.setItem(`oTest-Res-${testN2}`, o.tRes[testN2]);
      sessionStorage.setItem(`oTest-Status-${testN2}`, JSON.stringify(o.tStatus[testN2]));
    }
    if (typeof o.tFns[testN2] === "function") {
      o.tFns[testN2](testN2);
    }
  };
  if (opts.sync || opts.confirmOnFailure) {
    (async () => {
      for (let i = o.tStatus[testN2].length; i < num; i++) {
        const testInfo = {
          n: testN2,
          i,
          title: tests[i][0],
          tShowOk: o.tShowOk,
          tStyled: o.tStyled
        };
        let res = tests[i][1];
        if (typeof res === "undefined") {
          if (o.tStyled) {
            o.tLog[testN2] += "<div>" + testInfo.title + "</div>";
          } else {
            o.tLog[testN2] += testInfo.title + "\n";
          }
          log("\u251C " + testInfo.title, false, true);
          o.tStatus[testN2][i] = true;
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
        if (res && typeof res.then === "function") {
          try {
            const value = await res;
            const ok = value === true || value == null || value && typeof value === "object" && value.ok === true;
            const msg = value && value.errors && value.errors.length ? value.errors.join("; ") : typeof value === "string" ? value : "";
            o.testUpdate(testInfo, ok, ok ? "" : msg ? ": " + msg : "");
            done++;
            if (!ok && opts.confirmOnFailure) {
              const choice = await showConfirmOnFailureOverlay(i, msg);
              if (!choice.continue) break;
            }
          } catch (err) {
            o.testUpdate(testInfo, false, err.message || "Promise rejected");
            if (opts.confirmOnFailure) {
              const choice = await showConfirmOnFailureOverlay(i, err.message || "Promise rejected");
              if (!choice.continue) break;
            }
          }
          continue;
        }
        if (typeof o.tStatus[testN2][i] === "undefined") {
          o.tStatus[testN2][i] = typeof res === "string" ? o.F : res;
        } else {
          sessionStorage.setItem(`oTest-Status-${testN2}`, JSON.stringify(o.tStatus[testN2]));
          return;
        }
        if (res === true) {
          done++;
          if (o.tShowOk) {
            o.tLog[testN2] += preOk + tests[i][0] + posOk;
            log("\u251C OK: " + tests[i][0]);
          }
        } else if (res !== o.U) {
          o.tLog[testN2] += preXx + tests[i][0] + (res !== o.F ? ": " + res : "") + posXx;
          log("\u251C \u2718 " + tests[i][0] + (res !== o.F ? ": " + res : ""), true);
          if (opts.confirmOnFailure) {
            const choice = await showConfirmOnFailureOverlay(i, typeof res === "string" ? res : "");
            if (!choice.continue) break;
          }
        } else {
          waits++;
          setTimeout(
            (info) => {
              info.title += " (timeout)";
              o.testUpdate(info);
            },
            o.tTime,
            testInfo
          );
          return;
        }
      }
      finalize();
    })();
    return testN2;
  }
  for (let i = o.tStatus[testN2].length; i < num; i++) {
    const testInfo = {
      n: testN2,
      i,
      title: tests[i][0],
      tShowOk: o.tShowOk,
      tStyled: o.tStyled
    };
    let res = tests[i][1];
    if (typeof res === "undefined") {
      if (o.tStyled) {
        o.tLog[testN2] += "<div>" + testInfo.title + "</div>";
      } else {
        o.tLog[testN2] += testInfo.title + "\n";
      }
      log("\u251C " + testInfo.title, false, true);
      o.tStatus[testN2][i] = true;
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
    if (res && typeof res.then === "function") {
      waits++;
      const timeoutId = setTimeout(() => {
        testInfo.title += " (timeout)";
        o.testUpdate(testInfo);
      }, o.tTime);
      res.then((value) => {
        clearTimeout(timeoutId);
        const ok = value === true || value && value.ok === true;
        const msg = value && value.errors && value.errors.length ? value.errors.join("; ") : typeof value === "string" ? value : "";
        o.testUpdate(testInfo, ok, ok ? "" : msg ? ": " + msg : "");
      }).catch((err) => {
        clearTimeout(timeoutId);
        o.testUpdate(testInfo, false, err.message || "Promise rejected");
      });
      continue;
    }
    if (typeof o.tStatus[testN2][i] === "undefined") {
      o.tStatus[testN2][i] = typeof res === "string" ? o.F : res;
    } else {
      sessionStorage.setItem(`oTest-Status-${testN2}`, JSON.stringify(o.tStatus[testN2]));
      return;
    }
    if (res === true) {
      done++;
      if (o.tShowOk) {
        o.tLog[testN2] += preOk + tests[i][0] + posOk;
        log("\u251C OK: " + tests[i][0]);
      }
    } else if (res !== o.U) {
      o.tLog[testN2] += preXx + tests[i][0] + (res !== o.F ? ": " + res : "") + posXx;
      log("\u251C \u2718 " + tests[i][0] + (res !== o.F ? ": " + res : ""), true);
    } else {
      waits++;
      setTimeout(
        (info) => {
          info.title += " (timeout)";
          o.testUpdate(info);
        },
        o.tTime,
        testInfo
      );
    }
  }
  finalize();
  return testN2;
};
o.testUpdate = (info, res = o.F, suff = "") => {
  o.verify([
    [info, ["object"]],
    [res, ["boolean", "string"]],
    [suff, ["string"]]
  ]);
  let row = "";
  const testN2 = info.n;
  const log = (line = "", error = false) => {
    if (o.tAutolog) {
      if (error) {
        console.error(line);
      } else {
        console.log(line);
      }
    }
  };
  if (o.tStatus[testN2][info.i] === o.U || o.tStatus[testN2][info.i] === null) {
    o.tStatus[testN2][info.i] = res === true;
    if (res === true) {
      if (info.tShowOk) {
        row = "\u251C OK: " + info.title + suff;
        log(row);
        if (info.tStyled) {
          o.tLog[testN2] += o.tPre + o.tOk + info.title + suff + o.tDc;
        } else {
          o.tLog[testN2] += row + "\n";
        }
      }
    } else {
      o.tRes[testN2] = o.F;
      row = "\u251C \u2718 " + info.title + (res ? ": " + res : "") + suff;
      log(row, true);
      if (info.tStyled) {
        o.tLog[testN2] += o.tPre + o.tXx + info.title + suff + (res ? ": " + res : "") + o.tDc + o.tDc;
      } else {
        o.tLog[testN2] += row + "\n";
      }
    }
    let fails = 0, n = 0;
    for (const s of o.tStatus[testN2]) {
      if (s === o.U || s === null) {
        return;
      }
      if (!s) {
        fails++;
      }
      n++;
    }
    const expectedSteps = o.tests[testN2]?.tests?.length ?? o.tExpectedSteps[testN2] ?? Number.MAX_SAFE_INTEGER;
    if (n < expectedSteps) {
      if (sessionStorage?.getItem("oTest-Run") === testN2) {
        sessionStorage.setItem(`oTest-Log-${testN2}`, o.tLog[testN2]);
        sessionStorage.setItem(`oTest-Res-${testN2}`, o.tRes[testN2]);
        sessionStorage.setItem(`oTest-Status-${testN2}`, JSON.stringify(o.tStatus[testN2]));
      }
      return;
    }
    if (o.tFinalized[testN2]) return;
    o.tFinalized[testN2] = true;
    if (sessionStorage?.getItem("oTest-Run") === testN2) {
      sessionStorage.setItem(`oTest-Log-${testN2}`, o.tLog[testN2]);
      sessionStorage.setItem(`oTest-Res-${testN2}`, o.tRes[testN2]);
      sessionStorage.setItem(`oTest-Status-${testN2}`, JSON.stringify(o.tStatus[testN2]));
    }
    o.tRes[testN2] = !fails;
    row = fails ? "FAILED " + fails + "/" + n : "DONE " + n + "/" + n;
    log("\u2558 " + row, Boolean(fails));
    log();
    if (info.tStyled) {
      o.tLog[testN2] += o.tPre + '<b style="color:' + (!fails ? "green" : "red") + ';">' + row + "</b>" + o.tDc;
    } else {
      o.tLog[testN2] += "\u2558 " + row + "\n";
    }
    if (typeof o.tFns[testN2] === "function") {
      o.tFns[testN2](testN2);
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
        true
      );
    },
    false
  );
}
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
    visible: style.display !== "none" && style.visibility !== "hidden" && rect.width > 0,
    opacity: style.opacity,
    zIndex: style.zIndex
  };
};
o.assertVisible = (el) => {
  const m = o.measure(el);
  return Boolean(m.visible);
};
o.assertSize = (el, expected = {}) => {
  if (!el) return "element is null";
  const m = o.measure(el);
  if (expected.w !== void 0 && Math.round(m.width) !== expected.w) {
    return `width: expected ${expected.w}, got ${Math.round(m.width)}`;
  }
  if (expected.h !== void 0 && Math.round(m.height) !== expected.h) {
    return `height: expected ${expected.h}, got ${Math.round(m.height)}`;
  }
  const getPx = (prop) => {
    const v = window.getComputedStyle(el).getPropertyValue(prop);
    return v ? parseFloat(v) : 0;
  };
  if (expected.padding !== void 0 && getPx("padding-top") !== expected.padding) {
    return `padding: expected ${expected.padding}, got ${getPx("padding-top")}`;
  }
  if (expected.paddingTop !== void 0 && getPx("padding-top") !== expected.paddingTop) {
    return `paddingTop: expected ${expected.paddingTop}, got ${getPx("padding-top")}`;
  }
  if (expected.paddingRight !== void 0 && getPx("padding-right") !== expected.paddingRight) {
    return `paddingRight: expected ${expected.paddingRight}, got ${getPx("padding-right")}`;
  }
  if (expected.paddingBottom !== void 0 && getPx("padding-bottom") !== expected.paddingBottom) {
    return `paddingBottom: expected ${expected.paddingBottom}, got ${getPx("padding-bottom")}`;
  }
  if (expected.paddingLeft !== void 0 && getPx("padding-left") !== expected.paddingLeft) {
    return `paddingLeft: expected ${expected.paddingLeft}, got ${getPx("padding-left")}`;
  }
  if (expected.margin !== void 0 && getPx("margin-top") !== expected.margin) {
    return `margin: expected ${expected.margin}, got ${getPx("margin-top")}`;
  }
  if (expected.marginTop !== void 0 && getPx("margin-top") !== expected.marginTop) {
    return `marginTop: expected ${expected.marginTop}, got ${getPx("margin-top")}`;
  }
  if (expected.marginRight !== void 0 && getPx("margin-right") !== expected.marginRight) {
    return `marginRight: expected ${expected.marginRight}, got ${getPx("margin-right")}`;
  }
  if (expected.marginBottom !== void 0 && getPx("margin-bottom") !== expected.marginBottom) {
    return `marginBottom: expected ${expected.marginBottom}, got ${getPx("margin-bottom")}`;
  }
  if (expected.marginLeft !== void 0 && getPx("margin-left") !== expected.marginLeft) {
    return `marginLeft: expected ${expected.marginLeft}, got ${getPx("margin-left")}`;
  }
  return true;
};
o.recorder = {
  active: false,
  actions: [],
  mocks: {},
  initialData: {},
  assertions: [],
  observeRoot: null,
  strictCapture: null,
  _originalFetch: null,
  _listeners: [],
  _observer: null
};
o.recordingAssertionDebug = false;
o.startRecording = (observe, events, timeouts) => {
  if (o.recorder.active) {
    return;
  }
  let observeSel;
  let eventsOpt;
  let timeoutsOpt;
  let strictCapture = null;
  const isStartBag = observe != null && typeof observe === "object" && !Array.isArray(observe) && (o.C(observe, "observe") || o.C(observe, "events") || o.C(observe, "timeouts") || o.C(observe, "strictCaptureAssertions") || o.C(observe, "strictCaptureNetwork") || o.C(observe, "strictCaptureWebSocket"));
  if (isStartBag) {
    const bag = observe;
    observeSel = bag.observe != null ? String(bag.observe) : void 0;
    eventsOpt = bag.events;
    timeoutsOpt = bag.timeouts;
    if (o.C(bag, "strictCaptureAssertions") || o.C(bag, "strictCaptureNetwork") || o.C(bag, "strictCaptureWebSocket")) {
      strictCapture = {
        assertions: !!bag.strictCaptureAssertions,
        network: !!bag.strictCaptureNetwork,
        websocket: !!bag.strictCaptureWebSocket
      };
    }
  } else {
    observeSel = typeof observe === "string" ? observe : void 0;
    eventsOpt = events;
    timeoutsOpt = timeouts;
  }
  const defaultEvents = [
    "click",
    "mouseover",
    "scroll",
    "input",
    "change",
    "submit",
    "keydown",
    "focus",
    "blur"
  ];
  const defaultStepDelays = {
    click: 100,
    mouseover: 50,
    scroll: 30,
    input: 50,
    change: 50,
    submit: 100,
    keydown: 50,
    focus: 50,
    blur: 50
  };
  const listenEvents = eventsOpt || defaultEvents;
  const stepDelays = Object.assign({}, defaultStepDelays, timeoutsOpt || {});
  const captureDebounce = {
    scroll: 30,
    mouseover: 50,
    keydown: 50,
    focus: 50,
    blur: 50
  };
  const rec = o.recorder;
  rec.active = true;
  rec.actions = [];
  rec.mocks = {};
  rec.stepDelays = stepDelays;
  rec.initialData = { url: window.location.href, timestamp: Date.now() };
  rec.strictCapture = strictCapture;
  rec.observeRoot = observeSel || null;
  rec.assertions = [];
  rec.removedElements = [];
  o.inits.forEach((inst, idx) => {
    if (inst?.store) {
      rec.initialData["init_" + idx] = JSON.parse(JSON.stringify(inst.store));
    }
  });
  rec._originalFetch = window.fetch;
  window.fetch = async (url, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    let reqBody;
    try {
      reqBody = opts.body ? JSON.parse(opts.body) : void 0;
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
      status: response.status
    };
    return response;
  };
  rec._originalXHROpen = XMLHttpRequest.prototype.open;
  rec._originalXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._oMethod = (method || "GET").toUpperCase();
    this._oUrl = url;
    return rec._originalXHROpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(body) {
    const capture = () => {
      if (this.readyState !== 4) return;
      let reqBody;
      try {
        reqBody = body ? JSON.parse(body) : void 0;
      } catch (_e) {
        reqBody = body;
      }
      let respBody;
      try {
        const text = this.responseText;
        respBody = text ? JSON.parse(text) : null;
      } catch (_e) {
        respBody = this.responseText ?? null;
      }
      const key = (this._oMethod || "GET") + ":" + (this._oUrl || "");
      rec.mocks[key] = {
        url: this._oUrl,
        method: this._oMethod,
        request: reqBody,
        response: respBody,
        status: this.status
      };
    };
    this.addEventListener("readystatechange", capture);
    return rec._originalXHRSend.apply(this, arguments);
  };
  rec.websocketEvents = [];
  rec._originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const ws = new rec._originalWebSocket(url, protocols);
    const id = rec.websocketEvents.length;
    rec.websocketEvents.push({
      url: typeof url === "string" ? url : String(url),
      protocol: Array.isArray(protocols) ? protocols[0] : protocols,
      open: true,
      messages: []
    });
    ws.addEventListener("message", (e) => {
      const data = typeof e.data === "string" ? e.data : String(e.data);
      rec.websocketEvents[id].messages.push({ dir: "in", data });
    });
    ws.addEventListener("close", () => {
      rec.websocketEvents[id].open = false;
    });
    const origSend = ws.send.bind(ws);
    ws.send = function(data) {
      const d = typeof data === "string" ? data : String(data);
      rec.websocketEvents[id].messages.push({ dir: "out", data: d });
      return origSend(data);
    };
    return ws;
  };
  const unstableDataAttrs = { "data-o-init": 1, "data-o-init-i": 1, "data-o-state": 1 };
  const qualify = (sel, fromNode) => {
    if (o.D.querySelectorAll(sel).length <= 1) return sel;
    let node = fromNode;
    while (node && node !== o.D.body) {
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
        if (o.D.querySelectorAll(q).length === 1) return q;
      }
      node = node.parentElement;
    }
    return sel;
  };
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
      const base = node.id ? "#" + node.id : node.className ? node.tagName.toLowerCase() + "." + [...node.classList].join(".") : node.tagName.toLowerCase();
      sel = node.id ? base : qualify(base, node.parentElement);
    }
    return sel;
  };
  const observeTarget = observeSel && o.D.querySelector(observeSel) || o.D.body;
  rec._observer = new MutationObserver((mutations) => {
    const actionIdx = rec.actions.length - 1;
    if (actionIdx < 0) return;
    const lastAction = rec.actions[actionIdx];
    if (o.recordingAssertionDebug && typeof console !== "undefined" && console.log) {
      console.log("[recording] MutationObserver batch:", {
        actionIdx,
        lastAction: lastAction ? { type: lastAction.type, target: lastAction.target } : null,
        mutationTypes: mutations.map((x) => x.type),
        addedCount: mutations.reduce((n, x) => n + (x.addedNodes?.length || 0), 0),
        removedCount: mutations.reduce((n, x) => n + (x.removedNodes?.length || 0), 0)
      });
    }
    mutations.forEach((m) => {
      const addAssertionIndex = (sel, node) => {
        let listSelector;
        let index;
        if (sel && observeTarget) {
          const matches = observeTarget.querySelectorAll(sel);
          if (matches.length > 1) {
            const idxAmong = [...matches].indexOf(node);
            if (idxAmong !== -1) {
              listSelector = sel;
              index = idxAmong;
            } else {
              let n = node;
              while (n && n !== observeTarget && n.nodeType === 1) {
                const qaAttr = o.autotag && n.dataset && n.dataset[o.autotag];
                if (qaAttr) {
                  const itemSel = `[data-${o.autotag}="${qaAttr}"]`;
                  const itemMatches = observeTarget.querySelectorAll(itemSel);
                  if (itemMatches.length > 1) {
                    const idx = [...itemMatches].indexOf(n);
                    if (idx !== -1) {
                      listSelector = itemSel;
                      index = idx;
                      break;
                    }
                  }
                }
                n = n.parentElement;
              }
            }
          }
        }
        return { listSelector, index };
      };
      if (m.type === "childList") {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (!node.offsetParent) return;
          const sel = buildSelector(node);
          if (!sel) return;
          if (rec.assertions.some(
            (a2) => a2.actionIdx === actionIdx && a2.selector === sel && a2.type === "visible"
          ))
            return;
          const text = (node.textContent?.trim() || "").slice(0, 80) || void 0;
          const { listSelector: aListSel, index: aIdx } = addAssertionIndex(sel, node);
          const a = { actionIdx, type: "visible", selector: sel, text };
          if (aListSel != null) a.listSelector = aListSel;
          if (aIdx != null) a.index = aIdx;
          rec.assertions.push(a);
          if (o.recordingAssertionDebug && typeof console !== "undefined" && console.log) {
            console.log("[recording] +visible assertion:", {
              actionIdx,
              lastAction: lastAction?.type + " " + lastAction?.target,
              selector: sel,
              text: (text || "").slice(0, 40),
              index: aIdx,
              listSelector: aListSel
            });
          }
        });
        m.removedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const sel = buildSelector(node);
          if (!sel) return;
          const text = (node.textContent?.trim() || "").slice(0, 80) || void 0;
          const parent = m.target;
          let index;
          if (node.previousSibling) {
            index = Array.from(parent.children).indexOf(node.previousSibling) + 1;
          } else if (node.nextSibling) {
            index = Array.from(parent.children).indexOf(node.nextSibling);
          } else {
            index = 0;
          }
          let listSelector;
          if (o.autotag && node.dataset?.[o.autotag]) {
            const qaVal = node.dataset[o.autotag];
            listSelector = `[data-${o.autotag}="${qaVal}"]`;
          }
          const entry = { actionIdx, type: "removed", selector: sel, text };
          if (listSelector) entry.listSelector = listSelector;
          entry.index = index;
          rec.removedElements.push(entry);
          if (o.recordingAssertionDebug && typeof console !== "undefined" && console.log) {
            console.log("[recording] +removed element:", {
              actionIdx,
              lastAction: lastAction?.type + " " + lastAction?.target,
              selector: sel,
              text: (text || "").slice(0, 40),
              index,
              listSelector
            });
          }
        });
      }
      if (m.type === "attributes") {
        const attr = m.attributeName;
        if (!attr) return;
        const sel = buildSelector(m.target);
        if (!sel) return;
        const attrToType = {
          class: "class",
          style: "style",
          hidden: "hidden",
          disabled: "disabled",
          "aria-expanded": "aria-expanded",
          "aria-checked": "aria-checked"
        };
        const type = attrToType[attr];
        if (!type) return;
        if (rec.assertions.some(
          (a2) => a2.actionIdx === actionIdx && a2.selector === sel && a2.type === type
        ))
          return;
        const { listSelector: aListSel, index: aIdx } = addAssertionIndex(sel, m.target);
        const el = m.target;
        let value;
        if (type === "class") value = el.className;
        else if (type === "style") value = el.style?.cssText || el.getAttribute("style") || "";
        else if (type === "hidden") value = el.hidden;
        else if (type === "disabled") value = el.disabled === true;
        else if (type === "aria-expanded")
          value = el.getAttribute("aria-expanded");
        else if (type === "aria-checked") value = el.getAttribute("aria-checked");
        const a = { actionIdx, type, selector: sel };
        if (type === "class") a.className = value;
        else if (type === "style") a.style = value;
        else if (type === "hidden") a.hidden = value;
        else if (type === "disabled") a.disabled = value;
        else if (type === "aria-expanded") a.ariaExpanded = value;
        else if (type === "aria-checked") a.ariaChecked = value;
        if (aListSel != null) a.listSelector = aListSel;
        if (aIdx != null) a.index = aIdx;
        rec.assertions.push(a);
        if (o.recordingAssertionDebug && typeof console !== "undefined" && console.log) {
          console.log("[recording] +attr assertion:", {
            actionIdx,
            lastAction: lastAction?.type + " " + lastAction?.target,
            selector: sel,
            type,
            value,
            index: aIdx,
            listSelector: aListSel
          });
        }
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
      "aria-checked"
    ]
  });
  const timers = {};
  listenEvents.forEach((ev) => {
    const handler = (e) => {
      const target = e.target;
      if (observeSel && observeTarget && target?.nodeType === 1 && !observeTarget.contains(target)) {
        return;
      }
      let selector = "";
      if (target?.dataset) {
        const qaKey = o.autotag && target.dataset[o.autotag];
        if (qaKey) {
          selector = qualify(`[data-${o.autotag}="${qaKey}"]`, target.parentElement);
        }
      }
      if (!selector && target?.tagName) {
        const base = target.id ? "#" + target.id : target.className ? target.tagName.toLowerCase() + "." + [...target.classList].join(".") : target.tagName.toLowerCase();
        selector = target.id ? base : qualify(base, target.parentElement);
      }
      let listSelector;
      let targetIndex;
      if (selector && observeTarget) {
        const matches = observeTarget.querySelectorAll(selector);
        if (matches.length > 1) {
          const idxAmongMatches = [...matches].indexOf(target);
          if (idxAmongMatches !== -1) {
            listSelector = selector;
            targetIndex = idxAmongMatches;
          } else {
            let node = target;
            while (node && node !== observeTarget && node.nodeType === 1) {
              const qaAttr = o.autotag && node.dataset && node.dataset[o.autotag];
              if (qaAttr) {
                const itemSel = `[data-${o.autotag}="${qaAttr}"]`;
                const itemMatches = observeTarget.querySelectorAll(itemSel);
                if (itemMatches.length > 1) {
                  const idx = [...itemMatches].indexOf(node);
                  if (idx !== -1) {
                    listSelector = itemSel;
                    targetIndex = idx;
                    break;
                  }
                }
              }
              node = node.parentElement;
            }
          }
        }
      }
      const targetType = target?.tagName ? target.tagName.toLowerCase() + (target.type ? ":" + target.type : "") : void 0;
      const scrollY = ev === "scroll" ? window.scrollY : void 0;
      const value = ev === "input" || ev === "change" ? target?.value : void 0;
      const checked = ev === "change" && (target?.type === "checkbox" || target?.type === "radio") ? target?.checked : void 0;
      const key = ev === "keydown" ? target?.key : void 0;
      const code = ev === "keydown" ? target?.code : void 0;
      const delay = ev === "click" || ev === "change" || ev === "submit" ? 0 : stepDelays[ev] !== void 0 ? stepDelays[ev] : captureDebounce[ev] ?? 0;
      const pushAction = () => {
        if ((ev === "blur" || ev === "focus") && selector) {
          const lastIdx = rec.actions.length - 1;
          const lastAction = lastIdx >= 0 ? rec.actions[lastIdx] : null;
          if (lastAction) {
            const sameTarget = lastAction.target === selector && lastAction.listSelector == null === (listSelector == null) && lastAction.targetIndex == null === (targetIndex == null) && (lastAction.targetIndex == null || lastAction.targetIndex === targetIndex);
            if (sameTarget) return;
            for (const r of rec.removedElements) {
              if (r.actionIdx !== lastIdx) continue;
              if (r.selector === selector || selector.startsWith(r.selector + " ") || selector.startsWith(r.selector + ">"))
                return;
            }
          }
        }
        const action = { type: ev, target: selector, time: Date.now() };
        if (targetType) action.targetType = targetType;
        if (scrollY !== void 0) action.scrollY = scrollY;
        if (value !== void 0) action.value = value;
        if (checked !== void 0) action.checked = checked;
        if (key !== void 0) action.key = key;
        if (code !== void 0) action.code = code;
        if (listSelector != null) action.listSelector = listSelector;
        if (targetIndex != null) action.targetIndex = targetIndex;
        rec.actions.push(action);
      };
      if (delay === 0) {
        pushAction();
      } else {
        clearTimeout(timers[ev]);
        timers[ev] = setTimeout(pushAction, delay);
      }
    };
    o.D.addEventListener(ev, handler, true);
    rec._listeners.push({ ev, handler });
  });
};
o.stopRecording = () => {
  const rec = o.recorder;
  rec.active = false;
  if (rec._originalFetch) {
    window.fetch = rec._originalFetch;
    rec._originalFetch = null;
  }
  if (rec._originalXHROpen) {
    XMLHttpRequest.prototype.open = rec._originalXHROpen;
    XMLHttpRequest.prototype.send = rec._originalXHRSend;
    rec._originalXHROpen = null;
    rec._originalXHRSend = null;
  }
  if (rec._originalWebSocket) {
    window.WebSocket = rec._originalWebSocket;
    rec._originalWebSocket = null;
  }
  rec._listeners.forEach(({ ev, handler }) => {
    o.D.removeEventListener(ev, handler, true);
  });
  rec._listeners = [];
  if (rec._observer) {
    rec._observer.disconnect();
    rec._observer = null;
  }
  const out = {
    actions: [...rec.actions],
    mocks: { ...rec.mocks },
    initialData: { ...rec.initialData },
    stepDelays: { ...rec.stepDelays },
    assertions: [...rec.assertions || []],
    removedElements: [...rec.removedElements || []],
    observeRoot: rec.observeRoot || null,
    websocketEvents: [...rec.websocketEvents || []]
  };
  if (rec.strictCapture) {
    out.strictCapture = { ...rec.strictCapture };
  }
  return out;
};
o.clearRecording = (id) => {
  if (id !== void 0) {
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
o.runRecordingAssertions = (recording, root, actionIdx, opts) => {
  const strictAssertions = !!(opts && opts.strictAssertions);
  const strictRemoved = opts && opts.strictRemoved !== void 0 ? !!opts.strictRemoved : strictAssertions;
  const preFiltered = opts && opts.assertions;
  const assertions = preFiltered != null ? preFiltered : (recording.assertions || []).filter(
    (a) => actionIdx == null || a.actionIdx === actionIdx
  );
  if (o.recordingAssertionDebug && typeof console !== "undefined" && console.log) {
    console.log("[runRecordingAssertions] run:", {
      actionIdx,
      scope: actionIdx == null ? "teardown (all)" : "per-action",
      assertionsCount: assertions.length,
      assertions: assertions.map((a) => ({
        actionIdx: a.actionIdx,
        type: a.type,
        selector: a.selector,
        index: a.index,
        text: (a.text || "").slice(0, 40)
      }))
    });
  }
  const seen = /* @__PURE__ */ new Set();
  const deduped = assertions.filter((a) => {
    const key = `${a.selector}|${a.type}|${a.actionIdx}|${a.index ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const resolveRoot = () => {
    if (root != null) {
      return typeof root === "string" ? o.D.querySelector(root) || o.D.body : root;
    }
    const sel = recording.observeRoot;
    return sel ? o.D.querySelector(sel) || o.D.body : o.D.body;
  };
  const r = resolveRoot();
  const norm = (s) => (s || "").trim().replace(/\s+/g, " ");
  const styleNorm = (s) => norm(String(s || "").replace(/\s*:\s*/g, ": ").replace(/\s*;\s*/g, "; "));
  const getText = (el) => el ? norm(el.textContent || "") : "";
  const removedElements = opts?.removedElements || [];
  const isRemoved = (a) => {
    if (!removedElements.length || actionIdx == null) return false;
    const expText = norm(a.text || "");
    for (const r2 of removedElements) {
      if (r2.actionIdx > actionIdx) continue;
      if (norm(r2.text || "") !== expText) continue;
      if (r2.selector !== a.selector) continue;
      if (a.listSelector != null && r2.listSelector !== a.listSelector) continue;
      if (a.index != null && r2.index !== a.index) continue;
      return true;
    }
    return false;
  };
  let passed = 0;
  const failures = [];
  for (const a of deduped) {
    if (isRemoved(a)) {
      if (!strictRemoved) {
        passed += 1;
        if (o.recordingAssertionDebug && typeof console !== "undefined" && console.log) {
          console.log("[runRecordingAssertions] skip (explicit removed):", {
            actionIdx: a.actionIdx,
            selector: a.selector,
            text: (a.text || "").slice(0, 40)
          });
        }
        continue;
      }
      let ghost = null;
      const expText = norm(a.text || "");
      if (a.listSelector != null && a.index != null) {
        const items = r.querySelectorAll(a.listSelector);
        let item = items[a.index];
        if (!item && a.index > 0) item = items[a.index - 1];
        if (item) {
          ghost = a.selector !== a.listSelector ? item.querySelector(a.selector) || item : item;
        }
        if (!ghost && expText && a.type === "visible") {
          for (let j = 0; j < items.length; j++) {
            const it = items[j];
            const cand = a.selector !== a.listSelector ? it.querySelector(a.selector) || it : it;
            if (cand && getText(cand).indexOf(expText) !== -1) {
              ghost = cand;
              break;
            }
          }
        }
      } else {
        const matches = r.querySelectorAll(a.selector);
        ghost = matches.length > 0 ? matches[0] : o.D.querySelector(a.selector);
      }
      if (ghost && a.type === "visible") {
        const vis = ghost.nodeType === 1 && (ghost.offsetParent !== null || ghost.getBoundingClientRect && ghost.getBoundingClientRect().width > 0);
        const gtext = getText(ghost);
        const still = vis && (!expText || gtext.indexOf(expText) !== -1 || expText.indexOf(gtext) !== -1);
        if (still) {
          failures.push({
            selector: a.selector,
            message: "expected absent (recorded removed) but matching content still visible"
          });
          continue;
        }
      } else if (ghost && a.type !== "visible") {
        failures.push({
          selector: a.selector,
          message: "expected absent (recorded removed) but element still present"
        });
        continue;
      }
      passed += 1;
      continue;
    }
    let el = null;
    let indexOutOfBounds = false;
    let listItemsLength = -1;
    if (a.listSelector != null && a.index != null) {
      const items = r.querySelectorAll(a.listSelector);
      listItemsLength = items.length;
      const expectedText = norm(a.text || "");
      const tryItem = (idx) => {
        const it = items[idx];
        if (!it) return null;
        const e = a.selector !== a.listSelector ? it.querySelector(a.selector) : it;
        return e || (a.selector !== a.listSelector ? it : null);
      };
      let item;
      if (strictAssertions) {
        item = items[a.index];
        if (item) {
          el = tryItem(a.index);
          if (!el && a.selector !== a.listSelector) el = item;
        }
      } else {
        item = items[a.index];
        if (!item && a.index > 0) item = items[a.index - 1];
        if (item) {
          el = tryItem(a.index) || (a.index > 0 ? tryItem(a.index - 1) : null);
          if (!el && a.selector !== a.listSelector) el = item;
          if (a.type === "visible" && expectedText && el) {
            const actualText = getText(el);
            const textMismatch = actualText.indexOf(expectedText) === -1 && expectedText.indexOf(actualText) === -1;
            if (textMismatch) {
              for (let j = 0; j < items.length; j++) {
                const candEl = tryItem(j);
                if (candEl && getText(candEl).indexOf(expectedText) !== -1) {
                  el = candEl;
                  item = items[j];
                  break;
                }
              }
            }
          }
        }
      }
      if (!item) {
        indexOutOfBounds = true;
      }
    } else {
      const matches = r.querySelectorAll(a.selector);
      el = matches.length > 0 ? matches[0] : o.D.querySelector(a.selector);
    }
    if (a.type === "visible") {
      const visible = el && el.nodeType === 1 && (el.offsetParent !== null || el.getBoundingClientRect && el.getBoundingClientRect().width > 0);
      const expectedText = norm(a.text || "");
      const actualText = getText(el);
      const textOk = strictAssertions ? !expectedText || actualText === expectedText : !expectedText || actualText.indexOf(expectedText) !== -1 || expectedText.length > 0 && expectedText.indexOf(actualText) !== -1;
      if (visible && textOk) {
        passed += 1;
      } else {
        const listCount = listItemsLength >= 0 ? listItemsLength : r.querySelectorAll(a.listSelector || a.selector).length;
        const message = indexOutOfBounds ? `index out of bounds (list has ${listCount} items, assertion expected index ${a.index})` : !el ? "element not found" : !visible ? "not visible" : !textOk ? "text mismatch" : "fail";
        failures.push({ selector: a.selector, message });
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[runRecordingAssertions] visible failed:", {
            actionIdx: a.actionIdx,
            selector: a.selector,
            listSelector: a.listSelector,
            index: a.index,
            expectedText: a.text || "(any)",
            actualText: actualText.slice(0, 80),
            message
          });
        }
      }
    } else if (a.type === "class") {
      const tokens = (a.className || "").trim().split(/\s+/).filter(Boolean);
      const hasClass = el && (tokens.length === 0 || tokens.every((c) => el.classList?.contains(c)));
      const classOrderOk = !strictAssertions || !a.className || norm((el?.className || "").trim()) === norm((a.className || "").trim());
      if (hasClass && classOrderOk) {
        passed += 1;
      } else {
        const msg = indexOutOfBounds ? `index out of bounds (list has ${r.querySelectorAll(a.listSelector).length} items, expected index ${a.index})` : !el ? "element not found" : hasClass && !classOrderOk ? `expected exact className "${a.className}" (strict)` : `expected class "${a.className}"`;
        failures.push({ selector: a.selector, message: msg });
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[runRecordingAssertions] failed:", {
            type: a.type,
            selector: a.selector,
            actionIdx: a.actionIdx,
            listSelector: a.listSelector,
            index: a.index,
            itemsInRoot: a.listSelector ? r.querySelectorAll(a.listSelector).length : "-",
            message: msg
          });
        }
      }
    } else if (a.type === "style") {
      const expected = (a.style || "").trim();
      const actual = (el?.style?.cssText || el?.getAttribute?.("style") || "").trim();
      const ok = el && (!expected || (strictAssertions ? styleNorm(actual) === styleNorm(expected) : actual.indexOf(expected) !== -1 || expected === actual));
      if (ok) {
        passed += 1;
      } else {
        const msg = !el ? "element not found" : `expected style "${expected.slice(0, 60)}..."`;
        failures.push({ selector: a.selector, message: msg });
      }
    } else if (a.type === "hidden") {
      const ok = el && el.hidden === a.hidden;
      if (ok) {
        passed += 1;
      } else {
        const msg = !el ? "element not found" : `expected hidden=${a.hidden}`;
        failures.push({ selector: a.selector, message: msg });
      }
    } else if (a.type === "disabled") {
      const ok = el && el.disabled === a.disabled;
      if (ok) {
        passed += 1;
      } else {
        const msg = !el ? "element not found" : `expected disabled=${a.disabled}`;
        failures.push({ selector: a.selector, message: msg });
      }
    } else if (a.type === "aria-expanded") {
      const actual = el?.getAttribute?.("aria-expanded");
      const ok = el && (a.ariaExpanded == null || String(actual) === String(a.ariaExpanded));
      if (ok) {
        passed += 1;
      } else {
        const msg = !el ? "element not found" : `expected aria-expanded="${a.ariaExpanded}"`;
        failures.push({ selector: a.selector, message: msg });
      }
    } else if (a.type === "aria-checked") {
      const actual = el?.getAttribute?.("aria-checked");
      const ok = el && (a.ariaChecked == null || String(actual) === String(a.ariaChecked));
      if (ok) {
        passed += 1;
      } else {
        const msg = !el ? "element not found" : `expected aria-checked="${a.ariaChecked}"`;
        failures.push({ selector: a.selector, message: msg });
      }
    }
  }
  return { passed, total: deduped.length, failures };
};
o.exportTest = (recording, options = {}) => {
  const delay = options.delay !== void 0 ? options.delay : 16;
  const extensionExport = options.extensionExport === true;
  const recordingData = {
    actions: recording.actions,
    assertions: recording.assertions || [],
    observeRoot: recording.observeRoot || null
  };
  const rootVar = recording.observeRoot ? `(o.D.querySelector('${recording.observeRoot.replace(/'/g, "\\'")}') || o.D.body)` : "o.D.body";
  const getEl = (a) => {
    if (a.listSelector != null && a.targetIndex != null) {
      const listSel = JSON.stringify(a.listSelector);
      const useItem = a.target === a.listSelector;
      const targetSel = useItem ? listSel : JSON.stringify(a.target);
      return `    const items = o.D.querySelectorAll(${listSel});
    const item = items[${a.targetIndex}];
    let el = null;
    if (item) { el = ${useItem ? "item" : `item.querySelector(${targetSel}) || item`}; }`;
    }
    return `    const el = o.D.querySelector(${JSON.stringify(a.target)});`;
  };
  const endSuffix = delay > 0 ? `
    await o.sleep(${delay});
    return true;
` : ` return true;
`;
  const stepFn = delay > 0 ? "async () =>" : "() =>";
  const steps = [];
  for (let i = 0; i < recording.actions.length; i++) {
    const a = recording.actions[i];
    let body;
    if (a.type === "scroll") {
      body = `    window.scrollTo(0, ${a.scrollY || 0});${endSuffix}`;
    } else if (a.type === "input" || a.type === "change") {
      body = (a.value !== void 0 ? `    el.value = ${JSON.stringify(a.value)};
` : "") + (a.checked !== void 0 ? `    el.checked = ${a.checked};
` : "") + `    el.dispatchEvent(new Event('${a.type}', {bubbles:true}));${endSuffix}`;
    } else if (a.type === "submit") {
      body = `    (el.requestSubmit && el.requestSubmit()) || el.submit();${endSuffix}`;
    } else if (a.type === "keydown") {
      body = `    el.dispatchEvent(new KeyboardEvent('keydown', {key:${JSON.stringify(a.key || "")}, code:${JSON.stringify(a.code || "")}, bubbles:true, cancelable:true}));${endSuffix}`;
    } else if (a.type === "focus") {
      body = `    el.focus();${endSuffix}`;
    } else if (a.type === "blur") {
      body = `    el.blur();${endSuffix}`;
    } else {
      const useNativeClick = a.type === "click";
      body = useNativeClick ? `    el.click();${endSuffix}` : `    el.dispatchEvent(new MouseEvent('${a.type}', {bubbles:true,cancelable:true}));${endSuffix}`;
    }
    const skipIfMissing = a.type === "blur" || a.type === "focus";
    steps.push(
      `  ['${a.type} on ${a.target}', ${stepFn} {
` + getEl(a) + `
    if (!el && '${a.type}' !== 'scroll') { if (${skipIfMissing}) return true; return 'element not found: ${a.target.replace(/'/g, "\\'")}'; }
` + body + `  }]`
    );
    const assertsForAction = (recording.assertions || []).filter((x) => x.actionIdx === i);
    if (assertsForAction.length > 0) {
      steps.push(
        `  ['assert after ${a.type}', () => {
    const r = o.runRecordingAssertions(recordingData, ${rootVar}, ${i});
    return r.passed === r.total ? true : r.failures.map(f => f.selector + ': ' + f.message).join('; ');
  }]`
      );
    }
  }
  const mocksStr = Object.keys(recording.mocks || {}).length ? JSON.stringify(recording.mocks, null, 2) : "{}";
  const header = `// Auto-generated by o.exportTest() \u2014 review and anonymize mocks before committing
const recordingMocks = ${mocksStr};
const recordingData = { actions: ${JSON.stringify(recording.actions)}, assertions: ${JSON.stringify(recording.assertions || [])}, observeRoot: ${JSON.stringify(recording.observeRoot || null)} };

`;
  const manualLine = `  // Add manual checks: ['Manual: label', () => o.testConfirm('label', ['item1'])],`;
  if (extensionExport) {
    return header + `const __objsExtensionTestRun = o.test('Recorded test',
${steps.join(",\n")},
${manualLine}
{ sync: true }, () => {
  // teardown
});
`;
  }
  return header + `o.addTest('Recorded test', [
${steps.join(",\n")}
${manualLine}
], () => {
  // teardown
});
`;
};
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
  const routes = Object.values(recording.mocks).map((mock) => {
    let urlPath = mock.url;
    try {
      urlPath = new URL(mock.url).pathname || urlPath;
    } catch (_e) {
    }
    if (!urlPath.startsWith("/")) urlPath = "/" + urlPath;
    const respBody = JSON.stringify(mock.response);
    const reqBody = JSON.stringify(mock.request);
    const method = (mock.method || "GET").toUpperCase();
    let verify = `    if (route.request().method() !== ${JSON.stringify(method)}) { await route.continue(); return; }
`;
    if (mock.request != null && (method === "POST" || method === "PUT" || method === "PATCH")) {
      verify += `    const postData = route.request().postData();
    const body = (() => { try { return JSON.parse(postData || '{}'); } catch { return {}; } })();
    expect(body).toEqual(${reqBody});
`;
    }
    return `  await page.route('**${urlPath}', async route => {
` + verify + `    await route.fulfill({ status: ${mock.status || 200}, contentType: 'application/json',
      body: JSON.stringify(${respBody}) });
  });`;
  }).join("\n");
  const sd = Object.assign(
    {
      click: 100,
      mouseover: 50,
      scroll: 30,
      input: 50,
      change: 50,
      submit: 100,
      keydown: 50,
      focus: 50,
      blur: 50
    },
    recording.stepDelays || {}
  );
  const steps = recording.actions.map((action, i) => {
    const loc = action.listSelector != null && action.targetIndex != null ? action.target !== action.listSelector ? `page.locator(${JSON.stringify(action.listSelector)}).nth(${action.targetIndex}).locator(${JSON.stringify(action.target)})` : `page.locator(${JSON.stringify(action.listSelector)}).nth(${action.targetIndex})` : `page.locator(${JSON.stringify(action.target)})`;
    const wait = `  await page.waitForTimeout(${sd[action.type] || 50});`;
    let step;
    if (action.type === "scroll") {
      step = `  await page.evaluate(() => window.scrollTo(0, ${action.scrollY || 0}));`;
    } else if (action.type === "mouseover") {
      step = `  await ${loc}.hover();
  // Pure CSS :hover \u2014 no DOM mutation to assert.
  // Fix: toggle a class in a mouseover handler, or add a page.screenshot() visual check.`;
    } else if (action.type === "input") {
      step = `  await ${loc}.fill(${JSON.stringify(action.value || "")});`;
    } else if (action.type === "change") {
      const tt = action.targetType || "";
      if (tt.indexOf(":checkbox") !== -1 || tt.indexOf(":radio") !== -1) {
        const on = action.checked !== void 0 ? action.checked : action.value === "true" || action.value === "on";
        step = `  await ${loc}.${on ? "check" : "uncheck"}();`;
      } else if (tt.indexOf("select") !== -1) {
        step = `  await ${loc}.selectOption(${JSON.stringify(action.value || "")});`;
      } else {
        step = `  await ${loc}.fill(${JSON.stringify(action.value || "")});`;
      }
    } else if (action.type === "submit") {
      step = `  await ${loc}.evaluate((el) => el.requestSubmit?.() || el.submit());`;
    } else if (action.type === "keydown") {
      const key = action.key || "";
      step = key === "Enter" ? `  await ${loc}.press("Enter");` : key ? `  await ${loc}.press(${JSON.stringify(key)});` : `  await ${loc}.press(${JSON.stringify(action.code || "")});`;
    } else if (action.type === "focus") {
      step = `  if (await ${loc}.count() > 0) await ${loc}.focus();`;
    } else if (action.type === "blur") {
      step = `  if (await ${loc}.count() > 0) await ${loc}.blur();`;
    } else {
      step = `  await ${loc}.click();`;
    }
    const asserts = (recording.assertions || []).filter((a) => a.actionIdx === i).filter(
      (a, j, arr) => arr.findIndex(
        (x) => x.selector === a.selector && x.type === a.type && x.index === a.index
      ) === j
    ).map((a) => {
      const aLoc = a.listSelector != null && a.index != null ? a.selector !== a.listSelector ? `page.locator(${JSON.stringify(a.listSelector)}).nth(${a.index}).locator(${JSON.stringify(a.selector)})` : `page.locator(${JSON.stringify(a.listSelector)}).nth(${a.index})` : `page.locator(${JSON.stringify(a.selector)})`;
      if (a.type === "visible") {
        let s = `  await expect(${aLoc}).toBeVisible();`;
        if (a.text)
          s += `
  await expect(${aLoc}).toContainText(${JSON.stringify(a.text)});`;
        return s;
      }
      if (a.type === "class") {
        const classes = (a.className || "").trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0)
          return classes.map((c) => `  await expect(${aLoc}).toHaveClass(${JSON.stringify(c)});`).join("\n");
        return `  // class on ${a.selector} (no specific classes asserted)`;
      }
      if (a.type === "style") {
        const style = (a.style || "").trim();
        if (style) {
          const m = style.match(/(\w+)\s*:\s*([^;]+)/);
          if (m)
            return `  await expect(${aLoc}).toHaveCSS(${JSON.stringify(m[1])}, ${JSON.stringify(m[2].trim())});`;
          return `  await expect(${aLoc}).toHaveAttribute("style", ${JSON.stringify(style)});`;
        }
        return "";
      }
      if (a.type === "hidden") {
        return a.hidden ? `  await expect(${aLoc}).toBeHidden();` : `  await expect(${aLoc}).toBeVisible();`;
      }
      if (a.type === "disabled") {
        return a.disabled ? `  await expect(${aLoc}).toBeDisabled();` : `  await expect(${aLoc}).toBeEnabled();`;
      }
      if (a.type === "aria-expanded" && a.ariaExpanded != null) {
        return `  await expect(${aLoc}).toHaveAttribute("aria-expanded", ${JSON.stringify(String(a.ariaExpanded))});`;
      }
      if (a.type === "aria-checked" && a.ariaChecked != null) {
        return `  await expect(${aLoc}).toHaveAttribute("aria-checked", ${JSON.stringify(String(a.ariaChecked))});`;
      }
      return "";
    }).filter(Boolean).join("\n");
    return step + "\n" + wait + (asserts ? "\n" + asserts : "");
  }).join("\n");
  const hasAutoAssertions = (recording.assertions || []).length > 0;
  const wsEvents = recording.websocketEvents || [];
  const hasWsEvents = wsEvents.length > 0 && wsEvents.some((c) => c.messages?.length > 0);
  const wsSetup = hasWsEvents ? `  const wsCollected = [];
  page.on('websocket', ws => {
    ws.on('framereceived', ev => wsCollected.push({ dir: 'in', payload: typeof ev.payload === 'string' ? ev.payload : String(ev.payload) }));
    ws.on('framesent', ev => wsCollected.push({ dir: 'out', payload: typeof ev.payload === 'string' ? ev.payload : String(ev.payload) }));
  });

` : "";
  const wsAssertions = hasWsEvents ? wsEvents.flatMap((conn) => (conn.messages || []).map((msg) => ({ dir: msg.dir, data: msg.data }))).map(
    (msg) => `  expect(wsCollected).toContainEqual({ dir: ${JSON.stringify(msg.dir)}, payload: ${JSON.stringify(msg.data)} });`
  ).join("\n") + "\n\n" : "";
  return `// Auto-generated by o.exportPlaywrightTest() \u2014 review and anonymize mocks before committing
// Prerequisites: npm install @playwright/test && npx playwright install chromium
// Run: npx playwright test recorded.spec.ts
import { test, expect } from '@playwright/test';

test(${JSON.stringify(testName)}, async ({ page }) => {
` + (routes ? `  // Network mocks \u2014 edit/anonymize before committing
` + routes + "\n\n" : "") + wsSetup + `  // Set baseURL in playwright.config.ts: { use: { baseURL: 'https://staging.example.com' } }
  await page.goto(${JSON.stringify(baseUrl)});

` + (steps ? steps + "\n\n" : "") + (wsAssertions ? `  // WebSocket verifications
` + wsAssertions : "") + (!hasAutoAssertions && !hasWsEvents ? `  // TODO: Add assertions before committing, e.g.:
  // await expect(page.locator('[data-qa="success-panel"]')).toBeVisible();
  // await expect(page).toHaveURL(/\\/confirmation/);
  // await expect(page.locator('[data-qa="error-banner"]')).not.toBeVisible();
` : hasAutoAssertions || hasWsEvents ? `  // Auto-generated assertions above \u2014 review for correctness before committing
` : "") + `});
`;
};
o.playRecording = (recording, opts = {}) => {
  const isOptions = opts && typeof opts === "object" && (opts.runAssertions !== void 0 || opts.root !== void 0 || opts.manualChecks !== void 0 || opts.actionDelay !== void 0 || opts.skipWebSocketMock !== void 0 || opts.skipNetworkMocks !== void 0 || opts.recordingAssertionDebug !== void 0 || opts.strictPlay !== void 0 || opts.strictAssertions !== void 0 || opts.strictNetwork !== void 0 || opts.strictWebSocket !== void 0 || opts.strictRemoved !== void 0 || opts.onComplete !== void 0);
  const mockOverrides = isOptions ? opts.mockOverrides || {} : opts;
  const runAssertions = isOptions && opts.runAssertions;
  const rootOpt = isOptions ? opts.root : void 0;
  const manualChecks = isOptions && opts.manualChecks || [];
  const actionDelay = isOptions && opts.actionDelay !== void 0 ? opts.actionDelay : 16;
  const skipWebSocketMock = isOptions && opts.skipWebSocketMock;
  const skipNetworkMocks = isOptions && opts.skipNetworkMocks;
  if (isOptions && opts.recordingAssertionDebug !== void 0) {
    o.recordingAssertionDebug = !!opts.recordingAssertionDebug;
  }
  const sc = recording.strictCapture || {};
  const strictPlay = isOptions && opts.strictPlay === true;
  const strictAssertions = isOptions && opts.strictAssertions !== void 0 ? !!opts.strictAssertions : strictPlay ? true : !!sc.assertions;
  const strictNetwork = isOptions && opts.strictNetwork !== void 0 ? !!opts.strictNetwork : strictPlay ? true : !!sc.network;
  const strictWebSocket = isOptions && opts.strictWebSocket !== void 0 ? !!opts.strictWebSocket : strictPlay ? true : !!sc.websocket;
  const strictRemoved = isOptions && opts.strictRemoved !== void 0 ? !!opts.strictRemoved : strictAssertions;
  const parseBodyLikeRecorder = (body) => {
    if (body == null || body === "") return void 0;
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch (_e) {
        return body;
      }
    }
    return body;
  };
  const mockRequestMatchesLive = (recordedReq, liveBody) => {
    const live = parseBodyLikeRecorder(liveBody);
    if (recordedReq === live) return true;
    if (recordedReq == null && live == null) return true;
    if (recordedReq == null || live == null) return false;
    if (typeof recordedReq === "object" && typeof live === "object")
      return JSON.stringify(recordedReq) === JSON.stringify(live);
    return String(recordedReq) === String(live);
  };
  const normWsData = (s) => String(s || "").trim().replace(/\s+/g, " ");
  const allMocks = Object.assign({}, recording.mocks, mockOverrides);
  const origFetch = window.fetch;
  const origXHROpen = XMLHttpRequest.prototype.open;
  const origXHRSend = XMLHttpRequest.prototype.send;
  if (!skipNetworkMocks) {
    window.fetch = (url, fetchOpts = {}) => {
      const method = (fetchOpts.method || "GET").toUpperCase();
      const key = method + ":" + url;
      if (allMocks[key]) {
        const mock = allMocks[key];
        if (strictNetwork && o.C(mock, "request") && !mockRequestMatchesLive(mock.request, fetchOpts.body)) {
          return Promise.reject(
            new Error(
              "[Objs playRecording] strictNetwork: request body does not match recording for " + key
            )
          );
        }
        const body = typeof mock.response === "string" ? mock.response : JSON.stringify(mock.response);
        return Promise.resolve(new Response(body, { status: mock.status || 200 }));
      }
      return origFetch(url, fetchOpts);
    };
    XMLHttpRequest.prototype.open = function(method, url) {
      this._oMethod = (method || "GET").toUpperCase();
      this._oUrl = url;
      return origXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      const key = (xhr._oMethod || "GET") + ":" + (xhr._oUrl || "");
      const mock = allMocks[key];
      if (mock) {
        if (strictNetwork && o.C(mock, "request") && !mockRequestMatchesLive(mock.request, body)) {
          setTimeout(() => {
            xhr.readyState = 4;
            xhr.status = 0;
            xhr.statusText = "Objs strictNetwork mismatch";
            xhr.dispatchEvent(new Event("readystatechange"));
            xhr.dispatchEvent(new Event("error"));
          }, 0);
          return;
        }
        const respBody = typeof mock.response === "string" ? mock.response : JSON.stringify(mock.response);
        setTimeout(() => {
          xhr.readyState = 4;
          xhr.status = mock.status || 200;
          xhr.statusText = "OK";
          xhr.responseText = respBody;
          xhr.response = respBody;
          xhr.dispatchEvent(new Event("readystatechange"));
          xhr.dispatchEvent(new Event("load"));
        }, 0);
        return;
      }
      return origXHRSend.apply(this, arguments);
    };
  }
  let origWebSocket = null;
  const wsEvents = recording.websocketEvents || [];
  const useWsMock = !skipWebSocketMock && wsEvents.length > 0 && wsEvents.some((e) => e.messages && e.messages.length > 0);
  if (useWsMock && typeof window.WebSocket === "function") {
    origWebSocket = window.WebSocket;
    let wsConsumeIdx = 0;
    const normalizeWsUrl = (u) => {
      const s = typeof u === "string" ? u : String(u);
      try {
        return new URL(s, window.location.href).href;
      } catch (_e) {
        return s;
      }
    };
    const takeNextRecorded = (urlStr) => {
      const norm = normalizeWsUrl(urlStr);
      for (let i = wsConsumeIdx; i < wsEvents.length; i++) {
        if (normalizeWsUrl(wsEvents[i].url) === norm) {
          wsConsumeIdx = i + 1;
          return wsEvents[i];
        }
      }
      for (let i = wsConsumeIdx; i < wsEvents.length; i++) {
        if (String(wsEvents[i].url) === String(urlStr)) {
          wsConsumeIdx = i + 1;
          return wsEvents[i];
        }
      }
      return null;
    };
    const C = origWebSocket;
    class O_MockWebSocket extends EventTarget {
      constructor(url, protocols, recorded) {
        super();
        const urlStr = typeof url === "string" ? url : String(url);
        this.url = urlStr;
        this.readyState = C.CONNECTING;
        const p = protocols;
        this.protocol = Array.isArray(p) ? p[0] || "" : p ? String(p) : "";
        this.extensions = "";
        this.binaryType = "blob";
        this._messages = (recorded.messages || []).slice();
        this._pos = 0;
        const self = this;
        setTimeout(() => {
          if (self.readyState === C.CLOSED) return;
          self.readyState = C.OPEN;
          self._dispatchOpen();
          self._drainInbound();
        }, 0);
      }
      _dispatchOpen() {
        const ev = new Event("open");
        this.dispatchEvent(ev);
        if (typeof this.onopen === "function") this.onopen(ev);
      }
      _dispatchMessage(data) {
        const ev = new MessageEvent("message", { data });
        this.dispatchEvent(ev);
        if (typeof this.onmessage === "function") this.onmessage(ev);
      }
      _drainInbound() {
        while (this._pos < this._messages.length && this._messages[this._pos].dir === "in") {
          const m = this._messages[this._pos++];
          this._dispatchMessage(m.data);
        }
      }
      send(data) {
        if (this.readyState !== C.OPEN) {
          const err = typeof DOMException !== "undefined" ? new DOMException("Still in CONNECTING state.", "InvalidStateError") : new Error("InvalidStateError");
          throw err;
        }
        if (this._pos >= this._messages.length) {
          if (strictWebSocket) {
            throw new Error(
              "[Objs playRecording] strictWebSocket: unexpected send() after recorded frames exhausted"
            );
          }
          this._drainInbound();
          return;
        }
        const next = this._messages[this._pos];
        if (next.dir === "out") {
          if (strictWebSocket) {
            const got = typeof data === "string" ? data : String(data);
            const exp = String(next.data != null ? next.data : "");
            if (normWsData(got) !== normWsData(exp)) {
              throw new Error(
                "[Objs playRecording] strictWebSocket: outbound frame mismatch"
              );
            }
          }
          this._pos++;
        }
        this._drainInbound();
      }
      close(code, reason) {
        if (this.readyState === C.CLOSING || this.readyState === C.CLOSED) return;
        this.readyState = C.CLOSING;
        const self = this;
        setTimeout(() => {
          self.readyState = C.CLOSED;
          const ev = typeof CloseEvent !== "undefined" ? new CloseEvent("close", {
            code: code !== void 0 ? code : 1e3,
            reason: reason !== void 0 ? String(reason) : "",
            wasClean: true
          }) : new Event("close");
          self.dispatchEvent(ev);
          if (typeof self.onclose === "function") self.onclose(ev);
        }, 0);
      }
    }
    const MockWebSocketCtor = function MockWebSocketCtor2(url, protocols) {
      const urlStr = typeof url === "string" ? url : String(url);
      const rec = takeNextRecorded(urlStr);
      if (!rec || !rec.messages || rec.messages.length === 0) {
        return new origWebSocket(url, protocols);
      }
      return new O_MockWebSocket(url, protocols, rec);
    };
    MockWebSocketCtor.CONNECTING = C.CONNECTING;
    MockWebSocketCtor.OPEN = C.OPEN;
    MockWebSocketCtor.CLOSING = C.CLOSING;
    MockWebSocketCtor.CLOSED = C.CLOSED;
    window.WebSocket = MockWebSocketCtor;
  }
  const resolveRoot = () => {
    if (rootOpt != null) {
      return typeof rootOpt === "string" ? o.D.querySelector(rootOpt) || o.D.body : rootOpt;
    }
    const sel = recording.observeRoot;
    return sel ? o.D.querySelector(sel) || o.D.body : o.D.body;
  };
  const rootEl = runAssertions ? resolveRoot() : null;
  const actionScope = rootOpt != null ? resolveRoot() : o.D;
  const actions = recording.actions;
  const assertions = recording.assertions || [];
  const assertionsByAction = {};
  for (const a of assertions) {
    const k = a.actionIdx;
    if (!assertionsByAction[k]) assertionsByAction[k] = [];
    assertionsByAction[k].push(a);
  }
  if (o.recordingAssertionDebug && runAssertions && typeof console !== "undefined" && console.log) {
    const summary = actions.map((act, i) => ({
      i,
      action: act.type + " " + (act.target || ""),
      assertions: (assertionsByAction[i] || []).length,
      assertionDetails: (assertionsByAction[i] || []).map((x) => ({
        type: x.type,
        index: x.index,
        text: (x.text || "").slice(0, 30)
      }))
    }));
    console.log("[playRecording] assertions by action:", summary);
  }
  const manualByAction = {};
  for (const mc of manualChecks) {
    const k = mc.afterAction;
    if (!manualByAction[k]) manualByAction[k] = [];
    manualByAction[k].push(mc);
  }
  const testCases = [];
  let assertionAccum = { passed: 0, total: 0, failures: [] };
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    testCases.push([
      `${action.type} on ${action.target}`,
      async () => {
        let el = null;
        const scope = actionScope;
        if (action.target) {
          if (action.listSelector != null && action.targetIndex != null) {
            const items = scope.querySelectorAll(action.listSelector);
            const item = items[action.targetIndex];
            if (item) {
              el = action.target !== action.listSelector ? item.querySelector(action.target) : item;
              if (!el && action.target !== action.listSelector) el = item;
            }
          } else {
            el = scope.querySelector(action.target);
          }
        }
        if (!el && action.type !== "scroll") {
          if (action.type === "blur" || action.type === "focus") return true;
          return `element not found: ${action.target}`;
        }
        if (action.type === "scroll") {
          window.scrollTo(0, action.scrollY || 0);
        } else if (action.type === "input" || action.type === "change") {
          if (action.value !== void 0) el.value = action.value;
          if (action.checked !== void 0) el.checked = action.checked;
          el.dispatchEvent(new Event(action.type, { bubbles: true }));
        } else if (action.type === "submit") {
          if (typeof el.requestSubmit === "function") el.requestSubmit();
          else el.submit();
        } else if (action.type === "keydown") {
          el.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: action.key || "",
              code: action.code || "",
              bubbles: true,
              cancelable: true
            })
          );
        } else if (action.type === "focus") {
          el.focus();
        } else if (action.type === "blur") {
          el.blur();
        } else {
          if (action.type === "click") {
            el.click();
          } else {
            el.dispatchEvent(
              new MouseEvent(action.type, { bubbles: true, cancelable: true })
            );
          }
        }
        if (actionDelay > 0) await o.sleep(actionDelay);
        return true;
      }
    ]);
    const asserted = assertionsByAction[i];
    if (runAssertions && asserted && asserted.length > 0) {
      testCases.push([
        `assert after ${action.type}`,
        () => new Promise((resolve) => {
          const run = () => {
            const r = o.runRecordingAssertions(recording, rootEl, i, {
              assertions: asserted,
              removedElements: recording.removedElements,
              strictAssertions,
              strictRemoved
            });
            assertionAccum.passed += r.passed;
            assertionAccum.total += r.total;
            assertionAccum.failures.push(...r.failures);
            resolve(
              r.passed === r.total ? true : r.failures.map((f) => f.selector + ": " + f.message).join("; ")
            );
          };
          requestAnimationFrame(() => requestAnimationFrame(run));
        })
      ]);
    }
    for (const mc of manualByAction[i] || []) {
      testCases.push([
        `Manual: ${mc.label}`,
        () => typeof o.testConfirm === "function" ? o.testConfirm(mc.label, mc.items || []) : { ok: true }
      ]);
    }
  }
  for (const mc of manualByAction["end"] || []) {
    testCases.push([
      `Manual: ${mc.label}`,
      () => typeof o.testConfirm === "function" ? o.testConfirm(mc.label, mc.items || []) : { ok: true }
    ]);
  }
  const onComplete = isOptions && opts.onComplete;
  const testId = o.test("Recorded playback", ...testCases, { sync: true }, (testId2) => {
    window.fetch = origFetch;
    XMLHttpRequest.prototype.open = origXHROpen;
    XMLHttpRequest.prototype.send = origXHRSend;
    if (origWebSocket) window.WebSocket = origWebSocket;
    const assertionResult = runAssertions && assertions.length > 0 ? assertionAccum : void 0;
    if (assertionResult?.failures?.length > 0) {
      o.tRes[testId2] = false;
      const failLines = assertionResult.failures.map((f) => `${f.selector}: ${f.message}`).join("; ");
      const suffix = o.tStyled ? o.tPre + o.tXx + "Assertions failed: " + failLines + o.tDc : "\n\u2718 Assertions failed: " + failLines;
      o.tLog[testId2] = (o.tLog[testId2] || "") + suffix;
    }
    if (typeof onComplete === "function") onComplete(assertionResult);
  });
  return runAssertions ? { testId } : testId;
};
o.testOverlay = () => {
  const btnId = "o-test-overlay-btn";
  const panelId = "o-test-overlay-panel";
  if (o("#" + btnId).el) {
    return;
  }
  const scrollId = "o-test-overlay-scroll";
  const exportBtnId = "o-test-export-objs";
  const copyBtnId = "o-test-copy-txt";
  const btnBarStyle = "padding:6px 10px;background:#334155;color:#e2e8f0;border:none;border-radius:6px;cursor:pointer;font-size:12px;";
  const buildListPlainText = () => o.tLog.map((log, i) => (log != null && log !== "" ? String(log) : "Test #" + i) + (o.tRes[i] ? " \u2713" : " \u2717")).join("\n\n");
  const updatePanel = () => {
    const scroll = o("#" + scrollId);
    if (!scroll.el) return;
    let html = "";
    o.tLog.forEach((log, i) => {
      const ok = o.tRes[i];
      html += `<div style="margin:2px 0;padding:2px 4px;border-radius:3px;background:${ok ? "#14532d" : "#450a0a"};color:${ok ? "#86efac" : "#fca5a5"};font-size:11px;white-space:pre-wrap">${log || "Test #" + i}</div>`;
    });
    scroll.html(html);
  };
  const innerHTML = `<div class="o-test-overlay-root" style="display:flex;flex-direction:column;gap:4px;max-height:min(88vh,560px);overflow:hidden;"><div style="display:flex;align-items:center;gap:12px;flex-shrink:0;"><span class="o-test-overlay-summary" style="flex:1;font-size:13px;cursor:grab;">Tests: 0/0</span><button type="button" class="o-test-overlay-toggle" style="${btnBarStyle}">List</button><button type="button" class="o-test-overlay-close" style="padding:4px 8px;background:transparent;color:#94a3b8;border:none;border-radius:4px;cursor:pointer;font-size:16px;line-height:1;" title="Close">\xD7</button></div><div id="${panelId}" style="display:none;flex-direction:column;margin-top:4px;max-height:min(52vh,420px);background:#0a0f1e;border:1px solid #1e293b;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.35);overflow:hidden;"><div id="${scrollId}" style="box-sizing:border-box;height:min(48vh,380px);overflow-y:scroll;padding:8px;font-size:11px;user-select:text;cursor:text;"></div><div id="o-test-overlay-footer" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;border-top:1px solid #1e293b;background:#0f172a;flex-shrink:0;"><button type="button" id="${exportBtnId}" class="o-test-overlay-export-btn" style="${btnBarStyle}">Export (objs)</button><button type="button" id="${copyBtnId}" class="o-test-overlay-export-btn" style="${btnBarStyle}">Copy (txt)</button></div></div></div>`;
  const box = o.overlay({
    innerHTML,
    removeExisting: false,
    className: "o-test-overlay",
    id: btnId,
    excludeDragSelector: ".o-test-overlay-close, .o-test-overlay-toggle, #" + panelId + ", #" + scrollId + ", #o-test-overlay-footer, .o-test-overlay-export-btn"
  });
  o("#" + exportBtnId).on("click", () => {
    const data = JSON.stringify({ results: o.tRes, logs: o.tLog }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = o.D.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "objs-test-results.json";
    a.click();
  });
  o("#" + copyBtnId).on("click", () => {
    const text = buildListPlainText();
    const write = () => {
      const ta = o.D.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      o.D.body.appendChild(ta);
      ta.select();
      o.D.execCommand("copy");
      ta.remove();
    };
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(write);
    } else {
      write();
    }
  });
  const refreshSummary = () => {
    const summary = o(".o-test-overlay-summary");
    if (summary.els.length)
      summary.innerText(`Tests: ${o.tRes.filter(Boolean).length}/${o.tRes.length}`);
  };
  box.first(".o-test-overlay-toggle").on("click", () => {
    const panel = o("#" + panelId);
    if (!panel.el) return;
    const isOpen = panel.el.style.display !== "none";
    if (isOpen) {
      panel.el.style.display = "none";
    } else {
      panel.el.style.display = "flex";
      updatePanel();
    }
  });
  box.first(".o-test-overlay-close").on("click", () => {
    box._overlayCleanup();
  });
  o.testOverlay.showPanel = () => {
    const panel = o("#" + panelId);
    if (!panel.el) return;
    panel.el.style.display = "flex";
    updatePanel();
    refreshSummary();
  };
  if (!o._testOverlayBase) o._testOverlayBase = o.test;
  o.test = (...args) => {
    const id = o._testOverlayBase(...args);
    const origFn = o.tFns[id];
    o.tFns[id] = (n) => {
      if (typeof origFn === "function") origFn(n);
      const panel = o("#" + panelId);
      if (panel.el && panel.el.style.display !== "none") updatePanel();
      refreshSummary();
    };
    return id;
  };
};
o.overlay = (opts = {}) => {
  const {
    innerHTML,
    onClose,
    timeout,
    excludeDragSelector,
    removeExisting = true,
    className = "o-overlay-common",
    id
  } = opts;
  if (removeExisting) o("." + className).remove();
  else if (id && o("#" + id).el) return o("#" + id);
  const overlayStyle = {
    position: "fixed",
    left: "50%",
    bottom: "50px",
    transform: "translateX(-50%)",
    "z-index": "999999",
    width: "fit-content",
    "max-width": "min(90vw, 420px)",
    "font-family": "system-ui,sans-serif",
    "user-select": "text"
  };
  const countdownId = "o-overlay-countdown";
  const barHtml = `<div class="o-overlay-bar" style="display:flex;flex-direction:column;align-items:stretch;padding:10px 14px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;font-size:14px;min-width:200px;max-height:90vh;overflow-y:auto;">` + innerHTML + (timeout ? `<div id="${countdownId}" style="margin-top:6px;font-size:11px;color:#94a3b8;"></div>` : "") + "</div>";
  const box = o.initState({
    tag: "div",
    className,
    id: id || void 0,
    style: "position:fixed;left:50%;bottom:50px;transform:translateX(-50%);z-index:999999;width:fit-content;max-width:min(90vw,420px);font-family:system-ui,sans-serif;user-select:text;",
    html: barHtml
  }).appendInside("body");
  const applyStyle = () => box.css(overlayStyle);
  let drag = null;
  const onMove = (e) => {
    if (!drag) return;
    overlayStyle.left = drag.left + (e.clientX - drag.startX) + "px";
    overlayStyle.top = drag.top + (e.clientY - drag.startY) + "px";
    delete overlayStyle.bottom;
    overlayStyle.transform = "none";
    applyStyle();
  };
  const onUp = () => {
    if (drag) {
      delete overlayStyle.cursor;
      applyStyle();
    }
    drag = null;
  };
  box.on("mousedown", (e) => {
    if (excludeDragSelector && e.target.closest(excludeDragSelector)) return;
    const r = box.el.getBoundingClientRect();
    drag = { startX: e.clientX, startY: e.clientY, left: r.left, top: r.top };
    overlayStyle.cursor = "grabbing";
    applyStyle();
  });
  o.D.addEventListener("mousemove", onMove);
  o.D.addEventListener("mouseup", onUp);
  let timerId;
  const cleanup = () => {
    o.D.removeEventListener("mousemove", onMove);
    o.D.removeEventListener("mouseup", onUp);
    if (timerId) clearInterval(timerId);
    box.remove();
  };
  if (timeout && timeout > 0) {
    let remaining = Math.ceil(timeout / 1e3);
    const cd = o("#" + countdownId);
    if (cd.el) cd.el.textContent = remaining ? `Continue in ${remaining}s` : "";
    timerId = setInterval(() => {
      remaining -= 1;
      if (cd.el) cd.el.textContent = remaining > 0 ? `Continue in ${remaining}s` : "";
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        cleanup();
        if (typeof onClose === "function") onClose({ ok: false, errors: ["timeout"] });
      }
    }, 1e3);
  }
  box._overlayCleanup = cleanup;
  box._overlayOnClose = onClose;
  return box;
};
o.testConfirm = (label, items = [], opts = {}) => new Promise((resolve) => {
  const btnLabel = opts.confirm || "Continue";
  const hasCheckboxes = items.length > 0;
  const btnBg = hasCheckboxes ? "#dc2626" : "#2563eb";
  const itemIds = items.map((_, idx) => "o-tc-cb-" + idx);
  const checkboxStyle = `.o-tc-item-cb{appearance:none;-webkit-appearance:none;width:16px;height:16px;border:2px solid #ef4444;border-radius:3px;background:#fef2f2;flex-shrink:0;cursor:pointer;}.o-tc-item-cb:checked{border-color:#22c55e;background:#22c55e;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-size:12px 12px;background-position:center;}`;
  const itemsHtml = hasCheckboxes ? `<style>${checkboxStyle}</style><ul class="o-tc-list" style="margin:8px 0 0;padding:0;list-style:none;font-size:13px;color:#cbd5e1;cursor:grab;">` + items.map(
    (i, idx) => `<li style="margin-bottom:4px;"><label for="${itemIds[idx]}" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;"><input type="checkbox" id="${itemIds[idx]}" class="o-tc-item-cb"> <span>${i}</span></label></li>`
  ).join("") + "</ul>" : "";
  const innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><span class="o-tc-label" style="flex:1;cursor:grab;">${label}: Paused</span><button type="button" class="o-tc-ok" style="padding:6px 14px;background:${btnBg};color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;flex-shrink:0;">${btnLabel}</button></div>` + itemsHtml;
  const box = o.overlay({
    innerHTML,
    timeout: opts.timeout,
    excludeDragSelector: ".o-tc-ok",
    onClose: (r) => resolve(r || { ok: true })
  });
  const okBtnStyles = {
    padding: "6px 14px",
    background: hasCheckboxes ? "#dc2626" : "#2563eb",
    color: "#fff",
    border: "none",
    "border-radius": "6px",
    "font-weight": "600",
    cursor: "pointer",
    "font-size": "13px",
    "flex-shrink": "0"
  };
  if (hasCheckboxes) {
    const okBtn = box.first(".o-tc-ok");
    const cbs = o(".o-overlay-common .o-tc-item-cb");
    const updateBtn = () => {
      const allChecked = cbs.length > 0 && cbs.els.every((el) => el.checked);
      okBtn.css({ ...okBtnStyles, background: allChecked ? "#16a34a" : "#dc2626" });
    };
    cbs.on("change", updateBtn);
  }
  box.first(".o-tc-ok").on("click", () => {
    let unchecked = [];
    if (hasCheckboxes) {
      const cbsList = o(".o-overlay-common .o-tc-item-cb");
      if (cbsList.els.length)
        cbsList.els.forEach((el, idx) => {
          if (!el.checked && items[idx] !== void 0) unchecked.push(items[idx]);
        });
    }
    box._overlayCleanup();
    resolve(unchecked.length === 0 ? { ok: true } : { ok: false, errors: unchecked });
  });
});

export { o };
export default o;
if (typeof window !== "undefined") window.o = o;
