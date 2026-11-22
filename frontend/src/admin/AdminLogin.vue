<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, request } from './api'
import logo from './logo.png'

const emit = defineEmits<{ done: [] }>()

const login = ref('admin')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  if (!login.value.trim()) {
    error.value = 'Введите логин'
    return
  }
  if (!password.value) {
    error.value = 'Введите пароль'
    return
  }
  busy.value = true
  error.value = ''
  try {
    await request('POST', '/api/admin/login', { login: login.value.trim(), password: password.value })
    password.value = ''
    emit('done')
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      error.value = 'Неверный логин или пароль'
    } else if (e instanceof ApiError && e.status === 429) {
      error.value = 'Слишком много попыток, попробуйте позже'
    } else if (e instanceof ApiError) {
      error.value = 'Ошибка сервера, попробуйте позже'
    } else {
      error.value = 'Нет связи с сервером'
    }
  }
  busy.value = false
}
</script>

<template>
  <div class="login">
    <form class="lbox" @submit.prevent="submit">
      <img :src="logo" alt="INKAR" style="height:40px">
      <h1>Админка поздравлений</h1>
      <p>Вход для сотрудников ИТ-отдела</p>
      <input v-model="login" class="fld" placeholder="Логин" autocomplete="username">
      <input v-model="password" class="fld" type="password" placeholder="Пароль" autocomplete="current-password">
      <div class="err">{{ error }}</div>
      <button class="btn gold" style="width:100%;padding:14px;font-size:16px" type="submit" :disabled="busy">Войти</button>
    </form>
  </div>
</template>
