import { defineComponent } from 'vue'
import { NMessageProvider } from 'naive-ui'
import BpmnModelerProcessContent, {
  bpmnModelerProcessProps,
  type BpmnModelerProcessProps,
} from './BpmnModelerProcessContent'

export default defineComponent<BpmnModelerProcessProps>({
  name: 'BpmnModelerProcess',
  props: { ...bpmnModelerProcessProps },
  emits: ['update:theme', 'update:locale'],
  setup(props, { emit, slots }) {
    return () => (
      <NMessageProvider>
        <BpmnModelerProcessContent
          {...props}
          onUpdate:theme={(value: any) => emit('update:theme', value)}
          onUpdate:locale={(value: any) => emit('update:locale', value)}
          v-slots={slots}
        />
      </NMessageProvider>
    )
  },
})
