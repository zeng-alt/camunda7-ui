import { defineComponent, ref, watch, nextTick, type PropType } from 'vue'
import { NInput, NSelect, NButton, NModal, NSpace, NTag } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import LintFieldFeedback from '../lint/LintFieldFeedback'
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLineGutter,
  hoverTooltip,
  keymap,
} from '@codemirror/view'
import { EditorState, Compartment, type Extension } from '@codemirror/state'
import {
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldKeymap,
} from '@codemirror/language'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete'
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { combinedCompletionSource, allHoverTooltips } from '@/utils/camunda7/execution-completions'

const scriptFormatOptions = [
  { label: 'JavaScript (js)', value: 'js' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'Python', value: 'python' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'JRuby', value: 'jruby' },
  { label: 'BeanShell', value: 'beanshell' },
]

export { scriptFormatOptions }

const cmBaseTheme = EditorView.baseTheme({
  '&.cm-editor.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: "'Menlo', 'Consolas', 'Courier New', monospace",
    fontSize: '13px',
  },
  '.cm-content': { padding: '6px 0' },
  '.cm-gutters': { fontSize: '12px' },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: '1px solid rgba(125,125,125,.2)',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.08)',
    overflow: 'hidden',
    fontSize: '12px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: "'Menlo', 'Consolas', 'Courier New', monospace",
    maxHeight: '240px',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '5px 10px',
    lineHeight: '1.7',
    transition: 'background .08s',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected="true"]': {
    borderRadius: '3px',
  },
  '.cm-tooltip-autocomplete ul li .cm-completionIcon': {
    width: '18px',
    height: '18px',
    marginRight: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '.cm-tooltip-autocomplete ul li .cm-completionIcon::before': {
    fontSize: '13px',
  },
  '.cm-tooltip-autocomplete ul li .cm-completionDetail': {
    fontSize: '11px',
    marginLeft: 'auto',
    paddingLeft: '12px',
    fontFamily: 'inherit',
  },
  '.cm-tooltip-autocomplete .cm-completionInfo': {
    padding: '6px 10px',
    fontSize: '11px',
    borderTop: '1px solid rgba(125,125,125,.15)',
    lineHeight: '1.5',
    fontFamily: 'inherit',
  },
})

const variableContexts = [
  {
    prefix: 'execution',
    i18nKey: 'bpmnPanel.script.execution',
    descKey: 'bpmnPanel.script.executionDesc',
  },
  { prefix: 'task', i18nKey: 'bpmnPanel.script.task', descKey: 'bpmnPanel.script.taskDesc' },
  {
    prefix: 'variable',
    i18nKey: 'bpmnPanel.script.variables',
    descKey: 'bpmnPanel.script.variablesDesc',
  },
  {
    prefix: 'inputParameter',
    i18nKey: 'bpmnPanel.script.inputParameter',
    descKey: 'bpmnPanel.script.inputParameterDesc',
  },
  {
    prefix: 'outputParameter',
    i18nKey: 'bpmnPanel.script.outputParameter',
    descKey: 'bpmnPanel.script.outputParameterDesc',
  },
]

