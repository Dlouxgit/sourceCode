import Watcher from './observe/watcher'

export function mountComponent() {
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