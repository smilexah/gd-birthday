<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loggedIn, request, type AdminWish, type WishPage } from './api'
import { answerConfirm, confirmBox, showError, showToast, toast } from './common'
import logo from './logo.png'
import AdminLogin from './AdminLogin.vue'
import AdminOverview from './AdminOverview.vue'
import AdminWishes from './AdminWishes.vue'
import AdminReports from './AdminReports.vue'
import AdminSettings from './AdminSettings.vue'
import AdminShow from './AdminShow.vue'

const views = [
  { key: 'ov', title: 'Обзор' },
  { key: 'wl', title: 'Поздравления' },
  { key: 'cp', title: 'Жалобы' },
  { key: 'st', title: 'Настройки' }
]

const view = ref('ov')
const reportCount = ref(0)
const showItems = ref<AdminWish[]>([])
const showLoading = ref(false)

async function checkSession() {
  try {
    await request('GET', '/api/admin/me')
    loggedIn.value = true
  } catch {
    loggedIn.value = false
  }
}

async function loadReportCount() {
  try {
    const data = await request<{ items: AdminWish[] }>('GET', '/api/admin/reports')
    reportCount.value = data.items.length
  } catch (error) {
    showError(error)
  }
}

function go(key: string) {
  view.value = key
  loadReportCount()
}

function onLogin() {
  loggedIn.value = true
  view.value = 'ov'
  loadReportCount()
}

async function logout() {
  try {
    await request('POST', '/api/admin/logout')
  } catch (error) {
    showError(error)
  }
  loggedIn.value = false
}

async function startShow() {
  if (showLoading.value) {
    return
  }
  showLoading.value = true
  const all: AdminWish[] = []
  try {
    let page = 1
    while (true) {
      const data = await request<WishPage>('GET', '/api/admin/wishes?status=visible&page=' + page + '&pageSize=100')
      all.push(...data.items)
      if (data.items.length === 0 || all.length >= data.total) {
        break
      }
      page++
    }
  } catch (error) {
    showError(error)
    showLoading.value = false
    return
  }
  showLoading.value = false
  if (!all.length) {
    showToast('Нет поздравлений для показа')
    return
  }
  showItems.value = all
}

function stopShow() {
  showItems.value = []
}

function onConfirmKey(event: KeyboardEvent) {
  if (confirmBox.open && event.key === 'Escape') {
    answerConfirm(false)
  }
}

watch(loggedIn, (value) => {
  if (!value) {
    showItems.value = []
    answerConfirm(false)
  }
})

onMounted(() => {
  document.body.style.margin = '0'
  document.body.style.background = '#F1F4FB'
  document.addEventListener('keydown', onConfirmKey)
  checkSession().then(() => {
    if (loggedIn.value) {
      loadReportCount()
    }
  })
})

onBeforeUnmount(() => {
  document.body.style.margin = ''
  document.body.style.background = ''
  document.removeEventListener('keydown', onConfirmKey)
})
</script>

<template>
  <div class="adm">
    <AdminLogin v-if="loggedIn === false" @done="onLogin" />
    <div v-else-if="loggedIn" class="app">
      <aside>
        <div class="logo"><img :src="logo" alt="INKAR"></div>
        <button v-for="item in views" :key="item.key" class="nav" :class="{ on: view === item.key }" @click="go(item.key)">
          {{ item.title }}
          <span v-if="item.key === 'cp'" class="bd">{{ reportCount }}</span>
        </button>
        <div class="sp"></div>
        <button class="nav" @click="logout">Выйти</button>
      </aside>
      <main>
        <AdminOverview v-if="view === 'ov'" @show="startShow" @reported="reportCount = $event" />
        <AdminWishes v-else-if="view === 'wl'" @changed="loadReportCount" />
        <AdminReports v-else-if="view === 'cp'" @changed="loadReportCount" />
        <AdminSettings v-else-if="view === 'st'" @show="startShow" />
      </main>
    </div>
    <AdminShow v-if="showItems.length" :items="showItems" @close="stopShow" />
    <div v-if="confirmBox.open" class="mbg" @click.self="answerConfirm(false)">
      <div class="mbox">
        <p>{{ confirmBox.text }}</p>
        <div class="mact">
          <button class="btn ghost" @click="answerConfirm(false)">Отмена</button>
          <button class="btn danger" @click="answerConfirm(true)">Удалить</button>
        </div>
      </div>
    </div>
    <div class="toast" :class="{ on: toast.on }">{{ toast.text }}</div>
  </div>
</template>

