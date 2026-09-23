<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="viewBox"
    aria-hidden="true"
    focusable="false"
    :shape-rendering="crisp ? 'crispEdges' : undefined"
  >
    <template v-if="name === 'app'">
      <rect x="1.5" y="1.5" width="13" height="9" fill="#d4d0c8" stroke="#000" />
      <rect x="3" y="3" width="10" height="6" fill="#008080" />
      <rect x="6" y="11" width="4" height="2" fill="#808080" />
      <rect x="3.5" y="13.5" width="9" height="1.5" fill="#d4d0c8" stroke="#000" stroke-width="0.6" />
    </template>
    <template v-else-if="name === 'cards'">
      <rect x="1.5" y="1.5" width="6" height="6" fill="#fff" stroke="#0a246a" />
      <rect x="8.5" y="1.5" width="6" height="6" fill="#fff" stroke="#0a246a" />
      <rect x="1.5" y="8.5" width="6" height="6" fill="#fff" stroke="#0a246a" />
      <rect x="8.5" y="8.5" width="6" height="6" fill="#fff" stroke="#0a246a" />
      <rect x="3" y="3" width="3" height="1" fill="#0a246a" />
      <rect x="10" y="3" width="3" height="1" fill="#0a246a" />
      <rect x="3" y="10" width="3" height="1" fill="#0a246a" />
      <rect x="10" y="10" width="3" height="1" fill="#0a246a" />
    </template>
    <template v-else-if="name === 'ring'">
      <circle cx="8" cy="8" r="6.5" fill="#ff00ff" stroke="#000" />
      <path d="M8 8V1.5A6.5 6.5 0 0 1 14.2 10z" fill="#0000ff" />
    </template>
    <template v-else-if="name === 'table'">
      <rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#000" />
      <rect x="2" y="3" width="12" height="2" fill="#d4d0c8" />
      <path d="M3 7.5h10M3 9.5h10M3 11.5h10" stroke="#0a246a" />
    </template>
    <template v-else-if="name === 'map'">
      <circle cx="8" cy="8" r="6.5" fill="#2b5fd9" stroke="#000" />
      <path d="M4 4.5h3v3H5v3H3.5z M9 3.5h3v4h-2v3H9z" fill="#3cb043" />
    </template>
    <template v-else-if="name === 'back'">
      <circle cx="8" cy="8" r="7" fill="#3cb043" stroke="#1e6b22" />
      <path d="M9.5 4l-4 4 4 4" stroke="#fff" stroke-width="2.2" fill="none" />
    </template>
    <template v-else-if="name === 'gear'">
      <circle cx="4.5" cy="4.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path d="M4.5 0v2M4.5 7v2M0 4.5h2M7 4.5h2" stroke="currentColor" stroke-width="1.4" />
    </template>
    <template v-else-if="name === 'contrast'">
      <circle cx="4.5" cy="4.5" r="3.8" fill="none" stroke="currentColor" />
      <path d="M4.5 0.7a3.8 3.8 0 0 1 0 7.6z" fill="currentColor" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="4.5" cy="4.5" r="2" fill="none" stroke="currentColor" stroke-width="1.2" />
      <path d="M4.5 0v1.3M4.5 7.7V9M0 4.5h1.3M7.7 4.5H9" stroke="currentColor" stroke-width="1.2" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M6.5 0.8A4 4 0 1 0 8.2 6.5 3.2 3.2 0 0 1 6.5 0.8z" fill="currentColor" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M0 0l8 7M8 0l-8 7" stroke="currentColor" stroke-width="1.6" />
    </template>
    <template v-else-if="name === 'expand'">
      <path d="M0.5 0.5h7v7h-7z" fill="none" stroke="currentColor" />
      <path d="M0 1.5h8" stroke="currentColor" />
    </template>
    <template v-else-if="name === 'restore'">
      <path d="M2.5 0.5h5v5h-5z M0.5 2.5h5v5h-5z" fill="var(--face)" stroke="currentColor" />
      <path d="M2 1h6M0 3h6" stroke="currentColor" />
    </template>
    <template v-else-if="name === 'warning'">
      <path d="M16 2L31 29H1z" fill="#ffe000" stroke="#000" />
      <rect x="14.5" y="10" width="3" height="11" fill="#000" />
      <rect x="14.5" y="23" width="3" height="3" fill="#000" />
    </template>
    <template v-else-if="name === 'error'">
      <circle cx="16" cy="16" r="14" fill="#e00000" stroke="#600000" />
      <path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="3.4" />
    </template>
    <template v-else-if="name === 'info'">
      <circle cx="16" cy="16" r="14" fill="#fff" stroke="#0a246a" stroke-width="2" />
      <rect x="14.5" y="13" width="3" height="11" fill="#0a246a" />
      <rect x="14.5" y="8" width="3" height="3" fill="#0a246a" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 }
})

const LARGE = ['warning', 'error', 'info']
const TINY = ['gear', 'contrast', 'sun', 'moon', 'restore']
const viewBox = computed(() => {
  if (LARGE.includes(props.name)) return '0 0 32 32'
  if (TINY.includes(props.name)) return '0 0 9 9'
  if (props.name === 'close' || props.name === 'expand') return '0 0 8 8'
  return '0 0 16 16'
})
const crisp = computed(() => ['app', 'cards', 'table'].includes(props.name))
</script>
