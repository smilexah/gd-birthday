<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CakeSlice from './CakeSlice.vue'
import { ApiError, createWish, errorKey, type Flavor, type Workplace } from './api'
import { saveTokens } from './device'
import { confetti, showToast } from './effects'
import { poke, setAccepting, showOwnWish, state } from './state'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t, locale } = useI18n()

const workplaces: { code: Workplace; colors: string[] }[] = [
  { code: 'apt', colors: ['#FFD3DE', '#8A1F42', '#E59AB0'] },
  { code: 'fil', colors: ['#BDF1E6', '#0F5547', '#7FCDBD'] },
  { code: 'off', colors: ['#CFDBFF', '#1C3A8F', '#98ADE6'] },
  { code: 'log', colors: ['#FFE7A8', '#7A4B0B', '#E3BE6C'] },
  { code: 'reg', colors: ['#E6D2FF', '#4F2A8A', '#BE9CE6'] }
]
const flavors: Flavor[] = ['V', 'B', 'C', 'G']

const labelStyle = 'display:block;font-weight:900;color:#1A3CB0;margin:16px 0 6px;font-size:15px'
const inputStyle = 'width:100%;box-sizing:border-box;border:3px solid #CFDBFF;border-radius:16px;padding:12px 14px;font:700 16px Nunito,sans-serif;color:#12233F'

const nameInput = ref<HTMLInputElement | null>(null)
const name = ref('')
const workplace = ref<Workplace | null>(null)
const city = ref('')
const text = ref('')
const flavor = ref<Flavor>('V')
const website = ref('')
const messageKey = ref('')
const sending = ref(false)

function hasCity() {
  return workplace.value === 'apt' || workplace.value === 'fil'
}

function close() {
  emit('close')
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    close()
  }
}

function resetForm() {
  name.value = ''
  text.value = ''
  city.value = ''
  workplace.value = null
}

async function submit() {
  const cleanName = name.value.trim()
  const cleanText = text.value.trim()
  if (!cleanName || !workplace.value || !cleanText) {
    messageKey.value = 'errors.required'
    return
  }
  if (/\s/.test(cleanName)) {
    messageKey.value = 'errors.name'
    return
  }
  if (/https?:|www\./i.test(cleanText)) {
    messageKey.value = 'errors.links'
    return
  }
  if (!state.accepting) {
    messageKey.value = 'errors.closed'
    return
  }
  messageKey.value = ''
  sending.value = true
  try {
    const created = await createWish({
      name: cleanName,
      workplace: workplace.value,
      city: hasCity() ? city.value.trim() : '',
      text: cleanText,
      flavor: flavor.value,
      lang: locale.value,
      website: website.value
    })
    state.tokens[created.wish.id] = created.authorToken
    saveTokens(state.tokens)
    resetForm()
    close()
    confetti()
    showToast(t('toast.thanks'))
    poke()
    showOwnWish(created.wish)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'closed') {
      setAccepting(false)
    }
    messageKey.value = errorKey(error)
  } finally {
    sending.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return
    }
    messageKey.value = ''
    poke()
    await nextTick()
    setTimeout(() => {
      if (nameInput.value) {
        nameInput.value.focus()
      }
    }, 50)
  }
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div :style="{ display: open ? 'flex' : 'none' }" style="position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(10,15,70,.65);align-items:center;justify-content:center;z-index:100;padding:16px" @click="onBackdropClick">
    <form id="mf" autocomplete="off" style="background:#fff;border-radius:28px;max-width:540px;width:100%;max-height:92vh;overflow:auto;padding:26px 28px;border:4px solid #1A3CB0;box-shadow:10px 10px 0 #1A3CB0;font-family:Nunito,sans-serif" @submit.prevent="submit">
      <h3 style="margin:0;font-size:28px;font-weight:900;color:#1A3CB0">{{ t('form.title') }}</h3>
      <label for="fn" :style="labelStyle">{{ t('form.name') }}</label><input id="fn" ref="nameInput" v-model="name" maxlength="30" :style="inputStyle">
      <label :style="labelStyle">{{ t('form.workplace') }}</label>
      <div id="fw" style="display:flex;flex-wrap:wrap;gap:8px">
        <button v-for="item in workplaces" :key="item.code" type="button" class="fl" :class="{ on: workplace === item.code }" :style="'background:' + item.colors[0] + ';color:' + item.colors[1] + ';border-bottom:4px solid ' + item.colors[2]" @click="workplace = item.code">{{ t('workplace.' + item.code) }}</button>
      </div>
      <div id="fcw" :style="{ display: hasCity() ? 'block' : 'none' }"><label for="fc" :style="labelStyle">{{ t('form.city') }}</label><input id="fc" v-model="city" maxlength="30" :style="inputStyle"></div>
      <label for="ft" :style="labelStyle">{{ t('form.text') }}</label><textarea id="ft" v-model="text" maxlength="500" rows="4" :style="inputStyle + ';resize:vertical'"></textarea>
      <div id="fk" style="text-align:right;font-size:12px;font-weight:700;color:#5B6577">{{ text.length }} / 500</div>
      <label :style="labelStyle">{{ t('form.flavor') }}</label>
      <div id="fs" style="display:flex;flex-wrap:wrap;gap:6px">
        <button v-for="item in flavors" :key="item" type="button" :aria-label="t('form.flavors.' + item)" :aria-pressed="flavor === item ? 'true' : 'false'" :style="'background:#FFF8E0;border:3px solid transparent;border-radius:16px;padding:4px;cursor:pointer;border-color:' + (flavor === item ? '#1A3CB0' : 'transparent')" @click="flavor = item"><div style="width:90px"><CakeSlice :flavor="item" width="90px" /></div></button>
      </div>
      <input id="fh" v-model="website" tabindex="-1" aria-hidden="true" style="position:absolute;left:-9999px" autocomplete="off">
      <div id="fe" role="alert" style="color:#C22C66;font-weight:800;margin-top:12px;min-height:20px">{{ messageKey ? t(messageKey) : '' }}</div>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px">
        <button id="fx" type="button" style="cursor:pointer;background:#EEF1FF;color:#1A3CB0;border:0;box-shadow:0 4px 0 #B7C3F0;border-radius:999px;padding:14px 26px;font:900 16px Nunito,sans-serif" @click="close">{{ t('form.cancel') }}</button>
        <button type="submit" :disabled="sending" style="cursor:pointer;background:linear-gradient(#FFE27A,#F3B53C);color:#3B2300;border:0;box-shadow:0 5px 0 #A6732F;border-radius:999px;padding:14px 30px;font:900 17px Nunito,sans-serif">{{ t('form.submit') }}</button>
      </div>
    </form>
  </div>
</template>
