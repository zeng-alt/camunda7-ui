# camunda7-ui

Camunda 7 UI components for Vue 3. Provides BPMN modeler, DMN viewer, and process management UI components.

## Installation

```sh
npm install camunda7-ui
```

## Usage

```vue
<script setup lang="ts">
import { CamundaConfigProvider, BpmnModelerProcess } from 'camunda7-ui'
import 'camunda7-ui/style.css'
</script>

<template>
  <CamundaConfigProvider theme="light">
    <BpmnModelerProcess />
  </CamundaConfigProvider>
</template>
```

## Development

```sh
# Install dependencies
npm install

# Start dev server (playground)
npm run dev

# Type-check, compile and minify for production
npm run build

# Format code
npm run format
```

## Components

- `CamundaConfigProvider` - Theme and locale configuration provider
- `BpmnModelerProcess` - BPMN modeler component

## License

MIT
