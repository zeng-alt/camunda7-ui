<script setup lang="ts">
import { BpmnProcessViewer, type ProcessExecutionState } from 'camunda7-ui'
import { ref } from 'vue'

const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
  xmlns:modeler="http://camunda.org/schema/modeler/1.0"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn"
  exporter="Camunda Modeler" exporterVersion="5.0.0"
  modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="7.18.0">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="开始">
      <bpmn:outgoing>Flow_Start</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Activity_Submit" name="提交申请" camunda:assignee="张三">
      <bpmn:incoming>Flow_Start</bpmn:incoming>
      <bpmn:incoming>Flow_CheckToSubmit</bpmn:incoming>
      <bpmn:incoming>Flow_ManagerToSubmit</bpmn:incoming>
      <bpmn:outgoing>Flow_SubmitToCheck</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="Gateway_Check" name="自动判断" default="Flow_CheckToSubmit">
      <bpmn:incoming>Flow_SubmitToCheck</bpmn:incoming>
      <bpmn:outgoing>Flow_CheckToManager</bpmn:outgoing>
      <bpmn:outgoing>Flow_CheckToSubmit</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:userTask id="Activity_Manager" name="经理审批" camunda:assignee="李四">
      <bpmn:incoming>Flow_CheckToManager</bpmn:incoming>
      <bpmn:outgoing>Flow_ManagerToSubmit</bpmn:outgoing>
      <bpmn:outgoing>Flow_ManagerToExecute</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:serviceTask id="Activity_Execute" name="执行任务" camunda:class="com.example.ExecuteService">
      <bpmn:incoming>Flow_ManagerToExecute</bpmn:incoming>
      <bpmn:outgoing>Flow_ExecuteToWait</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:intermediateCatchEvent id="Event_Wait" name="等待回调">
      <bpmn:incoming>Flow_ExecuteToWait</bpmn:incoming>
      <bpmn:outgoing>Flow_WaitToConfirm</bpmn:outgoing>
    </bpmn:intermediateCatchEvent>
    <bpmn:userTask id="Activity_Confirm" name="确认结果" camunda:assignee="王五" camunda:candidateUsers="张三, 李四">
      <bpmn:incoming>Flow_WaitToConfirm</bpmn:incoming>
      <bpmn:outgoing>Flow_ConfirmToEnd</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:endEvent id="EndEvent_1" name="结束">
      <bpmn:incoming>Flow_ConfirmToEnd</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Start" sourceRef="StartEvent_1" targetRef="Activity_Submit" />
    <bpmn:sequenceFlow id="Flow_SubmitToCheck" sourceRef="Activity_Submit" targetRef="Gateway_Check" />
    <bpmn:sequenceFlow id="Flow_CheckToManager" sourceRef="Gateway_Check" targetRef="Activity_Manager" name="通过">
      <bpmn:conditionExpression xsi:type="tFormalExpression">\${approved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_CheckToSubmit" sourceRef="Gateway_Check" targetRef="Activity_Submit" name="驳回" />
    <bpmn:sequenceFlow id="Flow_ManagerToSubmit" sourceRef="Activity_Manager" targetRef="Activity_Submit" name="驳回">
      <bpmn:conditionExpression xsi:type="tFormalExpression">\${approved == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_ManagerToExecute" sourceRef="Activity_Manager" targetRef="Activity_Execute" name="通过">
      <bpmn:conditionExpression xsi:type="tFormalExpression">\${approved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_ExecuteToWait" sourceRef="Activity_Execute" targetRef="Event_Wait" />
    <bpmn:sequenceFlow id="Flow_WaitToConfirm" sourceRef="Event_Wait" targetRef="Activity_Confirm" />
    <bpmn:sequenceFlow id="Flow_ConfirmToEnd" sourceRef="Activity_Confirm" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="50" y="252" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_Submit_di" bpmnElement="Activity_Submit">
        <dc:Bounds x="130" y="230" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Check_di" bpmnElement="Gateway_Check">
        <dc:Bounds x="280" y="245" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_Manager_di" bpmnElement="Activity_Manager">
        <dc:Bounds x="380" y="230" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_Execute_di" bpmnElement="Activity_Execute">
        <dc:Bounds x="530" y="230" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_Wait_di" bpmnElement="Event_Wait">
        <dc:Bounds x="680" y="252" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_Confirm_di" bpmnElement="Activity_Confirm">
        <dc:Bounds x="766" y="230" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="916" y="252" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Start_di" bpmnElement="Flow_Start">
        <di:waypoint x="86" y="270" />
        <di:waypoint x="130" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_SubmitToCheck_di" bpmnElement="Flow_SubmitToCheck">
        <di:waypoint x="230" y="270" />
        <di:waypoint x="280" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_CheckToManager_di" bpmnElement="Flow_CheckToManager">
        <di:waypoint x="330" y="270" />
        <di:waypoint x="380" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_ManagerToExecute_di" bpmnElement="Flow_ManagerToExecute">
        <di:waypoint x="480" y="270" />
        <di:waypoint x="530" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_ExecuteToWait_di" bpmnElement="Flow_ExecuteToWait">
        <di:waypoint x="630" y="270" />
        <di:waypoint x="680" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_WaitToConfirm_di" bpmnElement="Flow_WaitToConfirm">
        <di:waypoint x="716" y="270" />
        <di:waypoint x="766" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_ConfirmToEnd_di" bpmnElement="Flow_ConfirmToEnd">
        <di:waypoint x="866" y="270" />
        <di:waypoint x="916" y="270" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_CheckToSubmit_di" bpmnElement="Flow_CheckToSubmit">
        <di:waypoint x="305" y="295" />
        <di:waypoint x="305" y="350" />
        <di:waypoint x="180" y="350" />
        <di:waypoint x="180" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_ManagerToSubmit_di" bpmnElement="Flow_ManagerToSubmit">
        <di:waypoint x="430" y="310" />
        <di:waypoint x="430" y="390" />
        <di:waypoint x="180" y="390" />
        <di:waypoint x="180" y="310" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

const mockUsers = [
  { label: '张三', value: 'zhangsan' },
  { label: '李四', value: 'lisi' },
  { label: '王五', value: 'wangwu' },
]

const mockGroups = [
  { label: '管理层', value: 'management' },
  { label: '工程部', value: 'engineering' },
]

async function onSearchUsers(name: string) {
  if (!name) return mockUsers
  return mockUsers.filter(
    (u) => u.label.includes(name) || u.value.includes(name.toLowerCase()),
  )
}

async function onSearchUserGroups(name: string) {
  if (!name) return mockGroups
  return mockGroups.filter(
    (g) => g.label.includes(name) || g.value.includes(name.toLowerCase()),
  )
}

const executionState: ProcessExecutionState = {
  processInstanceId: 'instance_001',
  elements: {
    StartEvent_1: { status: 'completed', visitCount: 1, rejectCount: 0 },
    Activity_Submit: {
      status: 'completed',
      visitCount: 2,
      rejectCount: 1,
      assignee: 'zhangsan',
    },
    Gateway_Check: { status: 'completed', visitCount: 2, rejectCount: 0 },
    Activity_Manager: {
      status: 'completed',
      visitCount: 2,
      rejectCount: 1,
      assignee: 'lisi',
    },
    Activity_Execute: { status: 'completed', visitCount: 1, rejectCount: 0 },
    Event_Wait: { status: 'completed', visitCount: 1, rejectCount: 0 },
    Activity_Confirm: {
      status: 'active',
      visitCount: 1,
      rejectCount: 0,
      assignee: 'wangwu',
      candidateUsers: ['zhangsan', 'lisi'],
    },
    EndEvent_1: { status: 'pending', visitCount: 0, rejectCount: 0 },
  },
  executionOrder: [
    'StartEvent_1',
    'Activity_Submit',
    'Gateway_Check',
    'Activity_Manager',
    'Activity_Submit',
    'Gateway_Check',
    'Activity_Manager',
    'Activity_Execute',
    'Event_Wait',
    'Activity_Confirm',
  ],
  timestamps: [
    '2026-07-29 09:00:00',
    '2026-07-29 09:05:00',
    '2026-07-29 09:06:00',
    '2026-07-29 09:10:00',
    '2026-07-29 09:15:00',
    '2026-07-29 09:16:00',
    '2026-07-29 09:20:00',
    '2026-07-29 09:30:00',
    '2026-07-29 09:35:00',
    '2026-07-29 09:40:00',
  ],
  results: [
    '流程发起',
    '提交申请 → 自动判断',
    '条件判断: 金额 > 10000',
    '经理审批: 驳回',
    '重新提交申请',
    '条件判断: 金额 ≤ 10000',
    '经理审批: 通过 ✓',
    '执行任务完成',
    '等待回调中...',
    '确认结果',
  ],
}
</script>

<template>
  <div class="h-screen w-screen bg-#f5f5f5">
    <BpmnProcessViewer
      :processXml="bpmnXml"
      :executionState="executionState"
      :onSearchUsers="onSearchUsers"
      :onSearchUserGroups="onSearchUserGroups"
      showTimeline
    />
  </div>
</template>
