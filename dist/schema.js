(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SchemaEngine = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Compiler = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Module = require('./Types/Module');

var Types = _interopRequireWildcard(_Module);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Compiler = exports.Compiler = function () {
	function Compiler(Store) {
		_classCallCheck(this, Compiler);

		this.Store = Store;
	}

	_createClass(Compiler, [{
		key: 'isMediaQuery',
		value: function isMediaQuery(check) {
			return check.match(/\@media\s+/);
		}
	}, {
		key: 'isVariableScope',
		value: function isVariableScope(check) {
			return check.match(/^\$/);
		}
	}, {
		key: 'generateSelector',
		value: function generateSelector(selector, scope) {
			var children = '';
			var check = selector.match(/^[^\s]+/)[0];
			var postfixes = selector.replace(/^[^\s]+/, '');
			var style = this.Store.getStyle(check);
			if (style) for (var child in style.children) {
				children += child.replace('&', ' ') + ' ' + postfixes + ', ';
			}
			return (children + ' ' + '.' + scope + ' ' + selector).replace(/\s+\:/, ':').replace('BASE', '');
		}
	}, {
		key: 'generateValue',
		value: function generateValue(isString) {
			var variable = Types.Variable.retrieve(isString);
			if (variable) {
				var value = this.Store.getVariable(variable);
				return isString.replace(variable, value);
			} else return isString;
		}
	}, {
		key: 'parse',
		value: function parse(obj, scope) {
			var _this = this;

			var parentID = '';
			var parentOBJ = {};
			var groupingID = '';

			var stack = [];
			var sum = "";
			var level = 0;

			var stitch = function stitch(obj) {

				level++;

				for (var props in obj) {

					if (_this.isVariableScope(props) || Types.Event.isEvent(props) || Types.Binding.isBinding(props) || Types.Extend.isExtend(props)) continue;

					if (level == 1 && !_this.isMediaQuery(props)) {
						parentID = props;
						parentOBJ = obj[props];
					}

					if (Types.Mixin.isMixin(props)) {
						var mixin = _this.Store.getMixin(Types.Mixin.format(props));
						if (typeof obj[props] == 'string') stitch(mixin(obj[props]));else if (Array.isArray(obj[props])) stitch(mixin.apply(_this, obj[props]));else continue;
					} else if (Types.Group.isGroup(props)) {
						groupingID = Types.Group.format(props);
						stitch(obj[props]);
						groupingID = '';
					} else if (Types.Nesting.isNesting(props)) {
						var item = _defineProperty({}, parentID + " " + Types.Nesting.format(props), obj[props]);
						stack.push(item);
					} else {
						if (_typeof(obj[props]) === 'object') {
							if (_this.isMediaQuery(props)) sum += props;else sum += _this.generateSelector(props, scope);
							sum += "{";
							stitch(obj[props]);
							sum += "}";
						} else {
							sum += groupingID + props;
							sum += ":" + _this.generateValue(obj[props], scope, parentID, props) + ";";
						}
					}
				}

				level--;
			};

			stitch(obj);

			var len = stack.length;
			for (var i = 0; i < len; i++) {
				stitch(stack[i]);
				len = stack.length;
			}

			return sum;
		}
	}]);

	return Compiler;
}();
},{"./Types/Module":15}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Component = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Compiler = require('./Compiler');

