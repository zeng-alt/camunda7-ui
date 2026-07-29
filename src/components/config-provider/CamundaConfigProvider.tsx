import { defineComponent, computed, provide, inject, watchEffect, type PropType } from 'vue'
import {
  NConfigProvider,
  darkTheme,
  zhCN as naiveZhCN,
  enUS as naiveEnUS,
  dateZhCN as naiveDateZhCN,
  dateEnUS as naiveDateEnUS,
  type GlobalThemeOverrides,
} from 'naive-ui'
import { configProviderInjectionKey, type LocaleType, type ThemeType } from './context'
import { setLocale } from '../../locales'

export default defineComponent({
  name: 'CamundaConfigProvider',
  props: {
    theme: {
      type: String as PropType<ThemeType>,
      default: undefined,
    },
    themeOverrides: {
      type: Object as PropType<GlobalThemeOverrides>,
      default: undefined,
    },
    locale: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    timeFormat: {
      type: String,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const parentConfig = inject(configProviderInjectionKey, null)

    const mergedTheme = computed(() => props.theme ?? parentConfig?.themeRef.value ?? 'light')
    const mergedLocale = computed(() => props.locale ?? parentConfig?.localeRef.value ?? 'zh-CN')
    const mergedTimeFormat = computed(
      () => props.timeFormat ?? parentConfig?.timeFormatRef.value ?? 'YYYY-MM-DD HH:mm:ss',
    )
    const mergedThemeOverrides = computed(
      () => props.themeOverrides ?? parentConfig?.themeOverridesRef.value,
    )

    const themeRef = computed(() => mergedTheme.value)
    const localeRef = computed(() => mergedLocale.value)
    const timeFormatRef = computed(() => mergedTimeFormat.value)
    const themeOverridesRef = computed(() => mergedThemeOverrides.value)

    const currentNaiveTheme = computed(() => {
      return mergedTheme.value === 'dark' ? darkTheme : null
    })

    const currentNaiveLocale = computed(() => {
      return mergedLocale.value === 'zh-CN' ? naiveZhCN : naiveEnUS
    })

    const currentNaiveDateLocale = computed(() => {
      return mergedLocale.value === 'zh-CN' ? naiveDateZhCN : naiveDateEnUS
    })

    watchEffect(() => {
      // Update internal vue-i18n locale whenever locale changes
      setLocale(mergedLocale.value)
    })

    watchEffect(() => {
      // Only the root provider should modify the document root class
      if (typeof document !== 'undefined' && !parentConfig) {
        if (mergedTheme.value === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    })

    provide(configProviderInjectionKey, {
      themeRef,
      localeRef,
      timeFormatRef,
      themeOverridesRef,
    })

    return () => (
      <NConfigProvider
        abstract
        theme={currentNaiveTheme.value}
        themeOverrides={mergedThemeOverrides.value}
        locale={currentNaiveLocale.value}
        dateLocale={currentNaiveDateLocale.value}
      >
        {slots.default?.()}
      </NConfigProvider>
    )
  },
})
