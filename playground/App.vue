<script setup lang="ts">
import { BpmnModelerProcess, type ThemeType } from 'camunda7-ui'
import { ref } from 'vue'
import type { ProcessLookupItem } from 'camunda7-ui'

const theme = ref<ThemeType>('dark')
const extraTabLabels = ref({
  'start-event': '自定义配置',
  'end-event': '自定义配置',
})

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

async function onSearchDelegateExpressions(name: string) {
  await delay(150)
  if (!name) return mockDelegateExpressions
  return mockDelegateExpressions.filter(
    (d) =>
      d.label.includes(name) || d.value.toLowerCase().includes(name.toLowerCase()),
  )
}
</script>

<template>
  <div class="h-screen relative w-full">
    <BpmnModelerProcess
      :theme="theme"
      :extraTabLabels="extraTabLabels"
      :onSearchUsers="onSearchUsers"
      :onSearchUserGroups="onSearchUserGroups"
      :onSearchJavaClasses="onSearchJavaClasses"
      :onSearchDelegateExpressions="onSearchDelegateExpressions"
      :onSearchExternalTopics="onSearchExternalTopics"
      :onFetchProcessList="onFetchProcessList"
    >
      <template #buttons="{ modeler }">
        <NButton ghost >
          <NIcon>
            <span class="i-ic-baseline-add" />
          </NIcon>
        </NButton>
        <NButton ghost >
          <NIcon>
            <span class="i-ic-baseline-add" />
          </NIcon>
        </NButton>
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
  </div>
</template>
