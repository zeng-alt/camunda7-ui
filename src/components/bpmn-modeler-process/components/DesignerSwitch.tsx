import { defineComponent, type PropType } from 'vue'
import { NButton, NButtonGroup } from 'naive-ui'
import { useCamundaI18n } from '@/locales'

export default defineComponent({
  name: 'DesignerSwitch',
  props: {
    // 按钮尺寸：small / medium / large
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否专业模式
    proDesigner: { type: Boolean, default: true },
    // 是否显示模式切换按钮
    showDesignerSwitch: { type: Boolean, default: true },
    // 模式切换回调
    onSetProDesigner: { type: Function as PropType<(value: boolean) => void>, default: null },
  },
  setup(props, { slots }) {
    const { t } = useCamundaI18n()

    return () => {
      if (!slots.footer && !props.showDesignerSwitch) return null
      return (
        <div class="absolute bottom-12px left-1/2 -translate-x-1/2 z-10">
          <NButtonGroup size={props.size}>
            {slots.footer && slots.footer()}
            {props.showDesignerSwitch && (
              <div class="mx-8px">
                <NButton
                  type={props.proDesigner ? 'primary' : 'default'}
                  onClick={() => props.onSetProDesigner?.(true)}
                >
                  {t('bpmnPanel.designerSwitch.pro')}
                </NButton>
                <NButton
                  type={!props.proDesigner ? 'primary' : 'default'}
                  onClick={() => props.onSetProDesigner?.(false)}
                >
                  {t('bpmnPanel.designerSwitch.restricted')}
                </NButton>
              </div>
            )}
          </NButtonGroup>
        </div>
      )
    }
  },
})
