import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect, NButton } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

interface HeaderEntry {
  _key: number
  key: string
  value: string
}

interface OutputParam {
  _key: number
  name: string
  value: string
}

let keySeq = 0

function createDefaultHeader(): HeaderEntry {
  return { _key: keySeq++, key: '', value: '' }
}

function createDefaultOutput(): OutputParam {
  return { _key: keySeq++, name: '', value: '' }
}

const connectorIdOptions = [
  { label: 'HTTP Connector', value: 'http-connector' },
]

const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' },
]

export { connectorIdOptions, httpMethodOptions }

export default defineComponent({
  name: 'ConnectorFields',
  props: {
    businessObject: { type: Object as PropType<any>, required: true },
    element: { type: Object as PropType<any>, required: true },
    bpmnModeler: { type: Object, required: true },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const connectorId = ref('')
    const method = ref('GET')
    const url = ref('')
    const headers = ref<HeaderEntry[]>([])
    const body = ref('')
    const outputParams = ref<OutputParam[]>([])

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return

      const conn = bo.extensionElements?.values?.find(
        (v: any) => v.$type === 'camunda:Connector'
      )
      if (!conn) {
        connectorId.value = ''
        method.value = 'GET'
        url.value = ''
        headers.value = []
        body.value = ''
        outputParams.value = []
        return
      }

      connectorId.value = conn.connectorId || ''
      const io = conn.inputOutput
      method.value = 'GET'
      url.value = ''
      headers.value = []
      body.value = ''

      if (io) {
        const inputs: any[] = Array.isArray(io.inputParameters) ? io.inputParameters : []
        for (const p of inputs) {
          if (p.name === 'method') method.value = p.value || 'GET'
          else if (p.name === 'url') url.value = p.value || ''
          else if (p.name === 'headers' && p.definition?.$type === 'camunda:Map') {
            headers.value = (p.definition.entries || []).map((e: any) => ({
              _key: keySeq++,
              key: e.key || '',
              value: e.value || '',
            }))
          }
          else if (p.name === 'body') body.value = p.value || ''
        }

        const outputs: any[] = Array.isArray(io.outputParameters) ? io.outputParameters : []
        outputParams.value = outputs.map((p: any) => ({
          _key: keySeq++,
          name: p.name || '',
          value: p.value || '',
        }))
      } else {
        outputParams.value = []
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }

      let connector = bo.extensionElements.values.find(
        (v: any) => v.$type === 'camunda:Connector'
      )

      if (!connectorId.value) {
        if (connector) {
          bo.extensionElements.values = bo.extensionElements.values.filter(
            (v: any) => v !== connector
          )
          modeling.updateProperties(toRaw(props.element), {
            extensionElements: bo.extensionElements,
          })
        }
        return
      }

      if (!connector) {
        connector = moddle.create('camunda:Connector', { connectorId: connectorId.value })
        bo.extensionElements.values.push(connector)
      }

      connector.connectorId = connectorId.value

      let io = connector.inputOutput
      if (!io) {
        io = moddle.create('camunda:InputOutput')
        connector.inputOutput = io
      }

      const inputParams: any[] = []
      if (method.value) {
        inputParams.push(
          moddle.create('camunda:InputParameter', { name: 'method', value: method.value })
        )
      }
      if (url.value) {
        inputParams.push(
          moddle.create('camunda:InputParameter', { name: 'url', value: url.value })
        )
      }

      const validHeaders = headers.value.filter((h) => h.key)
      if (validHeaders.length > 0) {
        const entries = validHeaders.map((h) =>
          moddle.create('camunda:Entry', { key: h.key, value: h.value })
        )
        inputParams.push(
          moddle.create('camunda:InputParameter', {
            name: 'headers',
            definition: moddle.create('camunda:Map', { entries }),
          })
        )
      }

      if (body.value) {
        inputParams.push(
          moddle.create('camunda:InputParameter', { name: 'body', value: body.value })
        )
      }

      io.inputParameters = inputParams
      io.outputParameters = outputParams.value
        .filter((p) => p.name)
        .map((p) =>
          moddle.create('camunda:OutputParameter', { name: p.name, value: p.value })
        )

      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
    }

    function onConnectorIdChange(val: string | null) {
      connectorId.value = val ?? ''
      if (!val) {
        method.value = 'GET'
        url.value = ''
        headers.value = []
        body.value = ''
        outputParams.value = []
      }
      save()
    }

    function onMethodChange(val: string | null) { method.value = val ?? 'GET'; save() }
    function onUrlChange(val: string | null) { url.value = val ?? ''; save() }
    function onBodyChange(val: string | null) { body.value = val ?? ''; save() }

    function addHeader() { headers.value = [...headers.value, createDefaultHeader()]; save() }
    function removeHeader(index: number) { headers.value = headers.value.filter((_, i) => i !== index); save() }
    function updateHeader(index: number, field: 'key' | 'value', val: string) {
      headers.value = headers.value.map((h, i) => (i === index ? { ...h, [field]: val } : h))
      save()
    }

    function addOutput() { outputParams.value = [...outputParams.value, createDefaultOutput()]; save() }
    function removeOutput(index: number) { outputParams.value = outputParams.value.filter((_, i) => i !== index); save() }
    function updateOutput(index: number, field: 'name' | 'value', val: string) {
      outputParams.value = outputParams.value.map((p, i) => (i === index ? { ...p, [field]: val } : p))
      save()
    }

    return () => {
      const isHttp = connectorId.value === 'http-connector'

      return (
        <div>
          <div class="mb-8px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.connectorId')}</div>
            <NSelect
              value={connectorId.value || null}
              onUpdateValue={onConnectorIdChange}
              options={connectorIdOptions}
              size={props.formSize}
              placeholder={t('bpmnPanel.placeholders.connectorId')}
              clearable
            />
          </div>

          {isHttp && (
            <>
              <div class="text-12px font-bold mb-8px mt-16px">
                {t('bpmnPanel.fields.connectorInputs')}
              </div>

              <div class="mb-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.url')}</div>
                <NInput
                  value={url.value}
                  onUpdateValue={onUrlChange}
                  placeholder={t('bpmnPanel.placeholders.url')}
                  size={props.formSize}
                />
              </div>
              <div class="mb-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.httpMethod')}</div>
                <NSelect
                  value={method.value}
                  onUpdateValue={onMethodChange}
                  options={httpMethodOptions}
                  size={props.formSize}
                />
              </div>

              <div class="mb-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.headers')}</div>
                {headers.value.length === 0 ? (
                  <NButton size="tiny" onClick={addHeader} class="w-full justify-center">
                    + {t('bpmnPanel.buttons.addHeader')}
                  </NButton>
                ) : (
                  <div class="flex flex-col gap-4px">
                    {headers.value.map((h, i) => (
                      <div class="flex gap-4px items-center">
                        <NInput
                          value={h.key}
                          onUpdateValue={(v: string | null) => updateHeader(i, 'key', v ?? '')}
                          placeholder={t('bpmnPanel.placeholders.parameterKey')}
                          size={props.formSize}
                          style="flex:1"
                        />
                        <span class="text-12px text-#888">:</span>
                        <NInput
                          value={h.value}
                          onUpdateValue={(v: string | null) => updateHeader(i, 'value', v ?? '')}
                          placeholder={t('bpmnPanel.placeholders.parameterValue')}
                          size={props.formSize}
                          style="flex:1"
                        />
                        <NButton text type="error" size="tiny" onClick={() => removeHeader(i)}>
                          {t('bpmnPanel.buttons.delete')}
                        </NButton>
                      </div>
                    ))}
                    <NButton size="tiny" onClick={addHeader} class="w-full justify-center">
                      + {t('bpmnPanel.buttons.addHeader')}
                    </NButton>
                  </div>
                )}
              </div>

              <div class="mb-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.requestBody')}</div>
                <NInput
                  value={body.value}
                  onUpdateValue={onBodyChange}
                  placeholder={t('bpmnPanel.placeholders.requestBody')}
                  size={props.formSize}
                  type="textarea"
                  rows={3}
                />
              </div>

              <div class="text-12px font-bold mb-8px mt-16px">
                {t('bpmnPanel.fields.connectorOutputs')}
              </div>
              {outputParams.value.length === 0 ? (
                <NButton size="tiny" onClick={addOutput} class="w-full justify-center">
                  + {t('bpmnPanel.buttons.addOutput')}
                </NButton>
              ) : (
                <div class="flex flex-col gap-4px">
                  {outputParams.value.map((p, i) => (
                    <div class="flex gap-4px items-center">
                      <NInput
                        value={p.name}
                        onUpdateValue={(v: string | null) => updateOutput(i, 'name', v ?? '')}
                        placeholder={t('bpmnPanel.placeholders.outputName')}
                        size={props.formSize}
                        style="flex:1"
                      />
                      <NInput
                        value={p.value}
                        onUpdateValue={(v: string | null) => updateOutput(i, 'value', v ?? '')}
                        placeholder={t('bpmnPanel.placeholders.parameterValue')}
                        size={props.formSize}
                        style="flex:2"
                      />
                      <NButton text type="error" size="tiny" onClick={() => removeOutput(i)}>
                        {t('bpmnPanel.buttons.delete')}
                      </NButton>
                    </div>
                  ))}
                  <NButton size="tiny" onClick={addOutput} class="w-full justify-center">
                    + {t('bpmnPanel.buttons.addOutput')}
                  </NButton>
                </div>
              )}
            </>
          )}
        </div>
      )
    }
  },
})
