<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ total: number; accepting: boolean }>()
const emit = defineEmits<{ open: [] }>()
const { t } = useI18n()

const totalText = computed(() => String(props.total).replace(/\B(?=(\d{3})+$)/g, '\u00a0'))
</script>

<template>
<section style="position: relative; background: radial-gradient(ellipse at 50% 92%, rgba(232,178,94,0.30) 0%, rgba(232,178,94,0) 55%), radial-gradient(ellipse at 18% 8%, #1E40A8 0%, rgba(30,64,168,0) 50%), linear-gradient(180deg, #071238 0%, #0B1F5C 55%, #14337F 100%); padding: 120px 64px 0; text-align: center">
<svg aria-hidden="true" viewBox="0 0 1280 1000" preserveAspectRatio="xMidYMin slice" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%">
<defs>
<g id="burst" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
<line x1="0" y1="-18" x2="0" y2="-66" />
<line x1="0" y1="-18" x2="0" y2="-66" transform="rotate(45)" />
<line x1="0" y1="-18" x2="0" y2="-66" transform="rotate(90)" />
<line x1="0" y1="-18" x2="0" y2="-66" transform="rotate(135)" />
<line x1="0" y1="-18" x2="0" y2="-66" transform="rotate(180)" />
<line x1="0" y1="-18" x2="0" y2="-66" transform="rotate(225)" />
<line x1="0" y1="-18" x2="0" y2="-66" transform="rotate(270)" />
<line x1="0" y1="-18" x2="0" y2="-66" transform="rotate(315)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(22.5)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(67.5)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(112.5)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(157.5)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(202.5)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(247.5)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(292.5)" />
<line x1="0" y1="-28" x2="0" y2="-50" transform="rotate(337.5)" />
<circle cx="0" cy="-82" r="4" fill="currentColor" stroke="none" />
<circle cx="58" cy="-58" r="4" fill="currentColor" stroke="none" />
<circle cx="-58" cy="-58" r="4" fill="currentColor" stroke="none" />
<circle cx="82" cy="0" r="4" fill="currentColor" stroke="none" />
<circle cx="-82" cy="0" r="4" fill="currentColor" stroke="none" />
<circle cx="58" cy="58" r="4" fill="currentColor" stroke="none" />
<circle cx="-58" cy="58" r="4" fill="currentColor" stroke="none" />
<circle cx="0" cy="82" r="4" fill="currentColor" stroke="none" />
</g>
</defs>
<g transform="translate(640 770)">
<g class="spin2">
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(30)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(60)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(90)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(120)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(150)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(180)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(210)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(240)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(270)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(300)" />
<polygon points="0,0 -40,-760 40,-760" fill="url(#gRay)" transform="rotate(330)" />
</g>
</g>
<path d="M0 8 Q640 62 1280 8" fill="none" stroke="#FFD24D" stroke-width="5" filter="url(#glow)" />
<g class="sway"><polygon points="14,11 66,11 40,63" fill="url(#fgG)" /><polygon points="14,11 66,11 40,63" fill="url(#fgS)" /></g>
<g class="sway sw2"><polygon points="94,17 146,17 120,69" fill="url(#fgP)" /><polygon points="94,17 146,17 120,69" fill="url(#fgS)" /></g>
<g class="sway sw3"><polygon points="174,22 226,22 200,74" fill="url(#fgB)" /><polygon points="174,22 226,22 200,74" fill="url(#fgS)" /></g>
<g class="sway"><polygon points="254,26 306,26 280,78" fill="url(#fgW)" /><polygon points="254,26 306,26 280,78" fill="url(#fgS)" /></g>
<g class="sway sw2"><polygon points="334,29 386,29 360,81" fill="url(#fgG)" /><polygon points="334,29 386,29 360,81" fill="url(#fgS)" /></g>
<g class="sway sw3"><polygon points="414,31 466,31 440,83" fill="url(#fgP)" /><polygon points="414,31 466,31 440,83" fill="url(#fgS)" /></g>
<g class="sway"><polygon points="494,33 546,33 520,85" fill="url(#fgB)" /><polygon points="494,33 546,33 520,85" fill="url(#fgS)" /></g>
<g class="sway sw2"><polygon points="574,34 626,34 600,86" fill="url(#fgW)" /><polygon points="574,34 626,34 600,86" fill="url(#fgS)" /></g>
<g class="sway sw3"><polygon points="654,34 706,34 680,86" fill="url(#fgG)" /><polygon points="654,34 706,34 680,86" fill="url(#fgS)" /></g>
<g class="sway"><polygon points="734,33 786,33 760,85" fill="url(#fgP)" /><polygon points="734,33 786,33 760,85" fill="url(#fgS)" /></g>
<g class="sway sw2"><polygon points="814,31 866,31 840,83" fill="url(#fgB)" /><polygon points="814,31 866,31 840,83" fill="url(#fgS)" /></g>
<g class="sway sw3"><polygon points="894,29 946,29 920,81" fill="url(#fgW)" /><polygon points="894,29 946,29 920,81" fill="url(#fgS)" /></g>
<g class="sway"><polygon points="974,26 1026,26 1000,78" fill="url(#fgG)" /><polygon points="974,26 1026,26 1000,78" fill="url(#fgS)" /></g>
<g class="sway sw2"><polygon points="1054,22 1106,22 1080,74" fill="url(#fgP)" /><polygon points="1054,22 1106,22 1080,74" fill="url(#fgS)" /></g>
<g class="sway sw3"><polygon points="1134,17 1186,17 1160,69" fill="url(#fgB)" /><polygon points="1134,17 1186,17 1160,69" fill="url(#fgS)" /></g>
<g class="sway"><polygon points="1214,11 1266,11 1240,63" fill="url(#fgW)" /><polygon points="1214,11 1266,11 1240,63" fill="url(#fgS)" /></g>
<g transform="translate(140 270)" filter="url(#glow)"><g class="burst bs1" style="color: #FFD84D"><use href="#burst" /></g></g>
<g transform="translate(450 210)" filter="url(#glow)"><g class="burst bs2" style="color: #FF8FB5"><use href="#burst" /></g></g>
<g transform="translate(840 240)" filter="url(#glow)"><g class="burst bs3" style="color: #BFD4FF"><use href="#burst" /></g></g>
<g transform="translate(1150 300)" filter="url(#glow)"><g class="burst bs4" style="color: #FFD84D"><use href="#burst" /></g></g>
<g transform="translate(640 160)" filter="url(#glow)"><g class="burst bs5" style="color: #FFFFFF"><use href="#burst" /></g></g>
<g transform="translate(300 520)" filter="url(#glow)"><g class="burst bs6" style="color: #FF8FB5"><use href="#burst" /></g></g>
<g transform="translate(1000 540)" filter="url(#glow)"><g class="burst bs3" style="color: #FFD84D"><use href="#burst" /></g></g>
<path class="twinkle" d="M250 360 l7 16 16 7 -16 7 -7 16 -7 -16 -16 -7 16 -7z" fill="#FFE066" />
<path class="twinkle tw2" d="M1040 430 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="#FF8FB5" />
<path class="twinkle tw3" d="M70 450 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="#BFD4FF" />
<path class="twinkle tw2" d="M1215 500 l7 16 16 7 -16 7 -7 16 -7 -16 -16 -7 16 -7z" fill="#FFE066" />
<path class="twinkle" d="M560 60 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="#FFFFFF" />
<path class="twinkle tw3" d="M760 90 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="#FFFFFF" />
<rect class="fall" x="90" y="0" width="16" height="8" rx="3" fill="#FF8FB5" />
<rect class="fall fa2" x="190" y="0" width="16" height="8" rx="3" fill="#FFD84D" style="animation-delay: -3s" />
<rect class="fall fa3" x="330" y="0" width="16" height="8" rx="3" fill="#BFD4FF" style="animation-delay: -5s" />
<rect class="fall fa4" x="450" y="0" width="16" height="8" rx="3" fill="#FFFFFF" style="animation-delay: -2s" />
<rect class="fall" x="560" y="0" width="16" height="8" rx="3" fill="#FFD84D" style="animation-delay: -6s" />
<rect class="fall fa2" x="690" y="0" width="16" height="8" rx="3" fill="#FF8FB5" style="animation-delay: -8s" />
<rect class="fall fa3" x="800" y="0" width="16" height="8" rx="3" fill="#BFD4FF" style="animation-delay: -1s" />
<rect class="fall fa4" x="920" y="0" width="16" height="8" rx="3" fill="#FFFFFF" style="animation-delay: -7s" />
<rect class="fall" x="1030" y="0" width="16" height="8" rx="3" fill="#FFD84D" style="animation-delay: -4s" />
<rect class="fall fa2" x="1140" y="0" width="16" height="8" rx="3" fill="#FF8FB5" style="animation-delay: -9s" />
<rect class="fall fa3" x="1240" y="0" width="16" height="8" rx="3" fill="#BFD4FF" style="animation-delay: -10s" />
<rect class="fall" x="40" y="0" width="16" height="8" rx="3" fill="#FFFFFF" style="animation-delay: -5.5s" />
<g transform="translate(130 600)"><g class="float"><ellipse cx="0" cy="0" rx="48" ry="60" fill="url(#gbGold)" /><ellipse cx="-16" cy="-24" rx="9" ry="16" fill="#FFFFFF" opacity="0.55" transform="rotate(20 -16 -24)" /><path d="M-7 60 L7 60 L0 71Z" fill="#B9802F" /><path d="M0 71 q-14 40 6 80 t-6 90" stroke="#FFFFFF" stroke-opacity="0.6" fill="none" stroke-width="2" /></g></g>
<g transform="translate(55 730)"><g class="float f2"><ellipse cx="0" cy="0" rx="42" ry="54" fill="url(#gbPink)" /><ellipse cx="-14" cy="-21" rx="8" ry="14" fill="#FFFFFF" opacity="0.55" transform="rotate(20 -14 -21)" /><path d="M-6 54 L6 54 L0 64Z" fill="#C22C66" /><path d="M0 64 q-14 40 6 80 t-6 90" stroke="#FFFFFF" stroke-opacity="0.6" fill="none" stroke-width="2" /></g></g>
<g transform="translate(235 750)"><g class="float f3"><ellipse cx="0" cy="0" rx="40" ry="52" fill="url(#gbMint)" /><ellipse cx="-13" cy="-20" rx="8" ry="13" fill="#FFFFFF" opacity="0.55" transform="rotate(20 -13 -20)" /><path d="M-6 52 L6 52 L0 62Z" fill="#17917D" /><path d="M0 62 q-14 40 6 80 t-6 90" stroke="#FFFFFF" stroke-opacity="0.6" fill="none" stroke-width="2" /></g></g>
<g transform="translate(1150 600)"><g class="float f4"><ellipse cx="0" cy="0" rx="48" ry="60" fill="url(#gbPurple)" /><ellipse cx="-16" cy="-24" rx="9" ry="16" fill="#FFFFFF" opacity="0.55" transform="rotate(20 -16 -24)" /><path d="M-7 60 L7 60 L0 71Z" fill="#6A2BC0" /><path d="M0 71 q-14 40 6 80 t-6 90" stroke="#FFFFFF" stroke-opacity="0.6" fill="none" stroke-width="2" /></g></g>
<g transform="translate(1225 730)"><g class="float f2"><ellipse cx="0" cy="0" rx="42" ry="54" fill="url(#gbGold)" /><ellipse cx="-14" cy="-21" rx="8" ry="14" fill="#FFFFFF" opacity="0.55" transform="rotate(20 -14 -21)" /><path d="M-6 54 L6 54 L0 64Z" fill="#B9802F" /><path d="M0 64 q-14 40 6 80 t-6 90" stroke="#FFFFFF" stroke-opacity="0.6" fill="none" stroke-width="2" /></g></g>
<g transform="translate(1045 750)"><g class="float f3"><ellipse cx="0" cy="0" rx="40" ry="52" fill="url(#gbCoral)" /><ellipse cx="-13" cy="-20" rx="8" ry="13" fill="#FFFFFF" opacity="0.55" transform="rotate(20 -13 -20)" /><path d="M-6 52 L6 52 L0 62Z" fill="#BE3322" /><path d="M0 62 q-14 40 6 80 t-6 90" stroke="#FFFFFF" stroke-opacity="0.6" fill="none" stroke-width="2" /></g></g>
</svg>
<div style="position: relative; max-width: 900px; margin: 0 auto">
<div style="display: inline-block; background: linear-gradient(#FFE27A, #FFC53D); color: #3B2300; border-radius: 999px; padding: 9px 22px; font-size: 16px; font-weight: 900; transform: rotate(-2deg); box-shadow: 0 4px 0 #A6732F, 0 8px 20px rgba(0,0,0,0.25)">{{ t('hero.badge') }}</div>
<h1 style="margin: 26px 0 20px; color: #FFFFFF; font-size: 80px; line-height: 1.02; font-weight: 900; letter-spacing: -0.02em; text-shadow: 0 2px 0 #0A1A55, 0 10px 26px rgba(0,0,0,0.55)">{{ t('hero.greeting') }}<br><span class="shine" style="background: linear-gradient(100deg, #B9802F 0%, #FFF3C4 25%, #F2C45E 50%, #FFF3C4 75%, #B9802F 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; filter: drop-shadow(0 4px 0 #6B4514) drop-shadow(0 12px 18px rgba(0,0,0,0.5))">{{ t('hero.name') }}</span></h1>
<p style="margin: 0 auto 34px; max-width: 620px; color: #FFFFFF; font-size: 22px; line-height: 1.5; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.3)">{{ t('hero.lead') }}</p>
<button v-if="accepting" id="open1" class="cta" @click="emit('open')" style="cursor: pointer; background: linear-gradient(#FFE27A, #F3B53C); color: #3B2300; border: 0; border-radius: 999px; padding: 20px 46px; font-size: 21px; font-weight: 900; display: inline-flex; align-items: center; gap: 12px">
<svg aria-hidden="true" width="34" height="28" viewBox="0 0 200 150"><polygon points="30,64 78,44 168,44 120,64" fill="#FFFFFF" /><polygon points="30,64 120,64 120,112 30,112" fill="#FF6F9C" /><rect x="30" y="84" width="90" height="8" fill="#FFFFFF" /><polygon points="120,64 168,44 168,92 120,112" fill="#C22C66" /><circle cx="100" cy="48" r="10" fill="#D9364F" /></svg>
{{ t('hero.add') }}
</button>
<div v-else class="closed-note" style="display: inline-block; background: rgba(255,255,255,0.1); color: #FFE9B0; border: 1px solid rgba(255,233,168,0.5); border-radius: 999px; padding: 18px 40px; font-size: 20px; font-weight: 900; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px)">{{ t('hero.closed') }}</div>
</div>
<div style="position: relative; z-index: 2; display: flex; justify-content: center; margin-top: 10px; margin-bottom: -170px">
<div style="position: relative; width: 100%; max-width: 600px">
<svg role="img" :aria-label="t('hero.cake')" viewBox="0 0 520 500" style="width: 100%; height: auto; display: block; filter: drop-shadow(0 24px 24px rgba(10,15,70,0.5))">
<ellipse cx="260" cy="452" rx="250" ry="42" fill="#0A1040" opacity="0.4" />
<ellipse cx="260" cy="440" rx="236" ry="44" fill="#BFB49C" />
<ellipse cx="260" cy="430" rx="236" ry="44" fill="url(#gPlate)" />
<ellipse cx="260" cy="428" rx="204" ry="36" fill="#FFFFFF" opacity="0.7" />
<path d="M80 330 L80 430 A180 34 0 0 0 440 430 L440 330 Z" fill="url(#gT1)" />
<path d="M80 392 A180 34 0 0 0 440 392 L440 410 A180 34 0 0 1 80 410 Z" fill="url(#gGold)" />
<path d="M80 330 v20 q15 30 30 0 q15 42 30 0 q15 26 30 0 q15 38 30 0 q15 28 30 0 q15 44 30 0 q15 30 30 0 q15 36 30 0 q15 26 30 0 q15 40 30 0 q15 32 30 0 q15 34 30 0 v-20 Z" fill="url(#gFr)" />
<ellipse cx="260" cy="330" rx="180" ry="34" fill="url(#gFr)" />
<circle cx="130" cy="372" r="5" fill="#FFFFFF" />
<circle cx="190" cy="384" r="5" fill="#FFFFFF" />
<circle cx="260" cy="388" r="5" fill="#FFFFFF" />
<circle cx="330" cy="384" r="5" fill="#FFFFFF" />
<circle cx="390" cy="372" r="5" fill="#FFFFFF" />
<path d="M130 230 L130 320 A130 26 0 0 0 390 320 L390 230 Z" fill="url(#gT2)" />
<path d="M130 230 v18 q14.4 26 28.9 0 q14.4 38 28.9 0 q14.4 22 28.9 0 q14.4 34 28.9 0 q14.4 24 28.9 0 q14.4 40 28.9 0 q14.4 28 28.9 0 q14.4 32 28.9 0 q14.4 24 28.9 0 v-18 Z" fill="url(#gFr)" />
<ellipse cx="260" cy="230" rx="130" ry="26" fill="url(#gFr)" />
<path d="M190 150 L190 220 A70 20 0 0 0 330 220 L330 150 Z" fill="url(#gT3)" />
<path d="M190 150 v14 q14 24 28 0 q14 34 28 0 q14 20 28 0 q14 30 28 0 q14 22 28 0 v-14 Z" fill="url(#gFr)" />
<ellipse cx="260" cy="150" rx="70" ry="20" fill="url(#gFr)" />
<rect x="150" y="214" width="10" height="5" rx="2" fill="#FFD84D" transform="rotate(30 155 216)" />
<rect x="210" y="262" width="10" height="5" rx="2" fill="#4FDDC0" transform="rotate(-30 215 264)" />
<rect x="300" y="268" width="10" height="5" rx="2" fill="#FFFFFF" transform="rotate(60 305 270)" />
<rect x="352" y="256" width="10" height="5" rx="2" fill="#FFD84D" transform="rotate(-50 357 258)" />
<rect x="150" y="296" width="10" height="5" rx="2" fill="#FFD84D" transform="rotate(20 155 298)" />
<rect x="224" y="196" width="10" height="5" rx="2" fill="#FF6F9C" transform="rotate(-20 229 198)" />
<rect x="212" y="98" width="11" height="54" rx="3" fill="#FF6F9C" />
<rect x="255" y="92" width="11" height="60" rx="3" fill="#FFFFFF" />
<rect x="298" y="98" width="11" height="54" rx="3" fill="#FFD84D" />
<g filter="url(#glow)">
<ellipse class="flame" cx="217" cy="84" rx="8" ry="15" fill="url(#gFlame)" />
<ellipse class="flame fl2" cx="260" cy="78" rx="8" ry="15" fill="url(#gFlame)" />
<ellipse class="flame fl3" cx="303" cy="84" rx="8" ry="15" fill="url(#gFlame)" />
</g>
<path class="twinkle" d="M36 230 l7 16 16 7 -16 7 -7 16 -7 -16 -16 -7 16 -7z" fill="#FFE066" />
<path class="twinkle tw2" d="M478 190 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="#FF8FB5" />
<path class="twinkle tw3" d="M60 120 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="#FFFFFF" />
</svg>
<svg role="img" :aria-label="t('hero.counterLabel', { count: totalText })" viewBox="-115 -115 230 230" style="position: absolute; right: -60px; top: 40px; width: 210px; height: 210px; transform: rotate(-10deg); filter: drop-shadow(0 12px 14px rgba(10,15,70,0.45))">
<g class="spin">
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FF6F9C" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FFD84D" transform="rotate(30)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FF6F9C" transform="rotate(60)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FFD84D" transform="rotate(90)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FF6F9C" transform="rotate(120)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FFD84D" transform="rotate(150)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FF6F9C" transform="rotate(180)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FFD84D" transform="rotate(210)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FF6F9C" transform="rotate(240)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FFD84D" transform="rotate(270)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FF6F9C" transform="rotate(300)" />
<rect x="-10" y="-110" width="20" height="38" rx="10" fill="#FFD84D" transform="rotate(330)" />
</g>
<circle cx="0" cy="0" r="86" fill="#FFB02E" />
<circle cx="0" cy="0" r="76" fill="url(#gStick)" />
<text x="0" y="-20" text-anchor="middle" font-family="Nunito, sans-serif" font-size="17" font-weight="900" fill="#7A4B0B">{{ t('hero.counterTop') }}</text>
<text x="0" y="30" text-anchor="middle" font-family="Nunito, sans-serif" font-size="56" font-weight="900" fill="#2457F5" id="cnt">{{ totalText }}</text>
<text x="0" y="56" text-anchor="middle" font-family="Nunito, sans-serif" font-size="17" font-weight="900" fill="#7A4B0B">{{ t('hero.counterBottom') }}</text>
</svg>
</div>
</div>
</section>
</template>
