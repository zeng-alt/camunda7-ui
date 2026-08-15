<script setup lang="ts">
import {
  BpmnModelerProcess,
  BpmnPreviewModal,
  createOpenAiAdapter,
  type ThemeType,
  type LocaleType,
  type DesignerConfig,
} from '@zeng-alt/camunda7-ui'

import { ref } from 'vue'
import type { ProcessLookupItem, FormSchemaField, CamundaDictItem } from '@zeng-alt/camunda7-ui'
import request from './utils/request'

const theme = ref<ThemeType>('dark')
const locale = ref<LocaleType>('zh-CN')
const proDesigner = ref(true)
const previewModalRef = ref<InstanceType<typeof BpmnPreviewModal> | null>(null)
const modelerProcessRef = ref<InstanceType<typeof BpmnModelerProcess> | null>(null)

// 演示图：含「生成表单」全局表单 + 表单任务，可直接测试操作表单字段选择（无需 onLoadFormSchema）
const demoXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" id="Definitions_demo" targetNamespace="http://bpmn.io/schema/bpmn" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="7.23.0">
  <bpmn:process id="Process_demo" isExecutable="true" camunda:historyTimeToLive="180">
    <bpmn:extensionElements>
      <camunda:properties>
        <camunda:property name="globalForm.type" value="generated" />
        <camunda:property name="globalForm.formRef" value="" />
        <camunda:property name="globalForm.binding" value="deployment" />
        <camunda:property name="globalForm.version" value="" />
        <camunda:property name="globalForm.formKey" value="" />
        <camunda:property name="globalForm.fields" value="[{&quot;id&quot;:&quot;name&quot;,&quot;label&quot;:&quot;姓名&quot;,&quot;type&quot;:&quot;string&quot;,&quot;defaultValue&quot;:&quot;&quot;,&quot;datePattern&quot;:&quot;&quot;,&quot;constraints&quot;:{},&quot;properties&quot;:[],&quot;enumValues&quot;:[]},{&quot;id&quot;:&quot;age&quot;,&quot;label&quot;:&quot;年龄&quot;,&quot;type&quot;:&quot;long&quot;,&quot;defaultValue&quot;:&quot;&quot;,&quot;datePattern&quot;:&quot;&quot;,&quot;constraints&quot;:{},&quot;properties&quot;:[],&quot;enumValues&quot;:[]},{&quot;id&quot;:&quot;birthday&quot;,&quot;label&quot;:&quot;生日&quot;,&quot;type&quot;:&quot;date&quot;,&quot;defaultValue&quot;:&quot;&quot;,&quot;datePattern&quot;:&quot;yyyy-MM-dd&quot;,&quot;constraints&quot;:{},&quot;properties&quot;:[],&quot;enumValues&quot;:[]},{&quot;id&quot;:&quot;level&quot;,&quot;label&quot;:&quot;等级&quot;,&quot;type&quot;:&quot;enum&quot;,&quot;defaultValue&quot;:&quot;&quot;,&quot;datePattern&quot;:&quot;&quot;,&quot;constraints&quot;:{},&quot;properties&quot;:[],&quot;enumValues&quot;:[{&quot;id&quot;:&quot;A&quot;,&quot;name&quot;:&quot;高级&quot;},{&quot;id&quot;:&quot;B&quot;,&quot;name&quot;:&quot;中级&quot;},{&quot;id&quot;:&quot;C&quot;,&quot;name&quot;:&quot;初级&quot;}]}]" />
      </camunda:properties>
    </bpmn:extensionElements>
    <bpmn:startEvent id="StartEvent_1" name="开始" />
    <bpmn:serviceTask id="Activity_formTask" name="表单任务" camunda:modelerTemplate="camunda7-ui:form-task" camunda:delegateExpression="\${formService}" />
    <bpmn:endEvent id="EndEvent_1" name="结束" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_formTask" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_formTask" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_demo">
      <bpmndi:BPMNShape id="BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_Activity_formTask" bpmnElement="Activity_formTask">
        <dc:Bounds x="280" y="82" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_EndEvent_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="440" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_1" bpmnElement="Flow_1">
        <di:waypoint x="216" y="118" />
        <di:waypoint x="280" y="122" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_2" bpmnElement="Flow_2">
        <di:waypoint x="380" y="122" />
        <di:waypoint x="440" y="118" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
