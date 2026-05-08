'use client'

import { useEffect, useState } from 'react'
import { Users, Bell, AlertTriangle, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  todayAlerts: number
  monthAlerts: number
  activeAlerts: number
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayAlerts: 0,
    monthAlerts: 0,
    activeAlerts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, todayRes, monthRes, activeRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/alerts?today=true'),
          fetch('/api/alerts?month=true'),
          fetch('/api/alerts'),
        ])
        const users = await usersRes.json()
        const today = await todayRes.json()
        const month = await monthRes.json()
        const all = await activeRes.json()

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          todayAlerts: Array.isArray(today) ? today.length : 0,
          monthAlerts: Array.isArray(month) ? month.length : 0,
          activeAlerts: Array.isArray(all) ? all.filter((a: { status: string }) => a.status === 'active').length : 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      bgColor: 'bg-[#181d26]',
      textColor: 'text-white',
      iconColor: 'text-white/70',
    },
    {
      label: 'Alertas Hoy',
      value: stats.todayAlerts,
      icon: Bell,
      bgColor: 'bg-[#aa2d00]',
      textColor: 'text-white',
      iconColor: 'text-white/70',
    },
    {
      label: 'Alertas del Mes',
      value: stats.monthAlerts,
      icon: TrendingUp,
      bgColor: 'bg-[#0a2e0e]',
      textColor: 'text-white',
      iconColor: 'text-white/70',
    },
    {
      label: 'Alertas Activas',
      value: stats.activeAlerts,
      icon: AlertTriangle,
      bgColor: 'bg-[#f5e9d4]',
      textColor: 'text-[#181d26]',
      iconColor: 'text-[#181d26]/50',
    },
  ]

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-2xl font-medium text-[#181d26]">Dashboard</h2>
        <p className="text-[#41454d] mt-1">Resumen general del sistema de alertas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`${card.bgColor} ${card.textColor} rounded-[12px] p-8 transition-transform hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-6">
                <Icon size={24} className={card.iconColor} />
              </div>
              <div className="text-4xl font-medium leading-none mb-2">
                {loading ? '—' : card.value}
              </div>
              <div className={`text-sm ${card.iconColor} mt-1`}>{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Cream band */}
      <div className="mt-12 bg-[#f5e9d4] rounded-[12px] p-8">
        <h3 className="text-lg font-medium text-[#181d26] mb-2">Sistema de Alertas Interbancario</h3>
        <p className="text-[#41454d] text-sm max-w-2xl">
          Este sistema permite la gestión coordinada de alertas entre entidades financieras de Costa Rica. 
          Registre y consulte alertas, gestione usuarios y permisos, y mantenga un historial completo 
          de todas las actividades del sistema.
        </p>
      </div>
    </div>
  )
}
