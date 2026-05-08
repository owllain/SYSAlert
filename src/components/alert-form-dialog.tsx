'use client'

import { useState } from 'react'
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

  const resetForm = () => {
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
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) resetForm()
    onOpenChange(newOpen)
  }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-[12px] p-0">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="text-xl font-medium text-[#181d26]">
            {editAlert ? 'Editar Alerta' : 'Crear Alerta'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 py-6 space-y-5">
          {/* Profile */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Perfil</Label>
            <RadioGroup value={profile} onValueChange={setProfile} className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receptor" id="a-receptor" />
                <Label htmlFor="a-receptor" className="text-sm text-[#333840] cursor-pointer">Receptor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="victima" id="a-victima" />
                <Label htmlFor="a-victima" className="text-sm text-[#333840] cursor-pointer">Víctima</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Economic Affectation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Afectación Económica</Label>
            <RadioGroup value={economicAffectation ? 'si' : 'no'} onValueChange={(v) => setEconomicAffectation(v === 'si')} className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="si" id="a-si" />
                <Label htmlFor="a-si" className="text-sm text-[#333840] cursor-pointer">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="a-no" />
                <Label htmlFor="a-no" className="text-sm text-[#333840] cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Person Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Nombre de la Persona</Label>
            <Input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Nombre completo de la persona"
              className="rounded-[6px] h-11 border-[#dddddd]"
            />
          </div>

          {/* Person ID Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Tipo de Identificación</Label>
            <RadioGroup value={personIdType} onValueChange={(v) => { setPersonIdType(v); setPersonId(''); setIdError('') }} className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cedula" id="a-cedula" />
                <Label htmlFor="a-cedula" className="text-sm text-[#333840] cursor-pointer">Cédula 9 dígitos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dimex" id="a-dimex" />
                <Label htmlFor="a-dimex" className="text-sm text-[#333840] cursor-pointer">DIMEX 12 dígitos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pasaporte" id="a-pasaporte" />
                <Label htmlFor="a-pasaporte" className="text-sm text-[#333840] cursor-pointer">Pasaporte 30 caracteres</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Person ID Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Número de Identificación</Label>
            <Input
              value={personId}
              onChange={(e) => {
                setPersonId(e.target.value)
                if (idError) validateId(e.target.value, personIdType)
              }}
              placeholder={
                personIdType === 'cedula' ? '000000000' :
                personIdType === 'dimex' ? '000000000000' :
                'Número de pasaporte'
              }
              className={`rounded-[6px] h-11 ${idError ? 'border-[#aa2d00]' : 'border-[#dddddd]'}`}
            />
            {idError && <p className="text-xs text-[#aa2d00]">{idError}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Descripción del Incidente</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa el incidente en detalle..."
              className="rounded-[6px] border-[#dddddd] min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="px-8 pb-8 flex items-center justify-end gap-3">
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
            className="bg-[#181d26] text-white rounded-[12px] px-6 py-3 h-auto font-medium hover:bg-[#181d26]/90"
          >
            {saving ? 'Guardando...' : editAlert ? 'Actualizar' : 'Crear Alerta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
