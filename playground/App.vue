<script setup lang="ts">
import { BpmnModelerProcess, type ThemeType } from 'camunda7-ui'
import { ref } from 'vue'

const theme = ref<ThemeType>('dark')

function toggleTheme() {
  theme.value = theme.value == 'dark' ? 'light' : 'dark'
}
</script>

<template>x
  <div class="h-screen relative w-full">
    <BpmnModelerProcess :theme="theme" />
  </div>
</template>
