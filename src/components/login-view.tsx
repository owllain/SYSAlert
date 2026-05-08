'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Shield, Lock, ArrowRight, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserOption {
  id: string; name: string; username: string; email: string
  role: string; financialEntityId: string
  financialEntity: { name: string; code: string }
}

const entityColors: Record<string, string> = { BP: '#aa2d00', BCR: '#0a2e0e', BNC: '#181d26' }
const roleLabels: Record<string, string> = { admin: 'Administrador', analyst: 'Analista', viewer: 'Consultor' }

// Floating particles component
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0, 30, 0],
            x: [0, 15, 0, -15, 0],
            opacity: [0.2, 0.5, 0.3, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export function LoginView() {
  const { setCurrentUser } = useAppStore()
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      setUsers(Array.isArray(data) ? data : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleLogin = (user: UserOption) => {
    setCurrentUser({
      id: user.id, name: user.name, username: user.username,
      email: user.email, role: user.role,
      financialEntityId: user.financialEntityId,
      financialEntityName: user.financialEntity?.name || ''
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #aa2d00, #0a2e0e, #f5e9d4, #181d26, #aa2d00)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 20s ease infinite',
        }}
      />
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shineSlide {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(170, 45, 0, 0.3); }
          50% { box-shadow: 0 0 20px 4px rgba(170, 45, 0, 0.15); }
        }
      `}</style>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-[#181d26]/60" />

      {/* Floating particles */}
      <FloatingParticles />

      <div className="relative z-10 w-full max-w-[440px] mx-4">
        {/* Login Card with glass-morphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-[16px] overflow-hidden border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            <motion.div
              className="w-14 h-14 rounded-[12px] bg-[#181d26] flex items-center justify-center mx-auto mb-5"
              style={{ animation: 'logoPulse 3s ease-in-out infinite' }}
              whileHover={{ scale: 1.05 }}
            >
              <Shield size={28} className="text-white" />
            </motion.div>
            <h1 className="text-xl font-medium text-[#181d26] mb-1">Sistema de Alertas Interbancario</h1>
            <p className="text-sm text-[#41454d]">Inicie sesión para continuar</p>
          </div>

          {/* User Cards */}
          <div className="px-8 pb-8 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-[72px] rounded-[10px] bg-[#f8fafc] animate-pulse" />
                ))}
              </div>
            ) : (
              users.map((user, index) => {
                const color = entityColors[user.financialEntity?.code] || '#181d26'
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    className="relative overflow-hidden"
                  >
                    {/* Shine effect on hover */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)',
                      }}
                    />
                    <button
                      onClick={() => handleLogin(user)}
                      className="group w-full flex items-center gap-4 p-4 rounded-[10px] border border-[#dddddd]/60 hover:border-[#9297a0] transition-all duration-150 text-left relative overflow-hidden bg-white/50"
                    >
                      {/* Shine pseudo-element via CSS */}
                      <span
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0.2) 50%, transparent 55%)',
                          animation: 'none',
                          transform: 'translateX(-100%) skewX(-15deg)',
                          transition: 'none',
                        }}
                      />
                      <style>{`
                        .shine-trigger:hover .shine-effect {
                          animation: shineSlide 0.6s ease forwards;
                        }
                      `}</style>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                        style={{ backgroundColor: color }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#181d26] truncate">{user.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Building2 size={10} className="text-[#41454d]" />
                          <span className="text-xs text-[#41454d] truncate">{user.financialEntity?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-[#41454d] border border-[#dddddd]/60">
                          {roleLabels[user.role]}
                        </span>
                        <motion.div
                          className="flex items-center"
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.15 }}
                        >
                          <ArrowRight size={16} className="text-[#dddddd] group-hover:text-[#aa2d00] transition-colors" />
                        </motion.div>
                      </div>
                    </button>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-white/40 border-t border-[#dddddd]/40 flex items-center justify-center gap-2">
            <Lock size={12} className="text-[#41454d]/50" />
            <span className="text-[11px] text-[#41454d]/60">Plataforma segura · Costa Rica</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
