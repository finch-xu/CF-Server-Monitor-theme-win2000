<template>
  <WinDialog
    :show="show"
    :title="trans.liveConnectionTimeoutTitle"
    icon="warning"
    :closable="false"
  >
    {{ trans.liveConnectionTimeoutMessage }}
    <template #buttons>
      <button type="button" class="btn default" @click="$emit('continue')">{{ trans.continueConnection }}</button>
      <button type="button" class="btn" @click="$emit('close')">{{ trans.close }}</button>
    </template>
  </WinDialog>
</template>

<script setup>
import WinDialog from './WinDialog.vue'

defineProps({
  show: { type: Boolean, default: false },
  trans: { type: Object, required: true }
})

defineEmits(['close', 'continue'])
</script>
