import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/Authentication/auth.context'
import logo from '../assets/logo.png'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, LogOut, Home, Calendar, Users, Target, User, PieChart, Building2, MessageSquare } from 'lucide-react'
import { EXECUTIVE_LEVELS } from '../utils/roles'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, role, poste, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const isRTL = i18n.language === 'ar';
  const avatarUrl = user?.user_metadata?.avatar_url
  const isValidAvatarUrl = typeof avatarUrl === 'string' && avatarUrl.startsWith('http')
  const hasExclusiveAccess = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `flex items-center gap-3 px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white font-semibold transition-all ${isRTL ? 'flex-row-reverse' : ''}`
      : `flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`

  const mobileTabClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && (location.pathname + '/').startsWith(path + '/'))
    return `flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${isActive ? 'text-(--color-myPrimary)' : 'text-gray-400'
      }`
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setIsMobileOpen(false)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      navigate('/login')
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* MOBILE TOP HEADER */}
      <div className={`md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-50 flex items-center px-4 justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <img src={logo} alt="Logo" className="h-10" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-[60] safe-area-bottom">
        <div className={`flex items-center justify-around h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link to="/" className={mobileTabClass('/')}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t('nav.home')}</span>
          </Link>
          <Link to="/clubs" className={mobileTabClass('/clubs')}>
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t('nav.clubs')}</span>
          </Link>

          <Link to="/activities" className={mobileTabClass('/activities')}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t('nav.activities')}</span>
          </Link>
          <Link to="/community" className={mobileTabClass('/community')}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Feed</span>
          </Link>

          {user && hasExclusiveAccess && (
            <Link to="/members" className={mobileTabClass('/members')}>
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t('nav.members')}</span>
            </Link>
          )}

          {user && (
            <Link to="/teams" className={mobileTabClass('/teams')}>
              <Target className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t('nav.teams')}</span>
            </Link>
          )}

          {user ? (
            <Link to="/me" className={mobileTabClass('/me')}>
              <div className="w-6 h-6 rounded-full bg-gray-100 border overflow-hidden">
                {isValidAvatarUrl ? (
                  <img src={avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">
                    {user.user_metadata?.fullname?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t('common.profile')}</span>
            </Link>
          ) : (
            <Link to="/login" className={mobileTabClass('/login')}>
              <User className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t('auth.login')}</span>
            </Link>
          )}

          <button onClick={() => setIsMobileOpen(true)} className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-gray-400">
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t('common.more')}</span>
          </button>
        </div>
      </div>

      {/* OVERLAY (mobile) */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-[70] md:hidden transition-opacity"></div>
      )}

      {/* SIDEBAR (Desktop permanent, Mobile slide-in for 'More') */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} h-full w-64 bg-white shadow-sm z-[80]
          transform transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
          md:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
          <img src={logo} alt="Logo" className="h-10" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button className="md:hidden" onClick={() => setIsMobileOpen(false)}>
              <X />
            </button>
          </div>
        </div>

        {/* USER INFO */}
        {user && (
          <div className="p-4 border-b">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border shrink-0">
                {isValidAvatarUrl ? (
                  <img src={avatarUrl} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                    {user.user_metadata?.fullname?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex flex-col items-start gap-1">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user.user_metadata?.fullname || user.email}
                </p>
                <div className={`flex flex-wrap gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-gray-200">
                    {role || 'Member'}
                  </span>
                  {poste && (
                    <span className="text-[9px] bg-(--color-mySecondary) text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-blue-200 shadow-sm animate-in fade-in zoom-in duration-300">
                      {poste}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAV LINKS */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" className={navLinkClass}>
            <Home className="w-4 h-4" />
            <span className="flex-1">{t('nav.home')}</span>
          </NavLink>
          <NavLink to="/clubs" className={navLinkClass}>
            <Building2 className="w-4 h-4" />
            <span className="flex-1">{t('nav.clubs')}</span>
          </NavLink>
          <NavLink to="/activities" className={navLinkClass}>
            <Calendar className="w-4 h-4" />
            <span className="flex-1">{t('nav.activities')}</span>
          </NavLink>
          <NavLink to="/community" className={navLinkClass}>
            <MessageSquare className="w-4 h-4" />
            <span className="flex-1">Community Feed</span>
          </NavLink>

          {user && (
            <>
              {hasExclusiveAccess && (
                <>
                  <NavLink to="/recruitment" className={navLinkClass}>
                    <PieChart className="w-4 h-4" />
                    <span className="flex-1">{t('nav.recruitment')}</span>
                  </NavLink>
                  <NavLink to="/members" end className={navLinkClass}>
                    <Users className="w-4 h-4" />
                    <span className="flex-1">{t('nav.members')}</span>
                  </NavLink>
                </>
              )}
              <NavLink to="/teams" className={navLinkClass}>
                <Target className="w-4 h-4" />
                <span className="flex-1">{t('nav.teams')}</span>
              </NavLink>
              <NavLink to="/me" className={navLinkClass}>
                <User className="w-4 h-4" />
                <span className="flex-1">{t('common.profile')}</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t mt-auto">
          {user ? (
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 text-sm font-bold ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <LogOut className="w-4 h-4" />
              <span>{t('auth.logout')}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white font-semibold  transition"
                onClick={() => setIsMobileOpen(false)}
              >
                {t('auth.login')}
              </Link>
              <Link
                to="/register"
                className="w-full text-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                onClick={() => setIsMobileOpen(false)}
              >
                {t('auth.register')}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

