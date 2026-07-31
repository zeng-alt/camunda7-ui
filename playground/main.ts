import 'virtual:uno.css'
import '../src/styles/reset.css'
import '../src/styles/global.css'

import { createApp } from 'vue'
import { setupNaiveDiscreteApi } from '../src/utils'
import App from './App.vue'

async function bootstrap() {
  console.log('hello');
  
  const app = createApp(App)
  setupNaiveDiscreteApi()
  app.mount('#app')
}

bootstrap()
