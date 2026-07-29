import { ref, computed } from 'vue'
import {
  zhCN as naiveZhCN,
  enUS as naiveEnUS,
  dateZhCN as naiveDateZhCN,
  dateEnUS as naiveDateEnUS,
} from 'naive-ui'
import zhCN from './zh.json'
import enUS from './en.json'
import { useCamundaConfig } from '../components/config-provider/context'

export type LocaleType = 'zh-CN' | 'en-US'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

// Global fallback if not used inside provider
const defaultLocale = ref<LocaleType>((localStorage.getItem('locale') as LocaleType) || 'zh-CN')

export function setLocale(locale: LocaleType) {
  defaultLocale.value = locale
  localStorage.setItem('locale', locale)
}

export const t = (key: string, locale?: LocaleType) => {
  const keys = key.split('.')
  let val: any = messages[locale || defaultLocale.value]
  for (const k of keys) {
    if (val === undefined) break
    val = val[k]
  }
  return val || key
}

export function useCamundaI18n() {
  const config = useCamundaConfig()
  
  const currentLocale = computed<LocaleType>(() => {
    return config?.localeRef.value || defaultLocale.value
  })

  const tLocal = (key: string) => t(key, currentLocale.value)

  return {
    t: tLocal,
    currentLocale
  }
}

export const naiveLocale = computed(() => {
  return defaultLocale.value === 'zh-CN' ? naiveZhCN : naiveEnUS
})

export const naiveDateLocale = computed(() => {
  return defaultLocale.value === 'zh-CN' ? naiveDateZhCN : naiveDateEnUS
})

export function camundaTranslate(template: string, replacements?: Record<string, string>) {
  replacements = replacements || {}

  const locale = defaultLocale.value
  const bpmnMessages = (messages[locale] as any)?.bpmn || {}
  template = bpmnMessages[template] || template

  return template.replace(/{([^}]+)}/g, function(_, key) {
    return replacements[key] || '{' + key + '}'
  })
}

export const customTranslateModule = {
  translate: ['value', camundaTranslate]
}

export const camundaTranslateModule = customTranslateModule
