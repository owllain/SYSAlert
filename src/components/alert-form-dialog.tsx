'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface Alert {
  id: string
  profile: string
  economicAffectation: boolean
  personName: string
  personId: string
  personIdType: string
  description: string
  status: string
  createdBy: string
  financialEntityId: string
}

interface DuplicateAlert {
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
  creator: { id: string; name: string; username: string; financialEntity: { name: string } }
  createdAt: string
  updatedAt: string
}

interface AlertFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editAlert: Alert | null
  financialEntityId: string
  userId: string
  onSaved: () => void
}

const statusLabels: Record<string, string> = {
  active: 'Activa',
  resolved: 'Resuelta',
  dismissed: 'Descartada',
}

const entityColors: Record<string, string> = {
  'BP': 'bg-[#aa2d00]',
  'BCR': 'bg-[#0a2e0e]',
  'BNC': 'bg-[#1a3a5c]',
}

function getEntityDotColor(code: string): string {
  return entityColors[code] || 'bg-[#41454d]'
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
}

export function AlertFormDialog({ open, onOpenChange, editAlert, financialEntityId, userId, onSaved }: AlertFormDialogProps) {
  const [profile, setProfile] = useState('receptor')
  const [economicAffectation, setEconomicAffectation] = useState(false)
  const [personName, setPersonName] = useState('')
  const [personIdType, setPersonIdType] = useState('cedula')
  const [personId, setPersonId] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [idError, setIdError] = useState('')
  const [duplicateAlerts, setDuplicateAlerts] = useState<DuplicateAlert[]>([])
  const [duplicateChecking, setDuplicateChecking] = useState(false)
  const [forceCreate, setForceCreate] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkDuplicates = useCallback(async (id: string, idType: string) => {
    // Check if the ID has valid length before making API call
    let validLength = false
    if (idType === 'cedula') {
      validLength = /^\d{9}$/.test(id)
    } else if (idType === 'dimex') {
      validLength = /^\d{12}$/.test(id)
    } else if (idType === 'pasaporte') {
      validLength = id.length > 0
    }

    if (!validLength) {
      setDuplicateAlerts([])
      setDuplicateChecking(false)
      return
    }

    setDuplicateChecking(true)
    setForceCreate(false)
    try {
      const res = await fetch(`/api/alerts/check-duplicate?personId=${encodeURIComponent(id)}&personIdType=${encodeURIComponent(idType)}`)
      if (res.ok) {
        const data = await res.json()
        setDuplicateAlerts(data.duplicate ? data.existingAlerts : [])
      }
    } catch {
      // Silently fail - duplicate check is informational only
    } finally {
      setDuplicateChecking(false)
    }
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Reset form whenever dialog opens or editAlert changes
  useEffect(() => {
    if (!open) return
    if (editAlert) {
      setProfile(editAlert.profile)
      setEconomicAffectation(editAlert.economicAffectation)
      setPersonName(editAlert.personName)
      setPersonIdType(editAlert.personIdType)
      setPersonId(editAlert.personId)
      setDescription(editAlert.description)
    } else {
      setProfile('receptor')
      setEconomicAffectation(false)
      setPersonName('')
      setPersonIdType('cedula')
      setPersonId('')
      setDescription('')
    }
    setIdError('')
    setDuplicateAlerts([])
    setDuplicateChecking(false)
    setForceCreate(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [open, editAlert])

  const validateId = (value: string, type: string): boolean => {
    if (type === 'cedula') {
      if (!/^\d{9}$/.test(value)) {
        setIdError('La cédula debe tener exactamente 9 dígitos numéricos')
        return false
      }
    } else if (type === 'dimex') {
      if (!/^\d{12}$/.test(value)) {
        setIdError('El DIMEX debe tener exactamente 12 dígitos numéricos')
        return false
      }
    } else if (type === 'pasaporte') {
      if (value.length === 0 || value.length > 30) {
        setIdError('El pasaporte debe tener entre 1 y 30 caracteres')
        return false
      }
    }
    setIdError('')
    return true
  }

  const handleSubmit = async (overrideDuplicate = false) => {
    if (!personName || !personId || !description) {
      toast.error('Todos los campos son requeridos')
      return
    }

    if (!validateId(personId, personIdType)) return

    // If duplicates found and not forcing create, don't submit
    if (duplicateAlerts.length > 0 && !overrideDuplicate) {
      return
    }

    setSaving(true)
    try {
      const body = {
        profile,
        economicAffectation,
        personName,
        personId,
        personIdType,
        description,
        createdBy: userId,
        financialEntityId,
      }

      const res = editAlert
        ? await fetch('/api/alerts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editAlert.id, ...body }),
          })
        : await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast.success(editAlert ? 'Alerta actualizada correctamente' : 'Alerta creada correctamente')
        onSaved()
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar alerta')
      }
    } catch {
      toast.error('Error al guardar alerta')
    } finally {
      setSaving(false)
    }
  }

  const hasDuplicates = duplicateAlerts.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#1a1d27] sm:max-w-[560px] rounded-[12px] p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="text-xl font-medium text-[#181d26]">
            {editAlert ? 'Editar Alerta' : 'Crear Alerta'}
          </DialogTitle>
          <p className="text-sm text-[#41454d] mt-1">
            {editAlert ? 'Modifique los datos de la alerta' : 'Complete la información para registrar una nueva alerta'}
          </p>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar"
        >
          {/* Profile */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#181d26]">Perfil</Label>
            <RadioGroup value={profile} onValueChange={setProfile} className="flex gap-4">
              <label htmlFor="a-receptor" className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                profile === 'receptor' ? 'border-[#0a2e0e] bg-[#0a2e0e]/5' : 'border-[#dddddd] hover:border-[#9297a0]'
              }`}>
                <RadioGroupItem value="receptor" id="a-receptor" />
                <span className={`text-sm ${profile === 'receptor' ? 'text-[#0a2e0e] font-medium' : 'text-[#333840]'}`}>Receptor</span>
              </label>
              <label htmlFor="a-victima" className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                profile === 'victima' ? 'border-[#aa2d00] bg-[#aa2d00]/5' : 'border-[#dddddd] hover:border-[#9297a0]'
              }`}>
                <RadioGroupItem value="victima" id="a-victima" />
                <span className={`text-sm ${profile === 'victima' ? 'text-[#aa2d00] font-medium' : 'text-[#333840]'}`}>Víctima</span>
              </label>
            </RadioGroup>
          </div>

          {/* Economic Affectation */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#181d26]">Afectación Económica</Label>
            <RadioGroup value={economicAffectation ? 'si' : 'no'} onValueChange={(v) => setEconomicAffectation(v === 'si')} className="flex gap-4">
              <label htmlFor="a-si" className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                economicAffectation ? 'border-[#aa2d00] bg-[#aa2d00]/5' : 'border-[#dddddd] hover:border-[#9297a0]'
              }`}>
                <RadioGroupItem value="si" id="a-si" />
                <span className={`text-sm ${economicAffectation ? 'text-[#aa2d00] font-medium' : 'text-[#333840]'}`}>Sí</span>
              </label>
              <label htmlFor="a-no" className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                !economicAffectation ? 'border-[#0a2e0e] bg-[#0a2e0e]/5' : 'border-[#dddddd] hover:border-[#9297a0]'
              }`}>
                <RadioGroupItem value="no" id="a-no" />
                <span className={`text-sm ${!economicAffectation ? 'text-[#0a2e0e] font-medium' : 'text-[#333840]'}`}>No</span>
              </label>
            </RadioGroup>
          </div>

          <div className="h-px bg-[#dddddd]" />

          {/* Person Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Nombre de la Persona</Label>
            <Input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Nombre completo de la persona"
              className="rounded-[6px] h-11 border-[#dddddd] focus:border-[#181d26] focus:ring-[#181d26]/10"
            />
          </div>

          {/* Person ID Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#181d26]">Tipo de Identificación</Label>
            <RadioGroup value={personIdType} onValueChange={(v) => { setPersonIdType(v); setPersonId(''); setIdError(''); setDuplicateAlerts([]); setDuplicateChecking(false); setForceCreate(false); if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null } }} className="flex flex-col gap-2">
              <label htmlFor="a-cedula" className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                personIdType === 'cedula' ? 'border-[#181d26] bg-[#181d26]/5' : 'border-[#dddddd] hover:border-[#9297a0]'
              }`}>
                <RadioGroupItem value="cedula" id="a-cedula" />
                <span className={`text-sm ${personIdType === 'cedula' ? 'text-[#181d26] font-medium' : 'text-[#333840]'}`}>Cédula (9 dígitos)</span>
              </label>
              <label htmlFor="a-dimex" className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                personIdType === 'dimex' ? 'border-[#181d26] bg-[#181d26]/5' : 'border-[#dddddd] hover:border-[#9297a0]'
              }`}>
                <RadioGroupItem value="dimex" id="a-dimex" />
                <span className={`text-sm ${personIdType === 'dimex' ? 'text-[#181d26] font-medium' : 'text-[#333840]'}`}>DIMEX (12 dígitos)</span>
              </label>
              <label htmlFor="a-pasaporte" className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                personIdType === 'pasaporte' ? 'border-[#181d26] bg-[#181d26]/5' : 'border-[#dddddd] hover:border-[#9297a0]'
              }`}>
                <RadioGroupItem value="pasaporte" id="a-pasaporte" />
                <span className={`text-sm ${personIdType === 'pasaporte' ? 'text-[#181d26] font-medium' : 'text-[#333840]'}`}>Pasaporte (máx. 30 caracteres)</span>
              </label>
            </RadioGroup>
          </div>

          {/* Person ID Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Número de Identificación</Label>
            <div className="relative">
              <Input
                value={personId}
                onChange={(e) => {
                  const value = e.target.value
                  setPersonId(value)
                  setForceCreate(false)
                  if (idError) validateId(value, personIdType)

                  // Debounced duplicate check
                  if (debounceRef.current) {
                    clearTimeout(debounceRef.current)
                  }
                  if (!value.trim()) {
                    setDuplicateAlerts([])
                    setDuplicateChecking(false)
                    return
                  }
                  setDuplicateChecking(true)
                  debounceRef.current = setTimeout(() => {
                    checkDuplicates(value, personIdType)
                  }, 500)
                }}
                placeholder={
                  personIdType === 'cedula' ? '000000000' :
                  personIdType === 'dimex' ? '000000000000' :
                  'Número de pasaporte'
                }
                className={`rounded-[6px] h-11 pr-8 ${idError ? 'border-[#aa2d00] focus:border-[#aa2d00]' : hasDuplicates ? 'border-amber-400 focus:border-amber-500' : 'border-[#dddddd] focus:border-[#181d26]'} focus:ring-[#181d26]/10`}
              />
              {duplicateChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={14} className="text-[#9297a0] animate-spin" />
                </div>
              )}
            </div>
            {idError && <p className="text-xs text-[#aa2d00] mt-1">{idError}</p>}

            {/* Duplicate Warning Banner */}
            {hasDuplicates && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-[10px] p-4 mt-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-800">
                      ⚠️ Se encontraron {duplicateAlerts.length} alerta{duplicateAlerts.length !== 1 ? 's' : ''} existente{duplicateAlerts.length !== 1 ? 's' : ''} para esta persona
                    </p>

                    {/* Matching alerts list (up to 3) */}
                    <div className="mt-3 space-y-2">
                      {duplicateAlerts.slice(0, 3).map((dupAlert) => (
                        <div
                          key={dupAlert.id}
                          className="flex items-center gap-2.5 bg-white/60 rounded-[8px] px-3 py-2 text-xs border border-amber-100"
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getEntityDotColor(dupAlert.financialEntity?.code || '')}`} />
                          <span className="font-medium text-[#181d26] truncate max-w-[120px]">
                            {dupAlert.financialEntity?.name || '—'}
                          </span>
                          <Badge className={`rounded-[4px] text-[10px] px-1.5 py-0 h-4 ${
                            dupAlert.profile === 'victima' ? 'bg-[#aa2d00] text-white' : 'bg-[#0a2e0e] text-white'
                          }`}>
                            {dupAlert.profile === 'victima' ? 'Víc' : 'Rec'}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`rounded-[4px] text-[10px] px-1.5 py-0 h-4 ${
                              dupAlert.status === 'active'
                                ? 'bg-[#0a2e0e]/10 text-[#0a2e0e]'
                                : dupAlert.status === 'resolved'
                                ? 'bg-[#f8fafc] text-[#41454d]'
                                : 'bg-[#f5e9d4] text-[#181d26]'
                            }`}
                          >
                            {statusLabels[dupAlert.status] || dupAlert.status}
                          </Badge>
                          <span className="text-[#9297a0] ml-auto whitespace-nowrap">
                            {formatRelativeTime(dupAlert.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Force create button */}
                    <Button
                      onClick={() => handleSubmit(true)}
                      disabled={saving}
                      variant="outline"
                      className="mt-3 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-[8px] h-8 text-xs font-medium"
                    >
                      {saving ? 'Guardando...' : 'Crear de todas formas'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Descripción del Incidente</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa el incidente en detalle..."
              className="rounded-[6px] border-[#dddddd] min-h-[120px] resize-none focus:border-[#181d26] focus:ring-[#181d26]/10"
            />
          </div>
        </motion.div>

        <div className="px-8 pb-8 pt-2 flex items-center justify-end gap-3 border-t border-[#dddddd]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white text-[#181d26] border border-[#dddddd] rounded-[12px] px-6 py-3 h-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={saving || hasDuplicates}
            className="bg-[#181d26] text-white rounded-[12px] px-6 py-3 h-auto font-medium hover:bg-[#0d1218] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : editAlert ? 'Actualizar Alerta' : 'Crear Alerta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
