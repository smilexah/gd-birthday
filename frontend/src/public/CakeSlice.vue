<script setup lang="ts">
import { computed } from 'vue'
import type { Flavor } from './api'

const props = withDefaults(defineProps<{ flavor: Flavor; width?: string }>(), { width: '200px' })

const palettes: Record<Flavor, string[]> = {
  V: ['#F8DFAE', '#D9B97E', '#E8A94F', '#B8812F', '#FFFFFF', '#E6DFD0'],
  B: ['#FFB3C6', '#E08AA2', '#E5457A', '#B3315C', '#FFE3EA', '#E8BFC9'],
  C: ['#9A6240', '#734428', '#4A2B1E', '#331C12', '#F3D9B8', '#D9BD97'],
  G: ['#C4E88F', '#9EC668', '#6FB03F', '#528A2B', '#FFFFFF', '#E6DFD0']
}

const c = computed(() => palettes[props.flavor] || palettes.V)
</script>

<template>
  <svg viewBox="0 0 200 150" :style="{ width: props.width, height: 'auto', display: 'block' }">
    <ellipse cx="100" cy="124" rx="94" ry="19" fill="#B9AE96" />
    <ellipse cx="100" cy="119" rx="94" ry="19" fill="url(#gPlate)" />
    <ellipse cx="100" cy="118" rx="72" ry="12" fill="#fff" opacity=".8" />
    <polygon points="30,64 78,44 168,44 120,64" :fill="c[4]" />
    <polygon points="30,64 120,64 120,112 30,112" :fill="c[0]" />
    <rect x="30" y="84" width="90" height="8" :fill="c[2]" />
    <rect x="30" y="64" width="90" height="6" :fill="c[4]" />
    <polygon points="120,64 168,44 168,50 120,70" :fill="c[5]" />
    <polygon points="120,70 168,50 168,64 120,84" :fill="c[1]" />
    <polygon points="120,84 168,64 168,72 120,92" :fill="c[3]" />
    <polygon points="120,92 168,72 168,92 120,112" :fill="c[1]" />
    <polygon points="30,64 120,64 120,112 30,112" fill="url(#gShineV)" />
    <polygon points="30,64 78,44 168,44 120,64" fill="url(#gShineV)" />
    <circle cx="100" cy="48" r="10" fill="url(#gCherry)" />
    <path d="M100 39 q4 -11 13 -13" fill="none" stroke="#3F8A2E" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="96" cy="44" r="2.8" fill="#fff" opacity=".85" />
  </svg>
</template>
