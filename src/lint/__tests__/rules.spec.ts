import { describe, it, expect } from 'vitest'

import camunda7RuleFactories from '../rules'
import type { LintNode } from '../rules'

type Report = { id: string; message: string; path?: string[] }

function createNode(options: {
  $type: string
  attributes?: Record<string, any>
  properties?: Record<string, any>
  id?: string
  parentId?: string
}): LintNode {
  const attrs = options.attributes ?? {}
  return {
    $type: options.$type,
    id: options.id ?? 'n1',
    $instanceOf: (type: string) => type === options.$type,
    get: (name: string) => attrs[name],
    $parent: options.parentId ? { id: options.parentId } : null,
    ...(options.properties ?? {}),
  } as LintNode
}

function runRule(ruleName: string, node: LintNode): Report[] {
  const reports: Report[] = []
  const factory = camunda7RuleFactories[ruleName]
  if (!factory) throw new Error(`Unknown rule: ${ruleName}`)
  factory().check(node, {
    report: (id, message, path) => reports.push({ id, message, path }),
  })
  return reports
}

describe('lint rules', () => {
  it('exposes all expected camunda7 rules', () => {
    const expected = [
      'process-name-required',
      'process-history-time-to-live-required',
      'user-task-no-assignee',
      'service-task-no-implementation',
      'external-task-no-topic',
      'call-activity-no-called-element',
      'timer-event-no-definition',
      'message-event-no-message',
      'script-task-no-script',
      'dmn-task-no-decision',
      'expression-syntax',
    ]
    for (const name of expected) {
      expect(camunda7RuleFactories[name]).toBeTypeOf('function')
    }
  })

  describe('process-name-required', () => {
    const rule = 'process-name-required'

    it('reports when the process has no name', () => {
      const reports = runRule(rule, createNode({ $type: 'bpmn:Process' }))
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ id: 'n1', path: ['name'] })
    })

    it('reports when the name is only whitespace', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:Process', attributes: { name: '   ' } }),
      )
      expect(reports).toHaveLength(1)
    })

    it('does not report when the process has a name', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:Process', attributes: { name: 'Order Process' } }),
      )
      expect(reports).toHaveLength(0)
    })

    it('ignores non-process nodes', () => {
      expect(runRule(rule, createNode({ $type: 'bpmn:Task' }))).toHaveLength(0)
    })
  })

  describe('process-history-time-to-live-required', () => {
    const rule = 'process-history-time-to-live-required'

    it('reports for an executable process without historyTimeToLive', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:Process', properties: { isExecutable: true } }),
      )
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ path: ['historyTimeToLive'] })
    })

    it('does not report when historyTimeToLive is set', () => {
      const reports = runRule(
        rule,
        createNode({
          $type: 'bpmn:Process',
          properties: { isExecutable: true, historyTimeToLive: 180 },
        }),
      )
      expect(reports).toHaveLength(0)
    })

    it('does not report when the process is not executable', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:Process', properties: { isExecutable: false } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('user-task-no-assignee', () => {
    const rule = 'user-task-no-assignee'

    it('reports when assignee and candidates are all missing', () => {
      const reports = runRule(rule, createNode({ $type: 'bpmn:UserTask' }))
      expect(reports).toHaveLength(1)
    })

    it('does not report when an assignee is set', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:UserTask', attributes: { 'camunda:assignee': 'zhangsan' } }),
      )
      expect(reports).toHaveLength(0)
    })

    it('does not report when candidate users are set', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:UserTask', attributes: { 'camunda:candidateUsers': 'a,b' } }),
      )
      expect(reports).toHaveLength(0)
    })

    it('does not report when candidate groups are set', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:UserTask', attributes: { 'camunda:candidateGroups': 'sales' } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('service-task-no-implementation', () => {
    const rule = 'service-task-no-implementation'

    it('reports when no implementation is set', () => {
      const reports = runRule(rule, createNode({ $type: 'bpmn:ServiceTask' }))
      expect(reports).toHaveLength(1)
    })

    it.each([
      ['camunda:class', 'com.example.Service'],
      ['camunda:delegateExpression', '${svc}'],
      ['camunda:expression', '#{doWork()}'],
      ['camunda:type', 'mail'],
    ])('does not report when %s is set', (key, value) => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:ServiceTask', attributes: { [key]: value } }),
      )
      expect(reports).toHaveLength(0)
    })

    it('ignores non-service tasks', () => {
      expect(runRule(rule, createNode({ $type: 'bpmn:UserTask' }))).toHaveLength(0)
    })
  })

  describe('external-task-no-topic', () => {
    const rule = 'external-task-no-topic'

    it('reports for an external task without topic', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:ServiceTask', attributes: { 'camunda:type': 'external' } }),
      )
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ path: ['camunda:topic'] })
    })

    it('does not report when the topic is set', () => {
      const reports = runRule(
        rule,
        createNode({
          $type: 'bpmn:ServiceTask',
          attributes: { 'camunda:type': 'external', 'camunda:topic': 'order-processing' },
        }),
      )
      expect(reports).toHaveLength(0)
    })

    it('does not report for a non-external service task', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:ServiceTask', attributes: { 'camunda:type': 'java' } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('call-activity-no-called-element', () => {
    const rule = 'call-activity-no-called-element'

    it('reports when calledElement is missing', () => {
      const reports = runRule(rule, createNode({ $type: 'bpmn:CallActivity' }))
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ path: ['calledElement'] })
    })

    it('does not report when calledElement is set', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:CallActivity', attributes: { calledElement: 'Process_x' } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('timer-event-no-definition', () => {
    const rule = 'timer-event-no-definition'

    it('reports on the parent element when no definition is set', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:TimerEventDefinition', parentId: 'Event_1' }),
      )
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ id: 'Event_1', path: ['timeDuration'] })
    })

    it.each(['timeDate', 'timeDuration', 'timeCycle'])('does not report when %s is set', (key) => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:TimerEventDefinition', attributes: { [key]: 'PT1H' } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('message-event-no-message', () => {
    const rule = 'message-event-no-message'

    it('reports on the parent element when messageRef is missing', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:MessageEventDefinition', parentId: 'Event_1' }),
      )
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ id: 'Event_1', path: ['messageRef'] })
    })

    it('does not report when messageRef is set', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:MessageEventDefinition', attributes: { messageRef: {} } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('script-task-no-script', () => {
    const rule = 'script-task-no-script'

    it('reports when no script format or resource is set', () => {
      const reports = runRule(rule, createNode({ $type: 'bpmn:ScriptTask' }))
      expect(reports).toHaveLength(1)
    })

    it.each([
      ['scriptFormat', 'javascript'],
      ['camunda:resource', 'my-script.js'],
    ])('does not report when %s is set', (key, value) => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:ScriptTask', attributes: { [key]: value } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('dmn-task-no-decision', () => {
    const rule = 'dmn-task-no-decision'

    it('reports for a DMN task without decisionRef', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:BusinessRuleTask', attributes: { 'camunda:type': 'dmn' } }),
      )
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ path: ['camunda:decisionRef'] })
    })

    it('does not report when decisionRef is set', () => {
      const reports = runRule(
        rule,
        createNode({
          $type: 'bpmn:BusinessRuleTask',
          attributes: { 'camunda:type': 'dmn', 'camunda:decisionRef': 'Decision_x' },
        }),
      )
      expect(reports).toHaveLength(0)
    })

    it('does not report for a non-DMN business rule task', () => {
      const reports = runRule(
        rule,
        createNode({ $type: 'bpmn:BusinessRuleTask', attributes: { 'camunda:type': 'java' } }),
      )
      expect(reports).toHaveLength(0)
    })
  })

  describe('expression-syntax', () => {
    const rule = 'expression-syntax'

    function flowWithBody(body: string) {
      return createNode({
        $type: 'bpmn:SequenceFlow',
        attributes: { conditionExpression: { body } },
      })
    }

    it('reports an unclosed interpolation', () => {
      const reports = runRule(rule, flowWithBody('${order.total > 100'))
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ path: ['conditionExpression'] })
    })

    it('reports an empty interpolation', () => {
      const reports = runRule(rule, flowWithBody('${}'))
      expect(reports).toHaveLength(1)
    })

    it('does not report a balanced expression', () => {
      expect(runRule(rule, flowWithBody('${order.total > 100}'))).toHaveLength(0)
    })

    it('ignores flows without an expression', () => {
      expect(runRule(rule, createNode({ $type: 'bpmn:SequenceFlow' }))).toHaveLength(0)
    })

    it('ignores non-sequence-flow nodes', () => {
      expect(runRule(rule, createNode({ $type: 'bpmn:Task' }))).toHaveLength(0)
    })
  })
})
