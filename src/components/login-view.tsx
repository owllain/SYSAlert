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
    <div className="min-h-screen flex items-center justify-center bg-[#f5e9d4]/30 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, #181d26 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />

      <div className="relative z-10 w-full max-w-[440px] mx-4">
        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-[16px] shadow-xl border border-[#dddddd] overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="w-14 h-14 rounded-[12px] bg-[#181d26] flex items-center justify-center mx-auto mb-5">
              <Shield size={28} className="text-white" />
            </div>
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
                  >
                    <button
                      onClick={() => handleLogin(user)}
                      className="w-full flex items-center gap-4 p-4 rounded-[10px] border border-[#dddddd] hover:border-[#9297a0] transition-all duration-150 text-left group"
                    >
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
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-[#41454d] border border-[#dddddd]">
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
          <div className="px-8 py-4 bg-[#f8fafc] border-t border-[#dddddd] flex items-center justify-center gap-2">
            <Lock size={12} className="text-[#41454d]/50" />
            <span className="text-[11px] text-[#41454d]/60">Plataforma segura · Costa Rica</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
