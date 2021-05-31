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
        let preVnode = vm._preVnode
        vm._preVnode = vnode
        if (!preVnode) {
            vm.$el = patch(vm.$el, vnode)
        } else {
            vm.$el = patch(preVnode, vnode)
        }
    }
}

export function callHook(vm, hook) {
    let handlers = vm.$options[hook]
    console.log(vm.$options)
    console.log(handlers)
    handlers && handlers.forEach(handler => {
        handler.call(vm)
    })
}