import Vue from 'vue'
import VueRouter from 'vue-router'
import index from './views/index.vue'
import audios from './views/audios.vue'
import './registerServiceWorker'
import store from './store'

import App from './App'

Vue.use(VueRouter)

Vue.config.productionTip = false

import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'

if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: 'https://d82cf1aeb5684dab87c8c13535def305@sentry.io/1384417',
        integrations: [new Integrations.Vue({ Vue, attachProps: true })],
    })
}

const router = new VueRouter({
    mode: 'history',
    routes: [
        { path: '/sons', component: index },
        { path: '/sons/audios', component: audios },
    ],
})

new Vue({
    store,
    router,
    render: h => h(App),
}).$mount('#app')
