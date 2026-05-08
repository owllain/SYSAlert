'use client'

import { useEffect, useState, useCallback } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserFormDialog } from '@/components/user-form-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  analyst: 'Analista',
  viewer: 'Consultor',
}

const idTypeLabels: Record<string, string> = {
  cedula: 'Cédula 9 dígitos',
  dimex: 'DIMEX 12 dígitos',
  pasaporte: 'Pasaporte',
}

export function UsersView() {
  const [users, setUsers] = useState<User[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEntities = useCallback(async () => {
    try {
      const res = await fetch('/api/entities')
      const data = await res.json()
      setEntities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchEntities()
  }, [fetchUsers, fetchEntities])

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      const res = await fetch(`/api/users?id=${deleteUser.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Usuario eliminado correctamente')
        fetchUsers()
      } else {
        toast.error('Error al eliminar usuario')
      }
    } catch {
      toast.error('Error al eliminar usuario')
    } finally {
      setDeleteUser(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-2xl font-medium text-[#181d26]">Usuarios y Permisos</h2>
          <p className="text-[#41454d] mt-1">Gestión de usuarios del sistema</p>
        </div>
        <Button
          onClick={() => { setEditUser(null); setFormOpen(true) }}
          className="bg-[#181d26] text-white rounded-[12px] px-6 py-4 h-auto text-base font-medium hover:bg-[#181d26]/90"
        >
          <Plus size={18} className="mr-2" />
          Agregar Usuario
        </Button>
      </div>

      <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#dddddd]">
              <TableHead className="text-[#41454d] font-medium">Nombre</TableHead>
              <TableHead className="text-[#41454d] font-medium">Usuario</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden md:table-cell">Email</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden lg:table-cell">Tipo ID</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden lg:table-cell">Identificación</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden sm:table-cell">Entidad</TableHead>
              <TableHead className="text-[#41454d] font-medium">Rol</TableHead>
              <TableHead className="text-[#41454d] font-medium text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-[#41454d]">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-[#41454d]">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-b border-[#dddddd] last:border-0">
                  <TableCell className="font-medium text-[#181d26]">{user.name}</TableCell>
                  <TableCell className="text-[#41454d]">{user.username}</TableCell>
                  <TableCell className="text-[#41454d] hidden md:table-cell">{user.email}</TableCell>
                  <TableCell className="text-[#41454d] hidden lg:table-cell">
                    <Badge variant="secondary" className="bg-[#f8fafc] text-[#41454d] border border-[#dddddd] rounded-[6px] font-normal">
                      {idTypeLabels[user.idType] || user.idType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#41454d] hidden lg:table-cell font-mono text-xs">{user.identification}</TableCell>
                  <TableCell className="text-[#41454d] hidden sm:table-cell">{user.financialEntity?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-[6px] font-normal ${
                        user.role === 'admin'
                          ? 'bg-[#181d26] text-white'
                          : user.role === 'analyst'
                          ? 'bg-[#0a2e0e] text-white'
                          : 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]'
                      }`}
                    >
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#41454d] hover:text-[#181d26]"
                        onClick={() => { setEditUser(user); setFormOpen(true) }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#aa2d00] hover:text-[#aa2d00]/80"
                        onClick={() => setDeleteUser(user)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editUser={editUser}
        entities={entities}
        onSaved={fetchUsers}
      />

      <DeleteConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        description={`¿Está seguro de que desea eliminar al usuario "${deleteUser?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
