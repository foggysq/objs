// @author Roman Torshin, Apache 2.0 licence
(function(globals) {
	'use strict';
	function ownKeys(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),n.push.apply(n,r)}return n}function _objectSpread(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?ownKeys(Object(n),!0).forEach(function(e){_defineProperty(t,e,n[e])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):ownKeys(Object(n)).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))})}return t}function _defineProperty(t,e,n){return(e=_toPropertyKey(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function _toPropertyKey(t){var e=_toPrimitive(t,"string");return"symbol"===_typeof(e)?e:String(e)}function _toPrimitive(t,e){if("object"!==_typeof(t)||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0!==n){var r=n.call(t,e||"default");if("object"!==_typeof(r))return r;throw TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}function _createForOfIteratorHelper(t,e){var n="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!n){if(Array.isArray(t)||(n=_unsupportedIterableToArray(t))||e&&t&&"number"==typeof t.length){n&&(t=n);var r=0,i=function t(){};return{s:i,n:function e(){return r>=t.length?{done:!0}:{done:!1,value:t[r++]}},e:function t(e){throw e},f:i}}throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var a,c=!0,s=!1;return{s:function e(){n=n.call(t)},n:function t(){var e=n.next();return c=e.done,e},e:function t(e){s=!0,a=e},f:function t(){try{c||null==n.return||n.return()}finally{if(s)throw a}}}}function _toConsumableArray(t){return _arrayWithoutHoles(t)||_iterableToArray(t)||_unsupportedIterableToArray(t)||_nonIterableSpread()}function _nonIterableSpread(){throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function _unsupportedIterableToArray(t,e){if(t){if("string"==typeof t)return _arrayLikeToArray(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);if("Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n)return Array.from(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(t,e)}}function _iterableToArray(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}function _arrayWithoutHoles(t){if(Array.isArray(t))return _arrayLikeToArray(t)}function _arrayLikeToArray(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}function _typeof(t){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}var o=function t(e){var n={els:[],ie:{}},r="object",i="function",a=void 0,c=document,s=-1,l=0,u=0,f=[],d=0,p=0,y=function t(e){return _typeof(e)},v=function t(e,n){for(var r in e)Object.hasOwnProperty.call(e,r)&&n(r,e)},g=t.onError||function(){},h=function t(e){return function(){try{var t=e(arguments.length<=0?void 0:arguments[0],arguments.length<=1?void 0:arguments[1],arguments.length<=2?void 0:arguments[2],arguments.length<=3?void 0:arguments[3]);return t!==a?t:n}catch(r){g(r)}}},$=function t(e){for(d=l;d<=s;d++)e()},m=function e(n){return y(n)!==r&&(n=t.first(n).el),n},b=function t(){var e=!(arguments.length>0)||void 0===arguments[0]||arguments[0],r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:n.els,i=r.length;n.length=i,s=i-1,l=0,n.el=i?r[0]:a,n.last=i?r[s]:a,e&&(v(f,function(t,e){delete n[e[t]]}),f=[],n.ie={})},S=function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return Array.from(c.querySelectorAll(e))};n.reset=t;var _=function t(e,n,c){v(n,function(t){var s,l=n[t];y(l)===i&&(l=l(c)),"append"===t&&y(l)===r&&(l.els&&(l=[l]),l[0]&&l[0].els&&(valueBuff=[],v(l,function(t){var e;(e=valueBuff).push.apply(e,_toConsumableArray(l[t].els))}),l=valueBuff)),l!==a&&(["tag","sample","state"].includes(t)||(["html","innerHTML"].includes(t)?e.innerHTML=l:"dataset"===t&&y(l)===r?v(l,function(t){e.dataset[t]=l[t]}):"toggleClass"===t?e.classList.toggle(l):"addClass"===t?y(l)===r?(s=e.classList).add.apply(s,_toConsumableArray(l)):e.classList.add(l):"removeClass"===t?e.classList.remove(l):"style"===t&&y(l)===r?v(l,function(t){e.style[t]=l[t]}):"append"===t&&y(l)===r?v(l.length?l:[l],function(t){e.appendChild(l[t])}):e.setAttribute(t,l)))}),e.dataset.oState=n.state};return n.init=h(function(e){var u=n.initID||t.inits.length||0;n.initID=u,b(),t.inits[n.initID]=n,(y(e)!==r||e.render===a)&&(e={render:e}),v(e,function(v){f.push(v),n[v]=h(function(){var f=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[{}],g=e[v]||{tag:"div"},h=n.els.slice(l,s+1);y(g)===r&&(g.state=v,g["data-o-init"]=u);var $=function t(e){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return y(g)===r?c.createElement(g.tag||"div"):((d=c.createElement("div")).innerHTML=y(g)===i?g(n):g,d.children.length>1||!d.firstElementChild)?(d.dataset.oInit=e,d):(d.firstElementChild.dataset.oInit=e,d.firstElementChild)};f.length||(f=[f]);var m=!h[0]&&"render"===v;f=f.map(function(e,r){return e.self=n,e.o=t,e.i=e.i===a?r:e.i,m&&h.push($(u,e)),e}),m&&(n.els=h,b(!1)),h&&(p=h.length===f.length,h.map(function(t,e){f[p?e:0].i=e+l;var n=y(g)===i?g(f[p?e:0]):g;y(n)===r&&_(t,n,f[p?e:0])}))})})}),n.initState=h(function(t,e){n.init(t).render(e)}),n.sample=h(function(){var t,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"render",r=n.els[l].attributes,i=n.els[l].dataset,a={tag:n.els[l].tagName,html:n.els[l].innerHTML,dataset:{}},c=_createForOfIteratorHelper(r);try{for(c.s();!(t=c.n()).done;){var s=t.value;"data-"!==s.nodeName.substring(0,5)&&(a[s.nodeName]=s.value)}}catch(u){c.e(u)}finally{c.f()}return v(i,function(t){a.dataset[t]=i[t]}),_defineProperty({},e,a)}),n.select=h(function(t){t===a&&(t=n.length-1),s=t,l=t,n.el=n.els[t],u=1}),n.all=h(function(){s=n.length-1,l=0,n.el=n.els[0],u=0}),n.remove=h(function(t){t===a&&u&&(t=l),t!==a?n.els[t].parentNode.removeChild(n.els[t]):$(function(){n.els[d].parentNode.removeChild(n.els[d])}),b(!1)}),n.skip=h(function(t){t===a&&(t=l),n.els.splice(d,1),b()}),n.add=h(function(e,i){var c,s,l;"string"===y(e)&&""!==e?(c=n.els).push.apply(c,_toConsumableArray(S(e))):y(e)===r?e.tagName?n.els.push(e):e.els?(s=n.els).push.apply(s,_toConsumableArray(e.els)):e.length&&e[0].tagName&&(l=n.els).push.apply(l,_toConsumableArray(e)):"number"===y(e)&&t.inits[e]&&(n=t.inits[e]),b(!1),n.initID!==a&&n.dataset({oInit:n.initID})}),n.appendInside=h(function(t){$(function(){m(t).appendChild(n.els[d])})}),n.appendBefore=h(function(t){$(function(){m(t).parentNode.insertBefore(n.els[d],m(t))})}),n.appendAfter=h(function(t){$(function(){var e;(e=m(t)).after.apply(e,_toConsumableArray(n.els))})}),n.find=h(function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",e=[];$(function(){e.push.apply(e,_toConsumableArray(Array.from(n.els[d].querySelectorAll(":scope "+t))))}),n.els=e,b()}),n.first=h(function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",e=a,r=[];$(function(){(e=n.els[d].querySelector(t))&&r.push(e)}),n.els=r,b()}),n.attr=h(function(t,e){if(t){if(e===a){var r=[];return $(function(){r[d]=n.els[d].getAttribute(t)}),u?r[0]:r}""!==e?$(function(){n.els[d].setAttribute(t,e)}):$(function(){n.els[d].removeAttribute(t)})}}),n.attrs=h(function(){var t=[];return $(function(){var e={};_toConsumableArray(n.els[d].attributes).forEach(function(t){e[t.nodeName]=t.nodeValue}),t.push(e)}),u?t[0]:t}),n.dataset=h(function(t){if(_typeof(t)===r)$(function(){v(t,function(e){n.els[d].dataset[e]=t[e]})});else{var e=[];return $(function(){e.push(_objectSpread({},n.els[d].dataset))}),u?e[0]:e}}),n.style=h(function(t){n.attr("style",t)}),n.css=h(function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e="";v(t,function(n){e+=n+":"+t[n].replace('"',"'")+";"}),n.style(e)}),n.setClass=h(function(t){$(function(){n.els[d].setAttribute("class",t)})}),n.addClass=h(function(t){$(function(){n.els[d].classList.add(t)})}),n.removeClass=h(function(t){$(function(){n.els[d].classList.remove(t)})}),n.toggleClass=h(function(t,e){$(function(){n.els[d].classList.toggle(t,e)})}),n.haveClass=function(t){var e=!0;return $(function(){n.els[d].classList.contains(t)||(e=!1)}),e},n.innerHTML=h(function(t){if(t!==a)$(function(){n.els[d].innerHTML=t});else{var e="";return $(function(){e+=n.els[d].innerHTML}),e}}),n.innerText=h(function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";$(function(){n.els[d].innerText=t})}),n.textContent=h(function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";$(function(){n.els[d].textContent=t})}),n.html=h(function(t){if(t)n.innerHTML(t);else{var e="";return $(function(){e+=n.els[d].outerHTML}),e}}),n.forEach=h(function(t){n.initState(t)}),n.on=h(function(t,e,r,i){t.split(", ").forEach(function(t){$(function(){n.els[d].addEventListener(t,e,r,i)}),n.ie[t]||(n.ie[t]=[]),n.ie[t].push([e,r,i])})}),n.off=h(function(t,e,r){t.split(", ").forEach(function(t){$(function(){n.els[d].removeEventListener(t,e,r)}),n.ie[t]&&(n.ie[t]=n.ie[t].filter(function(t){return t[0]!==e}))})}),n.onAll=h(function(t,e){v(n.ie,function(r,i){t&&t!==r||i[r].forEach(function(t){$(function(){e?n.els[d].removeEventListener(r,t[0]):n.els[d].addEventListener(r,t[0],t[1],t[2])})})})}),n.offAll=h(function(t){n.onAll(t,1)}),e&&n.add(e),n.take=function(e){if(n.add(e),n.el){var r=n.el.dataset.oInit;if(r!==a&&t.inits[r])return 1===n.length?(p=n.els[0],Object.assign(n,t.inits[r]),n.els=[p]):n=t.inits[r],b(!1,n.els),n}},n};o.first=function(t){return o(document.querySelector(t)||"")},o.inits=[],o.errors=[],o.showErrors=!1,o.logErrors=function(){o.errors.length?o.errors.forEach(function(t){return console.log(t)}):console.log("No errors")},o.onError=function(t){o.showErrors?console.log(t):o.errors.push(t)},o.init=function(t){return o().init(t)},o.initState=function(t,e){return o().init(t).render(e)},o.take=function(t){return o().take(t)},o.Z=0,o.N=1,o.W=2,o.H=100,o.F=!1,o.C=function(t,e){return Object.hasOwnProperty.call(t,e)},o.ajax=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=new URLSearchParams;if(e.data&&"object"===_typeof(e.data)){for(var r in e.data)o.C(e.data,r)&&("object"===_typeof(e.data[r])?n.set(r,encodeURIComponent(JSON.stringify(e.data[r]))):n.set(r,e.data[r]));"GET"===e.method||"get"===e.method?t+="?"+n.toString():e.body||(e.body=n),delete e.data}return fetch(t,e)},o.get=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return o.ajax(t,_objectSpread(_objectSpread({},e),{},{method:"GET"}))},o.post=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return o.ajax(t,_objectSpread(_objectSpread({},e),{},{method:"POST"}))},o.getParams=function(t){var e,n={},r=new URLSearchParams(window.location.search).entries(),i=_createForOfIteratorHelper(r);try{for(i.s();!(e=i.n()).done;){var a=e.value;n[a[o.Z]]=a[o.N]}}catch(c){i.e(c)}finally{i.f()}return t?n[t]:n},o.incCache=!0,o.incCacheExp=864e5,o.incTimeout=6e3,o.incSource="",o.incForce=o.F,o.incAsync=!0,o.incCors=o.F,o.incFns={},o.incSet=[o.Z],o.incReady=[o.Z],o.incN=o.Z,o.incCheck=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,e=arguments.length>1?arguments[1]:void 0,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;return!n&&t&&e===o.U&&o.incReady[t]?o.incSet[t]===o.N:o.incReady[t]===o.U||o.incReady[t][e]===o.U?o.F:(o.incReady[t][e].loaded=n,o.incFns[o.incReady[t][e].name]=n,o.incReady[t][o.Z]+=n,t&&o.incReady[t].length===o.incReady[t][o.Z]&&("function"==typeof o.incSet[t]&&o.incSet[t](t),o.incSet[t]=o.N),o.incSet[t]===o.N)},o.incCacheClear=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:o.F;for(var e in o.incFns)o.C(o.incFns,e)&&(localStorage.removeItem("inc-"+e),localStorage.removeItem("inc-"+e+"Expires"));return t&&(o.incReady.forEach(function(t,e){e&&t.forEach(function(t,n){n&&o("#oInc-"+e+"-"+n).remove()})}),o.incN=o.Z,o.incFns={},o.incSet=[o.Z],o.incReady=[o.Z]),!0},o.inc=function(t,e,n){var r=o.Z,i=o.Z,a="function";if("object"!==_typeof(t)||!t)return o.incSet[o.Z];o.incSet[o.Z]++;var c=o.incSet[o.Z];o.incSet[c]=e||o.Z,o.incReady[c]=[];var s=o.incReady[c];s[o.Z]=o.N;var l={},u=function e(n){if(o.C(t,n)){r++,o.incN++;var a=t[n].indexOf(".css")>-1?"style":"script";if(t[n]=(o.incSource?o.incSource+"/":"")+t[n],isNaN(n)&&o.C(o.incFns,n)&&o.incFns[n]&&!o.incForce)return s[r]={name:n,loaded:o.N},i++,1;if(s[r]={name:n,loaded:o.Z},isNaN(n)&&(o.incFns[n]=o.Z),isNaN(n)&&o.incCache&&"http"!==t[n].substring(o.Z,4)&&"file:"!==window.location.protocol&&(t[n].indexOf(".css")>-1||t[n].indexOf(".js")>-1)){var u=localStorage,f=u.getItem("inc-"+n),d=u.getItem("inc-"+n+"Expires");f&&d&&new Date().getTime()<d?(o.initState({tag:a,id:"oInc-"+c+"-"+r,innerHTML:f,"data-o-inc":c}).appendInside("head"),s[r].loaded=o.N,o.incFns[n]=o.N,i++):(l[n]=r,o.get(t[n],{mode:o.incCors?"cors":"same-origin"}).then(function(e){if(200!==e.status){o.onError&&o.onError({message:o.incSource+t[n]+" was not loaded"});return}e.text().then(function(t){u.setItem("inc-"+n,t),u.setItem("inc-"+n+"Expires",new Date().getTime()+o.incCacheExp),o.initState({tag:a,id:"oInc-"+c+"-"+l[n],innerHTML:t,"data-o-inc":c}).appendInside("head"),o.incCheck(c,l[n],o.N)})}))}else{var p={tag:a,id:"oInc-"+c+"-"+r,"data-o-inc":c,async:o.incAsync,onload:"o.incCheck("+c+","+r+",1)"};t[n].indexOf(".css")>-1?(p.tag="link",p.rel="stylesheet",p.href=t[n]):(t[n].indexOf(".js")>-1||(p.tag="img",p.style="display:none;"),p.src=t[n]),o.initState(p).appendInside(p.style?"body":"head")}}};for(var f in t)if(u(f))continue;return s[o.Z]+=i,r!==o.Z&&(i===r?_typeof(e)===a&&e(c):setTimeout(function(t){o.incReady[t]&&o.incReady[t].length<o.incReady[t][o.Z]&&(o.incSet[t]=o.Z,_typeof(n)===a&&n(c))},o.incTimeout,c)),o.incSet[o.Z]},o.tLog=[],o.tRes=[],o.tStatus=[],o.tFns=[],o.tShowOk=o.F,o.tStyled=o.F,o.tTime=2e3,o.tPre='<div style="font-family:monospace;text-align:left;">',o.tOk='<span style="background:#cfc;padding: 0 15px;">OK</span> ',o.tXx='<div style="background:#fcc;padding:3px;">',o.tDc="</div>",o.test=function(){for(var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",e=o.tLog.length,n=arguments.length,r=Array(n>1?n-1:0),i=1;i<n;i++)r[i-1]=arguments[i];var a=0,c="├ OK: ",s="├ ✘ ",l="\n",u="\n",f=r.length,d=o.Z;"function"==typeof r[f-o.N]&&(o.tFns[e]=r[f-o.N],f--),o.tStyled?(o.tLog[e]="<div><b>"+t+" #"+e+"</b></div>",c=o.tPre+o.tOk,s=o.tPre+o.tXx,u=(l=o.tDc)+l):o.tLog[e]=t+" #"+e+"\n",o.tRes[e]=o.F,o.tStatus[e]=[];for(var p=o.Z;p<f;p++){var y={n:e,i:p,title:r[p][o.Z],tShowOk:o.tShowOk,tStyled:o.tStyled},v=r[p][o.N];if("function"==typeof v)try{v=v(y)}catch(g){v=g.message,o.onError&&o.onError(g)}o.tStatus[e][p]="string"==typeof v?o.F:v,!0===v?(d++,o.tShowOk&&(o.tLog[e]+=c+r[p][o.Z]+l)):v!==o.U?o.tLog[e]+=s+r[p][o.Z]+(v!==o.F?": <i>"+v+"</i>":"")+u:(a++,setTimeout(function(t){t.title+=" (timeout)",o.testUpdate(t)},o.tTime,y))}return o.tRes[e]=d===f,o.tStyled?o.tLog[e]+=o.tPre+'<div style="color:'+(d+a!==f?"red":"green")+';"><b>':o.tLog[e]+=a?"├":"└ ",o.tLog[e]+="DONE "+d+"/"+(f-a),a&&(o.tLog[e]+=", waiting: "+a),o.tStyled?o.tLog[e]+="</b>"+o.tDc+o.tDc:o.tLog[e]+="\n",a||"function"!=typeof o.tFns[e]||o.tFns[e](e),e},o.testUpdate=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:o.F,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"";if(o.tStatus[t.n][t.i]===o.U){o.tStatus[t.n][t.i]=!0===e,!0===e?t.tShowOk&&(t.tStyled?o.tLog[t.n]+=o.tPre+o.tOk+t.title+n+o.tDc:o.tLog[t.n]+="└ OK: "+t.title+n+"\n"):(o.tRes[t.n]=o.F,t.tStyled?o.tLog[t.n]+=o.tPre+o.tXx+t.title+n+(e?": "+e:"")+o.tDc+o.tDc:o.tLog[t.n]+="└ ✘ "+t.title+(e?": "+e:"")+n+"\n");var r,i=o.Z,a=i,c=_createForOfIteratorHelper(o.tStatus[t.n]);try{for(c.s();!(r=c.n()).done;){var s=r.value;if(s===o.U)return;!s&&i++,a++}}catch(l){c.e(l)}finally{c.f()}o.tRes[t.n]=!i;var u=i?"FAILED "+i+"/"+a:"DONE "+a+"/"+a;t.tStyled?o.tLog[t.n]+=o.tPre+'<b style="color:'+(i?"red":"green")+';">'+u+"</b>"+o.tDc:o.tLog[t.n]+="└ "+u,"function"==typeof o.tFns[t.n]&&o.tFns[t.n](t.n)}};

	if (typeof module !== 'undefined' && module.exports) {
		o.default = o;
		module.exports = o;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		define('o', [], function () {
			return o;
		});
	} else {
		window.o = o;
	}
})(this);
