<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { request, type Settings } from './api'
import { downloadExcel, fromAstanaInput, showError, showToast, toAstanaInput } from './common'

const emit = defineEmits<{ show: [] }>()

const settings = ref<Settings | null>(null)
const closeTime = ref('')

async function load() {
  try {
    const data = await request<Settings>('GET', '/api/admin/settings')
    settings.value = data
    closeTime.value = toAstanaInput(data.closesAt)
  } catch (error) {
    showError(error)
  }
}

async function toggleOpen() {
  if (!settings.value) {
    return
  }
  const open = !settings.value.accepting
  try {
    const data = await request<Settings>('PUT', '/api/admin/settings', { isOpen: open })
    settings.value = data
    closeTime.value = toAstanaInput(data.closesAt)
    showToast(open ? 'Приём открыт' : 'Приём закрыт')
  } catch (error) {
    showError(error)
  }
}

async function saveCloseTime() {
  try {
    const data = await request<Settings>('PUT', '/api/admin/settings', { closesAt: fromAstanaInput(closeTime.value) })
    settings.value = data
    closeTime.value = toAstanaInput(data.closesAt)
    showToast(data.closesAt ? 'Время закрытия сохранено' : 'Автоматическое закрытие отключено')
  } catch (error) {
    showError(error)
  }
}

function changePassword() {
  showToast('Пароль меняется в .env на сервере')
}

onMounted(load)
</script>

<template>
  <div class="top">
    <h2>Настройки</h2>
    <div></div>
  </div>
  <div class="card">
    <div class="set">
      <div><b>Приём поздравлений</b><span>Когда выключен, сайт работает в режиме чтения</span></div>
      <button class="sw" :class="{ on: settings && settings.accepting }" aria-label="Приём" @click="toggleOpen"></button>
    </div>
    <div class="set">
      <div><b>Автоматическое закрытие</b><span>Приём закроется сам в указанное время (Астана)</span></div>
      <input v-model="closeTime" class="fld" style="width:auto;margin:0" type="datetime-local" @change="saveCloseTime">
    </div>
    <div class="set">
      <div><b>Выгрузка данных</b><span>Все поздравления с местом работы, датой и статусом</span></div>
      <button class="btn gold" @click="downloadExcel">Выгрузить в Excel</button>
    </div>
    <div class="set">
      <div><b>Режим показа для генерального директора</b><span>Полноэкранный показ всех поздравлений по очереди</span></div>
      <button class="btn blue" @click="emit('show')">Открыть</button>
    </div>
    <div class="set">
      <div><b>Сменить пароль админки</b><span>Хранится только в .env на сервере</span></div>
      <button class="btn ghost" @click="changePassword">Сменить</button>
    </div>
  </div>
</template>
