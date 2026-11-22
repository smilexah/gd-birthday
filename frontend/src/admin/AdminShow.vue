<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AdminWish } from './api'
import { place } from './common'

const props = defineProps<{ items: AdminWish[] }>()
const emit = defineEmits<{ close: [] }>()

const root = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const index = ref(0)
let timer = 0
let wentFullscreen = false
let closed = false

const current = computed(() => props.items[index.value])

function restartBar() {
  const element = bar.value
  if (!element) {
    return
  }
  element.style.transition = 'none'
  element.style.width = '0'
  void element.offsetWidth
  element.style.transition = 'width 7s linear'
  element.style.width = '100%'
}

function move(step: number) {
  index.value = (index.value + step + props.items.length) % props.items.length
  restartBar()
  clearInterval(timer)
  timer = window.setInterval(() => move(1), 7000)
}

function close() {
  if (closed) {
    return
  }
  closed = true
  clearInterval(timer)
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  emit('close')
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
  if (event.key === 'ArrowRight') {
    move(1)
  }
  if (event.key === 'ArrowLeft') {
    move(-1)
  }
}

function onFullscreenChange() {
  if (document.fullscreenElement) {
    wentFullscreen = true
  } else if (wentFullscreen) {
    close()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  await nextTick()
  move(0)
  try {
    if (root.value && root.value.requestFullscreen) {
      root.value.requestFullscreen().catch(() => {})
    }
  } catch {
    return
  }
})

onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div ref="root" class="show">
    <div class="hd">С днём рождения, Алия Джайдаковна!</div>
    <button class="btn gold x" @click="close">Закрыть</button>
    <button class="nv" style="left:24px" @click="move(-1)">‹</button>
    <button class="nv" style="right:24px" @click="move(1)">›</button>
    <template v-if="current">
      <div class="q">«{{ current.text }}»</div>
      <div class="who">{{ current.name }}</div>
      <div class="pl">№{{ current.number }} · {{ place(current) }}</div>
    </template>
    <div class="ct">{{ index + 1 }} из {{ items.length }}</div>
    <div ref="bar" class="pr"></div>
  </div>
</template>
