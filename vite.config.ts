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

// bpmn-font ships a legacy @font-face that references EOT/SVG fonts (relative
// URLs). Vite inlines them as data URIs during the build, which makes browsers
// attempt to decode the unsupported EOT format and log
// "Failed to decode downloaded font". Modern browsers only need WOFF/TTF, so we
// drop that @font-face at the PostCSS stage (reliable for node_modules CSS,
// unlike a plugin transform hook which rolldown may skip).
const stripBpmnLegacyFonts = {
  postcssPlugin: 'strip-bpmn-legacy-fonts',
  Once(css: any) {
    css.walkAtRules('font-face', (rule: any) => {
      if (rule.toString().includes('embedded-opentype')) rule.remove()
    })
  },
}

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
      bundleTypes: true,
    }),
  ],
  server: {
    proxy: {
      '/engine-rest': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: {
      plugins: [stripBpmnLegacyFonts],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
      'camunda7-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      // 让 playground 直接使用源码（否则会经 package.json exports 解析到 dist，改动需重新 build 才能生效）。
      // 注意：带子路径的别名需放在不带子路径之前，否则会被前缀匹配吞掉。
      '@zeng-alt/camunda7-ui/style.css': fileURLToPath(new URL('./src/styles/global.css', import.meta.url)),
      '@zeng-alt/camunda7-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  build: {
    copyPublicDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'Camunda7UI',
      fileName: (format) => `camunda7-ui.${format}.js`,
    },
    rollupOptions: {
      external: [
        'vue',
        'naive-ui',
        'vue-i18n',
        '@vueuse/core',
        '@codemirror/autocomplete',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/lang-javascript',
        '@codemirror/theme-one-dark',
      ],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'naive-ui': 'naiveUi',
          'vue-i18n': 'VueI18n',
          '@vueuse/core': 'VueUse',
          '@codemirror/view': 'CodeMirrorView',
          '@codemirror/state': 'CodeMirrorState',
          '@codemirror/language': 'CodeMirrorLanguage',
          '@codemirror/commands': 'CodeMirrorCommands',
          '@codemirror/autocomplete': 'CodeMirrorAutocomplete',
          '@codemirror/lang-javascript': 'CodeMirrorLangJavascript',
          '@codemirror/theme-one-dark': 'CodeMirrorThemeOneDark',
        },
      },
    },
  },
})