<style>
.adm,.adm *{box-sizing:border-box}
.adm{min-height:100vh;font-family:Nunito,system-ui,sans-serif;background:#F1F4FB;color:#12233F}
.adm button{font-family:inherit;cursor:pointer}
.adm input,.adm select,.adm textarea{font-family:inherit}
.adm .login{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(ellipse at 50% 100%,rgba(232,178,94,.3),rgba(232,178,94,0) 55%),linear-gradient(180deg,#071238,#0B1F5C 60%,#14337F)}
.adm .lbox{background:#fff;border-radius:24px;padding:34px;width:100%;max-width:400px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
.adm .lbox h1{margin:14px 0 6px;font-size:26px;font-weight:900;color:#0B1F5C}
.adm .lbox p{margin:0 0 20px;color:#5B6577;font-weight:600}
.adm .fld{display:block;width:100%;border:2px solid #D8E0F5;border-radius:14px;padding:13px 14px;font-size:16px;font-weight:700;color:#12233F;margin-bottom:12px;background:#fff}
.adm .fld:focus{outline:none;border-color:#2457F5}
.adm .btn{border:0;border-radius:12px;padding:11px 18px;font-weight:800;font-size:14px}
.adm .gold{background:linear-gradient(#FFE9A8,#E8B25E);color:#3B2300;border-bottom:3px solid #A6732F}
.adm .blue{background:#2457F5;color:#fff;border-bottom:3px solid #162F8C}
.adm .ghost{background:#EEF1FF;color:#1C3A8F}
.adm .danger{background:#FFE3E8;color:#B3123F}
.adm .err{color:#C22C66;font-weight:800;min-height:20px;margin-bottom:8px}
.adm .app{min-height:100vh}
.adm aside{position:fixed;left:0;top:0;bottom:0;width:240px;background:linear-gradient(180deg,#0B1F5C,#071238);color:#fff;padding:22px 16px;display:flex;flex-direction:column;gap:6px}
.adm aside .logo{background:#fff;border-radius:14px;padding:10px 14px;margin-bottom:18px}
.adm aside .logo img{height:34px;display:block}
.adm .nav{display:flex;align-items:center;gap:12px;background:none;border:0;color:#C9D6FF;text-align:left;padding:12px 14px;border-radius:12px;font-weight:800;font-size:15px}
.adm .nav:hover{background:rgba(255,255,255,.08)}
.adm .nav.on{background:linear-gradient(#FFE9A8,#E8B25E);color:#3B2300}
.adm .nav .bd{margin-left:auto;background:#E8286A;color:#fff;border-radius:999px;font-size:12px;padding:2px 8px}
.adm .sp{flex:1}
.adm main{margin-left:240px;padding:28px 32px 60px;max-width:1280px}
.adm .top{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:22px}
.adm .top h2{margin:0;font-size:30px;font-weight:900;color:#0B1F5C}
.adm .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px}
.adm .card{background:#fff;border-radius:18px;padding:20px;box-shadow:0 2px 0 rgba(11,31,92,.04),0 10px 26px rgba(11,31,92,.07)}
.adm .stat .n{font-size:38px;font-weight:900;color:#0B1F5C;line-height:1.1}
.adm .stat .l{font-weight:800;color:#5B6577;font-size:14px}
.adm .stat.g .n{color:#B9802F}
.adm .stat.r .n{color:#C22C66}
.adm .cols{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-bottom:18px}
.adm .card h3{margin:0 0 14px;font-size:17px;font-weight:900;color:#0B1F5C}
.adm .bar{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-weight:800;font-size:14px}
.adm .bar .nm{width:140px;color:#33415F}
.adm .bar .tr{flex:1;background:#EEF1FF;border-radius:999px;height:16px;overflow:hidden}
.adm .bar .fl{height:100%;border-radius:999px;background:linear-gradient(90deg,#2457F5,#6A8CFF)}
.adm .bar .v{width:40px;text-align:right;color:#0B1F5C}
.adm .days{display:flex;align-items:flex-end;gap:14px;height:150px;padding-top:10px}
.adm .days .d{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px;font-weight:800;font-size:13px;color:#33415F}
.adm .days .col{width:100%;max-width:60px;border-radius:10px 10px 0 0;background:linear-gradient(#FFE9A8,#E8B25E)}
.adm .pill{display:inline-block;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:900}
.adm .s-vis{background:#D9F6E8;color:#0F6B43}
.adm .s-hid{background:#FFE7A8;color:#7A4B0B}
.adm .p-open{background:#D9F6E8;color:#0F6B43}
.adm .p-closed{background:#FFE3E8;color:#B3123F}
.adm .tools{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.adm .tools .fld{margin:0;width:auto;flex:1;min-width:180px;padding:10px 14px;font-size:15px}
.adm .tools select.fld{flex:0 0 auto}
.adm .tw{overflow-x:auto}
.adm table{width:100%;border-collapse:collapse;font-size:14px}
.adm th{text-align:left;color:#5B6577;font-size:12px;text-transform:uppercase;letter-spacing:.04em;padding:10px 10px;border-bottom:2px solid #EEF1FF}
.adm td{padding:12px 10px;border-bottom:1px solid #EEF1FF;vertical-align:top;font-weight:600}
.adm td.tx{max-width:380px;color:#33415F}
.adm td .nm{font-weight:900;color:#0B1F5C}
.adm td .pl{color:#5B6577;font-size:12px;font-weight:700}
.adm .acts{display:flex;gap:6px;flex-wrap:wrap}
.adm .acts .btn{padding:7px 12px;font-size:12px}
.adm .pg{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:14px;font-weight:800;color:#5B6577}
.adm .cmp{display:flex;flex-direction:column;gap:12px}
.adm .ci{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
.adm .ci .bx{flex:1;min-width:240px}
.adm .cnt{background:#E8286A;color:#fff;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:900;margin-left:8px}
.adm .empty{text-align:center;color:#5B6577;font-weight:800;padding:40px 0}
.adm .set{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 0;border-bottom:1px solid #EEF1FF}
.adm .set:last-child{border:0}
.adm .set b{display:block;font-size:16px;color:#0B1F5C}
.adm .set span{color:#5B6577;font-weight:600;font-size:14px}
.adm .sw{width:58px;height:32px;border-radius:999px;background:#C4CCE4;border:0;position:relative;transition:.2s}
.adm .sw:after{content:"";position:absolute;left:4px;top:4px;width:24px;height:24px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 2px 4px rgba(0,0,0,.25)}
.adm .sw.on{background:#22B573}
.adm .sw.on:after{left:30px}
.adm .show{display:flex;position:fixed;inset:0;z-index:100;background:radial-gradient(ellipse at 50% 100%,rgba(232,178,94,.35),rgba(232,178,94,0) 55%),linear-gradient(180deg,#071238,#0B1F5C 60%,#14337F);color:#fff;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center}
.adm .show .q{max-width:900px;font-size:34px;line-height:1.45;font-weight:800}
.adm .show .who{margin-top:26px;font-size:30px;font-weight:900;color:#F2C45E}
.adm .show .pl{margin-top:8px;font-size:18px;font-weight:700;color:#C9D6FF}
.adm .show .hd{position:absolute;top:22px;left:0;right:0;font-size:22px;font-weight:900;color:#F2C45E}
.adm .show .ct{position:absolute;bottom:26px;left:0;right:0;font-weight:800;color:#C9D6FF}
.adm .show .x{position:absolute;top:18px;right:22px}
.adm .show .nv{position:absolute;top:50%;width:56px;height:56px;border-radius:50%;border:0;background:linear-gradient(#FFF0C2,#E8B25E);font-size:26px;font-weight:900;color:#3B2300}
.adm .show .pr{position:absolute;left:0;bottom:0;height:5px;background:linear-gradient(90deg,#F2C45E,#FFE9A8)}
.adm .mbg{position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(7,18,56,.55)}
.adm .mbox{background:#fff;border-radius:24px;padding:28px;width:100%;max-width:400px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
.adm .mbox p{margin:0 0 20px;font-size:18px;font-weight:900;color:#0B1F5C}
.adm .mact{display:flex;gap:10px;justify-content:flex-end}
.adm .toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(30px);background:#0B1F5C;color:#fff;font-weight:800;padding:13px 24px;border-radius:999px;opacity:0;pointer-events:none;transition:.3s;z-index:200}
.adm .toast.on{opacity:1;transform:translateX(-50%)}
@media (max-width:900px){
.adm aside{position:static;width:auto;flex-direction:row;flex-wrap:wrap;padding:12px}
.adm aside .logo{margin:0 8px 0 0}
.adm .sp{display:none}
.adm main{margin-left:0;padding:18px 14px 50px}
.adm .grid4{grid-template-columns:repeat(2,1fr)}
.adm .cols{grid-template-columns:1fr}
.adm .show .q{font-size:22px}
.adm .show .who{font-size:22px}
.adm .bar .nm{width:100px}
}
</style>
