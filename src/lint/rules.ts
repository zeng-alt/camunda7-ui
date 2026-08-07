export type LintReporter = {
  report: (id: string, message: string, path?: string[]) => void
}

export type LintNode = {
  $type: string
  $instanceOf: (type: string) => boolean
  id: string
  get: (name: string) => any
  [key: string]: any
}

export type LintRuleFactory = (config?: any) => { check: (node: LintNode, reporter: LintReporter) => void }

const camunda7RuleFactories: Record<string, LintRuleFactory> = {
  'process-name-required': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:Process')) return
      const name = node.get('name')
      if (!name || !name.trim()) {
        reporter.report(node.id, 'Process should have a name', ['name'])
      }
    },
  }),
  'process-history-time-to-live-required': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:Process')) return
      if (!node.isExecutable) return
      const httl = node.historyTimeToLive ?? node.get('camunda:historyTimeToLive')
      if (httl === undefined || httl === null || httl === '') {
        reporter.report(node.id, 'Executable process should define camunda:historyTimeToLive', [
          'camunda:historyTimeToLive',
        ])
      }
    },
  }),
  'user-task-no-assignee': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:UserTask')) return
      const assignee = node.get('camunda:assignee')
      const candidateUsers = node.get('camunda:candidateUsers')
      const candidateGroups = node.get('camunda:candidateGroups')
      if (!assignee && !candidateUsers && !candidateGroups) {
        reporter.report(node.id, 'User task should define an assignee or candidate users/groups')
      }
    },
  }),
  'service-task-no-implementation': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:ServiceTask')) return
      const hasImplementation =
        node.get('camunda:class') ||
        node.get('camunda:delegateExpression') ||
        node.get('camunda:expression') ||
        node.get('camunda:type')
      if (!hasImplementation) {
        reporter.report(node.id, 'Service task is missing an implementation (class, expression, delegate expression or type)')
      }
    },
  }),
  'external-task-no-topic': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:ServiceTask')) return
      if (node.get('camunda:type') === 'external' && !node.get('camunda:topic')) {
        reporter.report(node.id, 'External task is missing a topic', ['camunda:topic'])
      }
    },
  }),
  'call-activity-no-called-element': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:CallActivity')) return
      if (!node.get('calledElement')) {
        reporter.report(node.id, 'Call activity is missing a called element', ['calledElement'])
      }
    },
  }),
  'timer-event-no-definition': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:TimerEventDefinition')) return
      const hasDefinition = node.get('timeDate') || node.get('timeDuration') || node.get('timeCycle')
      if (!hasDefinition) {
        reporter.report(node.id, 'Timer event should define a timeDate, timeDuration or timeCycle')
      }
    },
  }),
  'message-event-no-message': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:MessageEventDefinition')) return
      if (!node.get('messageRef')) {
        reporter.report(node.id, 'Message event should reference a message', ['messageRef'])
      }
    },
  }),
  'script-task-no-script': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:ScriptTask')) return
      const hasScript = node.get('scriptFormat') || node.get('camunda:resource')
      if (!hasScript) {
        reporter.report(node.id, 'Script task is missing a script format or resource')
      }
    },
  }),
  'dmn-task-no-decision': () => ({
    check(node, reporter) {
      if (!node.$instanceOf('bpmn:BusinessRuleTask')) return
      if (node.get('camunda:type') === 'dmn' && !node.get('camunda:decisionRef')) {
        reporter.report(node.id, 'DMN task should reference a decision', ['camunda:decisionRef'])
      }
    },
  }),
}

export default camunda7RuleFactories
