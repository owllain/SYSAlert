'use client'

import { useEffect, useState, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

const PAGE_SIZE = 10

export function AlertHistoryView() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [filterEntityId, setFilterEntityId] = useState<string>('all')
  const [filterProfile, setFilterProfile] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

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
      const params = new URLSearchParams({ month: 'true' })
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

  const filteredAlerts = alerts
    .filter(a => filterEntityId === 'all' || a.financialEntityId === filterEntityId)
    .filter(a => filterProfile === 'all' || a.profile === filterProfile)

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE))
  const paginatedAlerts = filteredAlerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const truncate = (str: string, len: number) =>
    str.length > len ? str.substring(0, len) + '...' : str

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [filterEntityId, filterProfile])

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
        <div>
          <h2 className="text-2xl font-medium text-[#181d26]">Historial de Alertas</h2>
          <p className="text-[#41454d] mt-1">Alertas del mes en curso</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filterProfile} onValueChange={setFilterProfile}>
            <SelectTrigger className="w-[160px] rounded-[6px] border-[#dddddd] h-10">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los perfiles</SelectItem>
              <SelectItem value="receptor">Receptor</SelectItem>
              <SelectItem value="victima">Víctima</SelectItem>
            </SelectContent>
          </Select>

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
              <TableHead className="text-[#41454d] font-medium">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#41454d]">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : paginatedAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-[#41454d]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center">
                      <span className="text-3xl">📅</span>
                    </div>
                    <p className="font-medium">No hay alertas este mes</p>
                    <p className="text-xs text-[#41454d]">Las alertas del mes aparecerán aquí</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAlerts.map((alert) => (
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
                  <TableCell className="text-[#41454d] text-sm whitespace-nowrap">
                    {formatDate(alert.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredAlerts.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-[#41454d]">
            Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filteredAlerts.length)} de {filteredAlerts.length} alertas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-[8px] border-[#dddddd]"
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-[8px] ${
                  p === page ? 'bg-[#181d26] text-white' : 'border-[#dddddd] text-[#41454d]'
                }`}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-[8px] border-[#dddddd]"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
