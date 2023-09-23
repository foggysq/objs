# Objs
> Fast and simple library to increase developing speed by samples and state control, auto-tests, cache and other. You can develop new features with Objs without rewriting anything. Examples and full documentation are here: [Full Documentation](https://fous.name/objs) (sandbox and free samples are coming soon)




## Get started
Just include script or load in project by NPM
```
<script src="objs.1.0.min.js" type="text/javascript"></script>
```
```
npm i objs-core
```




## Features

#### Develop
- Samples and state control
- Store data in object itself
- Cache server rendered elements

#### Test
- Sync/async tests
- Console & HTML output
- Autotests

#### Optimize
- Separated HTML and JS logic
- Async loading JS, CSS, images
- Controlled JS and CSS cache




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
`o().attr(attribute, [value])` – sets **attribute** to **value** or removes attribute if **value** is equal to '' or returns **attribute** value if **value** is undefined. If **.select()** was not used before - returns an array of values.

`o().attrs()` – returns an array of all elements attributes, if **.select()** was used before - returns an object with values of one element.

`o().dataset([object])` – Sets dataset values due to the **object** data. It will not delete other dataset values. If **.select()** was used before - returns an object with dataset of one element or changes just one element.

`o().style(value)` – sets style attribute to [string] **value**.

`o().css(object)` – sets style attribute to [string] created from **object** elements and values, e.g. {width: '100px', 'font-family': 'Arial'}.

`o().setClass(value)` – sets class attribute to **value**.

`o().addClass(class)` – adds **class**.

`o().removeClass(class)` – removes **class**.

`o().toggleClass(class, rule)` – switch having and not having **class** by **rule**. If **rule** set **class**.

`o().haveClass(class)` – returns true if all elements have **class**.

`o().innerHTML([html])` – if **html** is set, sets innerHTML af all elements. If not set, returns array with innerHTML of each element.

`o().innerText(text)` – sets innerText for all elements.

`o().textContent(content)` – sets textContent for all elements.

#### System
`o().forEach(function)` – runs **function** with ab object as the first parameter: {o, self, i} where is o-function, self Objs object and i-index of current element.

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




## License
Apache 2.0
