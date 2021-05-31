import { isObject, mergeOptions } from '../utils'
export function initGlobalAPI(Vue) {
    Vue.options = {} // 全局属性，每个组件初始化时这些属性都会被放到组件上
    Vue.mixin = function (options) {
        this.options = mergeOptions(this.options, options)
        return this
    }

    Vue.options._base = Vue
    
    Vue.extend = function (opt) {
        const Super = this

        const Sub = function (options) {
            this._init(options)
        }

        Sub.prototype = Object.create(Super.prototype) // Object.create 会产生一个新的实例(new Fn(), Fn.prototype === Super.prototype)作为子类(Sub)的原型，此时 constructor 会指向错误
        Sub.prototype.constructor = Sub
        
        Sub.options = mergeOptions(Super.options, opt)
        return Sub
    }

    Vue.options.components = {}

    Vue.component = function (id, definition) {
        console.log('213213')
        let  name = definition.name = definition.name || id
        if (isObject(definition)) {
            definition = Vue.extend(definition)
        }
        Vue.options.components[name] = definition
    }
    Vue.filter = function name() {}
    Vue.directive = function name() {}
}