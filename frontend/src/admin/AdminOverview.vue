<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { request, type Stats } from './api'
import { downloadExcel, formatDate, formatFullDate, place, showError, showToast, workplaceKeys, workplaces } from './common'

const emit = defineEmits<{ show: []; reported: [count: number] }>()

const stats = ref<Stats | null>(null)
const now = ref(Date.now())
let pollTimer = 0
let clockTimer = 0

async function load() {
  try {
    const data = await request<Stats>('GET', '/api/admin/stats')
    stats.value = data
    emit('reported', data.reported)
  } catch (error) {
    showError(error)
  }
}

const bars = computed(() => {
  const counts = stats.value ? stats.value.byWorkplace || {} : {}
  const values = workplaceKeys.map((key) => counts[key] || 0)
  const max = Math.max(1, ...values)
  return workplaceKeys.map((key, i) => ({
    key: key,
    name: workplaces[key],
    value: values[i],
    width: Math.round(values[i] / max * 100)
  }))
})

const days = computed(() => {
  const list = stats.value ? stats.value.byDay || [] : []
  const max = Math.max(1, ...list.map((d) => d.count))
  return list.map((d) => ({
    label: d.day.slice(8, 10) + '.' + d.day.slice(5, 7),
    count: d.count,
    height: Math.round(d.count / max * 100)
  }))
})

const latest = computed(() => (stats.value ? stats.value.latest || [] : []).slice(0, 5))

const timeLeft = computed(() => {
  if (!stats.value || !stats.value.closesAt) {
    return ''
  }
  const ms = new Date(stats.value.closesAt).getTime() - now.value
  if (ms <= 0) {
    return 'приём завершён'
  }
  const d = Math.floor(ms / 864e5)
  const h = Math.floor(ms % 864e5 / 36e5)
  const m = Math.floor(ms % 36e5 / 6e4)
  if (d === 0 && h === 0) {
    return 'до закрытия ' + m + ' мин'
  }
  return 'до закрытия ' + d + ' д ' + h + ' ч'
})

function shortText(text: string): string {
  return text.length > 90 ? text.slice(0, 90) + '…' : text
}

async function toggleOpen() {
  if (!stats.value) {
    return
  }
  const open = !stats.value.accepting
  try {
    await request('PUT', '/api/admin/settings', { isOpen: open })
    showToast(open ? 'Приём открыт' : 'Приём закрыт')
    await load()
  } catch (error) {
    showError(error)
  }
}

onMounted(() => {
  load()
  pollTimer = window.setInterval(load, 15000)
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(pollTimer)
  clearInterval(clockTimer)
})
</script>

<template>
  <div class="top">
    <h2>Обзор</h2>
    <div>
      <button class="btn blue" @click="emit('show')">Режим показа для ГД</button>
      {{ ' ' }}
      <button class="btn gold" @click="downloadExcel">Выгрузить в Excel</button>
    </div>
  </div>
  <template v-if="stats">
    <div class="grid4">
      <div class="card stat"><div class="n">{{ stats.total }}</div><div class="l">Всего поздравлений</div></div>
      <div class="card stat g"><div class="n">{{ stats.visible }}</div><div class="l">Показано на сайте</div></div>
      <div class="card stat"><div class="n">{{ stats.hidden }}</div><div class="l">Скрыто</div></div>
      <div class="card stat r"><div class="n">{{ stats.reported }}</div><div class="l">С жалобами</div></div>
    </div>
    <div class="cols">
      <div class="card">
        <h3>По местам работы</h3>
        <div v-for="bar in bars" :key="bar.key" class="bar">
          <div class="nm">{{ bar.name }}</div>
          <div class="tr"><div class="fl" :style="{ width: bar.width + '%' }"></div></div>
          <div class="v">{{ bar.value }}</div>
        </div>
      </div>
      <div class="card">
        <h3>Приём поздравлений</h3>
        <span class="pill" :class="stats.accepting ? 'p-open' : 'p-closed'">{{ stats.accepting ? 'Открыт' : 'Закрыт' }}</span>
        <div style="margin:12px 0;font-weight:700;color:#5B6577">
          <template v-if="stats.closesAt">Закрытие автоматически {{ formatFullDate(stats.closesAt) }} по Астане<br></template>
          <template v-else>Автоматическое закрытие не задано<br></template>
          <b style="color:#0B1F5C">{{ timeLeft }}</b>
        </div>
        <button class="btn" :class="stats.accepting ? 'danger' : 'blue'" @click="toggleOpen">{{ stats.accepting ? 'Закрыть приём' : 'Открыть приём' }}</button>
      </div>
    </div>
    <div class="cols">
      <div class="card">
        <h3>По дням</h3>
        <div class="days">
          <div v-for="day in days" :key="day.label" class="d">
            {{ day.count }}
            <div class="col" :style="{ height: day.height + 'px' }"></div>
            {{ day.label }}
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Последние</h3>
        <div v-for="wish in latest" :key="wish.id" style="padding:10px 0;border-bottom:1px solid #EEF1FF">
          <b style="color:#0B1F5C">{{ wish.name }}</b>
          {{ ' ' }}
          <span style="color:#5B6577;font-size:12px;font-weight:700">{{ place(wish) }} · {{ formatDate(wish.createdAt) }}</span>
          <div style="color:#33415F;font-weight:600;font-size:14px;margin-top:2px">{{ shortText(wish.text) }}</div>
        </div>
      </div>
    </div>
  </template>
</template>
