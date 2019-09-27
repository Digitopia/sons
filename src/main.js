import Vue from 'vue'
import './registerServiceWorker'
import store from './store'

import App from './App'

Vue.config.productionTip = false

import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'

if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: 'https://d82cf1aeb5684dab87c8c13535def305@sentry.io/1384417',
        integrations: [new Integrations.Vue({ Vue, attachProps: true })],
    })
}

new Vue({
    store,
    render: h => h(App),
}).$mount('#app')
