import Watcher from './observe/watcher'

import { patch } from './vdom/patch'

export function mountComponent(vm) {
    const updateComponent = () => {
        vm._update(vm._render())
    }

    callHook(vm, 'beforeCreated')

    new Watcher(vm, updateComponent, () => {
        console.log('hook')
        callHook(vm, 'created')
    }, true)
    callHook(vm, 'mounted')
}

export function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm = this
        vm.$el = patch(vm.$el, vnode)
    }
}

export function callHook(vm, hook) {
    let handlers = vm.$options[hook]
    console.log(vm.$options)
    console.log(handlers)
    debugger
    handlers && handlers.forEach(handler => {
        handler.call(vm)
    })
}