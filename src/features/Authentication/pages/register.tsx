import { useState } from 'react'
import { z } from 'zod'
import { useAuth } from '../auth.context'
import AuthForm from '../components/AuthForm'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// ---------------------
// ZOD VALIDATION SCHEMA
// ---------------------
export default function Register() {
  const { signUp, signOut } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const registerSchema = z.object({
    fullname: z.string().min(3, t('auth.fullnameRequired')),
    phone: z.string().min(6, t('auth.phoneRequired')),
    email: z.string().email(t('auth.invalidEmailFormat')),
    password: z.string().min(6, t('auth.passwordMinLength')),
    birth_date: z.string().min(1, t('auth.birthdayRequired')),
    device_id: z.string(),
  })

  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    email: '',
    password: '',
    birth_date: '',
    device_id: navigator.userAgent,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })

    // Clear field error when user updates value
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate with Zod
    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const fieldKey = issue.path[0]
        if (typeof fieldKey === 'string') {
          fieldErrors[fieldKey] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // If valid -> call signUp
    try {
      // Clear previous errors before signup
      setErrors({})

      const response = await signUp(form)

      // Check if signUp returned an error
      if (response?.error) {
        console.error('SignUp error:', response.error)
        setErrors({
          general: response.error.message || 'Failed to create account. Please try again.'
        })
        return
      }

      // Force signOut if Supabase auto-logged us in, 
      // preventing ProtectedRoute from bouncing us to home.
      await signOut()
      toast.success('Registration successful! Please login to continue.')
      navigate('/login')
    } catch (err: any) {
      // Handle unexpected errors
      console.error('Unexpected error:', err)
      setErrors({ general: err.message || 'Something went wrong' })
    }
  }

  const inputClasses = 'w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500'
  const labelClasses = 'block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1'

  return (
    <AuthForm
      title='Create Account'
      onSubmit={handleSubmit}
      buttonText='Register'
      link='login'
      linkText='Login '
      text='Already have an account?'
    >
      {/* General Error Message */}
      {errors.general && (
        <div className='bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl mb-4 font-bold text-sm'>
          {errors.general}
        </div>
      )}

      {/* Grid for Name & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Full Name</label>
          <input
            name='fullname'
            placeholder='John Doe'
            className={inputClasses}
            onChange={handleChange}
          />
          {errors.fullname && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.fullname}</p>
          )}
        </div>

        <div>
          <label className={labelClasses}>Phone</label>
          <input
            name='phone'
            placeholder='+216 ...'
            className={inputClasses}
            onChange={handleChange}
          />
          {errors.phone && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.phone}</p>
          )}
        </div>
      </div>

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
          <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.email}</p>
        )}
      </div>

      {/* Grid for Password & Birthday */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Password</label>
          <input
            type='password'
            name='password'
            placeholder='••••••••'
            className={inputClasses}
            onChange={handleChange}
          />
          {errors.password && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.password}</p>
          )}
        </div>

        <div>
          <label className={labelClasses}>Birthday</label>
          <input
            type='date'
            name='birth_date'
            className={inputClasses + ' [color-scheme:light] dark:[color-scheme:dark]'}
            onChange={handleChange}
          />
          {errors.birth_date && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.birth_date}</p>
          )}
        </div>
      </div>
    </AuthForm>
  )
}