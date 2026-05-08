'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
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
import { UserFormDialog } from '@/components/user-form-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { Plus, Pencil, Trash2, Search, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

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
  cedula: 'Cédula',
  dimex: 'DIMEX',
  pasaporte: 'Pasaporte',
}

const entityColors: Record<string, string> = {
  BP: '#aa2d00',
  BCR: '#0a2e0e',
  BNC: '#181d26',
}

export function UsersView() {
  const { currentUser, searchFocused, setSearchFocused } = useAppStore()
  const [users, setUsers] = useState<User[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Focus search input when searchFocused is triggered
  useEffect(() => {
    if (searchFocused) {
      searchInputRef.current?.focus()
      setSearchFocused(false)
    }
  }, [searchFocused, setSearchFocused])

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      const res = await fetch(`/api/users?id=${deleteUser.id}&deletedBy=${currentUser?.id || ''}`, { method: 'DELETE' })
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

  const filteredUsers = users.filter(user => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      user.name.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.identification.includes(q) ||
      user.financialEntity?.name.toLowerCase().includes(q)
    )
  })

  // Stats
  const adminCount = users.filter(u => u.role === 'admin').length
  const analystCount = users.filter(u => u.role === 'analyst').length
  const viewerCount = users.filter(u => u.role === 'viewer').length

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-2xl font-medium text-[#181d26]">Usuarios y Permisos</h2>
          <p className="text-[#41454d] mt-1">Gestión de usuarios del sistema interbancario</p>
        </div>
        <Button
          onClick={() => { setEditUser(null); setFormOpen(true) }}
          className="bg-[#181d26] text-white rounded-[12px] px-6 py-4 h-auto text-base font-medium hover:bg-[#0d1218] active:scale-[0.98] transition-transform"
        >
          <Plus size={18} className="mr-2" />
          Agregar Usuario
        </Button>
      </div>

      {/* Role stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="flex items-center gap-3 p-4 rounded-[10px] border border-[#dddddd] bg-white">
          <div className="w-10 h-10 rounded-[8px] bg-[#181d26] flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-medium text-[#181d26] leading-none">{adminCount}</p>
            <p className="text-xs text-[#41454d] mt-0.5">Administradores</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-[10px] border border-[#dddddd] bg-white">
          <div className="w-10 h-10 rounded-[8px] bg-[#0a2e0e] flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-medium text-[#181d26] leading-none">{analystCount}</p>
            <p className="text-xs text-[#41454d] mt-0.5">Analistas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-[10px] border border-[#dddddd] bg-white">
          <div className="w-10 h-10 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center">
            <Users size={18} className="text-[#41454d]" />
          </div>
          <div>
            <p className="text-2xl font-medium text-[#181d26] leading-none">{viewerCount}</p>
            <p className="text-xs text-[#41454d] mt-0.5">Consultores</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9297a0]" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario, correo, ID..."
            className="pl-9 rounded-[6px] h-10 border-[#dddddd] focus:border-[#181d26]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#dddddd] bg-[#f8fafc]/80">
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Nombre</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Usuario</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden md:table-cell">Correo</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Tipo ID</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Identificación</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Entidad</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Rol</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}>
                  <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-[#41454d]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center">
                      <UserPlus size={24} className="text-[#9297a0]" />
                    </div>
                    <p className="font-medium text-[#181d26]">
                      {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </p>
                    <p className="text-xs text-[#41454d]">
                      {search ? 'Intente con otros términos de búsqueda' : 'Agregue el primer usuario usando el botón superior'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, idx) => (
                <TableRow key={user.id} className={`border-b border-[#dddddd] last:border-0 hover:bg-[#f8fafc]/50 transition-colors cursor-default ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                        style={{ backgroundColor: entityColors[user.financialEntity?.code] || '#181d26' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#181d26]">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#41454d] text-sm">{user.username}</TableCell>
                  <TableCell className="text-[#41454d] text-sm hidden md:table-cell">{user.email}</TableCell>
                  <TableCell className="text-[#41454d] hidden lg:table-cell">
                    <Badge variant="secondary" className="bg-[#f8fafc] text-[#41454d] border border-[#dddddd] rounded-[6px] font-normal text-xs">
                      {idTypeLabels[user.idType] || user.idType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#41454d] hidden lg:table-cell font-mono text-xs">{user.identification}</TableCell>
                  <TableCell className="text-[#41454d] text-sm hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entityColors[user.financialEntity?.code] || '#181d26' }}
                      />
                      {user.financialEntity?.name || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-[6px] font-normal text-xs ${
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
                        className="h-8 w-8 text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc]"
                        onClick={() => { setEditUser(user); setFormOpen(true) }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#9297a0] hover:text-[#aa2d00] hover:bg-[#aa2d00]/5"
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
