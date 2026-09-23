<template>
  <div ref="rootRef" class="menu-anchor">
    <button
      ref="buttonRef"
      type="button"
      class="title-btn"
      :title="buttonLabel"
      :aria-label="buttonLabel"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      @click="toggleMenu"
      @keydown.down.prevent="openMenu"
    >
      <WinIcon name="display" :size="9" />
    </button>
    <div v-if="open" class="win popup-menu" role="menu" :aria-label="trans.w2kStyle" @keydown="handleMenuKeydown">
      <template v-for="(item, index) in items" :key="item.value">
        <button
          :ref="(el) => setItemRef(el, index)"
          type="button"
          class="popup-menu-item"
          role="menuitemradio"
          :aria-checked="styleChoice === item.value ? 'true' : 'false'"
          tabindex="-1"
          @click="chooseStyle(item.value)"
        >
          <span class="popup-menu-check" aria-hidden="true">{{ styleChoice === item.value ? '✓' : '' }}</span>
          <span>{{ item.label }}</span>
        </button>
        <div v-if="index === 0" class="popup-menu-sep" role="separator"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import WinIcon from './WinIcon.vue'
import { useStyle } from '../composables/useStyle'
import { STYLES } from '../utils/styleChoice'
import { useTranslation } from '../utils/i18n'

const trans = useTranslation()
const { styleChoice, siteStyle, effectiveStyle, setStyle } = useStyle()

const open = ref(false)
const rootRef = ref(null)
const buttonRef = ref(null)
const itemEls = []

const STYLE_NAME_KEYS = { win2000: 'w2kStyleWin2000', xp: 'w2kStyleXp', win31: 'w2kStyleWin31', osx: 'w2kStyleOsx' }
const styleName = (style) => trans.value[STYLE_NAME_KEYS[style]] || style

const items = computed(() => [
  { value: 'default', label: trans.value.w2kStyleDefault.replace('{name}', styleName(siteStyle.value)) },
  ...STYLES.map(style => ({ value: style, label: styleName(style) }))
])

const buttonLabel = computed(() => trans.value.w2kStyleCurrent.replace('{name}', styleName(effectiveStyle.value)))

const setItemRef = (el, index) => {
  if (el) itemEls[index] = el
}

// 上下键循环切换焦点
const focusItem = (index) => {
  const count = items.value.length
  itemEls[((index % count) + count) % count]?.focus()
}

const openMenu = async () => {
  open.value = true
  await nextTick()
  const checkedIndex = items.value.findIndex(item => item.value === styleChoice.value)
  focusItem(checkedIndex < 0 ? 0 : checkedIndex)
}

const closeMenu = (restoreFocus = false) => {
  open.value = false
  if (restoreFocus) buttonRef.value?.focus()
}

const toggleMenu = () => {
  if (open.value) closeMenu()
  else openMenu()
}

const chooseStyle = (value) => {
  setStyle(value)
  closeMenu(true)
}

const handleMenuKeydown = (event) => {
  const currentIndex = itemEls.indexOf(document.activeElement)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusItem(currentIndex + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusItem(currentIndex - 1)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu(true)
  } else if (event.key === 'Tab') {
    closeMenu()
  }
}

const handleDocumentPointerDown = (event) => {
  if (open.value && !rootRef.value?.contains(event.target)) closeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>