// const designerConfig = ref<DesignerConfig>({
//   elements: {
//     'bpmn:SubProcess': false,
//     'bpmn:UserTask': false,
//     'bpmn:StartEvent#bpmn:ConditionalEventDefinition': false,
//     'bpmn:EndEvent#bpmn:ErrorEventDefinition': false,
//   },
//   tabs: {
//     input: false,
//     output: false,
//     extensionProperties: false,
//   },
// })
// const extraTabLabels = ref({
//   'start-event': '自定义配置',
//   'end-event': '自定义配置',
// })

const localeMessages = {
  'de-DE': {
    bpmnPanel: {
      types: {
        process: 'Prozess',
      },
    },
  },
}

const availableLocales = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: 'Deutsch', value: 'de-DE' },
]

const mockUsers = [
  { label: '张三', value: 'zhangsan' },
  { label: '李四', value: 'lisi' },
  { label: '王五', value: 'wangwu' },
  { label: '赵六', value: 'zhaoliu' },
  { label: '孙七', value: 'sunqi' },
  { label: '周八', value: 'zhouba' },
  { label: '吴九', value: 'wujiu' },
  { label: '郑十', value: 'zhengshi' },
  { label: 'Alice Johnson', value: 'alice' },
  { label: 'Bob Smith', value: 'bob' },
  { label: 'Charlie Brown', value: 'charlie' },
  { label: 'Diana Prince', value: 'diana' },
  { label: 'Eve Wilson', value: 'eve' },
  { label: 'Frank Miller', value: 'frank' },
  { label: 'Grace Lee', value: 'grace' },
  { label: 'Henry Taylor', value: 'henry' },
  { label: 'Ivy Chen', value: 'ivy' },
  { label: 'Jack Davis', value: 'jack' },
  { label: 'Kate Moore', value: 'kate' },
  { label: 'Leo Garcia', value: 'leo' },
]

const mockGroups = [
  { label: '管理层', value: 'management' },
  { label: '工程部', value: 'engineering' },
  { label: '销售部', value: 'sales' },
  { label: '市场部', value: 'marketing' },
  { label: '人力资源', value: 'hr' },
  { label: '财务部', value: 'finance' },
  { label: '运维组', value: 'operations' },
  { label: '质量保障', value: 'qa' },
  { label: '设计部', value: 'design' },
  { label: '产品部', value: 'product' },
]

const mockJavaClasses = [
  { label: '用户服务', value: 'com.example.service.UserService' },
  { label: '订单服务', value: 'com.example.service.OrderService' },
  { label: '通知服务', value: 'com.example.service.NotificationService' },
  { label: '支付处理', value: 'com.example.service.PaymentProcessor' },
  { label: '审批监听器', value: 'com.example.listener.ApprovalListener' },
  { label: '邮件发送器', value: 'com.example.util.MailSender' },
  { label: '报告生成器', value: 'com.example.util.ReportGenerator' },
  { label: '数据校验器', value: 'com.example.validator.DataValidator' },
  { label: '日志过滤器', value: 'com.example.filter.LogFilter' },
  { label: '缓存管理器', value: 'com.example.cache.CacheManager' },
  { label: '任务分配器', value: 'com.example.assignment.TaskAssigner' },
  { label: '积分计算器', value: 'com.example.score.ScoreCalculator' },
]

const mockDecisions = [
  { label: '信用评估', value: 'Decision_credit_score', version: ['1.0', '1.1'] },
  { label: '贷款审批', value: 'Decision_loan_approval', version: ['2.0', '2.1'] },
  { label: '风险评级', value: 'Decision_risk_rating', version: ['1.0'] },
  { label: '欺诈检测', value: 'Decision_fraud_detection', version: ['3.0'] },
  { label: '定价策略', value: 'Decision_pricing', version: ['1.0', '1.2', '2.0'] },
]

