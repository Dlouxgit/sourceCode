import { mergeOptions } from '../utils'
export function initGlobalAPI(Vue) {
    Vue.options = {}
    Vue.mixin = function (options) {
        this.options = mergeOptions(this.options, options)
        return this
    }

    Vue.component = function name() {}
    Vue.filter = function name() {}
    Vue.directive = function name() {}
}