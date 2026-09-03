import { Outlet } from 'react-router-dom'
import Navbar from '../components/public/Navbar'
import Footer from '../components/public/Footer'

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Global blurry background photo for all public pages */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <img
          src="/hero-bg.png"
          alt=""
          className="w-full h-full object-cover object-center scale-105"
          style={{ filter: 'blur(6px)' }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
