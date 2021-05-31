(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

    function isFunction(val) {
      return typeof val === 'function';
    }
    function isObject(val) {
      return typeof val === 'object' && val !== null;
    }
    let callbacks = [];
    let waiting = false;

    function flushCallBacks() {
      callbacks.forEach(fn => fn());
      callbacks = [];
      waiting = false;
    }

    function nextTick(fn) {
      callbacks.push(fn);

      if (!waiting) {
        waiting = true;
        Promise.resolve().then(flushCallBacks);
      }

      return;
    }
    let isArray = Array.isArray;
    let strats = {};
    let lifeCycle = ['beforeCreate', 'created', 'beforeMount', 'mounted'];
    lifeCycle.forEach(hook => {
      strats[hook] = function (parentVal, childVal) {
        if (childVal) {
          if (parentVal) {
            return parentVal.concat(childVal);
          } else {
            // 最开始是 {} 和父合并，因此父亲的 key 值一定会走这里变成数组，因此上面的逻辑可以用 concat
            if (isArray(childVal)) {
              return childVal;
            } else {
              return [childVal];
            }
          }
        } else {
          return [parentVal];
        }
      };
    });

    strats.components = function (parentVal, childVal) {
      let res = Object.create(parentVal);

      if (childVal) {
        for (let key in childVal) {
          res[key] = childVal[key];
        }
      }

      return res;
    };

    function mergeOptions(parentVal, childVal) {
      console.log('parentVal, childVal', parentVal, childVal);
      const options = {};

      for (let key in parentVal) {
        mergeFileds(key);
      }

      for (let key in childVal) {
        if (!parentVal.hasOwnProperty(key)) {
          mergeFileds(key);
        }
      }

      function mergeFileds(key) {
        let strat = strats[key];

        if (strat) {
          options[key] = strat(parentVal[key], childVal[key]);
        } else {
          options[key] = childVal[key] || parentVal[key];
        }
      }

      return options;
    }

    function makeMap(str) {
      let tagList = str.split(',');
      return function (tagNmae) {
        return tagList.includes(tagNmae);
      };
    }

    const isReservedTag = makeMap('div,span,template,p,script,slot,a,image,text,view,button');

    function initGlobalAPI(Vue) {
      Vue.options = {}; // 全局属性，每个组件初始化时这些属性都会被放到组件上

      Vue.mixin = function (options) {
        this.options = mergeOptions(this.options, options);
        return this;
      };

      Vue.options._base = Vue;

      Vue.extend = function (opt) {
        const Super = this;

        const Sub = function (options) {
          this._init(options);
        };

        Sub.prototype = Object.create(Super.prototype); // Object.create 会产生一个新的实例(new Fn(), Fn.prototype === Super.prototype)作为子类(Sub)的原型，此时 constructor 会指向错误

        Sub.prototype.constructor = Sub;
        Sub.options = mergeOptions(Super.options, opt);
        return Sub;
      };

      Vue.options.components = {};

      Vue.component = function (id, definition) {
        console.log('213213');
        let name = definition.name = definition.name || id;

        if (isObject(definition)) {
          definition = Vue.extend(definition);
        }

        Vue.options.components[name] = definition;
      };

      Vue.filter = function name() {};

      Vue.directive = function name() {};
    }

    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名的  aa-xxx

    const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  aa:aa-xxx  

    const startTagOpen = new RegExp(`^<${qnameCapture}`); //  此正则可以匹配到标签名 匹配到结果的第一个(索引第一个) [1]

    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>  [1]

    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
    // [1]属性的key   [3] || [4] ||[5] 属性的值

    const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />    > 

    function parserHTML(html) {
      let stack = [];
      let root = null;

      function createASTElement(tag, attrs, parent = null) {
        return {
          tag,
          type: 1,
          children: [],
          parent,
          attrs
        };
      }

      function start(tag, attrs) {
        // [div,p]
        // 遇到开始标签 就取栈中的最后一个作为父节点
        let parent = stack[stack.length - 1];
        let element = createASTElement(tag, attrs, parent);

        if (root == null) {
          // 说明当前节点就是根节点
          root = element;
        }

        if (parent) {
          element.parent = parent; // 跟新p的parent属性 指向parent

          parent.children.push(element);
        }

        stack.push(element);
      }

      function end(tagName) {
        let endTag = stack.pop();

        if (endTag.tag != tagName) {
          console.log('标签错误');
        }
      }

      function text(chars) {
        let parent = stack[stack.length - 1];
        chars = chars.replace(/\s/g, '');

        if (chars) {
          parent.children.push({
            type: 2,
            // 文本
            text: chars
          });
        }
      }

      function advance(len) {
        html = html.substring(len);
      }

      function parseStartTag() {
        const start = html.match(startTagOpen);

        if (start) {
          const match = {
            tagName: start[1],
            attrs: []
          };
          advance(start[0].length);
          let end;
          let attr;

          while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5] // 属性可能为 height=1 height="1" height='1'

            });
            advance(attr[0].length);
          }

          if (end) {
            advance(end[0].length);
          }

          return match;
        }

        return false;
      }

      while (html) {
        let index = html.indexOf('<');

        if (index === 0) {
          const startTagMatch = parseStartTag();

          if (startTagMatch) {
            start(startTagMatch.tagName, startTagMatch.attrs);
            continue;
          }

          let endTagMatch;

          if (endTagMatch = html.match(endTag)) {
            end(endTagMatch[1]);
            advance(endTagMatch[0].length);
            continue;
          }
        }

        if (index > 0) {
          let chars = html.substring(0, index);
          text(chars);
          advance(chars.length);
        }
      }

      console.log(root);
      return root;
    }

    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{   xxx  }}  

    function genProps(attrs) {
      let str = '';

      for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];

        if (attr.name === 'style') {
          let styles = {};
          attr.value.replace(/([^;:]+):([^;:]+)/g, function () {
            styles[arguments[1]] = arguments[2];
          });
          attr.value = styles;
        }

        str += `${attr.name}: ${JSON.stringify(attr.value)},`;
      }

      return `{${str.slice(0, -1)}}`;
    }

    function gen(el) {
      if (el.type === 1) {
        return generate(el);
      } else {
        let text = el.text;
        if (!defaultTagRE.test(text)) return `_v('${text}')`;
        let lastIndex = defaultTagRE.lastIndex = 0;
        let tokens = [];
        let match;

        while (match = defaultTagRE.exec(text)) {
          let index = match.index;

          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push(`_s(${match[1].trim()})`);
          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }

        return `_v(${tokens.join('+')})`;
      }
    }

    function genChildren(el) {
      let children = el.children;

      if (children) {
        return children.map(item => gen(item)).join(',');
      }

      return false;
    }

    function generate(ast) {
      let children = genChildren(ast);
      let code = `_c('${ast.tag}', ${ast.attrs.length ? genProps(ast.attrs) : 'undefined'}${children ? `,${children}` : ''})`;
      return code;
    }

    function compileToFunction(template) {
      let ast = parserHTML(template);
      let code = generate(ast);
      let render = new Function(`with(this){return ${code}}`);
      console.log('redner', render.toString());
      return render;
    }

    let oldArrayPrototype = Array.prototype;
    let arrayMethods = Object.create(oldArrayPrototype);
    let methods = ['push', 'shift', 'pop', 'unshift', 'reverse', 'sort', 'splice'];
    methods.forEach(method => {
      arrayMethods[method] = function (...args) {
        oldArrayPrototype[method].call(this, ...args);
        let inserted = null;
        let ob = this.__ob__;

        switch (method) {
          case 'splice':
            inserted = args.slice(2);
            break;

          case 'push':
          case 'shift':
            inserted = args;
            break;
        }

        if (inserted) ob.observeArray(inserted);
      };
    });

    let id$1 = 0;

    class Dep {
      constructor(vm) {
        this.vm = vm;
        this.id = id$1++;
        this.subs = [];
      }

      depend() {
        Dep.target.addDep(this);
      }

      addSub(watcher) {
        this.subs.push(watcher);
      }

      notify() {
        this.subs.forEach(item => item.update());
      }

    }

    Dep.target = null;

    class Observer {
      constructor(value) {
        Object.defineProperty(value, '__ob__', {
          value: this,
          enumerable: false
        });

        if (isArray(value)) {
          value.__proto__ = arrayMethods;
          this.observeArray(value);
        } else {
          this.walk(value);
        }
      }

      observeArray(data) {
        data.forEach(item => observe(item));
      }

      walk(data) {
        Object.keys(data).forEach(key => {
          defineReactive(data, key, data[key]);
        });
      }

    }

    function defineReactive(obj, key, value) {
      observe(value);
      let dep = new Dep();
      Object.defineProperty(obj, key, {
        get() {
          if (Dep.target) {
            dep.depend();
          }

          return value;
        },

        set(newValue) {
          if (newValue === value) return;
          observe(newValue);
          value = newValue;
          dep.notify();
        }

      });
    }

    function observe(value) {
      if (!isObject(value)) return;
      if (value.__ob__) return;
      return new Observer(value);
    }

    function initState(vm) {
      const opts = vm.$options;

      if (opts.data) {
        initData(vm);
      }
    }

    function proxy(vm, key, source) {
      Object.defineProperty(vm, key, {
        get() {
          return vm[source][key];
        },

        set(newValue) {
          vm[source][key] = newValue;
        }

      });
    }

    function initData(vm) {
      let data = vm.$options.data;
      data = vm._data = isFunction(data) ? data.call(vm) : data;
      observe(data);

      for (let key in data) {
        proxy(vm, key, '_data');
      }
    }

    let queue = [];
    let has = {};

    function flushSchedulerQueue() {
      queue.forEach(watcher => watcher.run());
      queue = [];
      has = {};
      pending = false;
    }

    let pending = false;
    function queueWatcher(watcher) {
      let id = watcher.id;

      if (has[id] == null) {
        // 0 == null toBeFalsy(),  0 == undefined toBeFalsy(),  null == undefined toBeTruthy()
        has[id] = true;
        queue.push(watcher);

        if (!pending) {
          nextTick(flushSchedulerQueue);
          pending = true;
        }
      }
    }

    let id = 0;

    class Watcher {
      constructor(vm, fn, cb, options) {
        this.vm = vm;
        this.fn = fn;
        this.cb = cb;
        this.options = options;
        this.id = id++;
        this.depIds = new Set();
        this.getter = fn;
        this.deps = [];
        this.get();
      }

      addDep(dep) {
        let depId = dep.id;

        if (!this.depIds.has(depId)) {
          this.depIds.add(depId);
          this.deps.push(dep);
          dep.subs.push(this);
        }
      }

      get() {
        Dep.target = this;
        this.getter();
        Dep.target = null;
      }

      update() {
        queueWatcher(this);
      }

      run() {
        console.log('渲染触发');
        this.get();
      }

    }

    function createComponent$1(vm, tag, data, children, key, Ctor) {
      if (isObject(Ctor)) {
        Ctor = vm.$options._base.extend(Ctor);
      }

      data.hook = {
        init(vnode) {
          let child = vnode.componentInstance = new Ctor({});
          child.$mount();
        },

        prepatch() {},

        insert() {},

        destroy() {}

      };
      let componentVnode = vnode(vm, tag, data, undefined, key, undefined, {
        Ctor,
        children
      });
      return componentVnode;
    }

    function createElement(vm, tag, data = {}, ...children) {
      if (!isReservedTag(tag)) {
        let Ctor = vm.$options.components[tag];
        return createComponent$1(vm, tag, data, children, data.key, Ctor);
      }

      return vnode(vm, tag, data, children, data.key, undefined);
    }
    function createText(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }
    function isSameVnode(oldVnode, newVnode) {
      return newVnode.tag === oldVnode.tag && newVnode.key === oldVnode.key;
    }

    function vnode(vm, tag, data, children, key, text, componentOptions) {
      return {
        vm,
        tag,
        data,
        children,
        key,
        text,
        componentOptions
      };
    }

    function patch(oldVnode, vnode) {
      if (!oldVnode) {
        // 没有 oldVnode 说明是组件渲染，直接返回真实节点
        return createElm(vnode);
      }

      const isRealElement = oldVnode.nodeType;

      if (isRealElement) {
        const elm = createElm(vnode); // 创造真实节点

        const parentNode = oldVnode.parentNode;
        parentNode.insertBefore(elm, oldVnode.nextSibling);
        parentNode.removeChild(oldVnode);
        return elm;
      } else {
        if (!isSameVnode(oldVnode, vnode)) {
          createElm(vnode);
          return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
        }

        let el = vnode.el = oldVnode.el; // 文本节点

        if (!oldVnode.tag) {
          if (!oldVnode.text !== vnode.text) {
            return el.textContent = vnode.text;
          }
        }

        updateProperties(vnode, oldVnode.data); // 元素节点

        let oldChildren = oldVnode.children || [];
        let newChildren = vnode.children || [];

        if (oldChildren.length > 0 && newChildren.length === 0) {
          // 老节点存在子节点，新节点无
          el.innerHTML = '';
        } else if (newChildren.length > 0 && oldChildren.length === 0) {
          // 新节点存在子节点，老节点无
          newChildren.forEach(child => el.appendChild(createElm(child)));
        } else {
          updateChildren(el, oldChildren, newChildren);
        }
      }
    } // diff O(n)

    function updateChildren(el, oldChildren, newChildren) {
      let oldStartIndex = 0;
      let oldStartVnode = oldChildren[0];
      let oldEndIndex = oldChildren.length - 1;
      let oldEndVnode = oldChildren[oldEndIndex];
      let newStartIndex = 0;
      let newStartVnode = newChildren[0];
      let newEndIndex = newChildren.length - 1;
      let newEndVnode = newChildren[newEndIndex];

      function makeKeyByIndex() {
        let map = {};
        children.forEach((item, index) => {
          map[item.key] = index;
        });
        return map;
      }

      let mapping = makeKeyByIndex();

      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) {
          oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
          oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {
          patch(oldStartVnode, newStartVnode);
          oldStartVnode = oldChildren[++oldStartIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
          patch(oldEndVnode, newEndVnode);
          oldEndVnode = oldChildren[--oldEndIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) {
          patch(oldStartVnode, newEndVnode);
          el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
          oldStartVnode = oldChildren[++oldStartIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
          patch(oldEndVnode, newStartVnode);
          el.insertBefore(oldEndVnode.el, oldStartVnode.el);
          oldEndVnode = oldChildren[--oldEndIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else {
          let moveIndex = mapping[newStartVnode.key];

          if (moveIndex == null) {
            el.insertBefore(oldStartVnode.el, createElm(newStartVnode));
          } else {
            let moveVnode = oldChildren[moveIndex];
            el.insertBefore(moveVnode.el, oldStartVnode.el);
            patch(moveVnode, newStartVnode);
            oldChildren[moveIndex] = undefined;
          }

          newStartVnode = newChildren[++newStartIndex];
        }
      } // 新的多，插入


      if (newStartIndex <= newEndIndex) {
        // 查看当前节点的下一个元素是否存在(是否为 null)，存在就插入到下一个元素之前(inserBefore)，否则插入到最后(appendChild)
        const anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el;

        for (let i = newStartIndex; i < newEndIndex; i++) {
          // insertBefore(el, null) 相当于 appendChild
          // exmple
          // ABCD 老
          // FEABCD 新
          // F 插入到 A 前，之后 E 插入到 A 前，因此是 FE ABCD
          el.insertBefore(createElm(newChildren[i]), anchor);
        }
      } // 老的多，删除


      if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          let child = oldChildren[i]; // 由于乱序比对时，移动了 oldChildren 中的节点后，原来的节点位置会变成 undefined，此时的这个节点是不应该被移除的，因为它已经被摆放到了正确的位置上

          child && el.removeChild(child.el);
        }
      }
    }

    function createComponent(vnode) {
      let i = vnode.data;

      if ((i = i.hook) && (i = i.init)) {
        // 相当于如果 i.hook 存在，把 i.hook 赋值给 i
        // 接着如果 i.hook.init 存在，把 i.hook.init 赋值给 i
        i(vnode);
      }

      if (vnode.componentInstance) {
        // 说明是组件
        return true;
      }
    }

    function createElm(vnode) {
      let {
        tag,
        data,
        children,
        text,
        vm
      } = vnode;

      if (typeof tag === 'string') {
        if (createComponent(vnode)) {
          // 返回组件的真实节点
          return vnode.componentInstance.$el;
        }

        vnode.el = document.createElement(tag);
        updateProperties(vnode);
        children.forEach(child => {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        // text 没有 tag
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function updateProperties(vnode, oldProps = {}) {
      let newProps = vnode.data || {};
      let el = vnode.el;
      let newStyle = newProps.style || {};
      let oldStyle = oldProps.style || {};

      for (let key in oldStyle) {
        if (!newStyle[key]) {
          el.style[key] = '';
        }
      }

      for (let key in newProps) {
        if (key === 'style') {
          for (let key in newStyle) {
            el.style[key] = newStyle[key];
          }
        } else {
          el.setAttribute(key, newProps[key]);
        }
      }

      for (let key in oldProps) {
        if (!newProps[key]) {
          el.removeArttribute(key);
        }
      }
    }

    function mountComponent(vm) {
      const updateComponent = () => {
        vm._update(vm._render());
      };

      callHook(vm, 'beforeCreated');
      new Watcher(vm, updateComponent, () => {
        console.log('hook');
        callHook(vm, 'created');
      }, true);
      callHook(vm, 'mounted');
    }
    function lifecycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        const vm = this;
        let preVnode = vm._preVnode;
        vm._preVnode = vnode;

        if (!preVnode) {
          vm.$el = patch(vm.$el, vnode);
        } else {
          vm.$el = patch(preVnode, vnode);
        }
      };
    }
    function callHook(vm, hook) {
      let handlers = vm.$options[hook];
      console.log(vm.$options);
      console.log(handlers);
      handlers && handlers.forEach(handler => {
        handler.call(vm);
      });
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = mergeOptions(vm.constructor.options, options); // Vue 是全局的 Vue 构造函数，vm.constructor 可能是全局的 Vue，也可能是子类的构造函数，目前这里效果一样

        initState(vm);

        if (vm.$options.el) {
          console.log('页面挂载');
          vm.$mount(vm.$options.el);
        }
      };

      Vue.prototype.$mount = function (el) {
        const vm = this;
        const opts = vm.$options;
        el = document.querySelector(el);
        vm.$el = el;

        if (!opts.render) {
          // 模板编译
          let template = opts.template;

          if (!template) {
            template = el.outerHTML;
          }

          let render = compileToFunction(template);
          opts.render = render;
        }

        mountComponent(vm);
      };

      Vue.prototype.$nextTick = nextTick;
    }

    function renderMixin(Vue) {
      // 生成虚拟元素节点
      Vue.prototype._c = function (...args) {
        const vm = this;
        return createElement(vm, ...args);
      }; // 生成虚拟文本节点


      Vue.prototype._v = function (text) {
        const vm = this;
        return createText(vm, text);
      }; // 把属性变成字符串


      Vue.prototype._s = function (val) {
        if (isObject(val)) return JSON.stringify(val);
        return val;
      };

      Vue.prototype._render = function () {
        const vm = this;
        const {
          render
        } = vm.$options;
        const vnode = render.call(vm);
        return vnode;
      };
    }

    function Vue(options) {
      this._init(options);
    }

    initMixin(Vue);
    renderMixin(Vue);
    lifecycleMixin(Vue);
    initGlobalAPI(Vue);

    return Vue;

})));
//# sourceMappingURL=vue.js.map