var _PreCompiler = require('./PreCompiler');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Component = exports.Component = function () {
	function Component(_ref) {
		var Store = _ref.Store;
		var token = _ref.token;
		var tag = _ref.tag;
		var stylesheet = _ref.stylesheet;
		var styles = _ref.styles;

		_classCallCheck(this, Component);

		this.token = token;
		this.tag = tag;
		this.stylesheet = stylesheet;
		this.Store = Store;
		this.Store.registerTag(this.token.key, this.tag);
	}

	_createClass(Component, [{
		key: 'setStyles',
		value: function setStyles(obj) {
			this.stylesheet.set(obj);

			var preCompiler = new _PreCompiler.PreCompiler(this.Store, this);
			var compiler = new _Compiler.Compiler(this.Store);
			preCompiler.parse(this.stylesheet.get(), this.token.key);

			var renderStack = this.Store.getRenderStack();
			var styleIndex = this.Store.getStyleIndex();

			for (var item in renderStack) {
				var result = compiler.parse(styleIndex[item], item);
				this.Store.updateTag(item, result);
			}

			this.Store.emptyRenderStack();
		}
	}, {
		key: 'set',
		value: function set(obj) {
			this.setStyles(obj);
		}
	}, {
		key: 'getStyleTag',
		value: function getStyleTag() {
			return this.tag.getTag();
		}
	}, {
		key: 'remove',
		value: function remove() {
			this.tag.remove();
		}
	}, {
		key: 'scope',
		value: function scope() {
			return '.' + this.token.key + ' ';
		}
	}, {
		key: 'className',
		value: function className() {
			return this.token.key;
		}
	}]);

	return Component;
}();
},{"./Compiler":1,"./PreCompiler":4}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Event = exports.Component = exports.JASS = exports.RSS = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _Component2 = require('./Component');

var _Store = require('./Store');

var _Token = require('./Token');

var _Tag = require('./Tag');

var _StyleSheet = require('./StyleSheet');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ComponentFactory = function ComponentFactory(initial, styles) {
	_classCallCheck(this, ComponentFactory);

	var Store = RSS.Store,
	    token = new _Token.Token(),
	    tag = new _Tag.Tag(token.key, document),
	    stylesheet = new _StyleSheet.StyleSheet();

	var comp = new _Component2.Component({
		Store: Store, token: token, tag: tag, stylesheet: stylesheet
	});

	if (typeof initial == 'string') document.getElementById(initial).className = comp.className();else if ((typeof initial === 'undefined' ? 'undefined' : _typeof(initial)) == 'object') comp.setStyles(initial);
	if (styles) comp.setStyles(styles);

	return comp;
};

var _Event = function _Event(id) {
	var event = RSS.Store.events[id];
	for (var listener in event) {
		var comp = event[listener].component;
		var selector = event[listener].selector;
		var styles = {};
		styles[selector] = event[listener].styles;
		comp.setStyles(styles);
	}
};

var _RSS = function _RSS(store) {
	_classCallCheck(this, _RSS);

	this.Store = store;
	this.Component = ComponentFactory;
	this.Event = _Event;
	if (!document.getElementById('rss-container')) {
		var el = document.createElement('div');
		el.id = 'rss-container';
		document.body.appendChild(el);
	}
};

var RSS = exports.RSS = new _RSS(new _Store.Store());
var JASS = exports.JASS = new _RSS(new _Store.Store());
var Component = exports.Component = ComponentFactory;
var Event = exports.Event = _Event;
},{"./Component":2,"./Store":5,"./StyleSheet":7,"./Tag":8,"./Token":9}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PreCompiler = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Module = require('./Types/Module');

