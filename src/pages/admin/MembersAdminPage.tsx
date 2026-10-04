import { useState } from 'react';
import { toast } from 'sonner';
import { useMembers, useUpdateMemberStatus } from '@/hooks/use-members';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MemberStatus } from '@/types';

const STATUS: Record<
  MemberStatus,
  { label: string; variant: 'default' | 'secondary' | 'accent' | 'outline' | 'destructive' }
> = {
  PENDING: { label: 'Pendiente', variant: 'accent' },
  ACTIVE: { label: 'Activo', variant: 'default' },
  SUSPENDED: { label: 'Suspendido', variant: 'destructive' },
  INACTIVE: { label: 'Inactivo', variant: 'outline' },
};

const FILTERS: { value: MemberStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'SUSPENDED', label: 'Suspendidos' },
];

export function MembersAdminPage() {
  const [filter, setFilter] = useState<MemberStatus | 'all'>('all');
  const { data: members, isLoading } = useMembers(
    filter === 'all' ? undefined : filter,
  );
  const updateStatus = useUpdateMemberStatus();

  const changeStatus = (id: string, status: MemberStatus) =>
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success('Estado actualizado'),
        onError: () => toast.error('No se pudo actualizar'),
      },
    );

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Socios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aprueba solicitudes y administra el estado de los socios.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-48 skeleton" aria-busy="true" />
      ) : members?.length === 0 ? (
        <p className="state-empty">
          No hay socios en este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th scope="col" className="table-th hidden w-16 sm:table-cell">Nº</th>
                <th scope="col" className="table-th">Socio</th>
                <th scope="col" className="table-th hidden md:table-cell">Categorías</th>
                <th scope="col" className="table-th hidden sm:table-cell">Estado</th>
                <th scope="col" className="table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members?.map((member) => (
                <tr key={member.id} className="table-row">
                  <td className="table-td table-num hidden sm:table-cell">
                    {member.memberNumber}
                  </td>
                  <td className="table-td">
                    <div className="font-medium">
                      <span className="mr-1.5 text-muted-foreground tabular-nums sm:hidden">
                        {member.memberNumber}.
                      </span>
                      {member.user.name} {member.user.surname}
                    </div>
                    {/* <wbr> tras la @: si no cabe, corta ahí y no a mitad de dominio */}
                    <div className="break-words text-xs text-muted-foreground">
                      {member.user.email.split('@')[0]}@<wbr />
                      {member.user.email.split('@').slice(1).join('@')}
                    </div>
                    {/* En móvil, lo que no cabe en columnas va aquí debajo */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden">
                      <Badge variant={STATUS[member.status].variant} className="sm:hidden">
                        {STATUS[member.status].label}
                      </Badge>
                      {member.categories.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {member.categories.map((c) => c.category.label).join(' · ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={cn('hidden px-4 py-3 text-xs text-muted-foreground md:table-cell')}>
                    {member.categories.length > 0
                      ? member.categories.map((c) => c.category.label).join(' · ')
                      : '—'}
                  </td>
                  <td className="table-td hidden sm:table-cell">
                    <Badge variant={STATUS[member.status].variant}>
                      {STATUS[member.status].label}
                    </Badge>
                  </td>
                  <td className="table-td text-right">
                    {member.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => changeStatus(member.id, 'ACTIVE')}
                      >
                        Aprobar
                      </Button>
                    )}
                    {member.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => changeStatus(member.id, 'SUSPENDED')}
                      >
                        Suspender
                      </Button>
                    )}
                    {member.status === 'SUSPENDED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => changeStatus(member.id, 'ACTIVE')}
                      >
                        Reactivar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
