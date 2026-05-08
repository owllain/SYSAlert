'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Building2, Users, Bell, ShieldAlert, CheckCircle2, XCircle, ArrowRight, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Entity {
  id: string
  name: string
  code: string
  userCount: number
}

interface Alert {
  id: string
  profile: string
  economicAffectation: boolean
  personName: string
  personId: string
  personIdType: string
  description: string
  status: string
  financialEntityId: string
  financialEntity: { id: string; name: string; code: string }
  createdAt: string
}

const entityColors: Record<string, string> = { BP: '#aa2d00', BCR: '#0a2e0e', BNC: '#181d26' }
const entityBorderColors: Record<string, string> = { BP: 'border-l-[#aa2d00]', BCR: 'border-l-[#0a2e0e]', BNC: 'border-l-[#181d26]' }

interface ChartData {
  name: string
  count: number
  code: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartData }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-[#dddddd] rounded-[8px] px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-[#181d26]">{data.name}</p>
        <p className="text-xs text-[#41454d]">
          {data.count} alerta{data.count !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }
  return null
}

export function EntitiesView() {
  const { setActiveTab, setSelectedEntityId } = useAppStore()
  const [entities, setEntities] = useState<Entity[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [entitiesRes, alertsRes] = await Promise.all([
          fetch('/api/entities'),
          fetch('/api/alerts?month=true'),
        ])
        const entitiesData = await entitiesRes.json()
        const alertsData = await alertsRes.json()
        setEntities(Array.isArray(entitiesData) ? entitiesData : [])
        setAlerts(Array.isArray(alertsData) ? alertsData : [])
      } catch (error) {
        console.error('Error fetching entities data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate per-entity stats
  const entityStats = entities.map(entity => {
    const code = entity.code
    const entityAlerts = alerts.filter(a => a.financialEntity?.code === code)
    const total = entityAlerts.length
    const active = entityAlerts.filter(a => a.status === 'active').length
    const resolved = entityAlerts.filter(a => a.status === 'resolved').length
    const dismissed = entityAlerts.filter(a => a.status === 'dismissed').length
    const receptor = entityAlerts.filter(a => a.profile === 'receptor').length
    const victima = entityAlerts.filter(a => a.profile === 'victima').length
    const economic = entityAlerts.filter(a => a.economicAffectation).length
    const userCount = entity.userCount || 0

    return {
      id: entity.id,
      code,
      total,
      active,
      resolved,
      dismissed,
      receptor,
      victima,
      economic,
      userCount,
    }
  })

  // Bar chart data
  const chartData: ChartData[] = entities.map(entity => {
    const code = entity.code
    const stat = entityStats.find(s => s.code === code)
    return {
      name: entity.name,
      count: stat?.total || 0,
      code,
    }
  })

  // Profile distribution data
  const totalAlerts = alerts.length

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-medium text-[#181d26]">Entidades Financieras</h2>
        <p className="text-[#41454d] mt-1 text-sm">Comparación y detalle de entidades del sistema interbancario</p>
        <div className="mt-4 h-px bg-[#dddddd]" />
      </div>

      {/* Entity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {loading ? (
          // Skeleton cards
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#dddddd] rounded-[12px] p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-4 bg-[#f8fafc] rounded w-32" />
                  <div className="h-3 bg-[#f8fafc] rounded w-10" />
                </div>
                <div className="w-10 h-10 rounded-[8px] bg-[#f8fafc]" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded-[8px] bg-[#f8fafc]">
                  <div className="h-5 bg-[#dddddd] rounded w-8" />
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#f8fafc]">
                  <div className="h-5 bg-[#dddddd] rounded w-8" />
                </div>
              </div>
              <div className="h-2 bg-[#f8fafc] rounded-[4px] mb-3" />
              <div className="h-8 bg-[#f8fafc] rounded-[8px]" />
            </div>
          ))
        ) : (
          entities.map(entity => {
            const code = entity.code
            const color = entityColors[code] || '#41454d'
            const stat = entityStats.find(s => s.code === code)
            const total = stat?.total || 0
            const active = stat?.active || 0
            const resolved = stat?.resolved || 0
            const dismissed = stat?.dismissed || 0
            const receptor = stat?.receptor || 0
            const victima = stat?.victima || 0
            const economic = stat?.economic || 0
            const userCount = stat?.userCount || 0

            return (
              <div key={entity.id} className={`bg-white border border-[#dddddd] rounded-[12px] p-6 border-l-4 ${entityBorderColors[code] || 'border-l-[#41454d]'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-medium text-[#181d26]">{entity.name}</h3>
                    <span className="text-xs text-[#41454d] font-mono">{entity.code}</span>
                  </div>
                  <div className="w-10 h-10 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
                    <Building2 size={20} style={{ color }} />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2.5 rounded-[8px] bg-[#f8fafc]">
                    <div className="flex items-center gap-1.5">
                      <Bell size={12} style={{ color }} />
                      <span className="text-lg font-medium text-[#181d26]">{total}</span>
                    </div>
                    <p className="text-[10px] text-[#41454d] mt-0.5">Alertas</p>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#f8fafc]">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} style={{ color }} />
                      <span className="text-lg font-medium text-[#181d26]">{userCount}</span>
                    </div>
                    <p className="text-[10px] text-[#41454d] mt-0.5">Usuarios</p>
                  </div>
                </div>

                {/* Status breakdown bar */}
                <div className="mb-3">
                  <div className="flex rounded-[4px] overflow-hidden h-2 bg-[#f8fafc]">
                    {total > 0 && (
                      <>
                        <div style={{ width: `${(active / total) * 100}%`, backgroundColor: '#aa2d00' }} className="transition-all duration-500" />
                        <div style={{ width: `${(resolved / total) * 100}%`, backgroundColor: '#0a2e0e' }} className="transition-all duration-500" />
                        <div style={{ width: `${(dismissed / total) * 100}%`, backgroundColor: '#f5e9d4' }} className="transition-all duration-500" />
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-[#41454d]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#aa2d00]" /> {active} activas
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#41454d]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0a2e0e]" /> {resolved} resueltas
                    </span>
                  </div>
                </div>

                {/* Profile + Economic stats */}
                <div className="flex items-center justify-between text-[10px] text-[#41454d] mb-4">
                  <span>Receptor: {receptor} · Víctima: {victima}</span>
                  <span className="flex items-center gap-0.5"><DollarSign size={10} />{economic}</span>
                </div>

                {/* View alerts button */}
                <button
                  onClick={() => {
                    setSelectedEntityId(entity.id)
                    setActiveTab('latest-alerts')
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] border border-[#dddddd] text-sm text-[#41454d] hover:bg-[#f8fafc] hover:border-[#9297a0] transition-all"
                >
                  Ver alertas
                  <ArrowRight size={14} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Alerts by Entity */}
        <div className="bg-white border border-[#dddddd] rounded-[12px] p-6">
          <h3 className="text-sm font-medium text-[#181d26] mb-1">Comparación de Alertas</h3>
          <p className="text-xs text-[#41454d] mb-4">Mes en curso</p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="animate-pulse w-full h-full bg-[#f8fafc] rounded-[8px]" />
            </div>
          ) : chartData.every(d => d.count === 0) ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center">
                <ShieldAlert size={28} className="text-[#dddddd] mx-auto mb-2" />
                <p className="text-sm text-[#41454d]">Sin alertas este mes</p>
              </div>
            </div>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dddddd" vertical={false} />
                  <XAxis
                    dataKey="name"
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
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.code}`} fill={entityColors[entry.code] || '#41454d'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Profile Distribution Table */}
        <div className="bg-white border border-[#dddddd] rounded-[12px] p-6">
          <h3 className="text-sm font-medium text-[#181d26] mb-1">Distribución por Perfil</h3>
          <p className="text-xs text-[#41454d] mb-4">Comparación entre entidades</p>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-10 bg-[#f8fafc] rounded-[6px]" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-[#dddddd]">
                    <th className="text-left text-[10px] sm:text-[10px] uppercase tracking-wider text-[#41454d] font-medium pb-3 pr-4">Perfil</th>
                    {entities.map(entity => (
                      <th key={entity.code} className="text-center text-[10px] sm:text-[10px] uppercase tracking-wider font-medium pb-3 px-2 sm:px-3" style={{ color: entityColors[entity.code] || '#41454d' }}>
                        {entity.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(['receptor', 'victima'] as const).map(profile => {
                    const profileLabel = profile === 'receptor' ? 'Receptor' : 'Víctima'
                    return (
                      <tr key={profile} className="border-b border-[#dddddd]/60 last:border-0">
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-[6px] ${
                            profile === 'receptor'
                              ? 'bg-[#0a2e0e]/10 text-[#0a2e0e]'
                              : 'bg-[#aa2d00]/10 text-[#aa2d00]'
                          }`}>
                            {profile === 'receptor' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                            {profileLabel}
                          </span>
                        </td>
                        {entities.map(entity => {
                          const stat = entityStats.find(s => s.code === entity.code)
                          const count = profile === 'receptor' ? (stat?.receptor || 0) : (stat?.victima || 0)
                          const entityTotal = stat?.total || 0
                          const pct = entityTotal > 0 ? Math.round((count / entityTotal) * 100) : 0
                          return (
                            <td key={entity.code} className="py-3 px-2 sm:px-3 text-center text-[10px] sm:text-xs">
                              <div>
                                <span className="text-[10px] sm:text-sm font-medium text-[#181d26]">{count}</span>
                                <span className="text-[8px] sm:text-[10px] text-[#41454d] ml-0.5 sm:ml-1">({pct}%)</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {/* Total row */}
                  <tr className="bg-[#f8fafc]/60">
                    <td className="py-3 pr-4">
                      <span className="text-[10px] sm:text-xs font-medium text-[#181d26]">Total</span>
                    </td>
                    {entities.map(entity => {
                      const stat = entityStats.find(s => s.code === entity.code)
                      const count = stat?.total || 0
                      const pct = totalAlerts > 0 ? Math.round((count / totalAlerts) * 100) : 0
                      return (
                        <td key={entity.code} className="py-3 px-2 sm:px-3 text-center text-[10px] sm:text-xs">
                          <div>
                            <span className="text-[10px] sm:text-sm font-medium text-[#181d26]">{count}</span>
                            <span className="text-[8px] sm:text-[10px] text-[#41454d] ml-0.5 sm:ml-1">({pct}%)</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  {/* Economic affectation row */}
                  <tr>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-[6px] bg-[#f5e9d4]/60 text-[#41454d]">
                        <DollarSign size={12} />
                        Afectación
                      </span>
                    </td>
                    {entities.map(entity => {
                      const stat = entityStats.find(s => s.code === entity.code)
                      const count = stat?.economic || 0
                      const entityTotal = stat?.total || 0
                      const pct = entityTotal > 0 ? Math.round((count / entityTotal) * 100) : 0
                      return (
                        <td key={entity.code} className="py-3 px-2 sm:px-3 text-center text-[10px] sm:text-xs">
                          <div>
                            <span className="text-[10px] sm:text-sm font-medium text-[#181d26]">{count}</span>
                            <span className="text-[8px] sm:text-[10px] text-[#41454d] ml-0.5 sm:ml-1">({pct}%)</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
