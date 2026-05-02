import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

// creating pinia instance
const pinia = createPinia()

// register the persistence plugin
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