const mockFormRefs = [
  { label: '请假申请表单', value: 'form-leave-request', version: ['1.0', '1.1'] },
  { label: '报销表单', value: 'form-expense-claim', version: ['2.0'] },
  { label: '入职登记表', value: 'form-onboarding', version: ['1.0'] },
  { label: '合同审批表单', value: 'form-contract-approval', version: ['1.0', '1.2'] },
  { label: '客户反馈表单', value: 'form-feedback', version: ['1.0'] },
]

const mockFormKeys = [
  { label: '请假申请', value: 'embedded:app:leave-request.html' },
  { label: '报销申请', value: 'embedded:app:expense-claim.html' },
  { label: '入职登记', value: 'embedded:app:onboarding.html' },
  { label: '合同审批', value: 'embedded:app:contract-approval.html' },
  { label: '出差申请', value: 'embedded:app:travel-request.html' },
]

const mockTopics = [
  { label: '订单处理', value: 'order-processing' },
  { label: '支付回调', value: 'payment-callback' },
  { label: '邮件发送', value: 'email-sending' },
  { label: '消息通知', value: 'notification' },
  { label: '数据同步', value: 'data-sync' },
  { label: '报表生成', value: 'report-generation' },
  { label: '用户注册', value: 'user-registration' },
  { label: '审批流转', value: 'approval-workflow' },
]

const mockProcessList: ProcessLookupItem[] = [
  { label: '采购审批流程', value: 'Process_purchase_approval', version: ['1.0', '1.1'] },
  { label: '请假审批流程', value: 'Process_leave_approval', version: ['2.0'] },
  { label: '报销流程', value: 'Process_expense_claim', version: ['1.0', '1.2', '2.0'] },
  { label: '入职办理流程', value: 'Process_onboarding', version: ['1.0'] },
  { label: '合同管理流程', value: 'Process_contract_mgmt', version: ['3.0', '3.1'] },
  { label: '订单处理流程', value: 'Process_order_fulfillment', version: ['1.0'] },
  { label: '退款流程', value: 'Process_refund', version: ['2.0', '2.1'] },
  { label: '风险控制流程', value: 'Process_risk_control', version: ['1.0'] },
  { label: '客户投诉处理', value: 'Process_complaint', version: ['1.0', '1.1', '1.2'] },
  { label: '项目立项流程', value: 'Process_project_init', version: ['1.0'] },
]

const mockDelegateExpressions = [
  { label: '用户服务委托', value: '${userService}' },
  { label: '订单服务委托', value: '${orderService}' },
  { label: '审批服务委托', value: '${approvalService}' },
  { label: '通知服务委托', value: '${notificationService}' },
  { label: '邮件服务委托', value: '${mailService}' },
  { label: '日志服务委托', value: '${logService}' },
  { label: '缓存服务委托', value: '${cacheService}' },
  { label: '计算引擎委托', value: '${calculationEngine}' },
  { label: '工作流引擎委托', value: '${workflowEngine}' },
  { label: '规则引擎委托', value: '${ruleEngine}' },
]

async function handlePublish(modeler: any) {
  try {
    debugger
    // console.log('hello')
    const { xml } = await modeler.saveXML({ format: true })
    const rootElement = modeler.get('canvas').getRootElement()
    const processName = rootElement?.businessObject?.name || `deployment-${Date.now()}`
    const formData = new FormData()
    const deploymentName = processName
    formData.append('deployment-name', deploymentName)
    formData.append('deployment-source', 'camunda7-ui')
    formData.append('diagram.bpmn', new Blob([xml], { type: 'text/xml' }), 'diagram.bpmn')
    await request.post('/deployment/create', formData)
    alert('发布成功')
  } catch (e: any) {
    console.log('发布失败: ' + (e?.response?.data?.message || e.message));
    
    alert('发布失败: ' + (e?.response?.data?.message || e.message))
  }
}

async function handlePreview(modeler: any) {
  const { xml } = await modeler.saveXML({ format: true })
  previewModalRef.value?.open(xml)
}

