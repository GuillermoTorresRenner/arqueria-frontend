import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';
import { useConfirm } from '@/features/confirm-store';
import { Input } from '@/components/ui/input';
import { EXPERIENCE_OPTIONS, type ArcheryExperience } from '@/lib/join';
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

const EXPERIENCE_LABEL = Object.fromEntries(EXPERIENCE_OPTIONS.map((o) => [o.value, o.label]));

export function MembersAdminPage() {
  const [filter, setFilter] = useState<MemberStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [experience, setExperience] = useState<ArcheryExperience | ''>('');

  // La búsqueda va al servidor: se espera a que se deje de escribir
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: members, isLoading } = useMembers({
    status: filter === 'all' ? undefined : filter,
    search,
    experience: experience || undefined,
  });
  const filtering = Boolean(search || experience || filter !== 'all');
  const updateStatus = useUpdateMemberStatus();
  const deleteMember = useDeleteMember();
  const confirm = useConfirm();

  const nameOf = (member: { user: { name: string | null; surname: string | null; email: string } }) =>
    [member.user.name, member.user.surname].filter(Boolean).join(' ') || member.user.email;

  const remove = async (member: Parameters<typeof nameOf>[0] & { id: string }) => {
    const name = nameOf(member);
    const ok = await confirm({
      title: `¿Eliminar a ${name}?`,
      description:
        'Se borran su cuenta y su ficha de socio. No se puede deshacer. Si ya participó en torneos no se podrá eliminar: en ese caso, suspéndelo.',
      confirmLabel: 'Eliminar socio',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMember.mutate(member.id, {
      onSuccess: () => toast.success(`${name} eliminado`),
      // Si participó en torneos, el backend explica por qué no y sugiere suspender
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo eliminar'), { duration: 8000 }),
    });
  };

  const changeStatus = async (member: Parameters<typeof nameOf>[0] & { id: string }, status: MemberStatus) => {
    if (status === 'SUSPENDED') {
      const ok = await confirm({
        title: `¿Suspender a ${nameOf(member)}?`,
        description:
          'Su membresía quedará suspendida hasta que la reactives. Conserva su cuenta y sus resultados.',
        confirmLabel: 'Suspender',
        tone: 'danger',
      });
      if (!ok) return;
    }
    updateStatus.mutate(
      { id: member.id, status },
      {
        onSuccess: () => toast.success(status === 'SUSPENDED' ? 'Socio suspendido' : 'Socio reactivado'),
        onError: () => toast.error('No se pudo actualizar'),
      },
    );
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Socios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Socios inscritos en el club. Entran activos al inscribirse; aquí puedes suspenderlos o
          eliminarlos.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, apellido o correo"
            aria-label="Buscar socios por nombre, apellido o correo"
            className="pl-9"
          />
        </div>
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value as ArcheryExperience | '')}
          aria-label="Filtrar por experiencia"
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64"
        >
          <option value="">Toda la experiencia</option>
          {EXPERIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

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
          {filtering ? 'Ningún socio coincide con la búsqueda.' : 'Todavía no hay socios.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th scope="col" className="table-th hidden w-16 sm:table-cell">Nº</th>
                <th scope="col" className="table-th">Socio</th>
                <th scope="col" className="table-th hidden md:table-cell">Experiencia</th>
                <th scope="col" className="table-th hidden lg:table-cell">Categorías</th>
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
                    {member.experience && (
                      <div className="mt-1 text-xs text-muted-foreground md:hidden">
                        {EXPERIENCE_LABEL[member.experience]}
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 lg:hidden">
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
                  <td className="table-td hidden text-xs text-muted-foreground md:table-cell">
                    {member.experience ? EXPERIENCE_LABEL[member.experience] : '—'}
                  </td>
                  <td className={cn('hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell')}>
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
                          onClick={() => changeStatus(member, 'SUSPENDED')}
                        >
                          Suspender
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeStatus(member, 'ACTIVE')}
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
