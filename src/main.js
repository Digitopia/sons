import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import store from './store'

Vue.config.productionTip = false

import * as Sentry from '@sentry/browser'

if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: 'https://d82cf1aeb5684dab87c8c13535def305@sentry.io/1384417',
        integrations: [new Sentry.Integrations.Vue({ Vue })],
    })
}

new Vue({
    store,
    render: h => h(App),
}).$mount('#app')
