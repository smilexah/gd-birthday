<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { request, type AdminWish, type WishPage } from './api'
import { deleteWish, downloadExcel, formatDate, place, showError, toggleWish, workplaceKeys, workplaces } from './common'

const emit = defineEmits<{ changed: [] }>()

const pageSize = 20
const searchInput = ref('')
const search = ref('')
const workplace = ref('')
const status = ref('')
const page = ref(1)
const items = ref<AdminWish[]>([])
const total = ref(0)
const loaded = ref(false)
let searchTimer = 0
let requestNumber = 0

const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

async function load() {
  requestNumber++
  const myNumber = requestNumber
  const params = new URLSearchParams()
  if (search.value) {
    params.set('q', search.value)
  }
  if (workplace.value) {
    params.set('workplace', workplace.value)
  }
  if (status.value) {
    params.set('status', status.value)
  }
  params.set('page', String(page.value))
  params.set('pageSize', String(pageSize))
  try {
    const data = await request<WishPage>('GET', '/api/admin/wishes?' + params.toString())
    if (myNumber !== requestNumber) {
      return
    }
    if (data.items.length === 0 && data.total > 0 && page.value > 1) {
      page.value = Math.max(1, Math.ceil(data.total / pageSize))
      await load()
      return
    }
    items.value = data.items
    total.value = data.total
    loaded.value = true
  } catch (error) {
    showError(error)
  }
}

watch(searchInput, () => {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    search.value = searchInput.value.trim()
    page.value = 1
    load()
  }, 300)
})

watch([workplace, status], () => {
  page.value = 1
  load()
})

function previousPage() {
  if (page.value > 1) {
    page.value--
    load()
  }
}

function nextPage() {
  if (page.value < pages.value) {
    page.value++
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

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
})
</script>

<template>
  <div class="top">
    <h2>Поздравления</h2>
    <div><button class="btn gold" @click="downloadExcel">Выгрузить в Excel</button></div>
  </div>
  <div class="card">
    <div class="tools">
      <input v-model="searchInput" class="fld" placeholder="Поиск по имени или тексту">
      <select v-model="workplace" class="fld">
        <option value="">Все места</option>
        <option v-for="key in workplaceKeys" :key="key" :value="key">{{ workplaces[key] }}</option>
      </select>
      <select v-model="status" class="fld">
        <option value="">Любой статус</option>
        <option value="visible">Виден</option>
        <option value="hidden">Скрыт</option>
      </select>
    </div>
    <template v-if="items.length">
      <div class="tw">
        <table>
          <thead>
            <tr><th>№</th><th>Автор</th><th>Пожелание</th><th>Дата</th><th>Статус</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="wish in items" :key="wish.id">
              <td>{{ wish.number }}</td>
              <td><div class="nm">{{ wish.name }}</div><div class="pl">{{ place(wish) }}</div></td>
              <td class="tx">{{ wish.text }}<template v-if="wish.reports">{{ ' ' }}<span class="cnt">жалоб: {{ wish.reports }}</span></template></td>
              <td>{{ formatDate(wish.createdAt) }}</td>
              <td><span class="pill" :class="wish.status === 'visible' ? 's-vis' : 's-hid'">{{ wish.status === 'visible' ? 'виден' : 'скрыт' }}</span></td>
              <td>
                <div class="acts">
                  <button class="btn ghost" @click="toggle(wish)">{{ wish.status === 'visible' ? 'Скрыть' : 'Показать' }}</button>
                  <button class="btn danger" @click="remove(wish)">Удалить</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pg">
        <button class="btn ghost" @click="previousPage">‹</button>{{ page }} из {{ pages }}<button class="btn ghost" @click="nextPage">›</button>
      </div>
    </template>
    <div v-else-if="loaded" class="empty">Ничего не найдено</div>
  </div>
</template>
