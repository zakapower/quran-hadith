import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Header } from './components/Header'
import { ScrollToTop } from './components/ScrollToTop'
import { OverlayScrollbar } from './components/OverlayScrollbar'
import { Home } from './pages/Home'
import { QuranList } from './pages/QuranList'
import { SurahPage } from './pages/SurahPage'
import { HadithList } from './pages/HadithList'
import { HadithBookPage } from './pages/HadithBookPage'
import './index.css'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <OverlayScrollbar />
        <div className="app-shell">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quran" element={<QuranList />} />
              <Route path="/quran/:number" element={<SurahPage />} />
              <Route path="/hadith" element={<HadithList />} />
              <Route path="/hadith/:id" element={<HadithBookPage />} />
            </Routes>
          </main>
          <footer className="site-footer">
            <span>Tilāwah</span>
            <span className="site-footer__dot" aria-hidden="true">
              ·
            </span>
            <span>تلاوة</span>
          </footer>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