/** 切换 Token 仿真（演示通过 ref 暴露的编程式 API） */
function toggleSimulation() {
  modelerProcessRef.value?.toggleTokenSimulation()
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function onSearchUsers(name: string, pageNo = 1, pageSize = 20) {
  await delay(200)
  const filtered = name
    ? mockUsers.filter(
        (u) =>
          u.label.includes(name) || u.value.toLowerCase().includes(name.toLowerCase()),
      )
    : mockUsers
  const start = (pageNo - 1) * pageSize
  return {
    pageNum: pageNo,
    pageSize,
    data: filtered.slice(start, start + pageSize),
    total: filtered.length,
  }
}

async function onSearchUserGroups(name: string) {
  await delay(150)
  if (!name) return mockGroups
  return mockGroups.filter(
    (g) =>
      g.label.includes(name) || g.value.toLowerCase().includes(name.toLowerCase()),
  )
}

async function onSearchJavaClasses(name: string) {
  await delay(200)
  if (!name) return mockJavaClasses
  return mockJavaClasses.filter(
    (c) =>
      c.label.includes(name) || c.value.toLowerCase().includes(name.toLowerCase()),
  )
}

async function onSearchExternalTopics(name: string) {
  await delay(150)
  if (!name) return mockTopics
  return mockTopics.filter(
    (t) =>
      t.label.includes(name) || t.value.toLowerCase().includes(name.toLowerCase()),
  )
}

async function onFetchProcessList() {
  await delay(300)
  return mockProcessList
}

async function onSearchDecisionRefs(name: string) {
  await delay(200)
  if (!name) return mockDecisions
  return mockDecisions.filter(
    (d) =>
      d.label.includes(name) || d.value.toLowerCase().includes(name.toLowerCase()),
  )
}

async function onSearchFormRefs(name: string) {
  await delay(200)
  if (!name) return mockFormRefs
  return mockFormRefs.filter(
    (f) =>
      f.label.includes(name) || f.value.toLowerCase().includes(name.toLowerCase()),
  )
}

async function onSearchFormKeys(name: string) {
  await delay(150)
  if (!name) return mockFormKeys
  return mockFormKeys.filter(
    (f) =>
      f.label.includes(name) || f.value.toLowerCase().includes(name.toLowerCase()),
  )
}

async function onSearchDelegateExpressions(name: string) {
  await delay(150)
  if (!name) return mockDelegateExpressions
  return mockDelegateExpressions.filter(
    (d) =>
      d.label.includes(name) || d.value.toLowerCase().includes(name.toLowerCase()),
  )
}

// 演示全局表单结构加载：返回含对象/数组/日期/枚举的嵌套字段树，
// 供“操作表单”级联选择字段并按类型渲染输入框
const mockFormSchema: FormSchemaField[] = [
  { name: 'name', label: '姓名', type: 'string' },
  { name: 'age', label: '年龄', type: 'long' },
  { name: 'score', label: '分数', type: 'double' },
  { name: 'active', label: '启用', type: 'boolean' },
  { name: 'birthday', label: '生日', type: 'date', datePattern: 'yyyy-MM-dd' },
  { name: 'meetingAt', label: '会议时间', type: 'date', datePattern: 'yyyy-MM-dd HH:mm:ss' },
  {
    name: 'level',
    label: '等级',
    type: 'enum',
    enumValues: [
      { id: 'A', name: '高级' },
      { id: 'B', name: '中级' },
      { id: 'C', name: '初级' },
    ],
  },
  { name: 'levelString', label: '等级(字符串options)', type: 'enum', options: ['one', 'test'] },
  {
    name: 'levelObject',
    label: '等级(对象options)',
    type: 'enum',
    options: [
      { label: 'one', value: 'one' },
      { label: 'test', value: 'test' },
    ],
  },
  {
    name: 'status',
    label: '启动状态',
    type: 'enum',
    options: { dynamic: true, code: 'enable_status', label: '启动状态' },
  },
  {
    name: 'category',
    label: '分类(动态字典)',
    type: 'enum',
    options: { dynamic: true, code: 'category_code' },
  },
  {
    name: 'address',
    label: '地址',
    type: 'object',
    children: [
      { name: 'province', label: '省份', type: 'string' },
      { name: 'city', label: '城市', type: 'string' },
      { name: 'zip', label: '邮编', type: 'long' },
    ],
  },
  {
    name: 'items',
    label: '明细',
    type: 'array',
    items: {
      name: 'item',
      label: '明细项',
      type: 'object',
      children: [
        { name: 'sku', label: 'SKU', type: 'string' },
        { name: 'qty', label: '数量', type: 'long' },
        { name: 'price', label: '单价', type: 'double' },
      ],
    },
  },
  { name: 'tags', label: '标签', type: 'array', items: { name: 'tag', label: '标签', type: 'string' } },
]

async function onLoadFormSchema() {
  await delay(500)
  return mockFormSchema
}

// 演示动态字典：按 code 查询枚举选项
const mockDicts: Record<string, CamundaDictItem[]> = {
  enable_status: [
    { label: '启用', value: '1' },
    { label: '停用', value: '0', disabled: true },
  ],
  category_code: [
    { label: '办公用品', value: 'office' },
    { label: '差旅报销', value: 'travel' },
    { label: '固定资产', value: 'asset' },
  ],
}

async function onSearchDictItems(code: string) {
  await delay(300)
  return mockDicts[code] || []
}

// 演示 AI 助手：接入 DeepSeek（OpenAI 兼容接口）。
// 请通过 VITE_DEEPSEEK_API_KEY 环境变量提供 Key；生产环境建议在服务端代理转发，避免在前端暴露 Key。
const aiChat = createOpenAiAdapter({
  apiKey: 'xxxx',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash',
})
</script>

<template>
    <div class="h-screen relative w-full">
      <BpmnModelerProcess
      ref="modelerProcessRef"
      v-model:theme="theme"
      v-model:locale="locale"
      :proDesigner="proDesigner"
      size="small"
      :xml="demoXml"
      :onSearchUsers="onSearchUsers"
      :autoStash="true"
      :onSearchUserGroups="onSearchUserGroups"
      :onSearchJavaClasses="onSearchJavaClasses"
      :onSearchDelegateExpressions="onSearchDelegateExpressions"
      :onSearchExternalTopics="onSearchExternalTopics"
      :onFetchProcessList="onFetchProcessList"
      :onSearchDecisionRefs="onSearchDecisionRefs"
      :onSearchFormRefs="onSearchFormRefs"
      :onSearchFormKeys="onSearchFormKeys"
      :onLoadFormSchema="onLoadFormSchema"
      :onSearchDictItems="onSearchDictItems"
      :localeMessages="localeMessages"
      :availableLocales="availableLocales"
      :aiChat="aiChat"
    >
      <template #buttons="{ modeler }">
        <NButton ghost type="primary" @click="handlePublish(modeler)">
          <NIcon>
            <span class="i-ic-baseline-upload" />
          </NIcon>
        </NButton>
        <NButton ghost @click="handlePreview(modeler)">
          <NIcon>
            <span class="i-ic-baseline-remove-red-eye" />
          </NIcon>
        </NButton>
        <NButton ghost @click="toggleSimulation">
          <NIcon>
            <span class="i-ic-baseline-directions-run" />
          </NIcon>
        </NButton>
      </template>
      <template #footer>
      </template>
      <!-- <template #start-event-extra="{ type }">
        <div class="p-8px text-14px text-#666">
          开始事件: {{ type }}
        </div>
      </template>
      <template #end-event-extra="{ type }">
        <div class="p-8px text-14px text-#666">
          结束事件: {{ type }}
        </div>
      </template>
      <template #intermediate-throw-event-extra="{ type }">
        <div class="p-8px text-14px text-#666">
          中间抛出事件 ({{ type }})
        </div>
      </template>
      <template #intermediate-catch-event-extra="{ type }">
        <div class="p-8px text-14px text-#666">
          中间捕获事件 ({{ type }})
        </div>
      </template>
      <template #task-extra="{ type }">
        <div class="p-8px text-14px text-#666">
          任务自定义面板 ({{ type }})
        </div>
      </template>
      <template #gateway-extra="{ type }">
        <div class="p-8px text-14px text-#666">
          网关自定义面板 ({{ type }})
        </div>
      </template> -->
    </BpmnModelerProcess>

    <BpmnPreviewModal ref="previewModalRef" :theme="theme" :locale="locale" />
  </div>
</template>
