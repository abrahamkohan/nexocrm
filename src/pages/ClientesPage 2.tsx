// src/pages/ClientesPage.tsx
import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ClientCard } from '@/components/clients/ClientCard'
import { ClientForm, type ClientFormValues } from '@/components/clients/ClientForm'
import { ClientHistorySheet } from '@/components/clients/ClientHistorySheet'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

export function ClientesPage() {
  const { data: clients = [], isLoading, isError } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ClientRow | null>(null)
  const [historyClient, setHistoryClient] = useState<ClientRow | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return clients
    return clients.filter((c) =>
      c.full_name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q)
    )
  }, [clients, search])

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(client: ClientRow) {
    setEditing(client)
    setSheetOpen(true)
  }

  function handleDelete(client: ClientRow) {
    if (!confirm(`¿Eliminar a "${client.full_name}"? Esta acción no se puede deshacer.`)) return
    deleteClient.mutate(client.id)
  }

  async function handleSubmit(values: ClientFormValues) {
    const payload = {
      full_name: values.full_name,
      email: values.email || null,
      phone: values.phone || null,
      nationality: values.nationality || null,
      notes: values.notes || null,
    }
    if (editing) {
      await updateClient.mutateAsync({ id: editing.id, input: payload })
    } else {
      await createClient.mutateAsync(payload)
    }
    setSheetOpen(false)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-5 h-36 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">Error al cargar los clientes. Revisá tu conexión.</p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          {search ? (
            <p className="text-muted-foreground text-sm">
              No se encontraron clientes para "{search}".
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">No hay clientes todavía.</p>
              <p className="text-muted-foreground text-sm">
                Hacé clic en "Nuevo Cliente" para comenzar.
              </p>
            </>
          )}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={openEdit}
              onDelete={handleDelete}
              onViewHistory={(c) => setHistoryClient(c)}
            />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ClientForm
              key={editing?.id ?? 'new'}
              defaultValues={editing ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => setSheetOpen(false)}
              isSubmitting={createClient.isPending || updateClient.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ClientHistorySheet
        client={historyClient}
        open={!!historyClient}
        onOpenChange={(open) => { if (!open) setHistoryClient(null) }}
      />
    </div>
  )
}
