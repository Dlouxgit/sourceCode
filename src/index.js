import { initGlobalAPI } from './global-api'
import { initMixin } from './init'
import { lifecycleMixin } from './lifecycle'
import { renderMixin } from './render'

function Vue(options) {
    this._init(options)
}

initMixin(Vue)

renderMixin(Vue)

lifecycleMixin(Vue)

initGlobalAPI(Vue)

export default Vue