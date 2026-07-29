import { ref, computed, reactive } from 'vue'
import {
  zhCN as naiveZhCN,
  enUS as naiveEnUS,
  dateZhCN as naiveDateZhCN,
  dateEnUS as naiveDateEnUS,
} from 'naive-ui'
import zhCN from './zh.json'
import enUS from './en.json'
import { useCamundaConfig } from '../components/config-provider/context'

export type LocaleType = 'zh-CN' | 'en-US' | (string & {})

function deepMerge(target: any, ...sources: any[]): any {
  if (!sources.length) return target
  const source = sources.shift()
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key]) && isObject(target[key])) {
        deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
  return deepMerge(target, ...sources)
}

function isObject(item: any): boolean {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

const messages: Record<string, any> = reactive({
  'zh-CN': zhCN,
  'en-US': enUS,
})

const defaultLocale = ref<LocaleType>(
  (localStorage.getItem('locale') as LocaleType) || 'zh-CN',
)

const defaultFallback = ref<LocaleType>('en-US')

export function setLocale(locale: LocaleType) {
  defaultLocale.value = locale
  localStorage.setItem('locale', locale)
}

export function setLocaleFallback(locale: LocaleType) {
  defaultFallback.value = locale
}

export function setLocaleMessages(locale: string, msgs: Record<string, any>) {
  if (messages[locale]) {
    deepMerge(messages[locale], msgs)
  } else {
    messages[locale] = deepMerge({}, msgs)
  }
}

export const t = (key: string, locale?: LocaleType, fallbackLocale?: LocaleType) => {
  const keys = key.split('.')

  function lookup(loc: string) {
    let val: any = messages[loc]
    if (!val) return undefined
    for (const k of keys) {
      if (val === undefined || val === null) return undefined
      val = val[k]
    }
    return val
  }

  const primary = locale || defaultLocale.value
  let result = lookup(primary)
  if (result !== undefined && result !== null) return result

  const fallback = fallbackLocale || defaultFallback.value
  if (fallback && fallback !== primary) {
    result = lookup(fallback)
    if (result !== undefined && result !== null) return result
  }

  return key
}

export function useCamundaI18n() {
  const config = useCamundaConfig()

  const currentLocale = computed<LocaleType>(() => {
    return config?.localeRef.value || defaultLocale.value
  })

  const currentFallback = computed<LocaleType | undefined>(() => {
    return config?.localeFallbackRef.value || defaultFallback.value
  })

  const tLocal = (key: string) => t(key, currentLocale.value, currentFallback.value)

  return {
    t: tLocal,
    currentLocale,
    currentFallback,
  }
}

export function resolveNaiveLocale(locale: string) {
  if (locale === 'zh-CN') return naiveZhCN
  if (locale === 'en-US') return naiveEnUS
  return naiveEnUS
}

export function resolveNaiveDateLocale(locale: string) {
  if (locale === 'zh-CN') return naiveDateZhCN
  if (locale === 'en-US') return naiveDateEnUS
  return naiveDateEnUS
}

export const naiveLocale = computed(() => {
  return resolveNaiveLocale(defaultLocale.value)
})

export const naiveDateLocale = computed(() => {
  return resolveNaiveDateLocale(defaultLocale.value)
})

export function camundaTranslate(template: string, replacements?: Record<string, string>) {
  replacements = replacements || {}

  const locale = defaultLocale.value
  const fallback = defaultFallback.value
  const bpmnMessages = (messages[locale] as any)?.bpmn || (messages[fallback] as any)?.bpmn || {}
  template = bpmnMessages[template] || template

  return template.replace(/{([^}]+)}/g, function (_, key) {
    return replacements[key] || '{' + key + '}'
  })
}

export const customTranslateModule = {
  translate: ['value', camundaTranslate],
}

export const camundaTranslateModule = customTranslateModule