var Types = _interopRequireWildcard(_Module);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PreCompiler = exports.PreCompiler = function () {
	function PreCompiler(Store, component) {
		_classCallCheck(this, PreCompiler);

		this.Store = Store;
		this.component = component;
	}

	_createClass(PreCompiler, [{
		key: 'parse',
		value: function parse(obj, key) {
			var _this = this;

			var level = 0;
			var activeStyle = {};
			var selector = null;

			var extract = function extract(obj) {
				level++;

				for (var prop in obj) {

					if (level == 1) {
						selector = prop;
						_this.Store.addStyle(key, selector, obj[selector]);
						activeStyle = _this.Store.getStyle(selector);
						_this.Store.registerToken(key, activeStyle.selector, activeStyle);
						_this.Store.registerStyle(key, activeStyle.selector, activeStyle.body);
					}

					if (Types.Extend.isExtend(prop)) {
						var parent = _this.Store.getStyle(obj[prop]);
						if (parent) {
							activeStyle.addParent(obj[prop]);
							var signature = '.' + activeStyle.token + '&' + activeStyle.selector.replace('BASE', '');
							if (!parent.hasChild(signature)) parent.addChild(signature);
							_this.Store.addToRenderStack(parent.token);
						}
					} else if (Types.Variable.isVariable(prop)) {
						_this.Store.addVariable(prop, obj[prop]);
					} else if (Types.Mixin.isMixin(prop) && typeof obj[prop] === 'function') {
						_this.Store.addMixin(Types.Mixin.format(prop), obj[prop]);
					} else if (Types.Event.isEvent(prop)) {
						var id = Types.Event.format(prop);
						var event = { component: _this.component, selector: selector, styles: obj[prop] };
						_this.Store.addEvent(id, selector, event);
					} else if (Types.Binding.isBinding(prop)) {
						var binding = new Types.Binding(selector, key, prop, obj[prop]);
						_this.Store.addBinding(binding);
					}

					if (_typeof(obj[prop]) === 'object') {
						extract(obj[prop]);
					}
				}
				level--;
			};
			extract(obj);
			this.Store.addToRenderStack(key);
		}
	}]);

	return PreCompiler;
}();
},{"./Types/Module":15}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Store = undefined;

