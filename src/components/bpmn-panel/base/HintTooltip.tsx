import { defineComponent, type PropType } from 'vue'
import { NTooltip } from 'naive-ui'

export default defineComponent({
  name: 'HintTooltip',
  props: {
    // 表单标签文本
    label: { type: String, required: true },
    // 提示文本
    hint: { type: String, default: '' },
    // 提示 HTML
    hintHtml: { type: String, default: '' },
    // 悬浮层位置
    placement: { type: String as PropType<'top' | 'bottom' | 'left' | 'right'>, default: 'top' },
  },
  setup(props) {
    return () => (
      <NTooltip trigger="hover" placement={props.placement} style="max-width: 400px">
        {{
          trigger: () => (
            <span class="border-b border-dashed border-#1890ff text-#1890ff cursor-help text-12px">
              {props.label}
            </span>
          ),
          default: () => {
            if (!props.hintHtml) {
              return (
                <div style="white-space: pre-wrap; word-break: break-word; max-width: 360px; line-height: 1.6; font-size: 12px;">
                  {props.hint}
                </div>
              )
            }
            return (
              <div
                ref={(el: any) => {
                  if (el && el.innerHTML !== props.hintHtml) el.innerHTML = props.hintHtml
                }}
                style="white-space: pre-wrap; word-break: break-word; max-width: 360px; line-height: 1.6; font-size: 12px;"
              />
            )
          },
        }}
      </NTooltip>
    )
  },
})
