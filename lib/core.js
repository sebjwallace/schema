'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.Abstract = Abstract;

var vdom = require('virtual-dom');
var h = vdom.h;

var grid = require('./flexboxGrid');
grid.mount();

function DOM() {

  var tree = vdom.h('#root', '');
  var rootNode = vdom.create(tree);
  document.body.appendChild(rootNode);

  function update(newTree) {
    var patches = vdom.diff(tree, newTree);
    rootNode = vdom.patch(rootNode, patches);
    tree = newTree;
  }

  return {

    render: function render(tree) {
      update(tree);
    }

  };
}

var vDOM = new DOM();

function $(tag, attributes, _children) {

  // function schema(){
  //   return{
  //     tag: tag || 'DIV',
  //     attributes: attributes || {},
  //     children: children || [],
  //     domElement: null,
  //     onload: function(){},
  //   }
  // }

  function _extend(abstracts) {
    abstracts.forEach(function (abstract) {
      var vNode = abstract.vNode();
      for (var prop in vNode.properties) {
        if (prop != 'style') attributes[prop] = vNode.properties[prop];
      }
      var styles = vNode.properties.style;
      if (styles) {
        if (!attributes.style) attributes.style = {};
        for (var style in styles) {
          attributes['style'][style] = styles[style];
        }
      }
      var abstractChildren = abstract.getChildren();
      for (var child in abstractChildren) {
        _children.push(abstractChildren[child]);
      }
    });
  }

  attributes = attributes || {};
  _children = _children || [];
  var domElement = null;
  var _onload = function onload() {};
  var chainMediaSize = '';

  if (tag) if (tag.type) if (tag.type == 'vNodeChain') {
    tag = 'DIV';
    var abstracts = parseArgs(arguments);
    _extend(abstracts);
  }

  tag = tag || 'DIV';

  function addStyle(attr, value) {
    if (!attributes.style) attributes.style = {};
    attributes.style[attr] = value;
  }

  function addClass(name) {
    if (!attributes.className) attributes.className = '';
    attributes.className += name + ' ';
  }

  function parseRGBA(rgba) {
    rgba = parseArgs(rgba);
    if (rgba.length == 3) return 'rgb(' + rgba.join(',') + ')';else if (rgba.length == 4) return 'rgba(' + rgba.join(',') + ')';
  }

  function parseColor(color) {
    if ((typeof color === 'undefined' ? 'undefined' : _typeof(color)) == 'object') color = color.rgbString();
    return color;
    return color;
  }

  function parseArgs(args) {
    return Array.prototype.slice.call(args);
  }

  function parseUnits(args) {
    var args = parseArgs(args);
    var unit = 'px';
    if (typeof args[args.length - 1] == 'string') unit = args.splice(args.length - 1);
    return args.map(function (arg) {
      return arg += unit + ' ';
    });
  }

  function createHook(callback) {
    var Hook = function Hook() {};
    Hook.prototype.hook = function (node) {
      callback(node);
    };
    return new Hook();
  }

  function onReturn() {
    return chain;
  }

  var chain = {
    attr: function attr(_attr, val) {
      attributes[_attr] = val;
      return onReturn();
    },
    id: function id(_id) {
      attributes['id'] = _id;
      return onReturn();
    },
    class: function _class(className) {
      addClass(className);
      return onReturn();
    },
    children: function children() {
      var args = parseArgs(arguments);
      args = args.map(function (arg) {
        return arg.vNode();
      });
      _children.push(args);
      return onReturn();
    },
    text: function text(_text) {
      _children.push(_text);
      return onReturn();
    },
    event: function event(_event, fn, params) {
      if (typeof fn == 'string') {
        attributes[_event] = function () {
          $action.push(fn, params).call();
        };
        return onReturn();
      }
      if ((typeof fn === 'undefined' ? 'undefined' : _typeof(fn)) == 'object') if (fn.type == 'vNodeChain') {
        attributes[_event] = function () {
          var styles = fn.vNode().properties.style;
          for (var style in styles) {
            domElement.style[style] = styles[style];
          }
        };
        return onReturn();
      }
      attributes[_event] = fn;
      return onReturn();
    },
    action: function action(handler, vNode) {
      $action.pull(handler, function () {
        if (typeof vNode == 'function') {
          vNode = vNode.apply(this, arguments);
        }
        var styles = vNode.vNode().properties.style;
        for (var style in styles) {
          domElement.style[style] = styles[style];
        }
      });
      return onReturn();
    },
    onclick: function onclick(fn, params) {
      chain.event('onclick', fn, params);
      return onReturn();
    },
    onload: function onload(fn) {
      _onload = fn;
      return onReturn();
    },
    placeholder: function placeholder(text) {
      attributes.placeholder = text;
      return onReturn();
    },
    value: function value(_value) {
      attributes.value = _value;
      return onReturn();
    },
    display: function display(_display) {
      addStyle('display', _display);
      return onReturn();
    },
    hide: function hide() {
      addStyle('display', 'none');
      return onReturn();
    },
    show: function show() {
      addStyle('display', 'block');
      return onReturn();
    },
    color: function color(_color) {
      if (arguments.length > 2) _color = parseRGBA(arguments);
      _color = parseColor(_color);
      addStyle('color', _color);
      return onReturn();
    },
    background: function background(color) {
      if (arguments.length > 2) color = parseRGBA(arguments);
      color = parseColor(color);
      addStyle('background-color', color);
      return onReturn();
    },
    opacity: function opacity(value) {
      addStyle('opacity', value);
      return onReturn();
    },

    height: function height(_height, unit) {
      if (unit) _height = _height + unit;else if (!isNaN(_height)) _height = _height + 'px';
      addStyle('height', _height);
      return onReturn();
    },
    width: function width(_width, unit) {
      if (unit) _width = _width + unit;else if (!isNaN(_width)) _width = _width + 'px';
      addStyle('width', _width);
      return onReturn();
    },
    size: function size() {
      var sizes = parseUnits(arguments);
      addStyle('height', sizes[0]);
      if (sizes.length > 1) addStyle('width', sizes[1]);
      return onReturn();
    },
    padding: function padding() {
      var padding = parseUnits(arguments).join('');
      addStyle('padding', padding);
      return onReturn();
    },
    margin: function margin() {
      var margin = parseUnits(arguments).join('');
      addStyle('margin', margin);
      return onReturn();
    },
    border: function border(size, style, color) {
      addStyle('border', size + 'px ' + style + ' ' + color);
      return onReturn();
    },
    transition: function transition(styles, duration) {
      if (!duration) {
        duration = styles;
        styles = 'all';
      }
      addStyle('transition', styles + ' ' + duration + 's');
      return onReturn();
    },
    flex: function flex() {
      addStyle('display', 'flex');
      addStyle('flex-wrap', 'wrap');
      return onReturn();
    },
    row: function row() {
      chain.flex();
      addStyle('flex-direction', 'row');
      if (arguments) parseArgs(arguments).forEach(function (child) {
        _children.push(child.vNode());
      });
      return onReturn();
    },
    column: function column() {
      chain.flex();
      addStyle('flex-direction', 'column');
      if (arguments) parseArgs(arguments).forEach(function (child) {
        _children.push(child.vNode());
      });
      return onReturn();
    },
    justify: function justify(alignment) {
      addStyle('justify-content', alignment);
      return onReturn();
    },
    order: function order(_order) {
      addStyle('order', _order);
      return onReturn();
    },
    shrink: function shrink(_shrink) {
      addStyle('shrink', _shrink);
      return onReturn();
    },
    grow: function grow(_grow) {
      addStyle('flex-grow', _grow);
      return onReturn();
    },
    wrap: function wrap(reverse) {
      if (reverse) addStyle('flex-wrap', 'wrap-reverse');else addStyle('flex-wrap', 'wrap');
      return onReturn();
    },
    align: function align(_align) {
      if (_align == 'start' || _align == 'end') _align = 'flex-' + _align;
      addStyle('align-self', _align);
      return onReturn();
    },
    items: function items(align) {
      if (align == 'start' || align == 'end') align = 'flex-' + align;
      addStyle('align-items', align);
      return onReturn();
    },
    content: function content(align) {
      if (align == 'start' || align == 'end') align = 'flex-' + align;
      addStyle('align-content', align);
      return onReturn();
    },
    start: function start() {
      return chain.align('flex-start');
    },
    end: function end() {
      return chain.align('flex-end');
    },
    center: function center() {
      return chain.align('center');
    },
    baseline: function baseline() {
      return chain.align('baseline');
    },
    stretch: function stretch() {
      return chain.align('stretch');
    },
    xs: function xs(size) {
      if (size) addClass('col-xs-' + size);
      chainMediaSize = 'xs';
      return onReturn();
    },
    sm: function sm(size) {
      if (size) addClass('col-sm-' + size);
      chainMediaSize = 'sm';
      return onReturn();
    },
    md: function md(size) {
      if (size) addClass('col-md-' + size);
      chainMediaSize = 'md';
      return onReturn();
    },
    lg: function lg(size) {
      if (size) addClass('col-lg-' + size);
      chainMediaSize = 'lg';
      return onReturn();
    },
    offset: function offset(_offset) {
      addClass('col-' + chainMediaSize + '-offset-' + _offset);
      return onReturn();
    },
    style: function style(attr, value) {
      addStyle(attr, value);
      return onReturn();
    },
    if: function _if(condition, vNode) {
      if (condition() == true) _extend([vNode]);
      return onReturn();
    },
    filterMap: function filterMap(data, filter, map) {
      data = data.filter(filter);
      chain.map(data, map);
      return onReturn();
    },
    map: function map(data, fn) {
      var appending = data.map(function (item, i) {
        return fn(item, i).vNode();
      });
      _children.push(appending);
      return onReturn();
    },
    mapToText: function mapToText(data, fn) {
      var text = data.map(function (item, i) {
        return fn(item, i);
      }).join('');
      _children.push(text);
      return onReturn();
    },
    extend: function extend() {
      var abstracts = parseArgs(arguments);
      _extend(abstracts);
      return onReturn();
    },
    removeStyles: function removeStyles() {
      if (domElement) domElement.removeAttribute('style');
      attributes.style = {};
      return onReturn();
    },
    click: function click() {
      domElement.click();
      return onReturn();
    },
    remove: function remove() {
      domElement.parent.removeChild(domElement);
    },
    vNode: function vNode() {
      var vNode = h(tag, attributes, _children);
      var onloadHook = createHook(function (node) {
        domElement = node;
        _onload(node);
      });
      vNode.properties['onloadHook'] = onloadHook;
      return vNode;
    },
    domNode: function domNode() {
      return domElement;
    },
    getChildren: function getChildren() {
      return _children;
    },
    getAttributes: function getAttributes() {
      return attributes;
    },
    render: function render() {
      var vNode = chain.vNode();
      vDOM.render(vNode);
      return onReturn();
    },
    type: 'vNodeChain'
  };

  return chain;
}

exports.$ = $;
var actions = [];

var $action = exports.$action = {

  push: function push(handler, params) {
    if (!Array.isArray(params)) params = [params];
    return function () {
      actions[handler].forEach(function (action) {
        action.apply(this, params);
      });
    };
  },
  pull: function pull(handler, fn) {
    if (!actions[handler]) actions[handler] = [];
    actions[handler].push(fn);
  },
  getActions: function getActions(handler) {
    return actions[handler];
  },
  removeAllActions: function removeAllActions(handler) {
    actions = [];
  }

};

function Abstract() {
  return $('template');
}