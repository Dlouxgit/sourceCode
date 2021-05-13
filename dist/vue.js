(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

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

    function isFunction(val) {
      return typeof val === 'function';
    }
    function isObject(val) {
      return typeof val === 'object' && val !== null;
    }
    let isArray = Array.isArray;

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

    // 2.每个原型上都有一个constructor属性 指向 函数本身 Function.prototype.constrcutr = Function

    class Observer {
      constructor(value) {
        // 不让__ob__ 被遍历到
        // value.__ob__ = this; // 我给对象和数组添加一个自定义属性
        Object.defineProperty(value, '__ob__', {
          value: this,
          enumerable: false // 标识这个属性不能被列举出来，不能被循环到

        });

        if (isArray(value)) {
          // 更改数组原型方法, 如果是数组 我就改写数组的原型链
          value.__proto__ = arrayMethods; // 重写数组的方法

          this.observeArray(value);
        } else {
          this.walk(value); // 核心就是循环对象
        }
      }

      observeArray(data) {
        // 递归遍历数组，对数组内部的对象再次重写 [[]]  [{}]
        // vm.arr[0].a = 100;
        // vm.arr[0] = 100;
        data.forEach(item => observe(item)); // 数组里面如果是引用类型那么是响应式的
      }

      walk(data) {
        Object.keys(data).forEach(key => {
          // 要使用defineProperty重新定义
          defineReactive(data, key, data[key]);
        });
      }

    } // vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以好性能，如果层次过深也会浪费性能
    // 1.性能优化的原则：
    // 1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
    // 2) 不要写数据的时候 层次过深， 尽量扁平化数据 
    // 3) 不要频繁获取数据
    // 4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 


    function defineReactive(obj, key, value) {
      // vue2 慢的原因 主要在这个方法中
      observe(value); // 递归进行观测数据，不管有多少层 我都进行defineProperty

      Object.defineProperty(obj, key, {
        get() {
          // 后续会有很多逻辑
          return value; // 闭包，次此value 会像上层的value进行查找
        },

        set(newValue) {
          // 如果设置的是一个对象那么会再次进行劫持
          if (newValue === value) return;
          observe(newValue);
          console.log('修改');
          value = newValue;
        }

      });
    }

    function observe(value) {
      // 1.如果value不是对象，那么就不用观测了，说明写的有问题
      if (!isObject(value)) {
        return;
      }

      if (value.__ob__) {
        return; // 一个对象不需要重新被观测
      } // 需要对对象进行观测 （最外层必须是一个{} 不能是数组）
      // 如果一个数据已经被观测过了 ，就不要在进行观测了， 用类来实现，我观测过就增加一个标识 说明观测过了，在观测的时候 可以先检测是否观测过，如果观测过了就跳过检测


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
        depId = dep.id;

        if (!this.depIds.has(depId)) {
          this.depIds.add(depId);
          this.deps.push(dep);
          dep.subs.push(this);
        }
      }

      get() {
        this.getter();
      }

      update() {
        this.get();
      }

    }

    function patch(el, vnode) {
      const elm = createElm(vnode); // 创造真实节点

      const parentNode = el.parentNode;
      debugger;
      parentNode.insertBefore(elm, el.nextSibling);
      parentNode.removeChild(el);
      return elm;
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
        vnode.el = document.createElement(tag);
        updateProperties(vnode.el, data);
        children.forEach(child => {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        // text 没有 tag
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function updateProperties(el, props = {}) {
      for (let key in props) {
        el.setAttribute(key, props[key]);
      }
    }

    function mountComponent(vm) {
      const updateComponent = () => {
        vm._update(vm._render());
      };

      new Watcher(vm, updateComponent, () => {
        console.log('hook');
      }, true);
    }
    function lifecycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        const vm = this;
        vm.$el = patch(vm.$el, vnode);
      };
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = options;
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

          debugger;
          let render = compileToFunction(el.outerHTML);
          opts.render = render;
        }

        mountComponent(vm);
      };
    }

    function createElement(vm, tag, data = {}, ...children) {
      return vnode(vm, tag, data, children, data.key, undefined);
    }
    function createText(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }

    function vnode(vm, tag, data, children, key, text) {
      debugger;
      return {
        vm,
        tag,
        data,
        children,
        key,
        text
      };
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

    return Vue;

})));
//# sourceMappingURL=vue.js.map
