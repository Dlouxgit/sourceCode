import { compileToFunction } from './compiler'
import { initState } from './state'
import { mountComponent } from './lifecycle'
import { mergeOptions, nextTick } from './utils'

export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        vm.$options = mergeOptions(vm.constructor.options, options) // Vue 是全局的 Vue 构造函数，vm.constructor 可能是全局的 Vue，也可能是子类的构造函数，目前这里效果一样

        initState(vm)

        if (vm.$options.el) {
            console.log('页面挂载')
            vm.$mount(vm.$options.el)
        }
    }
    Vue.prototype.$mount = function (el) {
        const vm = this
        const opts = vm.$options
        el = document.querySelector(el)
        vm.$el = el
        if (!opts.render) {
            // 模板编译
            let template = opts.template
            
            if (!template) {
                template = el.outerHTML
            }
            let render = compileToFunction(el.outerHTML)
            opts.render = render
        }
        mountComponent(vm)
    }
    Vue.prototype.$nextTick = nextTick
}
