'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDetailDialog } from '@/components/alert-detail-dialog'
import { Search, ShieldAlert, DollarSign, Clock } from 'lucide-react'

interface Entity {
  id: string
  name: string
  code: string
}

interface Alert {
  id: string
  profile: string
  economicAffectation: boolean
  personName: string
  personId: string
  personIdType: string
  description: string
  financialEntityId: string
  financialEntity: { id: string; name: string; code: string }
  creator: { id: string; name: string; username: string; financialEntity: { name: string } }
  createdAt: string
  updatedAt: string
}

const idTypeLabels: Record<string, string> = {
  cedula: 'Cédula',
  dimex: 'DIMEX',
  pasaporte: 'Pasaporte',
}

export function LatestAlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [filterEntityId, setFilterEntityId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null)

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

  const entityFilteredAlerts = filterEntityId === 'all'
    ? alerts
    : alerts.filter(a => a.financialEntityId === filterEntityId)

  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return entityFilteredAlerts
    const q = searchQuery.toLowerCase().trim()
    return entityFilteredAlerts.filter(
      (a) =>
        a.personName.toLowerCase().includes(q) ||
        a.personId.toLowerCase().includes(q)
    )
  }, [entityFilteredAlerts, searchQuery])

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  }

  const truncate = (str: string, len: number) =>
    str.length > len ? str.substring(0, len) + '...' : str

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#41454d]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o identificación..."
            className="pl-9 h-10 rounded-[8px] border-[#dddddd] bg-white focus:border-[#181d26] focus:ring-[#181d26]/10 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#dddddd]">
              <TableHead className="text-[#41454d] font-medium">Entidad</TableHead>
              <TableHead className="text-[#41454d] font-medium">Perfil</TableHead>
              <TableHead className="text-[#41454d] font-medium">Persona</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden md:table-cell">Identificación</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden lg:table-cell">Afectación</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden xl:table-cell">Descripción</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden sm:table-cell">Creada por</TableHead>
              <TableHead className="text-[#41454d] font-medium">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-[#41454d]">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-[#41454d]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center">
                      <Clock size={28} className="text-[#41454d]/40" />
                    </div>
                    <div>
                      <p className="font-medium text-[#181d26]">
                        {searchQuery ? 'No se encontraron alertas' : 'No hay alertas el día de hoy'}
                      </p>
                      <p className="text-sm text-[#41454d] mt-1">
                        {searchQuery
                          ? 'Intente con otro término de búsqueda'
                          : 'Las alertas que se registren hoy aparecerán aquí'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => (
                <TableRow
                  key={alert.id}
                  className="border-b border-[#dddddd] last:border-0 cursor-pointer hover:bg-[#f8fafc]/60 transition-colors"
                  onClick={() => setDetailAlert(alert)}
                >
                  <TableCell className="text-[#41454d] text-sm">{alert.financialEntity?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-[6px] font-normal text-xs ${
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
                    <span className="text-[10px] text-[#41454d] ml-1.5 bg-[#f8fafc] px-1.5 py-0.5 rounded-[4px] border border-[#dddddd]">
                      {idTypeLabels[alert.personIdType]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {alert.economicAffectation ? (
                      <Badge className="rounded-[6px] text-xs font-normal bg-[#f5e9d4] text-[#181d26] border border-[#e8d5b8]">
                        <DollarSign size={11} className="mr-0.5" />
                        Sí
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#41454d]">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#41454d] hidden xl:table-cell text-sm max-w-[200px]">
                    {truncate(alert.description, 50)}
                  </TableCell>
                  <TableCell className="text-[#41454d] text-sm hidden sm:table-cell">
                    {alert.creator?.name || '—'}
                  </TableCell>
                  <TableCell className="text-[#41454d] text-sm whitespace-nowrap">
                    {formatTime(alert.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Result count */}
      {searchQuery && filteredAlerts.length > 0 && (
        <p className="text-xs text-[#41454d] mt-3">
          {filteredAlerts.length} resultado{filteredAlerts.length !== 1 ? 's' : ''} para &quot;{searchQuery}&quot;
        </p>
      )}

      <AlertDetailDialog
        open={!!detailAlert}
        onOpenChange={(open) => !open && setDetailAlert(null)}
        alert={detailAlert}
      />
    </div>
  )
}
