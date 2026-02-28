import React from 'react'
import logo from '../../../assets/logo.png';
import { Link } from 'react-router-dom';

type AuthFormProps = {
  title: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
  link: string
  linkText: string
  buttonText: string
  text?: string
}

export default function AuthForm({
  title,
  onSubmit,
  children,
  buttonText,
  link,
  text,
  linkText,
}: AuthFormProps) {
  return (
    <div className='min-h-screen flex flex-col md:flex-row items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-500'>
      {/* Premium Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-8 lg:gap-24">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <img src={logo} alt='Logo' className='h-32 md:h-64 w-auto object-contain drop-shadow-2xl' />
          <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center md:hidden">
            NGO <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">HUB</span>
          </h2>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
          <form
            onSubmit={onSubmit}
            className='relative w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 md:p-10 border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] shadow-2xl shadow-purple-500/5 dark:shadow-purple-500/10'
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] pointer-events-none"></div>

            <div className="mb-8 relative z-10">
              <h1 className='text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none'>{title}</h1>
              <div className="mt-2 h-1.5 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            </div>

            <div className='space-y-4 relative z-10'>{children}</div>

            <button
              type='submit'
              className='mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all active:scale-95'
            >
              {buttonText}
            </button>

            <p className='text-sm text-center mt-6 text-slate-500 dark:text-slate-400 font-medium relative z-10'>
              {text}{' '}
              <Link to={`/${link}`} className='text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all'>
                {linkText}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
