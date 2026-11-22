<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import './public.css'
import SiteHeader from './SiteHeader.vue'
import HeroSection from './HeroSection.vue'
import CakeStage from './CakeStage.vue'
import WishForm from './WishForm.vue'
import { toastText, toastVisible } from './effects'
import { startLive, stopLive } from './live'
import { refreshStats, reloadFeed, state } from './state'

const { t, locale } = useI18n()
const formOpen = ref(false)

const toastBase = 'position:fixed;left:50%;bottom:30px;background:#1A3CB0;color:#fff;font:800 17px Nunito,sans-serif;padding:14px 26px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none;transition:all .3s;z-index:200'

function openForm() {
  if (state.accepting) {
    formOpen.value = true
  }
}

watch(
  locale,
  () => {
    document.documentElement.lang = locale.value
    document.title = t('title')
  },
  { immediate: true }
)

onMounted(async () => {
  await Promise.all([reloadFeed('all'), refreshStats()])
  startLive()
})

onUnmounted(() => {
  stopLive()
})
</script>

<template>
  <div class="gd-page" style="overflow-x: hidden; background: #FFFFFF; font-family: 'Nunito', system-ui, sans-serif; color: #12233F; min-height: 100%">
<svg aria-hidden="true" width="0" height="0" style="position: absolute">
<defs>
<linearGradient id="gPlate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#D3C8B0" /></linearGradient>
<radialGradient id="gCherry" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FF9BAA" /><stop offset="0.5" stop-color="#D9364F" /><stop offset="1" stop-color="#8F1429" /></radialGradient>
<linearGradient id="gShineV" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5" /><stop offset="0.6" stop-color="#FFFFFF" stop-opacity="0" /></linearGradient>
<linearGradient id="gT1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF3D6" /><stop offset="0.4" stop-color="#F9D79B" /><stop offset="1" stop-color="#D79A57" /></linearGradient>
<linearGradient id="gT2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFDCE6" /><stop offset="0.45" stop-color="#FF9FBE" /><stop offset="1" stop-color="#D9507F" /></linearGradient>
<linearGradient id="gT3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#DDFAF3" /><stop offset="0.45" stop-color="#7FE0CF" /><stop offset="1" stop-color="#2FA797" /></linearGradient>
<linearGradient id="gFr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" /><stop offset="0.6" stop-color="#FFF5F8" /><stop offset="1" stop-color="#F3D5DF" /></linearGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE9B0" /><stop offset="0.5" stop-color="#E8B25E" /><stop offset="1" stop-color="#B9802F" /></linearGradient>
<radialGradient id="gbGold" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#FFF0C2" /><stop offset="0.5" stop-color="#E8B25E" /><stop offset="1" stop-color="#A6732F" /></radialGradient>
<radialGradient id="gbPink" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#FFE3EB" /><stop offset="0.5" stop-color="#FF6F9C" /><stop offset="1" stop-color="#C22C66" /></radialGradient>
<radialGradient id="gbMint" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#DCFFF7" /><stop offset="0.5" stop-color="#4FDDC0" /><stop offset="1" stop-color="#17917D" /></radialGradient>
<radialGradient id="gbCoral" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#FFD9CF" /><stop offset="0.5" stop-color="#FF6B57" /><stop offset="1" stop-color="#BE3322" /></radialGradient>
<radialGradient id="gbPurple" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#EEDBFF" /><stop offset="0.5" stop-color="#B26BFF" /><stop offset="1" stop-color="#6A2BC0" /></radialGradient>
<radialGradient id="gStick" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#FFE9B0" /></radialGradient>
<linearGradient id="gRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A8" stop-opacity="0.2" /><stop offset="1" stop-color="#FFE9A8" stop-opacity="0" /></linearGradient>
<radialGradient id="gFlame" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#FFFFFF" /><stop offset="0.4" stop-color="#FFE066" /><stop offset="1" stop-color="#FF8A3D" /></radialGradient>
<linearGradient id="fgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4B0" /><stop offset="1" stop-color="#FFB400" /></linearGradient><linearGradient id="fgP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFA8C6" /><stop offset="1" stop-color="#E8286A" /></linearGradient><linearGradient id="fgB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4DBFF" /><stop offset="1" stop-color="#2F6EFF" /></linearGradient><linearGradient id="fgW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#C9D6FF" /></linearGradient><linearGradient id="fgS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".75" /><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0" /></linearGradient><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
</defs>
</svg>
    <SiteHeader />
    <HeroSection :total="state.total" :accepting="state.accepting" @open="openForm" />
    <CakeStage :form-open="formOpen" @open="openForm" />
    <footer style="background: linear-gradient(#2B0F5C, #150838); color: #E6EAFF; padding: 44px 64px; text-align: center; font-weight: 700">
      <div style="font-size: 28px; font-weight: 900; color: #F2C45E; margin-bottom: 8px; text-shadow: 0 2px 14px rgba(232,178,94,0.45)">{{ t('footer.love') }}</div>
      <div style="font-size: 14px">{{ t('footer.copyright') }}</div>
    </footer>
    <WishForm :open="formOpen" @close="formOpen = false" />
    <div :style="toastBase + (toastVisible ? ';opacity:1;transform:translateX(-50%)' : ';opacity:0;transform:translateX(-50%) translateY(30px)')">{{ toastText }}</div>
  </div>
</template>
