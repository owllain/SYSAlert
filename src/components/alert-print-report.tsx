'use client'

import { useEffect } from 'react'
import { X, Printer, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Alert {
  id: string
  profile: string
  economicAffectation: boolean
  personName: string
  personId: string
  personIdType: string
  description: string
  financialEntityId: string
  status: string
  financialEntity: { id: string; name: string; code: string }
  creator: { id: string; name: string; username: string; financialEntity: { name: string } }
  createdAt: string
  updatedAt: string
}

interface AlertPrintReportProps {
  alerts: Alert[]
  title: string
  subtitle: string
  onClose: () => void
}

export function AlertPrintReport({ alerts, title, subtitle, onClose }: AlertPrintReportProps) {
  // Auto-trigger print dialog on mount
  useEffect(() => {
    // Small delay to let content render
    const timer = setTimeout(() => window.print(), 500)
    return () => clearTimeout(timer)
  }, [])

  const totalAlerts = alerts.length
  const receptorCount = alerts.filter(a => a.profile === 'receptor').length
  const victimaCount = alerts.filter(a => a.profile === 'victima').length
  const activeCount = alerts.filter(a => a.status === 'active').length
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length
  const dismissedCount = alerts.filter(a => a.status === 'dismissed').length
  const economicCount = alerts.filter(a => a.economicAffectation).length

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Screen-only controls */}
      <div className="print:hidden fixed top-4 right-4 flex items-center gap-2 z-10">
        <Button onClick={() => window.print()} className="bg-[#181d26] text-white rounded-[8px] px-4">
          <Printer size={16} className="mr-2" />
          Imprimir
        </Button>
        <Button onClick={onClose} variant="outline" className="rounded-[8px] px-4">
          <X size={16} className="mr-2" />
          Cerrar
        </Button>
      </div>

      {/* Print content */}
      <div className="max-w-[900px] mx-auto p-8 print:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#181d26] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#181d26] flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#181d26]">Sistema de Alertas Interbancario</h1>
              <p className="text-xs text-[#41454d]">República de Costa Rica</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#181d26]">{title}</p>
            <p className="text-xs text-[#41454d]">{subtitle}</p>
            <p className="text-xs text-[#41454d]">
              Generado: {new Date().toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-7 gap-3 mb-6">
          <div className="text-center p-3 bg-[#f8fafc] rounded-[6px] border">
            <p className="text-lg font-bold text-[#181d26]">{totalAlerts}</p>
            <p className="text-[9px] text-[#41454d] uppercase">Total</p>
          </div>
          <div className="text-center p-3 bg-[#0a2e0e]/5 rounded-[6px] border">
            <p className="text-lg font-bold text-[#0a2e0e]">{receptorCount}</p>
            <p className="text-[9px] text-[#41454d] uppercase">Receptores</p>
          </div>
          <div className="text-center p-3 bg-[#aa2d00]/5 rounded-[6px] border">
            <p className="text-lg font-bold text-[#aa2d00]">{victimaCount}</p>
            <p className="text-[9px] text-[#41454d] uppercase">Víctimas</p>
          </div>
          <div className="text-center p-3 bg-[#aa2d00]/5 rounded-[6px] border">
            <p className="text-lg font-bold text-[#aa2d00]">{activeCount}</p>
            <p className="text-[9px] text-[#41454d] uppercase">Activas</p>
          </div>
          <div className="text-center p-3 bg-[#0a2e0e]/5 rounded-[6px] border">
            <p className="text-lg font-bold text-[#0a2e0e]">{resolvedCount}</p>
            <p className="text-[9px] text-[#41454d] uppercase">Resueltas</p>
          </div>
          <div className="text-center p-3 bg-[#f8fafc] rounded-[6px] border">
            <p className="text-lg font-bold text-[#41454d]">{dismissedCount}</p>
            <p className="text-[9px] text-[#41454d] uppercase">Descartadas</p>
          </div>
          <div className="text-center p-3 bg-[#f5e9d4]/50 rounded-[6px] border">
            <p className="text-lg font-bold text-[#181d26]">{economicCount}</p>
            <p className="text-[9px] text-[#41454d] uppercase">Afectación $</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b-2 border-[#181d26]">
              <th className="text-left p-2 font-semibold text-[#181d26]">#</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Entidad</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Perfil</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Persona</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Identificación</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Afectación</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Estado</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Fecha</th>
              <th className="text-left p-2 font-semibold text-[#181d26]">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, i) => (
              <tr key={alert.id} className={`border-b border-[#dddddd] ${i % 2 !== 0 ? 'bg-[#fafbfc]' : ''}`}>
                <td className="p-2 text-[#41454d]">{i + 1}</td>
                <td className="p-2">{alert.financialEntity?.name || '—'}</td>
                <td className="p-2">{alert.profile === 'victima' ? 'Víctima' : 'Receptor'}</td>
                <td className="p-2 font-medium">{alert.personName}</td>
                <td className="p-2 font-mono">{alert.personId}</td>
                <td className="p-2">{alert.economicAffectation ? 'Sí' : 'No'}</td>
                <td className="p-2">{alert.status === 'active' ? 'Activa' : alert.status === 'resolved' ? 'Resuelta' : 'Descartada'}</td>
                <td className="p-2 whitespace-nowrap">{new Date(alert.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="p-2 max-w-[200px] truncate">{alert.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-[#dddddd] flex items-center justify-between">
          <p className="text-[10px] text-[#41454d]">
            Sistema de Alertas Interbancario — Costa Rica
          </p>
          <p className="text-[10px] text-[#41454d]">
            Documento confidencial — Uso interno únicamente
          </p>
        </div>
      </div>
    </div>
  )
}
