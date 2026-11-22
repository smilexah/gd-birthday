<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CakeSlice from './CakeSlice.vue'
import { ApiError, deleteWish, errorKey, reportWish, type Wish } from './api'
import { loadReported, saveReported, saveTokens } from './device'
import { showToast } from './effects'
import { listLength, loadMore, poke, reloadFeed, removeWishById, setAccepting, state } from './state'

const props = defineProps<{ formOpen: boolean }>()
const emit = defineEmits<{ open: [] }>()
const { t } = useI18n()

const POS = [0, 270, 450, 590, 700, 790]
const SC = [1, 0.78, 0.62, 0.5, 0.4, 0.32]
const filterCodes = ['all', 'apt', 'fil', 'off', 'log', 'reg']

const stageEl = ref<HTMLElement | null>(null)
const stageWidth = ref(1400)
const ready = ref(false)
const reported = ref<number[]>(loadReported())
const confirmId = ref<number | null>(null)
const deletingId = ref<number | null>(null)

let autoTimer: number | undefined
let confirmTimer: number | undefined
let startX: number | null = null

const list = computed<(Wish | null)[]>(() => (state.accepting ? [null, ...state.wishes] : state.wishes))

const cells = computed(() => {
  const n = list.value.length
  const f = Math.min(1, Math.max(0.55, stageWidth.value / 1400))
  const circle = n >= 7
  const result = []
  for (let i = 0; i < n; i++) {
    let d = i - state.active
    if (circle) {
      d = (((i - state.active) % n) + n) % n
      if (d > n / 2) {
        d -= n
      }
    }
    const a = Math.abs(d)
    if (a > 11) {
      continue
    }
    const side = d < 0 ? -1 : 1
    let style: Record<string, string | number>
    if (a > 5) {
      style = { opacity: 0, pointerEvents: 'none', transform: 'translateX(' + side * (POS[5] + 120) * f + 'px) scale(.2)' }
    } else {
      style = { opacity: 1, zIndex: 10 - a, transform: 'translateX(' + side * POS[a] * f + 'px) scale(' + SC[a] + ')' }
    }
    const wish = list.value[i]
    result.push({
      key: state.version + '-' + (wish ? wish.id : 'slot'),
      index: i,
      wish,
      active: d === 0,
      style
    })
  }
  return result
})

function placeText(wish: Wish) {
  const place = t('workplace.' + wish.workplace)
  return wish.city ? place + ' · ' + wish.city : place
}

function go(step: number) {
  const n = list.value.length
  if (n === 0) {
    return
  }
  if (n >= 7) {
    state.active = (state.active + step + n) % n
  } else {
    state.active = Math.max(0, Math.min(n - 1, state.active + step))
  }
}

function step(direction: number) {
  go(direction)
  poke()
}

function onCellClick(index: number, wish: Wish | null) {
  if (!wish) {
    emit('open')
    return
  }
  if (index !== state.active) {
    state.active = index
    poke()
  }
}

function chooseFilter(code: string) {
  reloadFeed(code)
  poke()
}

function onPointerDown(event: PointerEvent) {
  startX = event.clientX
}

function onPointerUp(event: PointerEvent) {
  if (startX === null) {
    return
  }
  const dx = event.clientX - startX
  startX = null
  if (Math.abs(dx) > 50) {
    step(dx < 0 ? 1 : -1)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (props.formOpen) {
    return
  }
  if (event.key === 'ArrowLeft') {
    step(-1)
  }
  if (event.key === 'ArrowRight') {
    step(1)
  }
}

function onResize() {
  if (stageEl.value) {
    stageWidth.value = stageEl.value.clientWidth
  }
}

function autoPlay() {
  const hovered = stageEl.value ? stageEl.value.matches(':hover') : false
  if (Date.now() - state.lastTouch > 6000 && list.value.length > 1 && !hovered && !props.formOpen) {
    go(1)
  }
}

async function report(wish: Wish) {
  if (reported.value.includes(wish.id)) {
    showToast(t('toast.reported'))
    return
  }
  try {
    await reportWish(wish.id)
    reported.value.push(wish.id)
    saveReported(reported.value)
    showToast(t('toast.reported'))
  } catch (error) {
    showToast(t(errorKey(error)))
  }
}

function canDelete(wish: Wish) {
  return state.accepting && Boolean(state.tokens[wish.id])
}

function forgetToken(id: number) {
  delete state.tokens[id]
  saveTokens(state.tokens)
}

async function remove(wish: Wish) {
  if (confirmId.value !== wish.id) {
    confirmId.value = wish.id
    window.clearTimeout(confirmTimer)
    confirmTimer = window.setTimeout(() => {
      confirmId.value = null
    }, 4000)
    return
  }
  confirmId.value = null
  deletingId.value = wish.id
  try {
    await deleteWish(wish.id, state.tokens[wish.id])
    forgetToken(wish.id)
    removeWishById(wish.id)
    showToast(t('toast.deleted'))
  } catch (error) {
    const code = error instanceof ApiError ? error.code : ''
    if (code === 'closed') {
      setAccepting(false)
      showToast(t('errors.closed'))
    } else if (code === 'network' || code === 'rate_limited') {
      showToast(t(errorKey(error)))
    } else {
      if (code === 'not_found' || code === 'forbidden') {
        forgetToken(wish.id)
      }
      showToast(t('errors.deleteFailed'))
    }
  } finally {
    deletingId.value = null
  }
}

watch(
  () => [state.active, state.wishes.length, state.nextCursor],
  () => {
    if (state.nextCursor !== null && state.active >= listLength() - 5) {
      loadMore()
    }
  }
)

watch(
  () => state.active,
  () => {
    confirmId.value = null
  }
)

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  document.addEventListener('keydown', onKeydown)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    autoTimer = window.setInterval(autoPlay, 4000)
  }
  setTimeout(() => {
    ready.value = true
  }, 60)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  document.removeEventListener('keydown', onKeydown)
  window.clearInterval(autoTimer)
  window.clearTimeout(confirmTimer)
})
</script>

