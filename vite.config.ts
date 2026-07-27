import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import Unocss from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    Unocss(),
    AutoImport({
      imports: ['vue'],
      dts: false,
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: false,
    }),
    dts({
      tsconfigPath: './tsconfig.app.json',
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
      'camunda7-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'Camunda7UI',
      fileName: (format) => `camunda7-ui.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'naive-ui', 'vue-i18n', '@vueuse/core'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'naive-ui': 'naiveUi',
          'vue-i18n': 'VueI18n',
          '@vueuse/core': 'VueUse',
        },
      },
    },
  },
})
