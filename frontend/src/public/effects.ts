import { ref } from 'vue'

export const toastText = ref('')
export const toastVisible = ref(false)

let toastTimer: number | undefined

export function showToast(text: string) {
  toastText.value = text
  toastVisible.value = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

export function confetti() {
  const colors = ['#FF8FB5', '#FFD84D', '#BFD4FF', '#fff', '#B26BFF']
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div')
    const x = Math.random() * 100
    piece.style.cssText = 'position:fixed;top:-20px;left:' + x + 'vw;width:12px;height:7px;border-radius:2px;background:' + colors[i % 5] + ';z-index:300;pointer-events:none;transition:transform ' + (1.6 + Math.random() * 1.6) + 's ease-in,opacity .4s 1.8s;transform:rotate(0)'
    document.body.appendChild(piece)
    setTimeout(() => {
      piece.style.transform = 'translate(' + ((Math.random() - 0.5) * 300) + 'px,' + (innerHeight + 40) + 'px) rotate(' + (Math.random() * 900) + 'deg)'
      piece.style.opacity = '0'
    }, 30)
    setTimeout(() => {
      piece.remove()
    }, 3600)
  }
}
