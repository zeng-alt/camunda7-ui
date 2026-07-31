import { defineComponent, type PropType } from 'vue'
import { NModal } from 'naive-ui'
import { useCamundaI18n } from '@/locales'

export default defineComponent({
  name: 'RestoreStashDialog',
  props: {
    // 是否显示弹窗
    show: { type: Boolean, default: false },
    // 弹窗尺寸
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 确认（恢复）回调
    onPositive: { type: Function as PropType<() => any>, default: null },
    // 取消（放弃）回调
    onNegative: { type: Function as PropType<() => any>, default: null },
    // 弹窗显隐变更回调
    onUpdateShow: { type: Function as PropType<(value: boolean) => void>, default: null },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    return () => (
      <NModal
        show={props.show}
        preset="dialog"
        mask-closable={false}
        size={props.size}
        style="width: 420px;"
        title={t('bpmnPanel.autoStash.restore')}
        positiveText={t('common.confirm')}
        negativeText={t('common.cancel')}
        onPositiveClick={props.onPositive}
        onNegativeClick={props.onNegative}
        onUpdateShow={props.onUpdateShow}
        bordered={false}
      />
    )
  },
})
