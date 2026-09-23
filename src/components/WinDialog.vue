<template>
  <Teleport to="body">
    <div v-if="show" class="dialog-overlay" @click.self="closable && $emit('close')" @keydown.esc="closable && $emit('close')">
      <div
        ref="dialogRef"
        class="win dialog"
        :style="width ? { width } : null"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <div class="title-bar">
          <span :id="titleId" class="title-bar-text">{{ title }}</span>
          <button v-if="closable" type="button" class="title-btn" :aria-label="closeLabel" @click="$emit('close')">
            <WinIcon name="close" :size="8" />
          </button>
        </div>
        <div class="dialog-body">
          <WinIcon v-if="icon" class="dialog-icon" :name="icon" :size="32" />
          <div class="dialog-message">
            <slot />
          </div>
        </div>
        <div v-if="$slots.buttons" class="dialog-buttons">
          <slot name="buttons" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import WinIcon from './WinIcon.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  width: { type: String, default: '' },
  closable: { type: Boolean, default: true },
  closeLabel: { type: String, default: 'Close' }
})

defineEmits(['close'])

const titleId = `dlg-${Math.random().toString(36).slice(2, 9)}`
const dialogRef = ref(null)

watch(() => props.show, async (visible) => {
  if (!visible) return
  await nextTick()
  const target = dialogRef.value?.querySelector('.btn.default') || dialogRef.value
  target?.focus()
}, { immediate: true })
</script>
