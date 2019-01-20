import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import store from './store'

Vue.config.productionTip = false

new Vue({
    store,
    render: h => h(App)
}).$mount('#app')

// Prevent context menu on mobile on long press
window.oncontextmenu = function(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    return false
}
