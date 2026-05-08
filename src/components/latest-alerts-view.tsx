'use client'

import { useEffect, useState, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Entity {
  id: string
  name: string
  code: string
}

interface Alert {
  id: string
  profile: string
  personName: string
  personId: string
  personIdType: string
  description: string
  financialEntityId: string
  financialEntity: { id: string; name: string; code: string }
  creator: { id: string; name: string; username: string; financialEntity: { name: string } }
  createdAt: string
}

export function LatestAlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [filterEntityId, setFilterEntityId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const fetchEntities = useCallback(async () => {
    try {
      const res = await fetch('/api/entities')
      const data = await res.json()
      setEntities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ today: 'true' })
      const res = await fetch(`/api/alerts?${params}`)
      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntities()
    fetchAlerts()
  }, [fetchEntities, fetchAlerts])

  const filteredAlerts = filterEntityId === 'all'
    ? alerts
    : alerts.filter(a => a.financialEntityId === filterEntityId)

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  }

  const truncate = (str: string, len: number) =>
    str.length > len ? str.substring(0, len) + '...' : str

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-2xl font-medium text-[#181d26]">Últimas Alertas</h2>
          <p className="text-[#41454d] mt-1">Alertas registradas el día de hoy</p>
        </div>

        <Select value={filterEntityId} onValueChange={setFilterEntityId}>
          <SelectTrigger className="w-[220px] rounded-[6px] border-[#dddddd] h-10">
            <SelectValue placeholder="Filtrar por entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            {entities.map(entity => (
              <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#dddddd]">
              <TableHead className="text-[#41454d] font-medium">Entidad</TableHead>
              <TableHead className="text-[#41454d] font-medium">Perfil</TableHead>
              <TableHead className="text-[#41454d] font-medium">Persona</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden md:table-cell">Identificación</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden lg:table-cell">Descripción</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden sm:table-cell">Creada por</TableHead>
              <TableHead className="text-[#41454d] font-medium">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#41454d]">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-[#41454d]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center">
                      <span className="text-3xl">📋</span>
                    </div>
                    <p className="font-medium">No hay alertas el día de hoy</p>
                    <p className="text-xs text-[#41454d]">Las alertas que se registren hoy aparecerán aquí</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => (
                <TableRow key={alert.id} className="border-b border-[#dddddd] last:border-0">
                  <TableCell className="text-[#41454d] text-sm">{alert.financialEntity?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-[6px] font-normal ${
                        alert.profile === 'victima'
                          ? 'bg-[#aa2d00] text-white'
                          : 'bg-[#0a2e0e] text-white'
                      }`}
                    >
                      {alert.profile === 'victima' ? 'Víctima' : 'Receptor'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-[#181d26]">{alert.personName}</TableCell>
                  <TableCell className="text-[#41454d] hidden md:table-cell">
                    <span className="font-mono text-xs">{alert.personId}</span>
                  </TableCell>
                  <TableCell className="text-[#41454d] hidden lg:table-cell text-sm max-w-[200px]">
                    {truncate(alert.description, 60)}
                  </TableCell>
                  <TableCell className="text-[#41454d] text-sm hidden sm:table-cell">
                    {alert.creator?.name || '—'}
                  </TableCell>
                  <TableCell className="text-[#41454d] text-sm">
                    {formatTime(alert.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
