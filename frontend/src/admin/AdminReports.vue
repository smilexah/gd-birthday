<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { request, type AdminWish } from './api'
import { deleteWish, dismissReports, place, showError, toggleWish } from './common'

const emit = defineEmits<{ changed: [] }>()

const items = ref<AdminWish[]>([])
const loaded = ref(false)

async function load() {
  try {
    const data = await request<{ items: AdminWish[] }>('GET', '/api/admin/reports')
    items.value = data.items
    loaded.value = true
  } catch (error) {
    showError(error)
  }
}

async function keep(wish: AdminWish) {
  if (await dismissReports(wish)) {
    emit('changed')
    load()
  }
}

async function toggle(wish: AdminWish) {
  if (await toggleWish(wish)) {
    emit('changed')
    load()
  }
}

async function remove(wish: AdminWish) {
  if (await deleteWish(wish)) {
    emit('changed')
    load()
  }
}

onMounted(load)
</script>

<template>
  <div class="top">
    <h2>Жалобы</h2>
    <div></div>
  </div>
  <div v-if="items.length" class="cmp">
    <div v-for="wish in items" :key="wish.id" class="card ci">
      <div class="bx">
        <b style="color:#0B1F5C;font-size:17px">{{ wish.name }}</b>
        {{ ' ' }}
        <span style="color:#5B6577;font-size:13px;font-weight:700">{{ place(wish) }} · №{{ wish.number }}</span><span class="cnt">жалоб: {{ wish.reports }}</span>
        <div style="margin-top:8px;font-weight:600;color:#33415F">{{ wish.text }}</div>
      </div>
      <div class="acts">
        <button class="btn ghost" @click="keep(wish)">Оставить</button>
        <button class="btn ghost" @click="toggle(wish)">{{ wish.status === 'visible' ? 'Скрыть' : 'Показать' }}</button>
        <button class="btn danger" @click="remove(wish)">Удалить</button>
      </div>
    </div>
  </div>
  <div v-else-if="loaded" class="card empty">Жалоб нет</div>
</template>
