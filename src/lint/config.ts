import labelRequired from 'bpmnlint/rules/label-required.js'
import startEventRequired from 'bpmnlint/rules/start-event-required.js'
import endEventRequired from 'bpmnlint/rules/end-event-required.js'
import singleBlankStartEvent from 'bpmnlint/rules/single-blank-start-event.js'
import conditionalFlows from 'bpmnlint/rules/conditional-flows.js'
import eventBasedGateway from 'bpmnlint/rules/event-based-gateway.js'
import fakeJoin from 'bpmnlint/rules/fake-join.js'
import linkEvent from 'bpmnlint/rules/link-event.js'
import noComplexGateway from 'bpmnlint/rules/no-complex-gateway.js'
import noDisconnected from 'bpmnlint/rules/no-disconnected.js'
import noDuplicateSequenceFlows from 'bpmnlint/rules/no-duplicate-sequence-flows.js'
import noGatewayJoinFork from 'bpmnlint/rules/no-gateway-join-fork.js'
import noImplicitEnd from 'bpmnlint/rules/no-implicit-end.js'
import noImplicitStart from 'bpmnlint/rules/no-implicit-start.js'
import noImplicitSplit from 'bpmnlint/rules/no-implicit-split.js'
import noInclusiveGateway from 'bpmnlint/rules/no-inclusive-gateway.js'
import singleEventDefinition from 'bpmnlint/rules/single-event-definition.js'
import subProcessBlankStartEvent from 'bpmnlint/rules/sub-process-blank-start-event.js'
import superfluousGateway from 'bpmnlint/rules/superfluous-gateway.js'
import superfluousTermination from 'bpmnlint/rules/superfluous-termination.js'

import camunda7RuleFactories from './rules'

const builtinRuleFactories: Record<string, any> = {
  'label-required': labelRequired,
  'start-event-required': startEventRequired,
  'end-event-required': endEventRequired,
  'single-blank-start-event': singleBlankStartEvent,
  'conditional-flows': conditionalFlows,
  'event-based-gateway': eventBasedGateway,
  'fake-join': fakeJoin,
  'link-event': linkEvent,
  'no-complex-gateway': noComplexGateway,
  'no-disconnected': noDisconnected,
  'no-duplicate-sequence-flows': noDuplicateSequenceFlows,
  'no-gateway-join-fork': noGatewayJoinFork,
  'no-implicit-end': noImplicitEnd,
  'no-implicit-start': noImplicitStart,
  'no-implicit-split': noImplicitSplit,
  'no-inclusive-gateway': noInclusiveGateway,
  'single-event-definition': singleEventDefinition,
  'sub-process-blank-start-event': subProcessBlankStartEvent,
  'superfluous-gateway': superfluousGateway,
  'superfluous-termination': superfluousTermination,
}

const resolver = {
  resolveRule(pkg: string, ruleName: string): any {
    if (pkg === 'bpmnlint') {
      return builtinRuleFactories[ruleName] || null
    }
    if (pkg === 'bpmnlint-plugin-camunda7') {
      return camunda7RuleFactories[ruleName] || null
    }
    return null
  },
  resolveConfig(): any {
    return null
  },
}

export const linterConfig = {
  config: {
    rules: {
      'label-required': 'error',
      'start-event-required': 'error',
      'end-event-required': 'error',
      'single-blank-start-event': 'error',
      'conditional-flows': 'error',
      'event-based-gateway': 'error',
      'fake-join': 'warn',
      'link-event': 'error',
      'no-complex-gateway': 'error',
      'no-disconnected': 'error',
      'no-duplicate-sequence-flows': 'error',
      'no-gateway-join-fork': 'error',
      'no-implicit-end': 'error',
      'no-implicit-start': 'error',
      'no-implicit-split': 'error',
      'no-inclusive-gateway': 'warn',
      'single-event-definition': 'error',
      'sub-process-blank-start-event': 'error',
      'superfluous-gateway': 'warn',
      'superfluous-termination': 'warn',
      'camunda7/user-task-no-assignee': 'warn',
      'camunda7/service-task-no-implementation': 'warn',
      'camunda7/external-task-no-topic': 'warn',
      'camunda7/call-activity-no-called-element': 'warn',
      'camunda7/timer-event-no-definition': 'warn',
      'camunda7/message-event-no-message': 'warn',
      'camunda7/script-task-no-script': 'warn',
      'camunda7/dmn-task-no-decision': 'warn',
      'camunda7/expression-syntax': 'warn',
      'camunda7/process-name-required': 'error',
      'camunda7/process-history-time-to-live-required': 'error',
      'camunda7/start-event-no-initiator': 'error',
    },
  },
  resolver,
}

export type LinterConfig = typeof linterConfig
