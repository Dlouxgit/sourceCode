import Watcher from './observe/watcher'

import { patch } from './vdom/patch'

export function mountComponent(vm) {
    const updateComponent = () => {
        vm._update(vm._render())
    }

    new Watcher(vm, updateComponent, () => {
        console.log('hook')
    }, true)
}

export function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm = this
        vm.$el = patch(vm.$el, vnode)
    }
}