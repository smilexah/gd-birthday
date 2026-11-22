<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveLang } from './device'
import logo from './logo.png'

const { locale } = useI18n()
const menuOpen = ref(false)
const langBox = ref<HTMLElement | null>(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function setLang(lang: string) {
  locale.value = lang
  saveLang(lang)
  menuOpen.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (langBox.value && !langBox.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header style="background: #FFFFFF; padding: 16px 64px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between">
    <img :src="logo" alt="INKAR" style="height: 44px; width: auto; display: block">
    <div id="lang" ref="langBox" style="position: relative">
      <button id="lbtn" aria-haspopup="true" :aria-expanded="menuOpen ? 'true' : 'false'" style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: #FFFFFF; color: #2457F5; border: 2px solid #2457F5; border-radius: 999px; padding: 8px 14px; font: 800 14px Nunito, sans-serif" @click.stop="toggleMenu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2457F5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg><span id="llab">{{ locale === 'kk' ? 'Қазақша' : 'Русский' }}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2457F5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg></button>
      <div id="lmenu" role="menu" :style="{ display: menuOpen ? 'block' : 'none' }" style="position: absolute; right: 0; top: calc(100% + 8px); background: #FFFFFF; border-radius: 16px; box-shadow: 0 12px 32px rgba(10,20,80,0.28); padding: 6px; min-width: 160px; z-index: 60">
        <button id="lru" class="lopt" :class="{ on: locale === 'ru' }" role="menuitem" @click="setLang('ru')">Русский</button>
        <button id="lkk" class="lopt" :class="{ on: locale === 'kk' }" role="menuitem" @click="setLang('kk')">Қазақша</button>
      </div>
    </div>
  </header>
</template>
