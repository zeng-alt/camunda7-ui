import { defineComponent, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

const scriptFormatOptions = [
  { label: 'JavaScript (js)', value: 'js' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'Python', value: 'python' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'JRuby', value: 'jruby' },
  { label: 'BeanShell', value: 'beanshell' },
]

export { scriptFormatOptions }

export default defineComponent({
  name: 'ScriptFields',
  props: {
    scriptFormat: { type: String, default: 'js' },
    scriptValue: { type: String, default: '' },
    onUpdateScriptFormat: { type: Function as PropType<(val: string) => void>, required: true },
    onUpdateScriptValue: { type: Function as PropType<(val: string) => void>, required: true },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    return () => (
      <div class={`flex flex-col gap-${props.compact ? '4px' : '8px'}`}>
        {props.compact ? (
          <div class="flex gap-8px items-center">
            <span class="text-12px text-#888">{t('bpmnPanel.fields.scriptFormat')}:</span>
            <NSelect
              value={props.scriptFormat}
              onUpdateValue={(v: string | null) => props.onUpdateScriptFormat(v ?? 'js')}
              options={scriptFormatOptions}
              size={props.formSize}
              style="width:140px"
            />
          </div>
        ) : (
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.scriptFormat')}</div>
            <NSelect
              value={props.scriptFormat}
              onUpdateValue={(v: string | null) => props.onUpdateScriptFormat(v ?? 'js')}
              options={scriptFormatOptions}
              size={props.formSize}
            />
          </div>
        )}
        <div>
          {!props.compact && <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.scriptValue')}</div>}
          <NInput
            value={props.scriptValue}
            onUpdateValue={(v: string | null) => props.onUpdateScriptValue(v ?? '')}
            placeholder={t('bpmnPanel.placeholders.listenerScript')}
            size={props.formSize}
            type="textarea"
            rows={3}
          />
        </div>
      </div>
    )
  },
})
