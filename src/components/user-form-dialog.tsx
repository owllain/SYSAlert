'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Entity {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  name: string
  username: string
  email: string
  identification: string
  idType: string
  role: string
  financialEntityId: string
  financialEntity: { id: string; name: string; code: string }
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editUser: User | null
  entities: Entity[]
  onSaved: () => void
}

export function UserFormDialog({ open, onOpenChange, editUser, entities, onSaved }: UserFormDialogProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [idType, setIdType] = useState('cedula')
  const [identification, setIdentification] = useState('')
  const [role, setRole] = useState('analyst')
  const [financialEntityId, setFinancialEntityId] = useState('')
  const [saving, setSaving] = useState(false)
  const [idError, setIdError] = useState('')

  // Reset form when dialog opens/changes
  const resetForm = () => {
    if (editUser) {
      setName(editUser.name)
      setUsername(editUser.username)
      setEmail(editUser.email)
      setIdType(editUser.idType)
      setIdentification(editUser.identification)
      setRole(editUser.role)
      setFinancialEntityId(editUser.financialEntityId)
    } else {
      setName('')
      setUsername('')
      setEmail('')
      setIdType('cedula')
      setIdentification('')
      setRole('analyst')
      setFinancialEntityId(entities.length > 0 ? entities[0].id : '')
    }
    setIdError('')
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editUser) {
        setName(editUser.name)
        setUsername(editUser.username)
        setEmail(editUser.email)
        setIdType(editUser.idType)
        setIdentification(editUser.identification)
        setRole(editUser.role)
        setFinancialEntityId(editUser.financialEntityId)
      } else {
        setName('')
        setUsername('')
        setEmail('')
        setIdType('cedula')
        setIdentification('')
        setRole('analyst')
        setFinancialEntityId(entities.length > 0 ? entities[0].id : '')
      }
      setIdError('')
    }
  }, [open, editUser, entities])

  // Reset when open changes
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
    if (!name || !username || !email || !identification || !financialEntityId) {
      toast.error('Todos los campos son requeridos')
      return
    }

    if (!validateId(identification, idType)) return

    setSaving(true)
    try {
      const body = { name, username, email, idType, identification, role, financialEntityId }
      const res = editUser
        ? await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editUser.id, ...body }) })
        : await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast.success(editUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente')
        onSaved()
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar usuario')
      }
    } catch {
      toast.error('Error al guardar usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-[12px] p-0">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="text-xl font-medium text-[#181d26]">
            {editUser ? 'Editar Usuario' : 'Agregar Usuario'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 py-6 space-y-5">
          {/* Financial Entity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Entidad Financiera</Label>
            <Select value={financialEntityId} onValueChange={setFinancialEntityId}>
              <SelectTrigger className="rounded-[6px] border-[#dddddd] h-11">
                <SelectValue placeholder="Seleccione entidad" />
              </SelectTrigger>
              <SelectContent>
                {entities.map(entity => (
                  <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ID Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Tipo de Identificación</Label>
            <RadioGroup value={idType} onValueChange={(v) => { setIdType(v); setIdentification(''); setIdError('') }} className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cedula" id="u-cedula" />
                <Label htmlFor="u-cedula" className="text-sm text-[#333840] cursor-pointer">Cédula 9 dígitos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dimex" id="u-dimex" />
                <Label htmlFor="u-dimex" className="text-sm text-[#333840] cursor-pointer">DIMEX 12 dígitos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pasaporte" id="u-pasaporte" />
                <Label htmlFor="u-pasaporte" className="text-sm text-[#333840] cursor-pointer">Pasaporte 30 caracteres</Label>
              </div>
            </RadioGroup>
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Número de Identificación</Label>
            <Input
              value={identification}
              onChange={(e) => {
                setIdentification(e.target.value)
                if (idError) validateId(e.target.value, idType)
              }}
              placeholder={
                idType === 'cedula' ? '000000000' :
                idType === 'dimex' ? '000000000000' :
                'Número de pasaporte'
              }
              className={`rounded-[6px] h-11 ${idError ? 'border-[#aa2d00]' : 'border-[#dddddd]'}`}
            />
            {idError && <p className="text-xs text-[#aa2d00]">{idError}</p>}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Nombre Completo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="rounded-[6px] h-11 border-[#dddddd]"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Usuario</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              className="rounded-[6px] h-11 border-[#dddddd]"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="rounded-[6px] h-11 border-[#dddddd]"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181d26]">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="rounded-[6px] border-[#dddddd] h-11">
                <SelectValue placeholder="Seleccione rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="analyst">Analista</SelectItem>
                <SelectItem value="viewer">Consultor</SelectItem>
              </SelectContent>
            </Select>
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
            {saving ? 'Guardando...' : editUser ? 'Actualizar' : 'Crear Usuario'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
