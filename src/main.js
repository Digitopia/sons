import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'

Vue.config.productionTip = false

new Vue({
    render: h => h(App),
}).$mount('#app')

// Prevent context menu on mobile on long press
window.oncontextmenu = function(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    return false
}
