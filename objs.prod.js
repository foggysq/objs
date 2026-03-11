/**
 * @fileoverview Objs-core library
 * @version 1.2
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
    states: [],
    isDebug: false,
    currentState: "",
    savedStates: {},
    isRoot: false,
    _parent: null
  }, ONE = 1, TWO = 2, THREE = 3, booleanType = "boolean", objectType = "object", functionType = "function", stringType = "string", numberType = "number", notEmptyStringType = "notEmptyString", undefinedType = "undefined", _reactProp = "dangerouslySetInnerHTML", u, D = o.D, start = -1, finish = 0, select = 0, ssr = typeof process !== "undefined" || o.D === o.DocumentMVP, i = 0, j = 0;
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
  };
  result.reset = o;
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
        ["html", "innerHTML"].includes(s) ? el.innerHTML = value : (
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
        const els = result.els.slice(finish, start + ONE);
        if (type(data) === objectType) {
          data.state = state;
          data["data-o-init"] = initN;
        }
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
        const rawData = props;
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
              }
              transform(el, buff, props[j ? i2 : 0]);
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
        if (creation && type(data) === objectType && data.events) {
          if (!ssr && !data.ssr) {
            initSSR();
          }
        }
      });
    });
    const renderState = states.render || states;
    if (!ssr && type(renderState) === objectType && renderState.events && renderState.ssr) {
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
  result.connect = returner((loader, state = "render", fail) => {
    typeVerify([
      [loader, [objectType]],
      [state, [notEmptyStringType]],
      [fail, [stringType, undefinedType]]
    ]);
    loader.connect(result, state, fail);
  }, "connect");
  result.getSSR = returner((initId) => {
    typeVerify([[initId, [numberType, undefinedType]]]);
    const effectiveId = initId !== void 0 ? initId : result.initID;
    if (ssr || type(initId) === undefinedType && type(result.initID) === undefinedType) {
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
    typeVerify([[i2, [numberType, undefinedType]]]);
    if (i2 === u) {
      i2 = result.length - ONE;
    }
    start = i2;
    finish = i2;
    result.el = result.els[i2];
    select = ONE;
  }, "select");
  result.all = returner(() => {
    start = result.length - ONE;
    finish = 0;
    result.el = result.els[0];
    select = 0;
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
    result.els.splice(i, ONE);
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
  o.tLog = [];
  o.tRes = [];
  o.tStatus = [];
  o.tFns = [];
  o.tShowOk = o.F;
  o.tStyled = o.F;
  o.tTime = 2e3;
  o.tests = [];
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
    if (typeof tests[num - 1] === "function") {
      o.tFns[testN2] = tests[num - 1];
      num--;
    }
    if (testSession) {
      o.tLog[testN2] = sessionStorage.getItem(`oTest-Log-${testN2}`) || "";
      o.tRes[testN2] = sessionStorage.getItem(`oTest-Res-${testN2}`) || false;
      o.tStatus[testN2] = JSON.parse(
        sessionStorage.getItem(`oTest-Status-${testN2}`) || "[]"
      );
      for (let i = 0; i < o.tStatus[testN2].length; i++) {
        if (o.tStatus[testN2]) {
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
    o.tRes[testN2] = done === num;
    row = waits ? "\u251C " : "\u2558 ";
    row += "DONE " + done + "/" + num + (waits ? ", waiting: " + waits : "");
    log(row, done + waits !== num);
    if (!waits) {
      log();
    }
    if (o.tStyled) {
      o.tLog[testN2] += o.tPre + '<div style="color:' + (done + waits !== num ? "red" : "green") + ';"><b>DONE ' + done + "/" + num + (waits ? ", waiting: " + waits : "") + "</b>" + o.tDc + o.tDc;
    } else {
      o.tLog[testN2] += row + "\n";
    }
    if (testSession) {
      sessionStorage.setItem(`oTest-Log-${testN2}`, o.tLog[testN2]);
      sessionStorage.setItem(`oTest-Res-${testN2}`, o.tRes[testN2]);
      sessionStorage.setItem(`oTest-Status-${testN2}`, JSON.stringify(o.tStatus[testN2]));
    }
    if (!waits && typeof o.tFns[testN2] === "function") {
      o.tFns[testN2](testN2);
    }
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
    if (o.tStatus[testN2][info.i] === o.U) {
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
        if (s === o.U) {
          return;
        }
        if (!s) {
          fails++;
        }
        n++;
      }
      if (sessionStorage?.getItem("oTest-Run") === testN2) {
        sessionStorage.setItem(`oTest-Log-${testN2}`, o.tLog[testN2]);
        sessionStorage.setItem(`oTest-Res-${testN2}`, o.tRes[testN2]);
        sessionStorage.setItem(`oTest-Status-${testN2}`, JSON.stringify(o.tStatus[testN2]));
        if (n < o.tests[testN2].tests.length) {
          return;
        }
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
    const m = o.measure(el);
    if (expected.w !== void 0 && Math.round(m.width) !== expected.w) {
      return `width: expected ${expected.w}, got ${Math.round(m.width)}`;
    }
    if (expected.h !== void 0 && Math.round(m.height) !== expected.h) {
      return `height: expected ${expected.h}, got ${Math.round(m.height)}`;
    }
    return true;
  };
}
o.recorder = {
  active: false,
  actions: [],
  mocks: {},
  initialData: {},
  assertions: [],
  observeRoot: null,
  _originalFetch: null,
  _listeners: [],
  _observer: null
};
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
    change: 50
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
  const observeTarget = observe && document.querySelector(observe) || document.body;
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
          if (rec.assertions.some(
            (a) => a.actionIdx === actionIdx && a.selector === sel && a.type === "visible"
          ))
            return;
          const text = node.textContent?.trim().slice(0, 80) || void 0;
          rec.assertions.push({ actionIdx, type: "visible", selector: sel, text });
        });
      }
      if (m.type === "attributes") {
        const sel = buildSelector(m.target);
        if (!sel) return;
        if (rec.assertions.some(
          (a) => a.actionIdx === actionIdx && a.selector === sel && a.type === "class"
        ))
          return;
        rec.assertions.push({
          actionIdx,
          type: "class",
          selector: sel,
          className: m.target.className
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
      "aria-checked"
    ]
  });
  const timers = {};
  listenEvents.forEach((ev) => {
    const handler = (e) => {
      const target = e.target;
      if (observe && observeTarget && target?.nodeType === 1 && !observeTarget.contains(target)) {
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
      const targetType = target?.tagName ? target.tagName.toLowerCase() + (target.type ? ":" + target.type : "") : void 0;
      const scrollY = ev === "scroll" ? window.scrollY : void 0;
      const value = ev === "input" || ev === "change" ? target?.value : void 0;
      const checked = ev === "change" && (target?.type === "checkbox" || target?.type === "radio") ? target?.checked : void 0;
      const delay = captureDebounce[ev] || 0;
      clearTimeout(timers[ev]);
      timers[ev] = setTimeout(() => {
        const action = { type: ev, target: selector, time: Date.now() };
        if (targetType) action.targetType = targetType;
        if (scrollY !== void 0) action.scrollY = scrollY;
        if (value !== void 0) action.value = value;
        if (checked !== void 0) action.checked = checked;
        rec.actions.push(action);
      }, delay);
    };
    document.addEventListener(ev, handler, true);
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
    assertions: [...rec.assertions || []],
    observeRoot: rec.observeRoot || null
  };
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
o.exportTest = (recording) => {
  const cases = recording.actions.map((a) => {
    let body;
    if (a.type === "scroll") {
      body = `    window.scrollTo(0, ${a.scrollY || 0}); return true;
`;
    } else if (a.type === "input" || a.type === "change") {
      body = (a.value !== void 0 ? `    el.value = ${JSON.stringify(a.value)};
` : "") + (a.checked !== void 0 ? `    el.checked = ${a.checked};
` : "") + `    el.dispatchEvent(new Event('${a.type}', {bubbles:true})); return true;
`;
    } else {
      const useNativeClick = a.type === "click";
      body = useNativeClick ? `    el.click(); return true;
` : `    el.dispatchEvent(new MouseEvent('${a.type}', {bubbles:true,cancelable:true})); return true;
`;
    }
    return `  ['${a.type} on ${a.target}', () => {
    const el = document.querySelector('${a.target}');
    if (!el) return 'element not found';
` + body + `  }],`;
  }).join("\n");
  const mocksStr = Object.keys(recording.mocks).length ? JSON.stringify(recording.mocks, null, 2) : "{}";
  return `// Auto-generated by o.exportTest() \u2014 review and anonymize mocks before committing
const recordingMocks = ${mocksStr};

o.addTest('Recorded test', [
${cases}
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
    const urlPath = mock.url.startsWith("/") ? mock.url : "/" + mock.url;
    const body = JSON.stringify(mock.response);
    return `  await page.route('**${urlPath}', async route => {
    await route.fulfill({ status: ${mock.status || 200}, contentType: 'application/json',
      body: JSON.stringify(${body}) });
  });`;
  }).join("\n");
  const sd = Object.assign(
    { click: 100, mouseover: 50, scroll: 30, input: 50, change: 50 },
    recording.stepDelays || {}
  );
  const steps = recording.actions.map((action, i) => {
    const loc = `page.locator('${action.target}')`;
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
    } else {
      step = `  await ${loc}.click();`;
    }
    const asserts = (recording.assertions || []).filter((a) => a.actionIdx === i).filter(
      (a, j, arr) => arr.findIndex((x) => x.selector === a.selector && x.type === a.type) === j
    ).map((a) => {
      if (a.type === "visible") {
        let s = `  await expect(page.locator(${JSON.stringify(a.selector)})).toBeVisible();`;
        if (a.text)
          s += `
  await expect(page.locator(${JSON.stringify(a.selector)})).toContainText(${JSON.stringify(a.text)});`;
        return s;
      }
      if (a.type === "class") {
        return `  // class on ${a.selector} changed to: "${a.className}"`;
      }
      return "";
    }).filter(Boolean).join("\n");
    return step + "\n" + wait + (asserts ? "\n" + asserts : "");
  }).join("\n");
  const hasAutoAssertions = (recording.assertions || []).length > 0;
  return `// Auto-generated by o.exportPlaywrightTest() \u2014 review and anonymize mocks before committing
// Prerequisites: npm install @playwright/test && npx playwright install chromium
// Run: npx playwright test recorded.spec.ts
import { test, expect } from '@playwright/test';

test(${JSON.stringify(testName)}, async ({ page }) => {
` + (routes ? `  // Network mocks \u2014 edit/anonymize before committing
` + routes + "\n\n" : "") + `  // Set baseURL in playwright.config.ts: { use: { baseURL: 'https://staging.example.com' } }
  await page.goto(${JSON.stringify(baseUrl)});

` + (steps ? steps + "\n\n" : "") + (!hasAutoAssertions ? `  // TODO: Add assertions before committing, e.g.:
  // await expect(page.locator('[data-qa="success-panel"]')).toBeVisible();
  // await expect(page).toHaveURL(/\\/confirmation/);
  // await expect(page.locator('[data-qa="error-banner"]')).not.toBeVisible();
` : `  // Auto-generated assertions above \u2014 review for correctness before committing
`) + `});
`;
};
if (__DEV__) {
  o.playRecording = (recording, mockOverrides = {}) => {
    const allMocks = Object.assign({}, recording.mocks, mockOverrides);
    const origFetch = window.fetch;
    window.fetch = (url, opts = {}) => {
      const method = (opts.method || "GET").toUpperCase();
      const key = method + ":" + url;
      if (allMocks[key]) {
        const mock = allMocks[key];
        const body = typeof mock.response === "string" ? mock.response : JSON.stringify(mock.response);
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
          if (action.value !== void 0) el.value = action.value;
          if (action.checked !== void 0) el.checked = action.checked;
          el.dispatchEvent(new Event(action.type, { bubbles: true }));
        } else {
          if (action.type === "click") {
            el.click();
          } else {
            el.dispatchEvent(
              new MouseEvent(action.type, { bubbles: true, cancelable: true })
            );
          }
        }
        return true;
      }
    ]);
    const testId = o.test("Recorded playback", ...testCases, () => {
      window.fetch = origFetch;
    });
    return testId;
  };
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
    o.initState({
      tag: "div",
      id: btnId,
      style: "position:fixed;bottom:12px;right:12px;z-index:99999;font-family:monospace;",
      html: `<button id="o-test-toggle" style="padding:6px 12px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">\u{1F9EA} Tests</button><div id="${panelId}" style="display:none;margin-top:4px;padding:8px;background:#fff;border:1px solid #ccc;border-radius:4px;max-width:420px;max-height:60vh;overflow-y:auto;box-shadow:0 2px 8px rgba(0,0,0,.15)"></div>`
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
  o.testConfirm = (label, items = [], opts = {}) => new Promise((resolve) => {
    const btnLabel = opts.confirm || "Continue";
    const hasCheckboxes = items.length > 0;
    const btnBg = hasCheckboxes ? "#dc2626" : "#2563eb";
    const itemIds = items.map((_, idx) => "o-tc-cb-" + idx);
    const checkboxStyle = `.o-tc-item-cb{appearance:none;-webkit-appearance:none;width:16px;height:16px;border:2px solid #ef4444;border-radius:3px;background:#fef2f2;flex-shrink:0;cursor:pointer;}.o-tc-item-cb:checked{border-color:#22c55e;background:#22c55e;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-size:12px 12px;background-position:center;}`;
    const itemsHtml = hasCheckboxes ? `<style>${checkboxStyle}</style><ul class="o-tc-list" style="margin:8px 0 0;padding:0;list-style:none;font-size:13px;color:#cbd5e1;">` + items.map(
      (i, idx) => `<li style="margin-bottom:4px;"><label for="${itemIds[idx]}" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;"><input type="checkbox" id="${itemIds[idx]}" class="o-tc-item-cb"> <span>${i}</span></label></li>`
    ).join("") + "</ul>" : "";
    const box = o.initState({
      tag: "div",
      className: "o-tc-overlay",
      style: "position:fixed;left:50%;bottom:50px;transform:translateX(-50%);z-index:999999;width:fit-content;max-width:min(90vw,400px);font-family:system-ui,sans-serif;cursor:grab;user-select:text;",
      html: `<div class="o-tc-bar" style="display:flex;flex-direction:column;align-items:stretch;padding:10px 14px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;font-size:14px;cursor:grab;min-width:280px;"><div style="display:flex;align-items:center;gap:12px;"><span class="o-tc-label" style="flex:1;">${label}: Paused</span><button type="button" class="o-tc-ok" style="padding:6px 14px;background:${btnBg};color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;flex-shrink:0;">${btnLabel}</button></div>` + itemsHtml + `</div>`
    }).appendInside("body");
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
      "user-select": "text"
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
          if (!el.checked && items[idx] !== void 0) unchecked.push(items[idx]);
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
}

export { o };
export default o;
if (typeof window !== "undefined") window.o = o;
