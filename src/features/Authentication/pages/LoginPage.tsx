import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.context'
import AuthForm from '../components/AuthForm'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      const { error } = await signIn(form)
      if (error) {
        setErrors({ email: error.message || t('auth.invalidCredentials', 'Invalid login credentials') })
        return
      }
      navigate('/')
    } catch {
      setErrors({ email: t('auth.unexpectedError', 'An unexpected error occurred') })
    }
  }

  const inputClasses = 'w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500'
  const labelClasses = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1'

  return (
    <AuthForm title='Welcome Back' onSubmit={handleSubmit} buttonText='Login' link='register' text="Don't have an account?" linkText='Create one'>
      {/* Email */}
      <div>
        <label className={labelClasses}>Email Address</label>
        <input
          name='email'
          type="email"
          placeholder='name@company.com'
          className={inputClasses}
          onChange={handleChange}
        />
        {errors.email && (
          <p className='text-red-500 text-xs font-bold mt-1 ml-1'>{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1 ml-1">
          <label className={labelClasses}>Password</label>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
        <input
          type='password'
          name='password'
          placeholder='••••••••'
          className={inputClasses}
          onChange={handleChange}
        />
        {errors.password && (
          <p className='text-red-500 text-xs font-bold mt-1 ml-1'>{errors.password}</p>
        )}
      </div>

    </AuthForm>
  )
}
