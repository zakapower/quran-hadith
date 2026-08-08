import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

type Props = {
  surah: number
  ayah: number
  translation: string
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

export function CopyAyahButton({ surah, ayah, translation }: Props) {
  const { lang, t } = useApp()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  async function onCopy() {
    const label = lang === 'ru' ? 'Коран' : 'Qur’an'
    const text = `${label} ${surah}:${ayah}\n${translation.trim()}`
    try {
      await writeClipboard(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      className={copied ? 'ayah__copy ayah__copy--done' : 'ayah__copy'}
      onClick={onCopy}
      aria-label={
        copied
          ? t('Скопировано', 'Copied')
          : t('Копировать аят', 'Copy ayah')
      }
      title={
        copied
          ? t('Скопировано', 'Copied')
          : t('Копировать аят', 'Copy ayah')
      }
    >
      <span className="ayah__copy-stack" aria-hidden="true">
        <span className="ayah__copy-icon ayah__copy-icon--copy" />
        <span className="ayah__copy-icon ayah__copy-icon--check" />
      </span>
    </button>
  )
}
