import { ref, onBeforeUnmount, type Ref } from 'vue'

export interface UseXmlStashOptions {
  autoStash: boolean
  stashKey: string
  hasExternalXml: () => boolean
  saveXml: () => Promise<string>
  loadDiagram: (xml: string) => Promise<void>
}

export interface UseXmlStash {
  showRestoreDialog: Ref<boolean>
  pendingStashXml: Ref<string>
  debounceStash: () => void
  checkStash: () => void
  handleRestoreStash: () => void
  handleDiscardStash: () => void
  flushStash: () => void
}

export function useXmlStash(options: UseXmlStashOptions): UseXmlStash {
  const showRestoreDialog = ref(false)
  const pendingStashXml = ref('')
  let stashTimer: ReturnType<typeof setTimeout> | null = null
  let latestXml = ''

  async function doStash() {
    if (!options.autoStash) return
    try {
      latestXml = await options.saveXml()
      try {
        localStorage.setItem(options.stashKey, latestXml)
      } catch {
        // storage full or unavailable
      }
    } catch {
      // ignore
    }
  }

  function debounceStash() {
    if (!options.autoStash) return
    if (stashTimer) clearTimeout(stashTimer)
    stashTimer = setTimeout(doStash, 2000)
  }

  function checkStash() {
    if (options.hasExternalXml() || !options.autoStash) return
    try {
      const stashed = localStorage.getItem(options.stashKey)
      if (stashed) {
        pendingStashXml.value = stashed
        showRestoreDialog.value = true
      }
    } catch {
      // ignore
    }
  }

  function handleRestoreStash() {
    showRestoreDialog.value = false
    if (pendingStashXml.value) {
      latestXml = pendingStashXml.value
      options.loadDiagram(pendingStashXml.value)
    }
    pendingStashXml.value = ''
  }

  function handleDiscardStash() {
    showRestoreDialog.value = false
    pendingStashXml.value = ''
  }

  function flushStash() {
    doStash()
    if (latestXml) {
      try {
        localStorage.setItem(options.stashKey, latestXml)
      } catch {
        // storage full or unavailable
      }
    }
  }

  onBeforeUnmount(() => {
    if (stashTimer) clearTimeout(stashTimer)
  })

  return {
    showRestoreDialog,
    pendingStashXml,
    debounceStash,
    checkStash,
    handleRestoreStash,
    handleDiscardStash,
    flushStash,
  }
}