var _Style = require('./Style');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Store = exports.Store = function Store() {
	var _this = this;

	_classCallCheck(this, Store);

	this.styles = {};
	this.tags = {};
	this.mixins = {};
	this.variables = {};
	this.events = {};
	this.bindings = {};
	this.tokenIndex = {};
	this.styleIndex = {};
	this.renderStack = {};

	this.registerTag = function (id, tag) {
		_this.tags[id] = tag;
	};
	this.updateTag = function (id, content) {
		_this.tags[id].update(content);
	};
	this.addVariable = function (name, value) {
		_this.variables[name] = value;
	};
	this.getVariable = function (name) {
		return _this.variables[name];
	};
	this.addMixin = function (name, fn) {
		_this.mixins[name] = fn;
	};
	this.getMixin = function (id) {
		return _this.mixins[id];
	};
	this.addEvent = function (id, selector, event) {
		if (!_this.events[id]) _this.events[id] = {};
		if (!_this.events[id][selector]) _this.events[id][selector] = event;
	};
	this.addBinding = function (id, binding) {
		_this.bindings[id] = binding;
	};
	this.addToRenderStack = function (key) {
		_this.renderStack[key] = key;
	};
	this.getRenderStack = function () {
		return _this.renderStack;
	};
	this.getStyleIndex = function () {
		return _this.styleIndex;
	};
	this.emptyRenderStack = function () {
		_this.renderStack = {};
	};
	this.addStyle = function (key, selector, styleBody) {
		_this.styles[selector] = new _Style.Style(key, selector, styleBody);
	};
	this.getStyle = function (selector) {
		if (!_this.styles[selector]) console.log('\'' + selector + '\' does not exist!');else return _this.styles[selector];
	};
	this.registerToken = function (key, selector, style) {
		if (!_this.tokenIndex[key]) _this.tokenIndex[key] = {};
		_this.tokenIndex[key][selector] = style;
	};
	this.registerStyle = function (key, selector, styleBody) {
		if (!_this.styleIndex[key]) _this.styleIndex[key] = {};
		_this.styleIndex[key][selector] = styleBody;
	};
};
},{"./Style":6}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Style = exports.Style = function () {
	function Style(token, selector, body) {
		_classCallCheck(this, Style);

		this.token = token;
		this.selector = selector;
		this.body = body;
		this.parents = {};
		this.children = {};
	}

	_createClass(Style, [{
		key: "addChild",
		value: function addChild(signature) {
			this.children[signature] = true;
		}
	}, {
		key: "addParent",
		value: function addParent(selector) {
			this.parents[selector] = selector;
		}
	}, {
		key: "getChildren",
		value: function getChildren() {
			return this.children;
		}
	}, {
		key: "hasChild",
		value: function hasChild(signature) {
			return this.children[signature];
		}
	}]);

	return Style;
}();
},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StyleSheet = exports.StyleSheet = function () {
	function StyleSheet() {
		_classCallCheck(this, StyleSheet);

		this.styles = null;
	}

	_createClass(StyleSheet, [{
		key: "set",
		value: function set(obj) {
			if (!this.styles) this.styles = obj;else {
				for (var selector in obj) {
					for (var attr in obj[selector]) {
						var existing = this.styles[selector][attr];
						var override = obj[selector][attr];
						if (Array.isArray(override)) {
							if (override[0] == existing) this.styles[selector][attr] = override[1];else this.styles[selector][attr] = override[0];
						} else {
							this.styles[selector][attr] = override;
						}
					}
				}
			}
		}
	}, {
		key: "get",
		value: function get() {
			return this.styles;
		}
	}]);

	return StyleSheet;
}();
},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Tag = exports.Tag = function () {
	function Tag(id, document) {
		_classCallCheck(this, Tag);

		this.document = document;
		this.id = 'rss-' + id;
		this.tag = this.generateTag(this.id);
	}

	_createClass(Tag, [{
		key: 'generateTag',
		value: function generateTag(id) {
			var el = this.document.createElement('style');
			el.id = id;
			var container = this.document.getElementById('rss-container');
			container.appendChild(el);
			return el;
		}
	}, {
		key: 'remove',
		value: function remove() {
			var el = this.document.getElementById(this.id);
			el.parentNode.removeChild(el);
		}
	}, {
		key: 'getTag',
		value: function getTag() {
			return this.tag;
		}
	}, {
		key: 'update',
		value: function update(stringified) {
			this.tag.innerHTML = stringified;
		}
	}]);

	return Tag;
}();
},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Token = exports.Token = function () {
	function Token() {
		_classCallCheck(this, Token);

		this.key = this.generateKey(4);
		this.current = false;
	}

	_createClass(Token, [{
		key: "generateKey",
		value: function generateKey(length) {
			var key = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
			for (var i = 0; i < length; i++) {
				key += possible.charAt(Math.floor(Math.random() * possible.length));
			}return key;
		}
	}]);

	return Token;
}();
},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Binding = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _JASS = require('../JASS');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Binding = exports.Binding = function () {
	function Binding(selector, key, name, fn) {
		_classCallCheck(this, Binding);

		this.el = null;
		if (selector == 'BASE') {
			this.el = document.getElementByClassName(key)[0];
		} else {
			this.el = document.getElementById(selector.replace('#', ''));
		}

		this.domEvent = name.replace(/^\@bind\s+/, '');
		this.createEvent(fn);
	}

	_createClass(Binding, [{
		key: 'createEvent',
		value: function createEvent(fn) {
			var _this = this;

			if (typeof fn == 'string') {
				(function () {
					var eventId = fn.replace(/^\@event\s+/, '');
					_this.fn = function () {
						_JASS.JASS.Event(eventId);
					};
				})();
			} else this.fn = fn;
			this.el[this.domEvent] = this.fn;
		}
	}], [{
		key: 'isBinding',
		value: function isBinding(check) {
			if (check.match(/^\@bind\s+[^]+$/)) return true;else return false;
		}
	}]);

	return Binding;
}();
},{"../JASS":3}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Event = exports.Event = function () {
	function Event() {
		_classCallCheck(this, Event);
	}

	_createClass(Event, null, [{
		key: 'isEvent',
		value: function isEvent(check) {
			if (check.match(/^\@event\s+[^]+$/)) return true;else return false;
		}
	}, {
		key: 'format',
		value: function format(fromString) {
			return fromString.replace(/^\@event\s+/, '');
		}
	}]);

	return Event;
}();
},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Extend = exports.Extend = function () {
	function Extend() {
		_classCallCheck(this, Extend);
	}

	_createClass(Extend, null, [{
		key: "isExtend",
		value: function isExtend(check) {
			return check.match(/^\@extend($|[0-9])/);
		}
	}]);

	return Extend;
}();
},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Group = exports.Group = function () {
	function Group() {
		_classCallCheck(this, Group);
	}

	_createClass(Group, null, [{
		key: 'isGroup',
		value: function isGroup(check) {
			return check.match(/^\#\s+[a-z,A-Z]+$/);
		}
	}, {
		key: 'format',
		value: function format(fromString) {
			return fromString.replace(/\#\s+/, '') + '-';
		}
	}]);

	return Group;
}();
},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mixin = exports.Mixin = function () {
	function Mixin() {
		_classCallCheck(this, Mixin);
	}

	_createClass(Mixin, null, [{
		key: 'isMixin',
		value: function isMixin(check) {
			if (check.match(/^\@mixin\s+/)) return true;
			return false;
		}
	}, {
		key: 'format',
		value: function format(fromString) {
			return fromString.replace(/^\@mixin\s/, '');
		}
	}]);

	return Mixin;
}();
},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Extend = require('./Extend');

