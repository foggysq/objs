# Objs
> Fast and simple JS library to develop, test, cache and optimize. You can develop new features with Objs without rewriting anything. Examples and full documentation are [here](https://fous.name/objs)

Feel free to use and share ideas for the next versions!
## Get started
Just include script or load in project by NPM (soon)
```
<script src="objs.1.0.min.js" type="text/javascript"></script>
```
```
npm ... (soon)
```
## Features
##### Develop
- Elements state control
- Store data in object itself
- Cache server rendered elements
##### Test
- Sync/async tests
- Console & HTML output
- Autotests
##### Optimize
- Separated HTML and JS logic
- Async loading JS, CSS, images
- Cache JS, CSS

## Main principles
Logic structure to create any dynamic module and controll it
To control element Objs uses states. State - it's an information how to create or change element. To create element use `render` state with html (inner HTML) and tag attributes:
```
// timer create state called render
const timerStates = {
	render: {
		class: 'timer',
		html: 'Seconds: <span>0</span>',
	}
}
```
> Default tag is `div`. Attributes `dataset` and `style` can be object type. Also, `render` could be a string like: 
`'<divclass="timer">Seconds:<span>0</span></div>'`

Then add a new state that will start counting. Number will be stored in the object itself - `self` object. So the state will be a function that gets `self`, creates a variable, increments it by interval and shows as innerHTML of `span`:
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
		setInterval(() => {
			self.n++;
			o(self).first('span').html(self.n);
		}, 1000);
	}
}
```
States are done and the last thing is to create and append element on the page. To do this - init states, render object and start timer... And also - append it: 
`o.init(timerStates).render().start().appendInside('#simpleTimer');`
> This and some more complex live examples are [HERE](https://fous.name/objs) but everywhere is the same logic: create states, some functions that changes element then init and append elements on page. States after initialization are used as `self` methods in addition to standart `on(), first(), remove()` and etc.




## License
Apache 2.0: Save author name in the file: `// Roman Torshin`
