import { defineComponent } from 'vue'
import { NMessageProvider } from 'naive-ui'
import BpmnModelerProcessContent, {
  bpmnModelerProcessProps,
  type BpmnModelerProcessProps,
} from './BpmnModelerProcessContent'

/**
 *  BPMN 模型器进程组件 
 * props
 *  - theme: 主题配置，默认值为 'dark'
 *  - proDesigner: 是否使用专业模式，默认值为 false
 *  - designerConfig: 设计器配置，默认值为 {}
 *  - extraTabLabels: 额外标签页标签，默认值为 []
 *  - onSearchUsers: 搜索用户回调，默认值为 null
 *  - autoStash: 是否自动保存存档，默认值为 false
 *  - onSearchUserGroups: 搜索用户组回调，默认值为 null
 *  - onSearchJavaClasses: 搜索 Java 类回调，默认值为 null
 *  - onSearchDelegateExpressions: 搜索委托表达式回调，默认值为 null
 *  - onSearchExternalTopics: 搜索外部任务主题回调，默认值为 null
 *  - onFetchProcessList: 获取流程列表回调，默认值为 null
 *  - onSearchDecisionRefs: 搜索决策引用回调，默认值为 null
 *  - onSearchFormRefs: 搜索表单引用回调，默认值为 null
 *  - onSearchFormKeys: 搜索表单键回调，默认值为 null
 *  - localeMessages: 本地化消息配置，默认值为 null
 *  - availableLocales: 可用语言配置，默认值为 null
 *  - onPublish: 发布回调，默认值为 null
 *  - onPublishError: 发布错误回调，默认值为 null
 *  - onPublishSuccess: 发布成功回调，默认值为 null
 *  - onPublishCancel: 发布取消回调，默认值为 null
 * emits
 *  - update:theme: 主题配置更新事件
 *  - update:locale: 本地化消息配置更新事件
 *  - update:proDesigner: 专业模式更新事件
 * @author zjj
 * @version 1.0.0
 * 
*/
export default defineComponent<BpmnModelerProcessProps>({
  name: 'BpmnModelerProcess',
  props: { ...bpmnModelerProcessProps },
  emits: ['update:theme', 'update:locale', 'update:proDesigner'],
  setup(props, { emit, slots }) {
    return () => (
      <NMessageProvider>
        <BpmnModelerProcessContent
          {...props}
          onUpdate:theme={(value: any) => emit('update:theme', value)}
          onUpdate:locale={(value: any) => emit('update:locale', value)}
          onUpdate:proDesigner={(value: any) => emit('update:proDesigner', value)}
          v-slots={slots}
        />
      </NMessageProvider>
    )
  },
})