Object.keys(_Extend).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Extend[key];
    }
  });
});

var _Binding = require('./Binding');

Object.keys(_Binding).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Binding[key];
    }
  });
});

var _Variable = require('./Variable');

Object.keys(_Variable).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Variable[key];
    }
  });
});

var _Mixin = require('./Mixin');

Object.keys(_Mixin).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Mixin[key];
    }
  });
});

var _Event = require('./Event');

Object.keys(_Event).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Event[key];
    }
  });
});

var _Group = require('./Group');

Object.keys(_Group).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Group[key];
    }
  });
});

var _Nesting = require('./Nesting');

Object.keys(_Nesting).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Nesting[key];
    }
  });
});
},{"./Binding":10,"./Event":11,"./Extend":12,"./Group":13,"./Mixin":14,"./Nesting":16,"./Variable":17}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Nesting = exports.Nesting = function () {
	function Nesting() {
		_classCallCheck(this, Nesting);
	}

	_createClass(Nesting, null, [{
		key: 'isNesting',
		value: function isNesting(check) {
			return check.match(/^\>[^]/);
		}
	}, {
		key: 'format',
		value: function format(fromString) {
			return fromString.replace('> ', '');
		}
	}]);

	return Nesting;
}();
},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Variable = exports.Variable = function () {
	function Variable() {
		_classCallCheck(this, Variable);
	}

	_createClass(Variable, null, [{
		key: 'isVariable',
		value: function isVariable(check) {
			if (typeof check != 'string') return false;
			if (check.match(/^\$[a-z,A-Z,-]+$/)) return true;
			return false;
		}
	}, {
		key: 'retrieve',
		value: function retrieve(isString) {
			if (typeof isString != 'string') return false;
			var match = isString.match(/\$[a-z,A-Z,-]+/);
			if (match) return match[0];
		}
	}]);

	return Variable;
}();
},{}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _jassJs = require('jass-js');

