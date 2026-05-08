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
import { AlertTriangle } from 'lucide-react'
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

interface AlertFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editAlert: Alert | null
  financialEntityId: string
  userId: string
  onSaved: () => void
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
  const [duplicateWarning, setDuplicateWarning] = useState<{ found: boolean; count: number; entities: string[] } | null>(null)
  const [duplicateChecking, setDuplicateChecking] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkDuplicates = useCallback(async (id: string) => {
    if (!id.trim()) {
      setDuplicateWarning(null)
      setDuplicateChecking(false)
      return
    }
    setDuplicateChecking(true)
    try {
      const res = await fetch(`/api/alerts?search=${encodeURIComponent(id)}`)
      if (res.ok) {
        const alerts = await res.json()
        if (alerts.length > 0) {
          const entities = [...new Set(alerts.map((a: { financialEntity?: { name: string } }) => a.financialEntity?.name).filter(Boolean))] as string[]
          setDuplicateWarning({ found: true, count: alerts.length, entities })
        } else {
          setDuplicateWarning(null)
        }
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
    setDuplicateWarning(null)
    setDuplicateChecking(false)
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

  const handleSubmit = async () => {
    if (!personName || !personId || !description) {
      toast.error('Todos los campos son requeridos')
      return
    }

    if (!validateId(personId, personIdType)) return

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-[12px] p-0 gap-0">
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
            <RadioGroup value={personIdType} onValueChange={(v) => { setPersonIdType(v); setPersonId(''); setIdError(''); setDuplicateWarning(null); setDuplicateChecking(false); if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null } }} className="flex flex-col gap-2">
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
            <Input
              value={personId}
              onChange={(e) => {
                const value = e.target.value
                setPersonId(value)
                if (idError) validateId(value, personIdType)

                // Debounced duplicate check
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current)
                }
                if (!value.trim()) {
                  setDuplicateWarning(null)
                  setDuplicateChecking(false)
                  return
                }
                setDuplicateChecking(true)
                debounceRef.current = setTimeout(() => {
                  checkDuplicates(value)
                }, 500)
              }}
              placeholder={
                personIdType === 'cedula' ? '000000000' :
                personIdType === 'dimex' ? '000000000000' :
                'Número de pasaporte'
              }
              className={`rounded-[6px] h-11 ${idError ? 'border-[#aa2d00] focus:border-[#aa2d00]' : 'border-[#dddddd] focus:border-[#181d26]'} focus:ring-[#181d26]/10`}
            />
            {idError && <p className="text-xs text-[#aa2d00] mt-1">{idError}</p>}
            {duplicateChecking && (
              <div className="flex items-center gap-2 mt-2 text-xs text-[#41454d]">
                <div className="w-3 h-3 border-2 border-[#9297a0] border-t-transparent rounded-full animate-spin" />
                Verificando duplicados...
              </div>
            )}
            {duplicateWarning && duplicateWarning.found && (
              <div className="bg-[#f5e9d4] border border-[#e8d5b8] rounded-[8px] p-3 text-sm text-[#181d26] mt-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#aa2d00] shrink-0 mt-0.5" />
                <span>Esta persona ya tiene {duplicateWarning.count} alerta{duplicateWarning.count !== 1 ? 's' : ''} registrada{duplicateWarning.count !== 1 ? 's' : ''} en: {duplicateWarning.entities.join(', ')}</span>
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
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#181d26] text-white rounded-[12px] px-6 py-3 h-auto font-medium hover:bg-[#0d1218]"
          >
            {saving ? 'Guardando...' : editAlert ? 'Actualizar Alerta' : 'Crear Alerta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
