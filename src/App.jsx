import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import ScrollToTop from './components/common/ScrollToTop'
import PageTransition from './components/common/PageTransition'
import ErrorBoundary from './components/common/ErrorBoundary'
import BackToTop from './components/common/BackToTop'
import CustomCursor from './components/common/CustomCursor'
import BootScreen from './components/common/BootScreen'
import ThemeProvider from './components/common/ThemeProvider'

import { CmsContentProvider } from './content/CmsContent'

import './styles/globals.css'

const Home = lazy(() => import('./pages/Home'))
const Lab = lazy(() => import('./pages/lab/Lab'))
const LabOverview = lazy(() => import('./pages/lab/LabOverview'))
const AppDetail = lazy(() => import('./pages/lab/AppDetail'))
const Studio = lazy(() => import('./pages/studio/Studio'))
const StudioOverview = lazy(() => import('./pages/studio/StudioOverview'))
const GameDetail = lazy(() => import('./pages/studio/GameDetail'))
const Chronicles = lazy(() => import('./pages/studio/Chronicles'))
const ChronicleDetail = lazy(() => import('./pages/studio/ChronicleDetail'))
const ChapterViewer = lazy(() => import('./pages/studio/ChapterViewer'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Roadmap = lazy(() => import('./pages/Roadmap'))
const PressKit = lazy(() => import('./pages/PressKit'))
const Experiments = lazy(() => import('./pages/lab/Experiments'))
const ExperimentDetail = lazy(() => import('./pages/lab/ExperimentDetail'))
const Localization = lazy(() => import('./pages/localization/Localization'))
const LocalizationDetail = lazy(() => import('./pages/localization/LocalizationDetail'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminApp = lazy(() => import('./admin/AdminApp'))

function RouteFallback() {
  return <div className="route-loading" role="status"><span>LOADING MODULE…</span></div>
}

function Layout({ children }) {
  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">Skip to content</a>
      {/* HEX theme background layers */}
      <div className="glow-orb-cyan" />
      <div className="glow-orb-red" />
      <div className="noise-grid" />
      <Navbar />
      <main id="main-content" style={{ position: 'relative', zIndex: 10 }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <BackToTop />
    </ErrorBoundary>
  )
}

function shouldSkipIntro(isAdmin) {
  return isAdmin
    || window.matchMedia('(max-width: 700px)').matches
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || sessionStorage.getItem('sc_intro_seen') === '1'
}

export default function App() {
  const isAdmin = window.location.pathname.startsWith('/admin')
  const [booted, setBooted] = useState(() => shouldSkipIntro(isAdmin))

  const completeBoot = () => {
    sessionStorage.setItem('sc_intro_seen', '1')
    setBooted(true)
  }

  useEffect(() => {
    window.__SITE_BOOTED = booted
  }, [booted])

  return (
    <>
      <ThemeProvider />
      {!isAdmin && !booted && <BootScreen onComplete={completeBoot} />}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {!isAdmin && <CustomCursor />}
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
        {isAdmin ? <Routes><Route path="/admin/*" element={<AdminApp />} /></Routes> : <CmsContentProvider><Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lab" element={<LabOverview />} />
            <Route path="/lab/apps" element={<Lab />} />
            <Route path="/lab/:id" element={<AppDetail />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route path="/experiments/:id" element={<ExperimentDetail />} />
            <Route path="/studio" element={<StudioOverview />} />
            <Route path="/studio/games" element={<Studio />} />
            <Route path="/studio/:id" element={<GameDetail />} />
            <Route path="/localization" element={<Localization />} />
            <Route path="/localization/:id" element={<LocalizationDetail />} />
            <Route path="/chronicles" element={<Chronicles />} />
            <Route path="/chronicles/:id" element={<ChronicleDetail />} />
            <Route path="/chronicles/:id/chapter/:num" element={<ChapterViewer />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/press" element={<PressKit />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout></CmsContentProvider>}
        </Suspense>
      </BrowserRouter>
    </>
  )
}
