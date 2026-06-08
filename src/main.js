import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './assets/base.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Import ALL icons
import {
  faChartBar,
  faBullhorn,
  faComments,
  faUser,
  faLock,
  faDoorOpen,
  faMoneyBill,
  faCreditCard,
  faCheckCircle,
  faBuilding,
  faHouse,
  faBars,
  faBan,
  faStar,
  faMobileAlt,
  faRightFromBracket,
  faTrash,
  faXmark,
  faSpinner,
  faEnvelope,
  faExclamationTriangle,
  faInfoCircle,
  faCalendarAlt,
  faImage,
  faKey,
  faSave,
  faArrowLeft,
  faHashtag,
  faHome,
  faChartSimple,
  faSatelliteDish,
  faHeart,
  faCircle,
  faLandmark,
  faPhone,
  faEye,
  faEyeSlash,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'

// Add all icons to library
library.add(
  faChartBar,
  faBullhorn,
  faComments,
  faUser,
  faLock,
  faDoorOpen,
  faMoneyBill,
  faCreditCard,
  faCheckCircle,
  faBuilding,
  faHouse,
  faBars,
  faBan,
  faStar,
  faMobileAlt,
  faRightFromBracket,
  faTrash,
  faXmark,
  faSpinner,
  faEnvelope,
  faExclamationTriangle,
  faInfoCircle,
  faCalendarAlt,
  faImage,
  faKey,
  faSave,
  faArrowLeft,
  faHashtag,
  faHome,
  faChartSimple,
  faSatelliteDish,
  faHeart,
  faCircle,
  faLandmark,
  faPhone,
  faEye,
  faEyeSlash,
  faTimesCircle,
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')