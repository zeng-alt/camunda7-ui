import { defineComponent, type PropType } from 'vue'
import { NTooltip } from 'naive-ui'

export default defineComponent({
  name: 'HintTooltip',
  props: {
    label: { type: String, required: true },
    hint: { type: String, default: '' },
    hintHtml: { type: String, default: '' },
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
