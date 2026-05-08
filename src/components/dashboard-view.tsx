'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type NavTab } from '@/lib/store'
import {
  Users,
  Bell,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  UserPlus,
  Shield,
  FileText,
  Clock,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  todayAlerts: number
  monthAlerts: number
  activeAlerts: number
}

interface RecentAlert {
  id: string
  profile: string
  personName: string
  description: string
  status: string
  createdAt: string
  creator: { name: string; financialEntity: { name: string } }
  financialEntity: { name: string; code: string }
}

interface EntityBreakdown {
  name: string
  code: string
  count: number
  color: string
}

interface TrendData {
  date: string
  label: string
  count: number
}

interface DistributionData {
  name: string
  value: number
  color: string
}

const entityColors: Record<string, string> = {
  BP: '#aa2d00',
  BCR: '#0a2e0e',
  BNC: '#181d26',
}

export function DashboardView() {
  const { setActiveTab, currentUser } = useAppStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayAlerts: 0,
    monthAlerts: 0,
    activeAlerts: 0,
  })
  const [yesterdayAlerts, setYesterdayAlerts] = useState(0)
  const [lastMonthAlerts, setLastMonthAlerts] = useState(0)
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([])
  const [entityBreakdown, setEntityBreakdown] = useState<EntityBreakdown[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [distributionData, setDistributionData] = useState<DistributionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, todayRes, monthRes, activeRes, allAlertsRes, entitiesRes, trendRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/alerts?today=true'),
          fetch('/api/alerts?month=true'),
          fetch('/api/alerts'),
          fetch('/api/alerts'),
          fetch('/api/entities'),
          fetch('/api/alerts?days=7'),
        ])
        const users = await usersRes.json()
        const today = await todayRes.json()
        const month = await monthRes.json()
        const all = await activeRes.json()
        const allAlerts = await allAlertsRes.json()
        const entities = await entitiesRes.json()
        const trend = await trendRes.json()

        const allAlertsArray = Array.isArray(allAlerts) ? allAlerts : []
        const todayArray = Array.isArray(today) ? today : []
        const monthArray = Array.isArray(month) ? month : []
        const trendArray = Array.isArray(trend) ? trend : []

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          todayAlerts: todayArray.length,
          monthAlerts: monthArray.length,
          activeAlerts: Array.isArray(all) ? all.filter((a: { status: string }) => a.status === 'active').length : 0,
        })

        // Calculate yesterday's alerts for trend
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        const yesterdayCount = allAlertsArray.filter((a: { createdAt: string }) => {
          const d = new Date(a.createdAt)
          return d >= yesterday && d <= yesterdayEnd
        }).length
        setYesterdayAlerts(yesterdayCount)

        // Last month alerts for trend
        const now = new Date()
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        const lastMonthCount = allAlertsArray.filter((a: { createdAt: string }) => {
          const d = new Date(a.createdAt)
          return d >= lastMonthStart && d <= lastMonthEnd
        }).length
        setLastMonthAlerts(lastMonthCount)

        // Recent 5 alerts
        setRecentAlerts(allAlertsArray.slice(0, 5))

        // Entity breakdown
        if (Array.isArray(entities)) {
          const breakdown: EntityBreakdown[] = entities.map((e: { name: string; code: string }) => ({
            name: e.name,
            code: e.code,
            count: allAlertsArray.filter((a: { financialEntity: { code: string } }) => a.financialEntity?.code === e.code).length,
            color: entityColors[e.code] || '#41454d',
          }))
          setEntityBreakdown(breakdown)
        }

        // Trend data: daily alert count for past 7 days
        const days: TrendData[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          d.setHours(0, 0, 0, 0)
          const dEnd = new Date(d)
          dEnd.setHours(23, 59, 59, 999)
          const count = trendArray.filter((a: { createdAt: string }) => {
            const ad = new Date(a.createdAt)
            return ad >= d && ad <= dEnd
          }).length
          days.push({
            date: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric' }),
            count,
          })
        }
        setTrendData(days)

        // Distribution data: by profile and status
        const receptorCount = allAlertsArray.filter((a: { profile: string }) => a.profile === 'receptor').length
        const victimaCount = allAlertsArray.filter((a: { profile: string }) => a.profile === 'victima').length
        const activeCount = allAlertsArray.filter((a: { status: string }) => a.status === 'active').length
        const resolvedCount = allAlertsArray.filter((a: { status: string }) => a.status === 'resolved').length
        const dismissedCount = allAlertsArray.filter((a: { status: string }) => a.status === 'dismissed').length

        setDistributionData([
          { name: 'Receptor', value: receptorCount, color: '#0a2e0e' },
          { name: 'Víctima', value: victimaCount, color: '#aa2d00' },
          { name: 'Activa', value: activeCount, color: '#aa2d00' },
          { name: 'Resuelta', value: resolvedCount, color: '#0a2e0e' },
          { name: 'Descartada', value: dismissedCount, color: '#f5e9d4' },
        ].filter(d => d.value > 0))
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const todayTrend = yesterdayAlerts > 0 ? ((stats.todayAlerts - yesterdayAlerts) / yesterdayAlerts) * 100 : stats.todayAlerts > 0 ? 100 : 0
  const monthTrend = lastMonthAlerts > 0 ? ((stats.monthAlerts - lastMonthAlerts) / lastMonthAlerts) * 100 : stats.monthAlerts > 0 ? 100 : 0

  const statCards = [
    {
      label: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      bgColor: 'bg-[#181d26]',
      textColor: 'text-white',
      iconColor: 'text-white/70',
      iconBg: 'bg-white/10',
      trend: null,
      trendLabel: null,
    },
    {
      label: 'Alertas Hoy',
      value: stats.todayAlerts,
      icon: Bell,
      bgColor: 'bg-[#aa2d00]',
      textColor: 'text-white',
      iconColor: 'text-white/80',
      iconBg: 'bg-white/15',
      trend: todayTrend,
      trendLabel: 'vs ayer',
    },
    {
      label: 'Alertas del Mes',
      value: stats.monthAlerts,
      icon: TrendingUp,
      bgColor: 'bg-[#0a2e0e]',
      textColor: 'text-white',
      iconColor: 'text-white/80',
      iconBg: 'bg-white/15',
      trend: monthTrend,
      trendLabel: 'vs mes anterior',
    },
    {
      label: 'Alertas Activas',
      value: stats.activeAlerts,
      icon: AlertTriangle,
      bgColor: 'bg-[#f5e9d4]',
      textColor: 'text-[#181d26]',
      iconColor: 'text-[#aa2d00]',
      iconBg: 'bg-[#aa2d00]/10',
      trend: null,
      trendLabel: null,
    },
  ]

  const quickActions = [
    {
      label: 'Nueva Alerta',
      description: 'Registrar una alerta interbancaria',
      icon: Plus,
      iconColor: 'text-[#aa2d00]',
      iconBg: 'bg-[#aa2d00]/10',
      tab: 'my-alerts' as NavTab,
    },
    {
      label: 'Gestionar Usuarios',
      description: 'Administrar permisos y accesos',
      icon: UserPlus,
      iconColor: 'text-[#181d26]',
      iconBg: 'bg-[#181d26]/10',
      tab: 'users' as NavTab,
    },
    {
      label: 'Ver Últimas',
      description: 'Consultar alertas del día',
      icon: Shield,
      iconColor: 'text-[#0a2e0e]',
      iconBg: 'bg-[#0a2e0e]/10',
      tab: 'latest-alerts' as NavTab,
    },
    {
      label: 'Historial',
      description: 'Revisar historial completo',
      icon: FileText,
      iconColor: 'text-[#41454d]',
      iconBg: 'bg-[#41454d]/10',
      tab: 'alert-history' as NavTab,
    },
  ]

  const totalEntityAlerts = entityBreakdown.reduce((sum, e) => sum + e.count, 0)

  function formatTimeAgo(dateStr: string) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `hace ${diffMins}m`
    if (diffHours < 24) return `hace ${diffHours}h`
    return `hace ${diffDays}d`
  }

  function getStatusConfig(status: string) {
    switch (status) {
      case 'active':
        return { label: 'Activa', dot: 'bg-[#aa2d00]', bg: 'bg-[#aa2d00]/10', text: 'text-[#aa2d00]' }
      case 'resolved':
        return { label: 'Resuelta', dot: 'bg-[#0a2e0e]', bg: 'bg-[#0a2e0e]/10', text: 'text-[#0a2e0e]' }
      case 'dismissed':
        return { label: 'Descartada', dot: 'bg-[#41454d]', bg: 'bg-[#41454d]/10', text: 'text-[#41454d]' }
      default:
        return { label: status, dot: 'bg-[#41454d]', bg: 'bg-[#41454d]/10', text: 'text-[#41454d]' }
    }
  }

  return (
    <div className="max-w-[1200px]">
      {/* Section Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-medium text-[#181d26]">Dashboard</h2>
        <p className="text-[#41454d] mt-1 text-sm">Resumen general del sistema de alertas</p>
        <div className="mt-4 h-px bg-[#dddddd]" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`${card.bgColor} ${card.textColor} rounded-[12px] p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] relative overflow-hidden`}
            >
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className={`${card.iconBg} rounded-[10px] p-2.5`}>
                    <Icon size={20} className={card.iconColor} />
                  </div>
                  {card.trend !== null && card.trend !== 0 && (
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trend > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {card.trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{Math.abs(Math.round(card.trend))}%</span>
                    </div>
                  )}
                </div>
                <div className="text-3xl font-medium leading-none mb-1.5">
                  {loading ? '—' : card.value}
                </div>
                <div className={`text-sm ${card.iconColor} font-normal`}>{card.label}</div>
                {card.trendLabel && card.trend !== 0 && (
                  <div className={`text-xs mt-1 ${card.iconColor} opacity-60`}>{card.trendLabel}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section - Tendencias y Estadísticas */}
      <div className="mt-8">
        <div className="mb-5">
          <h3 className="text-lg font-medium text-[#181d26]">Tendencias y Estadísticas</h3>
          <p className="text-xs text-[#41454d] mt-0.5">Visualización de datos de los últimos 7 días</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart - Alert Trend */}
          <div className="bg-white border border-[#dddddd] rounded-[12px] p-6">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-[#181d26]">Tendencia de Alertas</h4>
              <p className="text-xs text-[#41454d] mt-0.5">Últimos 7 días</p>
            </div>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="animate-pulse w-full h-full bg-[#f8fafc] rounded-[8px]" />
              </div>
            ) : trendData.every(d => d.count === 0) ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp size={28} className="text-[#dddddd] mx-auto mb-2" />
                  <p className="text-sm text-[#41454d]">Sin datos suficientes</p>
                  <p className="text-xs text-[#41454d]/60 mt-1">Los datos aparecerán cuando se registren alertas</p>
                </div>
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dddddd" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#41454d' }}
                      tickLine={false}
                      axisLine={{ stroke: '#dddddd' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#41454d' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dddddd',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      labelStyle={{ color: '#181d26', fontWeight: 500 }}
                      itemStyle={{ color: '#aa2d00' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#aa2d00"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#aa2d00', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#aa2d00', stroke: '#fff', strokeWidth: 2 }}
                      name="Alertas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pie Chart - Alert Distribution */}
          <div className="bg-white border border-[#dddddd] rounded-[12px] p-6">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-[#181d26]">Distribución de Alertas</h4>
              <p className="text-xs text-[#41454d] mt-0.5">Por perfil y estado</p>
            </div>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="animate-pulse w-full h-full bg-[#f8fafc] rounded-[8px]" />
              </div>
            ) : distributionData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle size={28} className="text-[#dddddd] mx-auto mb-2" />
                  <p className="text-sm text-[#41454d]">Sin datos de distribución</p>
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #dddddd',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                        itemStyle={{ color: '#181d26' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col gap-2.5 pl-2">
                  {distributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-[#41454d] flex-1">{item.name}</span>
                      <span className="text-xs font-medium text-[#181d26] tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#dddddd] flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-[#181d26]">Actividad Reciente</h3>
                <p className="text-xs text-[#41454d] mt-0.5">Últimas alertas registradas</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#aa2d00] hover:text-[#aa2d00] hover:bg-[#aa2d00]/5 text-xs font-medium"
                onClick={() => setActiveTab('latest-alerts')}
              >
                Ver todas
                <ArrowUpRight size={14} className="ml-1" />
              </Button>
            </div>
            <div className="divide-y divide-[#dddddd]/60">
              {loading ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-[#dddddd]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-[#dddddd] rounded w-1/3" />
                          <div className="h-2.5 bg-[#f8fafc] rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <Bell size={28} className="text-[#dddddd] mx-auto mb-3" />
                  <p className="text-sm text-[#41454d]">No hay alertas registradas</p>
                  <p className="text-xs text-[#41454d]/60 mt-1">Las alertas aparecerán aquí cuando se registren</p>
                </div>
              ) : (
                recentAlerts.map((alert, idx) => {
                  const statusCfg = getStatusConfig(alert.status)
                  return (
                    <div key={alert.id} className="px-6 py-3.5 flex items-start gap-3.5 hover:bg-[#f8fafc]/60 transition-colors">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-1.5">
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#aa2d00]' : 'bg-[#dddddd]'}`} />
                        {idx < recentAlerts.length - 1 && (
                          <div className="w-px h-full min-h-[20px] bg-[#dddddd]/80 mt-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-[#181d26] truncate">{alert.personName}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[10px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                            <span className={`w-1 h-1 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#41454d] truncate">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#41454d]/70 flex items-center gap-1">
                            <Building2 size={10} />
                            {alert.financialEntity?.name || '—'}
                          </span>
                          <span className="text-[#dddddd]">·</span>
                          <span className="text-[10px] text-[#41454d]/70 flex items-center gap-1">
                            <Clock size={10} />
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                      {/* Profile tag */}
                      <span className={`shrink-0 text-[10px] font-medium px-2 py-1 rounded-[6px] ${
                        alert.profile === 'receptor'
                          ? 'bg-[#0a2e0e]/10 text-[#0a2e0e]'
                          : 'bg-[#aa2d00]/10 text-[#aa2d00]'
                      }`}>
                        {alert.profile === 'receptor' ? 'Receptor' : 'Víctima'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#dddddd]">
              <h3 className="text-base font-medium text-[#181d26]">Acciones Rápidas</h3>
              <p className="text-xs text-[#41454d] mt-0.5">Accesos directos frecuentes</p>
            </div>
            <div className="p-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    onClick={() => setActiveTab(action.tab)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-[10px] hover:bg-[#f8fafc] transition-all duration-150 group text-left"
                  >
                    <div className={`${action.iconBg} rounded-[8px] p-2.5 transition-transform group-hover:scale-105`}>
                      <Icon size={18} className={action.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#181d26] group-hover:text-[#aa2d00] transition-colors">{action.label}</p>
                      <p className="text-xs text-[#41454d]/70 truncate">{action.description}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-[#dddddd] group-hover:text-[#aa2d00] transition-colors shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Entity Breakdown */}
      <div className="mt-8">
        <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#dddddd]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-[#181d26]">Distribución por Entidad</h3>
                <p className="text-xs text-[#41454d] mt-0.5">Alertas registradas por entidad financiera</p>
              </div>
              {totalEntityAlerts > 0 && (
                <span className="text-xs text-[#41454d] font-medium">{totalEntityAlerts} total</span>
              )}
            </div>
          </div>
          <div className="px-6 py-5">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-[#f8fafc] rounded-[6px]" />
              </div>
            ) : totalEntityAlerts === 0 ? (
              <div className="py-4 text-center">
                <Building2 size={24} className="text-[#dddddd] mx-auto mb-2" />
                <p className="text-sm text-[#41454d]">Sin datos de distribución</p>
              </div>
            ) : (
              <>
                {/* Horizontal bar */}
                <div className="flex rounded-[6px] overflow-hidden h-8 mb-4">
                  {entityBreakdown.map((entity) => {
                    const pct = totalEntityAlerts > 0 ? (entity.count / totalEntityAlerts) * 100 : 0
                    if (pct === 0) return null
                    return (
                      <div
                        key={entity.code}
                        style={{ width: `${pct}%`, backgroundColor: entity.color }}
                        className="transition-all duration-500 relative group"
                      >
                        {pct > 15 && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                            {Math.round(pct)}%
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-5">
                  {entityBreakdown.map((entity) => (
                    <div key={entity.code} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entity.color }} />
                      <span className="text-xs text-[#41454d]">{entity.name}</span>
                      <span className="text-xs font-medium text-[#181d26]">({entity.count})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Cream Band */}
      <div className="mt-8 bg-[#f5e9d4] rounded-[12px] overflow-hidden relative">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #181d26 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[8px] bg-[#181d26] flex items-center justify-center">
                  <Shield size={14} className="text-[#f5e9d4]" />
                </div>
                <h3 className="text-lg font-medium text-[#181d26]">Sistema de Alertas Interbancario</h3>
              </div>
              <p className="text-[#41454d] text-sm max-w-xl leading-relaxed">
                Plataforma coordinada para la gestión de alertas entre entidades financieras de Costa Rica. 
                Registre y consulte alertas, gestione usuarios y permisos, y mantenga un historial completo 
                de todas las actividades del sistema.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {currentUser && (
                <div className="bg-white/60 rounded-[10px] px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#181d26] flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#181d26] leading-tight">{currentUser.name}</p>
                      <p className="text-[10px] text-[#41454d] leading-tight flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#aa2d00]" />
                        {currentUser.financialEntityName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white/60 rounded-[10px] px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] text-[#41454d] uppercase tracking-wider font-medium mb-1">Entidades</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#aa2d00]" title="Banco Popular" />
                  <span className="w-2 h-2 rounded-full bg-[#0a2e0e]" title="BCR" />
                  <span className="w-2 h-2 rounded-full bg-[#181d26]" title="BNC" />
                  <span className="text-xs font-medium text-[#181d26] ml-1">3 activas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