export default defineComponent({
  name: 'ScriptFields',
  props: {
    scriptFormat: { type: String, default: 'js' },
    scriptValue: { type: String, default: '' },
    onUpdateScriptFormat: { type: Function as PropType<(val: string) => void>, default: null },
    onUpdateScriptValue: { type: Function as PropType<(val: string) => void>, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    compact: { type: Boolean, default: false },
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    scriptFormatPropertyKey: { type: String, default: 'scriptFormat' },
    scriptValuePropertyKey: { type: String, default: 'scriptValue' },
    nested: { type: Boolean, default: false },
    showResultVariable: { type: Boolean, default: false },
    resultVariable: { type: String, default: '' },
    onUpdateResultVariable: { type: Function as PropType<(val: string) => void>, default: null },
    resultVariablePropertyKey: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperties, updateModdleProperties } = useBpmnProperties(props)
    const localFormat = ref('js')
    const localValue = ref('')
    const localResultVariable = ref('')

    const isAuto = () => props.businessObject && props.element && props.bpmnModeler
    const isResultVarAuto = () => props.businessObject && props.resultVariablePropertyKey

    function syncFromModel() {
      if (!isAuto()) return
      const bo = props.businessObject
      if (!bo) return
      localFormat.value = bo[props.scriptFormatPropertyKey] || 'js'
      localValue.value = bo[props.scriptValuePropertyKey] || ''
      if (isResultVarAuto()) localResultVariable.value = bo[props.resultVariablePropertyKey] || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function saveProp(key: string, val: any) {
      const attrs = { [key]: val || undefined }
      if (props.nested) {
        updateModdleProperties(attrs, props.businessObject)
      } else {
        updateProperties(attrs)
      }
    }

    function onFormatChange(val: string) {
      if (isAuto()) {
        localFormat.value = val
        saveProp(props.scriptFormatPropertyKey, val)
      } else if (props.onUpdateScriptFormat) {
        props.onUpdateScriptFormat(val)
      }
    }

    function onValueChange(val: string) {
      if (isAuto()) {
        localValue.value = val
        saveProp(props.scriptValuePropertyKey, val)
      } else if (props.onUpdateScriptValue) {
        props.onUpdateScriptValue(val)
      }
    }

    function onResultVariableChange(val: string) {
      if (isResultVarAuto()) {
        localResultVariable.value = val
        saveProp(props.resultVariablePropertyKey, val)
      } else if (props.onUpdateResultVariable) {
        props.onUpdateResultVariable(val)
      }
    }

    const displayFormat = () => (isAuto() ? localFormat.value : props.scriptFormat)
    const displayValue = () => (isAuto() ? localValue.value : props.scriptValue)
    const displayResultVariable = () =>
      isResultVarAuto() ? localResultVariable.value : props.resultVariable

    const showModal = ref(false)
    const modalValue = ref('')
    const cmContainer = ref<HTMLDivElement | null>(null)
    let cmView: EditorView | null = null
    let darkObserver: MutationObserver | null = null
    const themeCompartment = new Compartment()

    const dragOffset = ref({ x: 0, y: 0 })
    const isDragging = ref(false)
    let dragStart = { x: 0, y: 0 }

    function onDragMouseDown(e: MouseEvent) {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return
      isDragging.value = true
      dragStart = { x: e.clientX - dragOffset.value.x, y: e.clientY - dragOffset.value.y }
      document.addEventListener('mousemove', onDragMouseMove)
      document.addEventListener('mouseup', onDragMouseUp)
    }

    function onDragMouseMove(e: MouseEvent) {
      if (!isDragging.value) return
      dragOffset.value = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
    }

    function onDragMouseUp() {
      isDragging.value = false
      document.removeEventListener('mousemove', onDragMouseMove)
      document.removeEventListener('mouseup', onDragMouseUp)
    }

    function makeExtensions(): Extension[] {
      return [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
        ]),
        cmBaseTheme,
        javascript(),
        autocompletion({ activateOnTyping: true }),
        javascriptLanguage.data.of({ autocomplete: combinedCompletionSource }),
        ...allHoverTooltips.map((src) => hoverTooltip(src)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            modalValue.value = update.state.sliceDoc()
          }
        }),
        themeCompartment.of(
          typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
            ? oneDark
            : [],
        ),
      ]
    }

    function createCmView() {
      if (!cmContainer.value) return

      const state = EditorState.create({
        doc: modalValue.value,
        extensions: makeExtensions(),
      })

      cmView = new EditorView({
        state,
        parent: cmContainer.value,
      })
    }

    function destroyCmView() {
      if (darkObserver) {
        darkObserver.disconnect()
        darkObserver = null
      }
      if (cmView) {
        cmView.destroy()
        cmView = null
      }
    }

    function openEditor() {
      modalValue.value = displayValue()
      dragOffset.value = { x: 0, y: 0 }
      showModal.value = true
      nextTick(() => {
        if (displayFormat() === 'js') {
          createCmView()
        }
        darkObserver = new MutationObserver(() => {
          const dark = document.documentElement.classList.contains('dark')
          if (cmView) {
            cmView.dispatch({
              effects: themeCompartment.reconfigure(dark ? oneDark : []),
            })
          }
        })
        darkObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        })
      })
    }

    function closeEditor() {
      destroyCmView()
      showModal.value = false
    }

    function confirmEditor() {
      if (displayFormat() === 'js' && cmView) {
        modalValue.value = cmView.state.sliceDoc()
      }
      onValueChange(modalValue.value)
      closeEditor()
    }

    function renderModalContent() {
      const isJs = displayFormat() === 'js'
      return (
        <div class="flex flex-col gap-14px" style={{ minHeight: '320px' }}>
          <div class="flex flex-col gap-6px">
            <div class={labelClass.value}>{t('bpmnPanel.script.availableVariables')}</div>
            <div class="flex flex-wrap gap-6px">
              {variableContexts.map((ctx) => (
                <NTag key={ctx.prefix} size="small" round bordered>
                  {{
                    default: () => (
                      <span>
                        <span style="font-family: Menlo,Consolas,monospace; font-weight: 500; margin-right: 4px">
                          {ctx.prefix}
                        </span>
                        {t(ctx.i18nKey)}
                      </span>
                    ),
                  }}
                </NTag>
              ))}
            </div>
          </div>

          <div>
            <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.scriptFormat')}</div>
            <NSelect
              value={displayFormat()}
              onUpdateValue={(v: string | null) => onFormatChange(v ?? 'js')}
              options={scriptFormatOptions}
              size={props.formSize}
              style="max-width: 220px"
            />
          </div>

          <div style={{ flex: 1 }}>
            {isJs ? (
              <div
                ref={cmContainer}
                class="border border-solid border-light_border dark:border-dark_border rounded-4px overflow-hidden"
                style={{ minHeight: '260px' }}
              />
            ) : (
              <NInput
                value={modalValue.value}
                onUpdateValue={(v: string) => (modalValue.value = v)}
                placeholder={t('bpmnPanel.placeholders.listenerScript')}
                size={props.formSize}
                type="textarea"
                autosize={{ minRows: 10, maxRows: 20 }}
              />
            )}
          </div>
        </div>
      )
    }

    function renderBody() {
      const isJs = displayFormat() === 'js'
      const btnSize = props.compact ? 'tiny' : props.formSize

      return (
        <>
          {props.compact ? (
            <div class="flex gap-8px items-center">
              <span class="text-12px text-#888">{t('bpmnPanel.fields.scriptFormat')}:</span>
              <NSelect
                value={displayFormat()}
                onUpdateValue={(v: string | null) => onFormatChange(v ?? 'js')}
                options={scriptFormatOptions}
                size={props.formSize}
                style="width:140px"
              />
            </div>
          ) : (
            <div>
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.scriptFormat')}</div>
              <LintFieldFeedback
                businessObject={props.businessObject}
                bpmnModeler={props.bpmnModeler}
                fieldPath="scriptFormat"
              >
                <NSelect
                  value={displayFormat()}
                  onUpdateValue={(v: string | null) => onFormatChange(v ?? 'js')}
                  options={scriptFormatOptions}
                  size={props.formSize}
                />
              </LintFieldFeedback>
            </div>
          )}

          {props.compact ? (
            <div class="flex gap-4px items-center">
              <NInput
                value={displayValue()}
                onUpdateValue={(v: string) => onValueChange(v)}
                placeholder={
                  isJs ? 'execution.getVariable("")' : t('bpmnPanel.placeholders.listenerScript')
                }
                size="tiny"
                class="flex-1"
                type="textarea"
                autosize
                style="font-family: Menlo,Consolas,monospace; font-size:12px"
              />
              <NButton size="tiny" text type="primary" onClick={openEditor}>
                {t('bpmnPanel.buttons.editScript')}
              </NButton>
            </div>
          ) : (
            <div>
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.scriptValue')}</div>
              <div class="flex gap-6px">
                <NInput
                  value={displayValue()}
                  onUpdateValue={(v: string) => onValueChange(v)}
                  placeholder={
                    isJs ? 'execution.getVariable("")' : t('bpmnPanel.placeholders.listenerScript')
                  }
                  size={props.formSize}
                  class="flex-1"
                  style="font-family: Menlo,Consolas,monospace"
                  type="textarea"
                  autosize
                />
                <NButton
                  text
                  type="primary"
                  size={btnSize}
                  onClick={openEditor}
                  style={{ flexShrink: 0 }}
                >
                  {t('bpmnPanel.buttons.editScript')}
                </NButton>
              </div>
            </div>
          )}

          {props.showResultVariable && (
            <div>
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.resultVariable')}</div>
              <NInput
                value={displayResultVariable()}
                onUpdateValue={(v: string | null) => onResultVariableChange(v ?? '')}
                size={props.formSize}
              />
            </div>
          )}
        </>
      )
    }

    return () => (
      <>
        <div class={`flex flex-col gap-${props.compact ? '4px' : '8px'}`}>{renderBody()}</div>
        <NModal
          show={showModal.value}
          onUpdateShow={(v: boolean) => {
            if (!v) closeEditor()
          }}
          onClose={closeEditor}
          preset="card"
          closable
          style={{
            width: '720px',
            maxHeight: '85vh',
            transform: `translate(${dragOffset.value.x}px, ${dragOffset.value.y}px)`,
          }}
          size={props.formSize}
          segmented
          maskClosable={false}
        >
          {{
            default: () => renderModalContent(),
            header: () => (
              <div
                onMousedown={onDragMouseDown}
                style={{
                  cursor: isDragging.value ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  flex: 1,
                }}
              >
                {t('bpmnPanel.script.title')}
              </div>
            ),
            footer: () => (
              <NSpace justify="end">
                <NButton onClick={closeEditor} size={props.formSize}>
                  {t('bpmnPanel.buttons.cancel')}
                </NButton>
                <NButton type="primary" onClick={confirmEditor} size={props.formSize}>
                  {t('bpmnPanel.buttons.confirm')}
                </NButton>
              </NSpace>
            ),
          }}
        </NModal>
      </>
    )
  },
})
