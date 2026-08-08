import { useApp } from '../context/AppContext'
import { CopyQuoteButton } from './CopyQuoteButton'

type Props = {
  surah: number
  ayah: number
  translation: string
}

export function CopyAyahButton({ surah, ayah, translation }: Props) {
  const { lang, t } = useApp()
  const label = lang === 'ru' ? 'Коран' : 'Qur’an'

  return (
    <CopyQuoteButton
      heading={`${label} ${surah}:${ayah}`}
      body={translation}
      label={t('Копировать аят', 'Copy ayah')}
    />
  )
}