var SchemaEngine = function SchemaEngine() {

  var components = [];

  var ATTR = /^[a-z,A-Z,-]+\:\s/;
  var ID = /^\#/;
  var CLAS = /(^|\s+)\./g;
  var DATA = /^\$/;
  var EVENT = /^\!/;
  var TRANS = /^\>/;
  var IF = /^\?\s+/;
  var FOR = /^\%\s+/;

  var level = 0;

  var render = function render(obj, root, trans) {

    root.innerHTML = '';
    obj.root = root;

    var dom = {};
    dom.parent = root;
    dom.el = null;

    // for(var item in obj){
    //   if(typeof obj[item] == 'function')
    //     obj[item] = (arguments) => { obj[item](arguments).bind(obj); }
    // }

    if (obj.styles) {
      var styles = new _jassJs.JASS.Component(obj.styles);
      obj.root.className = styles.className();
    }

    obj.setData = function (data) {
      for (var item in data) {
        obj.data[item] = data[item];
      }
      render(obj, obj.root, obj.trans);
    };

    var newElement = function newElement(obj, parent, type) {
      var tag = type || 'span';
      if (tag.match(ID)) {
        var child = document.createElement('div');
        child.id = tag.replace(ID, '');
      } else if (tag.match(CLAS)) {
        var child = document.createElement('div');
        child.className = tag.replace(CLAS, '');
      } else {
        var child = document.createElement(tag);
      }
      child.parent = parent;
      parent.appendChild(child);
      return child;
    };

    var buildElement = function buildElement(obj, dom, val) {
      var tag = val[0];
      var content = val[val.length - 1];
      if (typeof tag == 'object') {
        var component = tag;
        var sub = newElement(obj, dom.parent, 'div');
        var componentID = getComponentId(dom.parent);
        if (components[componentID]) render(components[componentID], sub, content);else {
          var instance = Object.create(component);
          if (component.data) {
            instance.data = JSON.parse(JSON.stringify(component.data));
            for (var data in val[1]) {
              instance.data[data] = val[1][data];
            }
          }
          components[componentID] = instance;
          render(instance, sub, content);
        }
        for (var j = 1; j < val.length; j++) {
          applySelector(sub, val[j]);
        }
      } else {
        dom.el = newElement(obj, dom.parent, tag);
        if (typeof content == 'string' && !content.match(TRANS)) dom.el.innerHTML = content;
        dom.parent = dom.el;
        traverse(val);
        dom.parent = dom.parent.parent;
      }
    };

    var applySelector = function applySelector(el, val) {
      if (typeof val != 'string') return false;
      if (val.match(ID)) el.id = val.replace(ID, '');else if (val.match(CLAS)) el.className = val.replace(CLAS, ' ');else return false;
      return true;
    };

    var getElementPath = function getElementPath(el) {
      var path = el.nodeName;
      var current = el;
      var parent = el.parentNode;
      while (parent) {
        for (var child in parent.children) {
          if (parent.children[child] == current) path = parent.nodeName + '[' + child + ']' + '/' + path;
        }
        current = parent;
        parent = parent.parentNode;
      }
      return path;
    };

    var getComponentId = function getComponentId(el) {
      return getElementPath(el) + el.children.length;
    };

    var traverse = function traverse(node) {

      for (var i = 0; i < node.length; i++) {

        var val = node[i];

        if (typeof val == 'string') {

          if (applySelector(dom.el, val)) continue;

          if (val.match(ATTR)) dom.el.setAttribute([val.match(/^[a-z,A-Z,-]+/)[0]], val.replace(ATTR, ''));else if (val.match(DATA)) {
            var prop = val.replace(DATA, '');
            var data = null;
            if (prop.match(/\./)) {
              var path = prop.split(/\./);
              data = obj.data[path[0]][path[1]];
            } else data = obj.data[prop];
            if (Array.isArray(data)) {
              val = data;dom.el.innerHTML = '';
            } else dom.el.innerHTML = data;
          } else if (val.match(EVENT)) {
            var format = val.replace('!', '').replace(/\s/, '').split(':');
            dom.el[format[0]] = function (e) {
              obj[format[1]](obj, e);
            };
          } else if (val.match(TRANS)) {
            val = trans;
            obj.trans = trans;
          } else if (val.match(IF)) {
            var exp = val.replace(IF, '');
            if (exp.match(DATA)) {
              var data = obj.data[exp.replace(DATA, '')];
              if (!data) dom.el.style.display = 'none';
            }
          } else if (val.match(FOR)) {
            var args = val.replace(FOR, '').split(/\s+\in\s+/);
            var data = obj.data[args[1].replace(DATA, '')];
            var temp = args[0].replace(DATA, '');
            for (var item in data) {
              obj.data[temp] = data[item];
              buildElement(obj, dom, node[node.length - 1]);
            }
            i = node.length;
          }
        }

        if (Array.isArray(val)) {
          buildElement(obj, dom, val);
        }
      }
    };
    traverse([obj.template]);
    // console.log(root.innerHTML);
  };

  this.render = render;
};

exports['default'] = SchemaEngine;
module.exports = exports['default'];

},{"jass-js":3}]},{},[18])(18)
});