<script setup lang="ts">
import { BpmnModelerProcess, type ThemeType } from 'camunda7-ui'
import { ref } from 'vue'

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
