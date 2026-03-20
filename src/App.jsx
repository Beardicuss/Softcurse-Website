import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar         from './components/common/Navbar'
import Footer         from './components/common/Footer'
import ScrollToTop    from './components/common/ScrollToTop'
import PageTransition from './components/common/PageTransition'
import ErrorBoundary  from './components/common/ErrorBoundary'
import BackToTop      from './components/common/BackToTop'
import CustomCursor   from './components/common/CustomCursor'
import BootScreen     from './components/common/BootScreen'

import Home       from './pages/Home'
import Lab        from './pages/lab/Lab'
import AppDetail  from './pages/lab/AppDetail'
import Studio     from './pages/studio/Studio'
import GameDetail from './pages/studio/GameDetail'
import About      from './pages/About'
import Contact    from './pages/Contact'
import Blog       from './pages/Blog'
import BlogPost   from './pages/BlogPost'
import Roadmap    from './pages/Roadmap'
import PressKit   from './pages/PressKit'
import NotFound   from './pages/NotFound'

import './styles/globals.css'

function Layout({ children }) {
  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <BackToTop />
    </ErrorBoundary>
  )
}

export default function App() {
  const [booted, setBooted] = useState(false)

  return (
    <>
      {!booted && <BootScreen onComplete={() => setBooted(true)} />}
      <BrowserRouter>
        <CustomCursor />
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/lab"        element={<Lab />} />
            <Route path="/lab/:id"    element={<AppDetail />} />
            <Route path="/studio"     element={<Studio />} />
            <Route path="/studio/:id" element={<GameDetail />} />
            <Route path="/about"      element={<About />} />
            <Route path="/contact"    element={<Contact />} />
            <Route path="/blog"       element={<Blog />} />
            <Route path="/blog/:id"   element={<BlogPost />} />
            <Route path="/roadmap"    element={<Roadmap />} />
            <Route path="/press"      element={<PressKit />} />
            <Route path="*"           element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  )
}
