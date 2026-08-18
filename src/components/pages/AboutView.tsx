'use client'

import { useApp } from '@/context/AppContext'
import './About.css'

const GITHUB_URL = 'https://github.com/zakapower/quran-hadith'

export function AboutView() {
  const { t } = useApp()

  return (
    <article className="about">
      <header className="about__head">
        <h1>{t('О проекте', 'About')}</h1>
        <p className="about__lead">
          {t(
            'Зачем нужен Tilāwah и как им пользоваться.',
            'What Tilāwah is for and how to use it.',
          )}
        </p>
      </header>

      <div className="about__prose">
        <section>
          <h2>{t('Что это', 'What this is')}</h2>
          <p>
            {t(
              'Tilāwah – минималистичный ридер Корана и хадисов. Цель простая: спокойно читать арабский текст рядом с переводом, без лишнего шума, рекламы и сложных кабинетов.',
              'Tilāwah is a minimal Qur’an and Hadith reader. The goal is simple: read Arabic text beside a translation calmly – no noise, ads, or heavy accounts.',
            )}
          </p>
        </section>

        <section>
          <h2>{t('Что внутри', 'What’s inside')}</h2>
          <ul>
            <li>
              {t(
                'Все 114 сур Корана с арабским текстом и переводом (русский / English).',
                'All 114 Qur’an surahs with Arabic text and translation (Russian / English).',
              )}
            </li>
            <li>
              {t(
                'Хадисы из Сахих аль-Бухари, Сахих Муслим, Сунан Абу Дауд, Сунан ат-Тирмизи, Сунан ан-Насаи и Сунан ибн Маджа.',
                'Hadith from Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Sunan at-Tirmidhi, Sunan an-Nasa’i, and Sunan Ibn Majah.',
              )}
            </li>
            <li>
              {t(
                'Озвучка сур целиком с подсветкой слов (караоке) и выбором чтеца.',
                'Full-surah audio with word highlighting (karaoke) and reciter choice.',
              )}
            </li>
            <li>
              {t(
                'Избранное для аятов и хадисов – хранится на этом устройстве.',
                'Favorites for ayahs and hadith – stored on this device.',
              )}
            </li>
            <li>
              {t(
                'Светлая и тёмная тема, размер шрифта, язык интерфейса.',
                'Light and dark theme, font size, interface language.',
              )}
            </li>
          </ul>
        </section>

        <section>
          <h2>{t('Источники', 'Sources')}</h2>
          <p>
            {t(
              'Тексты и тайминги озвучки берутся из открытых публичных API и CDN (в том числе данные, совместимые с экосистемой Quran.com). Мы не претендуем на статус официального издания – это удобный ридер для личного чтения.',
              'Texts and audio timings come from open public APIs and CDNs (including data compatible with the Quran.com ecosystem). This is not an official print edition – it is a convenient reader for personal study.',
            )}
          </p>
          <p>
            {t('Переводы хадисов (через hadith-api):', 'Hadith translations (via hadith-api):')}
          </p>
          <ul>
            <li>
              {t(
                'Сахих аль-Бухари – RU: Abdullah Nirsha / редакторы Daura.com (',
                'Sahih al-Bukhari – RU: Abdullah Nirsha / Daura.com editors (',
              )}
              <a
                href="https://isnad.link/book/sahih-al-buhari"
                target="_blank"
                rel="noopener noreferrer"
              >
                isnad.link
              </a>
              {t('); EN: Muhsin Khan.', '); EN: Muhsin Khan.')}
            </li>
            <li>
              {t(
                'Сахих Муслим – RU: издание с ',
                'Sahih Muslim – RU: ',
              )}
              <a
                href="https://isnad.link/book/sahih-muslim"
                target="_blank"
                rel="noopener noreferrer"
              >
                isnad.link
              </a>
              {t(
                ' (автор в источнике не указан); EN: Abdul Hamid Siddiqui.',
                ' edition (author not listed upstream); EN: Abdul Hamid Siddiqui.',
              )}
            </li>
            <li>
              {t(
                'Сунан Абу Дауд – RU: издание с ',
                'Sunan Abu Dawud – RU: ',
              )}
              <a
                href="https://isnad.link/book/sunan-abu-dauda"
                target="_blank"
                rel="noopener noreferrer"
              >
                isnad.link
              </a>
              {t(
                ' (автор в источнике не указан); EN: hadith-api.',
                ' edition (author not listed upstream); EN: hadith-api.',
              )}
            </li>
            <li>
              {t(
                'Сунан ат-Тирмизи, Сунан ан-Насаи, Сунан ибн Маджа – EN: hadith-api (русского издания в API нет).',
                'Sunan at-Tirmidhi, Sunan an-Nasa’i, Sunan Ibn Majah – EN: hadith-api (no Russian edition in the API).',
              )}
            </li>
          </ul>
        </section>

        <section>
          <h2>{t('Важно знать', 'Disclaimer')}</h2>
          <p>
            {t(
              'Это не фетва и не замена учёному. Тексты – для личного чтения. В сложных вопросах лучше обратиться к знающему человеку.',
              'This is not a fatwa and not a substitute for a scholar. The texts are for personal reading. For complex matters, ask a knowledgeable person.',
            )}
          </p>
        </section>

        <section>
          <h2>{t('Приватность', 'Privacy')}</h2>
          <p>
            {t(
              'Нет регистрации и облачного аккаунта. Язык, тема, избранное и прогресс чтения сохраняются локально в браузере (cookie / localStorage). Данные не продаются и не уходят в аналитику «ради рекламы».',
              'No sign-up and no cloud account. Language, theme, favorites, and reading progress stay locally in the browser (cookie / localStorage). Nothing is sold or shipped to ad analytics.',
            )}
          </p>
        </section>

        <section>
          <h2>{t('Открытость', 'Openness')}</h2>
          <p>
            {t(
              'Проект открытый. Код и обсуждение – на GitHub. Идеи и баги можно присылать туда же.',
              'The project is open. Code and discussion live on GitHub – ideas and bugs welcome there.',
            )}{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  )
}
