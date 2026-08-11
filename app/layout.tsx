import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { AppProvider } from '@/context/AppContext'
import { Header } from '@/components/Header'
import { OverlayScrollbar } from '@/components/OverlayScrollbar'
import { ScrollToTop } from '@/components/ScrollToTop'
import { getRequestLang } from '@/lib/request-lang'
import { getSiteOrigin } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  // Managed at runtime (theme); keep Next from injecting a fixed icon.
  icons: {},
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5f2' },
    { media: '(prefers-color-scheme: dark)', color: '#101512' },
  ],
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getRequestLang()
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://verses.quran.foundation" crossOrigin="" />
        <link
          rel="preload"
          href="https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;0,7..72,700;1,7..72,400&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var th=localStorage.getItem('qh-theme');if(th!=='dark'&&th!=='light'){th='dark'}document.documentElement.setAttribute('data-theme',th);document.documentElement.style.colorScheme=th;var href=th==='dark'?'/favicon-dark.svg?v=5':'/favicon-light.svg?v=5';document.querySelectorAll("link[rel='icon'],link[rel='shortcut icon']").forEach(function(n){n.remove()});var link=document.createElement('link');link.id='site-favicon';link.rel='icon';link.type='image/svg+xml';link.href=href;document.head.appendChild(link);var coarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;var touch=('ontouchstart' in window)||navigator.maxTouchPoints>0;if(coarse||touch){document.documentElement.setAttribute('data-touch','1')}var mark=function(){document.documentElement.setAttribute('data-touch','1')};window.addEventListener('touchstart',mark,{once:true,passive:true});window.addEventListener('pointerdown',function(e){if(e.pointerType==='touch'||e.pointerType==='pen')mark()},{once:true,passive:true})}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <AppProvider initialLang={lang}>
          <ScrollToTop />
          <OverlayScrollbar />
          <div className="app-shell">
            <Header />
            <main>{children}</main>
            <footer className="site-footer">
              <span className="site-footer__brand">Tilāwah</span>
              <span className="site-footer__dot" aria-hidden="true">
                ·
              </span>
              <span className="site-footer__arabic">تلاوة</span>
            </footer>
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
