
import presetRemToPx from '@unocss/preset-rem-to-px'

import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'

const FORM_TASK_ICON_SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="black" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z"/></svg>',
)

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      warn: true,
      prefix: ['i-'],
      collections: {
        ic: () => import('@iconify-json/ic/icons.json').then((m) => m.default),
      },
      extraProperties: {
        display: 'inline-block',
        width: '1em',
        height: '1em',
      },
    }),
    presetRemToPx({ baseFontSize: 4 }),
  ],
  shortcuts: [
    ['wh-full', 'w-full h-full'],
    ['f-c-c', 'flex justify-center items-center'],
    ['flex-col', 'flex flex-col'],
    ['card-border', 'border border-solid border-light_border dark:border-dark_border'],
    ['auto-bg', 'bg-white dark:bg-dark'],
    ['auto-bg-hover', 'hover:bg-#eaf0f1 hover:dark:bg-#1b2429'],
    ['auto-bg-highlight', 'bg-#eaf0f1 dark:bg-#1b2429'],
    ['text-highlight', 'rounded-4 px-8 py-2 auto-bg-highlight'],
    ['form-label-sm', 'text-11 text-#888'],
    ['form-label-md', 'text-12 text-#666'],
    ['form-label-lg', 'text-13 text-#555'],
  ],
  safelist: [
    'form-label-sm',
    'form-label-md',
    'form-label-lg',
    'form-task-icon',
  ],
  rules: [
    [
      'card-shadow',
      { 'box-shadow': '0 1px 2px -2px #00000029, 0 3px 6px #0000001f, 0 5px 12px 4px #00000017' },
    ],
  ],
  preflights: [
    {
      getCSS: () =>
        `.form-task-icon::before{content:'';display:inline-block;width:1em;height:1em;vertical-align:text-bottom;background-color:currentColor;-webkit-mask:url("data:image/svg+xml,${FORM_TASK_ICON_SVG}")no-repeat 0 0/100% 100%;mask:url("data:image/svg+xml,${FORM_TASK_ICON_SVG}")no-repeat 0 0/100% 100%}`,
    },
  ],
  theme: {
    colors: {
      primary: 'rgba(var(--primary-color))',
      dark: '#18181c',
      light_border: '#efeff5',
      dark_border: '#2d2d30',
    },
  },
})