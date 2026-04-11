import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, Building2, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setResetSent(true)
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel (Desktop only) ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12 w-full">
          {/* Logo & Brand */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-2xl font-bold text-white">N</span>
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">NexoCRM</span>
            </div>
            <p className="text-slate-400 text-lg">CRM Inmobiliario Inteligente</p>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-colors">
                <Building2 className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Gestión de Propiedades</h3>
                <p className="text-slate-400 text-sm">Administra inventario, proyectos y tipologías en un solo lugar.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                <Users className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">CRM de Clientes</h3>
                <p className="text-slate-400 text-sm">Seguimiento completo de leads, tareas y comunicación.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Análisis y Simulaciones</h3>
                <p className="text-slate-400 text-sm">Calcularentabilidad, flips y presupuestos con precisión.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-12">
            <p className="text-slate-500 text-sm">
              Potenciado por NexoCRM · © 2026
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-xl font-bold text-white">N</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">NexoCRM</span>
            </div>
          </div>

          {!recovering ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  Bienvenido 👋
                </h1>
                <p className="text-slate-500">
                  Ingresá tus credenciales para acceder a tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className={cn(
                        "w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-slate-900",
                        "placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                        "transition-all duration-200"
                      )}
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => { setRecovering(true); setResetEmail(email) }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className={cn(
                        "w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-11 text-slate-900",
                        "placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                        "transition-all duration-200"
                      )}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700",
                    "text-white font-semibold text-base",
                    "flex items-center justify-center gap-2",
                    "shadow-lg shadow-indigo-500/25",
                    "hover:shadow-xl hover:shadow-indigo-500/30",
                    "active:scale-[0.98] transition-all duration-200",
                    "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo hint */}
              <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 text-center">
                  ¿Necesitás ayuda? Contactá a tu administrador o visitá{' '}
                  <a href="https://nexocrm.app" className="text-indigo-600 hover:underline font-medium">
                    nexocrm.app
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Recovery Form */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  Recuperar Contraseña 🔑
                </h1>
                <p className="text-slate-500">
                  Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
                </p>
              </div>

              {!resetSent ? (
                <form onSubmit={handleReset} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                      className={cn(
                        "w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-slate-900",
                        "placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                        "transition-all duration-200"
                      )}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700",
                      "text-white font-semibold text-base",
                      "flex items-center justify-center gap-2",
                      "shadow-lg shadow-indigo-500/25",
                      "hover:shadow-xl hover:shadow-indigo-500/30",
                      "active:scale-[0.98] transition-all duration-200",
                      "disabled:opacity-70 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Link</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecovering(false)}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    ← Volver al login
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Email Enviado</h3>
                  <p className="text-slate-500 mb-6">
                    Revisá tu bandeja de entrada. Te enviamos las instrucciones para restablecer tu contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setRecovering(false); setResetSent(false) }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    ← Volver al login
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
