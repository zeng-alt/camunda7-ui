import { computed } from 'vue'
import * as NaiveUI from 'naive-ui'
import { isNullOrUndef } from './is'
import { naiveLocale, naiveDateLocale, t } from '../locales'
import type {
  MessageApi,
  DialogApi,
  MessageOptions,
  DialogOptions,
  LoadingBarApi,
  NotificationApi,
  MessageReactive,
} from 'naive-ui'

declare global {
  interface Window {
    $loadingBar: LoadingBarApi
    $notification: NotificationApi
    $message: ReturnType<typeof setupMessage>
    $dialog: ReturnType<typeof setupDialog>
  }
}

type MessageType = 'info' | 'success' | 'warning' | 'error' | 'loading'

export function setupMessage(NMessage: MessageApi) {
  class Message {
    static instance: Message
    message!: Record<string, MessageReactive>
    removeTimer!: Record<string, ReturnType<typeof setTimeout>>

    constructor() {
      // 单例模式
      if (Message.instance) return Message.instance
      Message.instance = this
      this.message = {}
      this.removeTimer = {}
    }

    removeMessage(key: string, duration = 5000) {
      this.removeTimer[key] && clearTimeout(this.removeTimer[key])
      this.removeTimer[key] = setTimeout(() => {
        this.message[key]?.destroy()
      }, duration)
    }

    destroy(key: string, duration = 200) {
      setTimeout(() => {
        this.message[key]?.destroy()
      }, duration)
    }

    showMessage(
      type: MessageType,
      content: string | string[],
      option: MessageOptions & { key?: string } = {},
    ) {
      if (Array.isArray(content)) {
        return content.forEach((msg) => NMessage[type](msg, option))
      }

      if (!option.key) {
        return NMessage[type](content, option)
      }

      const currentMessage = this.message[option.key]
      if (currentMessage) {
        currentMessage.type = type as any
        currentMessage.content = content
      } else {
        this.message[option.key] = NMessage[type](content, {
          ...option,
          duration: 0,
          onAfterLeave: () => {
            if (option.key) delete this.message[option.key]
          },
        })
      }
      this.removeMessage(option.key, option.duration ?? 5000)
    }

    loading(content: string | string[], option?: MessageOptions & { key?: string }) {
      this.showMessage('loading', content, option)
    }

    success(content: string | string[], option?: MessageOptions & { key?: string }) {
      this.showMessage('success', content, option)
    }

    error(content: string | string[], option?: MessageOptions & { key?: string }) {
      this.showMessage('error', content, option)
    }

    info(content: string | string[], option?: MessageOptions & { key?: string }) {
      this.showMessage('info', content, option)
    }

    warning(content: string | string[], option?: MessageOptions & { key?: string }) {
      this.showMessage('warning', content, option)
    }
  }

  return new Message()
}

type ExtendedDialogOptions = DialogOptions & {
  confirm?: () => boolean | Promise<boolean> | void | Promise<void>
  cancel?: () => boolean | Promise<boolean> | void | Promise<void>
  type?: 'info' | 'success' | 'warning' | 'error' | 'create'
}

type ExtendedDialogApi = DialogApi & {
  confirm?: (option?: ExtendedDialogOptions) => any
}

export function setupDialog(NDialog: ExtendedDialogApi) {
  NDialog.confirm = function (option: ExtendedDialogOptions = {}) {
    const showIcon = !isNullOrUndef(option.title)
    const type = option.type || 'warning'
    
    return NDialog[type]({
      showIcon,
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: option.confirm,
      onNegativeClick: option.cancel,
      onMaskClick: option.cancel,
      ...option,
    })
  }

  return NDialog
}

export function setupNaiveDiscreteApi() {
  const configProviderProps = computed(() => ({
    locale: naiveLocale.value,
    dateLocale: naiveDateLocale.value,
  }))

  const { message, dialog, notification, loadingBar } = NaiveUI.createDiscreteApi(
    ['message', 'dialog', 'notification', 'loadingBar'],
    { configProviderProps },
  )

  window.$loadingBar = loadingBar
  window.$notification = notification
  window.$message = setupMessage(message)
  window.$dialog = setupDialog(dialog)
}
