<template>
  <img
    v-if="code && code !== 'xx' && !loadFailed"
    class="flag-img"
    :src="getPublicAssetUrl('flags/' + code + '.svg')"
    :alt="code.toUpperCase()"
    :title="code.toUpperCase()"
    loading="lazy"
    @error="loadFailed = true"
  >
  <span v-else class="flag-fallback" aria-hidden="true">?</span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getFlagRegionCode } from '../utils/api'
import { getPublicAssetUrl } from '../utils/config'

const props = defineProps({
  region: { type: String, default: '' }
})

const loadFailed = ref(false)
const code = computed(() => getFlagRegionCode(props.region))

watch(() => props.region, () => {
  loadFailed.value = false
})
</script>
