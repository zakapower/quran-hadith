import { cookies } from 'next/headers'
import { LANG_COOKIE, parseLang, type Lang } from './lang'

export async function getRequestLang(): Promise<Lang> {
  const jar = await cookies()
  return parseLang(jar.get(LANG_COOKIE)?.value) ?? 'ru'
}
