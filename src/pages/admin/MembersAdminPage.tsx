import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useDeleteMember, useMembers, useUpdateMemberStatus } from '@/hooks/use-members';
import { apiErrorMessage } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MemberStatus } from '@/types';

const STATUS: Record<
  MemberStatus,
  { label: string; variant: 'default' | 'secondary' | 'accent' | 'outline' | 'destructive' }
> = {
  // En desuso (ya no hay aprobación); se conserva por si quedara algún dato antiguo
  PENDING: { label: 'Pendiente', variant: 'accent' },
  ACTIVE: { label: 'Activo', variant: 'default' },
  SUSPENDED: { label: 'Suspendido', variant: 'destructive' },
  INACTIVE: { label: 'Inactivo', variant: 'outline' },
};

const FILTERS: { value: MemberStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'SUSPENDED', label: 'Suspendidos' },
];

export function MembersAdminPage() {
  const [filter, setFilter] = useState<MemberStatus | 'all'>('all');
  const { data: members, isLoading } = useMembers(
    filter === 'all' ? undefined : filter,
  );
  const updateStatus = useUpdateMemberStatus();
  const deleteMember = useDeleteMember();

  const remove = (member: { id: string; user: { name: string | null; surname: string | null; email: string } }) => {
    const name = [member.user.name, member.user.surname].filter(Boolean).join(' ') || member.user.email;
    if (
      !window.confirm(
        `¿Eliminar a ${name}? Se borran su cuenta y su ficha, y no se puede deshacer.`,
      )
    ) {
      return;
    }
    deleteMember.mutate(member.id, {
      onSuccess: () => toast.success(`${name} eliminado`),
      // Si participó en torneos, el backend explica por qué no y sugiere suspender
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo eliminar'), { duration: 8000 }),
    });
  };

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
          Socios inscritos en el club. Entran activos al inscribirse; aquí puedes suspenderlos o
          eliminarlos.
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
                  <td className="table-td">
                    {/* Sin aprobación: un socio está activo o suspendido */}
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                      {member.status === 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeStatus(member.id, 'SUSPENDED')}
                        >
                          Suspender
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeStatus(member.id, 'ACTIVE')}
                        >
                          Reactivar
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Eliminar socio"
                        aria-label={`Eliminar a ${member.user.name ?? member.user.email}`}
                        onClick={() => remove(member)}
                        disabled={deleteMember.isPending}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
