import { defineComponent, type PropType, onMounted, onBeforeUnmount, ref } from 'vue'
import { CamundaConfigProvider } from '../config-provider'
import { type ThemeType, type LocaleType } from '../config-provider/context'
import { useCamundaI18n, setLocale, customTranslateModule } from '@/locales'
import { useCamundaLookups } from '@/composables'
import { NButton, NButtonGroup, NIcon, NLayout, NLayoutContent, NLayoutSider, NPopselect } from 'naive-ui'
import type { PageResult, CamundaLookupItem, ProcessLookupItem } from '@/composables'
import type { LocaleOption } from '../config-provider/context'
import CamundaPropertiesPanel from '../bpmn-panel/CamundaPropertiesPanel'
import './bpmn.css'
import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler'
import 'camunda-bpmn-js/dist/assets/camunda-platform-modeler.css'
import 'camunda-bpmn-js/dist/assets/diagram-js.css'
import 'camunda-bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import 'camunda-bpmn-js/dist/assets/bpmn-js.css'

const processId = `Process_${Math.random().toString(36).slice(2, 9)}`

const someDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" id="Definitions_0pw1fh7" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Modeler" exporterVersion="5.37.0" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="7.23.0">
  <bpmn:process id="${processId}" isExecutable="true" camunda:historyTimeToLive="180">
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export default defineComponent({
  name: 'BpmnModelerProcess',
  props: {
    theme: {
      type: String as PropType<ThemeType>,
      default: undefined,
    },
    locale: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    localeFallback: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    localeMessages: {
      type: Object as PropType<Record<string, Record<string, any>>>,
      default: undefined,
    },
    availableLocales: {
      type: Array as PropType<LocaleOption[]>,
      default: () => [
        { label: '中文', value: 'zh-CN' },
        { label: 'English', value: 'en-US' },
      ],
    },
    extraTabLabels: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
    },
    onSaveXml: {
      type: Function as PropType<(xml: string) => void>,
      default: null,
    },
    onSearchUsers: {
      type: Function as PropType<
        (name: string, pageNo?: number, pageSize?: number) => PageResult | Promise<PageResult>
      >,
      default: null,
    },
    onSearchUserGroups: {
      type: Function as PropType<
        (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
      >,
      default: null,
    },
    onFetchProcessList: {
      type: Function as PropType<() => ProcessLookupItem[] | Promise<ProcessLookupItem[]>>,
      default: null,
    },
    onSearchJavaClasses: {
      type: Function as PropType<
        (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
      >,
      default: null,
    },
    onSearchDelegateExpressions: {
      type: Function as PropType<
        (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
      >,
      default: null,
    },
    onSearchExternalTopics: {
      type: Function as PropType<
        (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
      >,
      default: null,
    },
    userResolver: {
      type: String,
      default: 'approverResolver.getUsers',
    },
    groupResolver: {
      type: String,
      default: 'approverResolver.getUserGroups',
    },
    onSearchDecisionRefs: {
      type: Function as PropType<
        (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
      >,
      default: null,
    },
    onSearchFormRefs: {
      type: Function as PropType<
        (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
      >,
      default: null,
    },
    onSearchFormKeys: {
      type: Function as PropType<
        (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
      >,
      default: null,
    },
  },
  emits: ['update:theme', 'update:locale'],
  setup(props, { emit, slots }) {
    const { t, currentLocale } = useCamundaI18n()

    const currentTheme = ref<ThemeType>(props.theme ?? 'light')
    const currentLocaleRef = ref<LocaleType>(props.locale ?? currentLocale.value ?? 'zh-CN')

    const canvasRef = ref<HTMLElement | null>(null)
    const modelerRef = ref<any>(null)
    let bpmnModeler: any = null

    onMounted(async () => {
      // 修复2：canvasRef.value 现在能正确拿到 DOM 节点（模板里加了 ref={canvasRef}）
      if (canvasRef.value) {
        bpmnModeler = new BpmnModeler({
          container: canvasRef.value,
          additionalModules: [
            // 国际化
            customTranslateModule,
          ],
        })
        modelerRef.value = bpmnModeler

        try {
          await bpmnModeler.importXML(someDiagram)
          console.log('success!')

          setupColorManager(bpmnModeler)

          let attempts = 0
          const tryFitViewport = () => {
            if (
              canvasRef.value &&
              canvasRef.value.clientWidth > 0 &&
              canvasRef.value.clientHeight > 0
            ) {
              bpmnModeler.get('canvas').zoom('fit-viewport')
            } else if (attempts < 10) {
              attempts++
              setTimeout(tryFitViewport, 50)
            }
          }
          tryFitViewport()
        } catch (err) {
          console.error('something went wrong:', err)
        }
      }
    })

    onBeforeUnmount(() => {
      if (bpmnModeler) {
        bpmnModeler.destroy()
      }
    })

    // 修复3：所有函数统一放在 setup 顶层，缩进一致
    function toggleMinimap() {
      if (bpmnModeler) {
        const minimap = bpmnModeler.get('minimap')
        if (minimap) minimap.toggle()
      }
    }

    function zoomIn() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas')
        const currentZoom = canvas.zoom()
        canvas.zoom(Math.min(currentZoom * 1.2, 3.0), 'auto')
      }
    }

    function zoomOut() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas')
        const currentZoom = canvas.zoom()
        canvas.zoom(Math.max(currentZoom / 1.2, 0.2), 'auto')
      }
    }

    function centerView() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas')
        canvas.zoom('fit-viewport')
      }
    }

    function lastStep() {
      if (bpmnModeler) {
        const commandStack = bpmnModeler.get('commandStack')
        if (commandStack.canUndo()) commandStack.undo()
      }
    }

    function nextStep() {
      if (bpmnModeler) {
        const commandStack = bpmnModeler.get('commandStack')
        if (commandStack.canRedo()) commandStack.redo()
      }
    }

    const showXml = async () => {
      if (bpmnModeler) {
        try {
          const { xml } = await bpmnModeler.saveXML({ format: true })
          if (props.onSaveXml) {
            props.onSaveXml(xml)
          } else {
            console.log(xml)
          }
        } catch (err) {
          console.error('Error saving XML', err)
        }
      }
    }

    function setupColorManager(modeler: any) {
      const elementRegistry = modeler.get('elementRegistry')
      elementRegistry.forEach((el: any) => reapplyElementColor(modeler, el))
      modeler.on('element.changed', ({ element }: any) => reapplyElementColor(modeler, element))
    }

    function reapplyElementColor(modeler: any, element: any) {
      const di = element.di
      if (!di) return
      const fill = di.get('color:background-color') || di.get('bioc:fill') || (di as any).fill
      const stroke = di.get('color:border-color') || di.get('bioc:stroke') || (di as any).stroke
      if (!fill && !stroke) return
      const elementRegistry = modeler.get('elementRegistry')
      const gfx = elementRegistry.getGraphics(element) as SVGElement | null
      if (!gfx) return
      const sel = '.djs-visual > :is(rect, circle, polygon, ellipse, path)'
      const visual = gfx.querySelector(sel) as SVGElement | null
      if (visual) {
        if (fill) visual.style.setProperty('fill', fill, 'important')
        if (stroke) visual.style.setProperty('stroke', stroke, 'important')
      }
    }

    function toggleTheme() {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
      emit('update:theme', currentTheme.value)
    }

    function handleLocaleChange(value: string) {
      currentLocaleRef.value = value as LocaleType
      setLocale(value as LocaleType)
      emit('update:locale', value)
      bpmnModeler?.get('eventBus')?.fire('i18n.changed')
    }

    const { registerLookups } = useCamundaLookups()
    registerLookups({
      searchUsers: props.onSearchUsers,
      searchUserGroups: props.onSearchUserGroups,
      fetchProcessList: props.onFetchProcessList,
      searchJavaClasses: props.onSearchJavaClasses,
      searchDelegateExpressions: props.onSearchDelegateExpressions,
      searchExternalTopics: props.onSearchExternalTopics,
      searchDecisionRefs: props.onSearchDecisionRefs,
      searchFormRefs: props.onSearchFormRefs,
      searchFormKeys: props.onSearchFormKeys,
    })

    const extraTabs: Record<string, any> = {
      'start-event': slots['start-event-extra'],
      'end-event': slots['end-event-extra'],
      'intermediate-throw-event': slots['intermediate-throw-event-extra'],
      'intermediate-catch-event': slots['intermediate-catch-event-extra'],
      task: slots['task-extra'],
      gateway: slots['gateway-extra'],
    }

    return () => (
      <CamundaConfigProvider
        theme={currentTheme.value}
        locale={currentLocaleRef.value}
        localeFallback={props.localeFallback}
        localeMessages={props.localeMessages}
      >
        {{
          default: () => (
            <NLayout has-sider sider-placement="right" position="absolute">
              <NLayoutContent
                class="h-full"
                content-style="height: 100%; display: flex; flex-direction: column;"
              >
                <div ref={canvasRef} class="bpmn-container" style="flex: 1; min-height: 0;" />
                <div
                  class="floating-btn-group"
                  style="position: absolute; top: 24px; right: 8px; z-index: 10;"
                >
                  <NButtonGroup size="small">
                    <NButton ghost onClick={zoomIn}>
                      <NIcon>
                        <span class="i-ic-baseline-add" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={zoomOut}>
                      <NIcon>
                        <span class="i-ic-baseline-remove" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={centerView}>
                      <NIcon>
                        <span class="i-ic-baseline-center-focus-strong" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={lastStep}>
                      <NIcon>
                        <span class="i-ic-baseline-undo" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={nextStep}>
                      <NIcon>
                        <span class="i-ic-baseline-redo" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={toggleMinimap}>
                      <NIcon>
                        <span class="i-ic-baseline-layers" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={showXml}>
                      <NIcon>
                        <span class="i-ic-baseline-code" />
                      </NIcon>
                    </NButton>
                    {slots.buttons?.({ modeler: modelerRef.value })}
                    <NPopselect
                      value={currentLocaleRef.value}
                      options={props.availableLocales as any}
                      onUpdateValue={handleLocaleChange}
                      trigger="click"
                    >
                      <NButton ghost>
                        <NIcon>
                          <span class="i-ic-baseline-language" />
                        </NIcon>
                      </NButton>
                    </NPopselect>
                    <NButton ghost onClick={toggleTheme}>
                      <NIcon>
                        <span
                          class={
                            currentTheme.value === 'dark'
                              ? 'i-ic-baseline-bedtime'
                              : 'i-ic-baseline-wb-sunny'
                          }
                        />
                      </NIcon>
                    </NButton>
                  </NButtonGroup>
                </div>
              </NLayoutContent>
              <NLayoutSider
                class="h-full"
                collapse-mode="width"
                collapsed-width={0}
                width={450}
                native-scrollbar={false}
                show-trigger="bar"
                content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
                bordered
              >
                <CamundaPropertiesPanel
                  bpmnModeler={modelerRef.value}
                  extraTabs={extraTabs}
                  extraTabLabels={props.extraTabLabels}
                  userResolver={props.userResolver}
                  groupResolver={props.groupResolver}
                />
              </NLayoutSider>
            </NLayout>
          ),
        }}
      </CamundaConfigProvider>
    )
  },
})
