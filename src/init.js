import { compileToFunction } from './compiler'
import { initState } from './state'
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        vm.$options = options

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
        if (!vm.render) {
            // 模板编译
            let template = opts.template
            
            if (!template) {
                let render = compileToFunction(el.outerHTML)
                opts.render = render
            }

        }
    }
}