<template>
  <section style="position: relative; z-index: 1; background: radial-gradient(circle at 12% 30%, rgba(255,200,90,.38) 0, rgba(255,200,90,0) 18%), radial-gradient(circle at 88% 20%, rgba(255,120,190,.38) 0, rgba(255,120,190,0) 20%), radial-gradient(circle at 72% 78%, rgba(120,170,255,.32) 0, rgba(120,170,255,0) 22%), radial-gradient(circle at 28% 82%, rgba(255,160,90,.28) 0, rgba(255,160,90,0) 18%), linear-gradient(180deg, #4B1C8F 0%, #7A2BA8 45%, #3A1478 100%); border-top: 6px solid #E8B25E; padding: 200px 0 0">
    <svg aria-hidden="true" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none"><path class="twinkle" d="M120 160 l8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8z" fill="#FFE9A8" /><path class="twinkle tw2" d="M1450 120 l7 16 16 7 -16 7 -7 16 -7 -16 -16 -7 16 -7z" fill="#FFB3D6" /><path class="twinkle tw3" d="M320 420 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="#FFFFFF" /><path class="twinkle" d="M1280 400 l8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8z" fill="#FFE9A8" /><path class="twinkle tw2" d="M820 90 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="#FFFFFF" /><circle class="twinkle tw3" cx="60" cy="520" r="5" fill="#FFE9A8" /><circle class="twinkle" cx="1540" cy="560" r="5" fill="#FFB3D6" /></svg>
    <div style="max-width: 1152px; margin: 0 auto; padding: 0 24px; text-align: center">
      <h2 style="margin: 0 0 22px; font-size: 52px; font-weight: 900; letter-spacing: -0.01em; color: #FFFFFF; text-shadow: 0 0 28px rgba(232,178,94,0.55), 0 4px 14px rgba(0,0,0,0.45)">{{ t('stage.title') }}</h2>
      <div id="filters" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 36px">
        <button v-for="code in filterCodes" :key="code" class="fl" :class="{ on: state.filter === code }" style="background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(8px)" @click="chooseFilter(code)">{{ t('filters.' + code) }}</button>
      </div>
    </div>
    <div id="stage" ref="stageEl" :class="{ rdy: ready }" style="position: relative; height: 470px; overflow: hidden; touch-action: pan-y; user-select: none" @pointerdown="onPointerDown" @pointerup="onPointerUp">
      <div id="items">
        <div v-for="cell in cells" :key="cell.key" class="it" :class="{ slot: !cell.wish, act: cell.active }" :style="cell.style" @click="onCellClick(cell.index, cell.wish)">
          <template v-if="!cell.wish">
            <div class="bub"><div class="bt" style="font-weight:900;font-size:19px;color:#3B2300;text-align:center">{{ t('stage.slot') }}</div></div>
            <div class="sl"><div class="plus"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#3B2300" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg></div></div>
          </template>
          <template v-else>
            <div class="bub">
              <template v-if="cell.active">
                <div class="bt">{{ cell.wish.text }}</div>
                <div class="bn"><span>{{ cell.wish.name }}</span><span class="no">№{{ cell.wish.number }}</span></div>
                <div class="bn" style="font-size:13px"><span class="no" style="background:#E6EAFF;color:#1C3A8F">{{ placeText(cell.wish) }}</span></div>
                <div class="actions">
                  <button class="rep" @click.stop="report(cell.wish)">{{ t('stage.report') }}</button>
                  <button v-if="canDelete(cell.wish)" class="rep" :disabled="deletingId === cell.wish.id" @click.stop="remove(cell.wish)">{{ confirmId === cell.wish.id ? t('stage.confirmDelete') : t('stage.delete') }}</button>
                </div>
              </template>
              <span v-else>{{ cell.wish.name }} №{{ cell.wish.number }}</span>
            </div>
            <div class="sl"><CakeSlice :flavor="cell.wish.flavor" /></div>
          </template>
        </div>
      </div>
      <button id="prev" :aria-label="t('stage.prev')" style="position: absolute; left: 24px; top: 235px; width: 62px; height: 62px; border-radius: 50%; border: 0; border-bottom: 5px solid #162F8C; background: #2457F5; display: flex; align-items: center; justify-content: center; z-index: 50; cursor: pointer" @click="step(-1)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg></button>
      <button id="next" :aria-label="t('stage.next')" style="position: absolute; right: 24px; top: 235px; width: 62px; height: 62px; border-radius: 50%; border: 0; border-bottom: 5px solid #162F8C; background: #2457F5; display: flex; align-items: center; justify-content: center; z-index: 50; cursor: pointer" @click="step(1)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg></button>
      <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 58px; background-color: #F2C4D2; background-image: radial-gradient(circle at 20px 0, #FFF6E0 18px, transparent 19px), linear-gradient(#F9D3DE, #C96C8E); background-size: 40px 100%, 100% 100%; background-repeat: repeat-x, no-repeat; box-shadow: 0 -8px 20px rgba(150,40,90,0.25)"></div>
    </div>
  </section>
</template>
