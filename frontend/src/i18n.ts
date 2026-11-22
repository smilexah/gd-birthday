import { createI18n } from 'vue-i18n'
import ru from './locales/ru'
import kk from './locales/kk'

function savedLang() {
  try {
    const value = localStorage.getItem('gd-lang')
    return value === 'kk' ? 'kk' : 'ru'
  } catch {
    return 'ru'
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: savedLang(),
  fallbackLocale: 'ru',
  messages: { ru, kk }
})
