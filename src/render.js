import { isObject } from './utils'
import { createElement, createText } from './vdom'

export function renderMixin(Vue) {
    // 生成虚拟元素节点
    Vue.prototype._c = function (...args) {
        const vm = this
        return createElement(vm, ...args)
    }

    // 生成虚拟文本节点
    Vue.prototype._v = function (text) {
        const vm = this
        return createText(vm, text)
    }

    // 把属性变成字符串
    Vue.prototype._s = function (val) {
        if (isObject(val))
            return JSON.stringify(val)
        return val
    }


    Vue.prototype._render = function () {
        const vm = this
        const { render } = vm.$options
        const vnode = render.call(vm)
        return vnode
    }
}