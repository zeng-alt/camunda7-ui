import { defineComponent, type PropType, onMounted, onBeforeUnmount, ref } from 'vue';
import { CamundaConfigProvider } from '../config-provider';
import { type ThemeType, type LocaleType } from '../config-provider/context';
import { useCamundaI18n, setLocale } from '@/locales';
import { NButton, NButtonGroup, NIcon, NLayout, NLayoutContent, NLayoutSider } from 'naive-ui'
import CamundaPropertiesPanel from '../bpmn-panel/CamundaPropertiesPanel'
import './bpmn.css'
import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler';
import 'camunda-bpmn-js/dist/assets/camunda-platform-modeler.css';
import 'camunda-bpmn-js/dist/assets/diagram-js.css';
import 'camunda-bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'camunda-bpmn-js/dist/assets/bpmn-js.css';

const someDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="156" y="82" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

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
  },
  emits: ['update:theme', 'update:locale'],
  setup(props, { emit }) {
    const { t, currentLocale } = useCamundaI18n();

    const currentTheme = ref<ThemeType>(props.theme ?? 'light')
    const currentLocaleRef = ref<LocaleType>(props.locale ?? currentLocale.value ?? 'zh-CN')

    const canvasRef = ref<HTMLElement | null>(null);
    const modelerRef = ref<any>(null);
    let bpmnModeler: any = null;

    onMounted(async () => {
      // 修复2：canvasRef.value 现在能正确拿到 DOM 节点（模板里加了 ref={canvasRef}）
      if (canvasRef.value) {
        bpmnModeler = new BpmnModeler({
          container: canvasRef.value,
        });
        modelerRef.value = bpmnModeler;

        try {
          await bpmnModeler.importXML(someDiagram);
          console.log('success!');

          let attempts = 0;
          const tryFitViewport = () => {
            if (canvasRef.value && canvasRef.value.clientWidth > 0 && canvasRef.value.clientHeight > 0) {
              bpmnModeler.get('canvas').zoom('fit-viewport');
            } else if (attempts < 10) {
              attempts++;
              setTimeout(tryFitViewport, 50);
            }
          };
          tryFitViewport();
        } catch (err) {
          console.error('something went wrong:', err);
        }
      }
    });

    onBeforeUnmount(() => {
      if (bpmnModeler) {
        bpmnModeler.destroy();
      }
    });

    // 修复3：所有函数统一放在 setup 顶层，缩进一致
    function toggleMinimap() {
      if (bpmnModeler) {
        const minimap = bpmnModeler.get('minimap');
        if (minimap) minimap.toggle();
      }
    }

    function zoomIn() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas');
        const currentZoom = canvas.zoom();
        canvas.zoom(Math.min(currentZoom * 1.2, 3.0), 'auto');
      }
    }

    function zoomOut() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas');
        const currentZoom = canvas.zoom();
        canvas.zoom(Math.max(currentZoom / 1.2, 0.2), 'auto');
      }
    }

    function centerView() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas');
        canvas.zoom('fit-viewport');
      }
    }

    function lastStep() {
      if (bpmnModeler) {
        const commandStack = bpmnModeler.get('commandStack');
        if (commandStack.canUndo()) commandStack.undo();
      }
    }

    function nextStep() {
      if (bpmnModeler) {
        const commandStack = bpmnModeler.get('commandStack');
        if (commandStack.canRedo()) commandStack.redo();
      }
    }

    const showXml = async () => {
      if (bpmnModeler) {
        try {
          const { xml } = await bpmnModeler.saveXML({ format: true });
          console.log(xml);
        } catch (err) {
          console.error('Error saving XML', err);
        }
      }
    };

    function toggleTheme() {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
      emit('update:theme', currentTheme.value)
    }

    function toggleLocale() {
      const next = currentLocaleRef.value === 'zh-CN' ? 'en-US' : 'zh-CN'
      currentLocaleRef.value = next
      setLocale(next)
      emit('update:locale', next)
    }

    return () => (
      <CamundaConfigProvider theme={currentTheme.value} locale={currentLocaleRef.value}>
        {{
          default: () => (
            <NLayout has-sider sider-placement="right" position="absolute">
              <NLayoutContent class="h-full" content-style="height: 100%; display: flex; flex-direction: column;">
                <div ref={canvasRef} class="bpmn-container" style="flex: 1; min-height: 0;" />
               
                <div class="floating-btn-group" style="position: absolute; top: 24px; right: 8px; z-index: 10;">
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
                    <NButton ghost onClick={toggleLocale}>
                      <NIcon>
                        <span class="i-ic-baseline-language" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={toggleTheme}>
                      <NIcon>
                        <span class={currentTheme.value === 'dark' ? 'i-ic-baseline-bedtime' : 'i-ic-baseline-wb-sunny'} />
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
                <CamundaPropertiesPanel bpmnModeler={modelerRef.value} />
              </NLayoutSider>
            </NLayout>
          )
        }}
      </CamundaConfigProvider>
    );
  },
});
