import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  geocode,
  useCreatePlace,
  useDeletePlace,
  usePlaces,
  useUpdatePlace,
  type GeocodingResult,
  type PlaceInput,
} from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { mapUrl } from '@/lib/activities';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Place } from '@/types';

const EMPTY: PlaceInput = { name: '', address: '', latitude: null, longitude: null };

/**
 * Lugares guardados para elegirlos al agendar. Las coordenadas se buscan por
 * nombre (comuna o localidad) y sirven para el pronóstico del tiempo.
 */
export function PlacesDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  /// Al crear uno desde el formulario de actividad, queda elegido
  onCreated?: (place: Place) => void;
}) {
  const { data: places, isLoading } = usePlaces();
  const [editing, setEditing] = useState<Place | 'new' | null>(null);
  const updatePlace = useUpdatePlace();
  const deletePlace = useDeletePlace();
  const confirm = useConfirm();

  const toggleActive = (place: Place) =>
    updatePlace.mutate(
      { id: place.id, isActive: !place.isActive },
      {
        onSuccess: () => toast.success(place.isActive ? 'Lugar desactivado' : 'Lugar reactivado'),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo actualizar')),
      },
    );

  const remove = async (place: Place) => {
    const ok = await confirm({
      title: `¿Eliminar «${place.name}»?`,
      description: 'Dejará de aparecer en el desplegable de lugares.',
      confirmLabel: 'Eliminar lugar',
      tone: 'danger',
    });
    if (!ok) return;
    deletePlace.mutate(place.id, {
      onSuccess: () => toast.success('Lugar eliminado'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo eliminar'), { duration: 8000 }),
    });
  };

  return (
    <Modal title="Lugares" onClose={onClose} className="max-w-2xl">
      {editing ? (
        <PlaceForm
          place={editing === 'new' ? null : editing}
          onDone={(saved) => {
            if (editing === 'new' && saved) onCreated?.(saved);
            setEditing(null);
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Se eligen desde un desplegable al agendar una actividad.
            </p>
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo lugar
            </Button>
          </div>

          {isLoading ? (
            <div className="h-24 skeleton" />
          ) : !places?.length ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aún no hay lugares. Crea el primero para poder agendar actividades.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {places.map((place) => {
                const uses = place._count?.activities ?? 0;
                return (
                  <li key={place.id} className="flex flex-wrap items-center gap-3 p-3">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {place.name}
                        {!place.isActive && <Badge variant="outline">Inactivo</Badge>}
                        {place.latitude == null && (
                          <Badge variant="accent" title="Sin coordenadas no hay pronóstico">
                            Sin coordenadas
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {place.address || 'Sin dirección'} ·{' '}
                        {uses === 1 ? '1 actividad' : `${uses} actividades`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(place)}
                        aria-label={`Editar ${place.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(place)}>
                        {place.isActive ? 'Desactivar' : 'Reactivar'}
                      </Button>
                      {uses === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(place)}
                          aria-label={`Eliminar ${place.name}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

function PlaceForm({
  place,
  onDone,
}: {
  place: Place | null;
  onDone: (saved?: Place) => void;
}) {
  const [form, setForm] = useState<PlaceInput>(
    place
      ? {
          name: place.name,
          address: place.address ?? '',
          latitude: place.latitude,
          longitude: place.longitude,
        }
      : EMPTY,
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const createPlace = useCreatePlace();
  const updatePlace = useUpdatePlace();
  const saving = createPlace.isPending || updatePlace.isPending;

  const set = (patch: Partial<PlaceInput>) => setForm((prev) => ({ ...prev, ...patch }));

  const search = async () => {
    const q = query.trim() || form.name.trim();
    if (!q) return;
    setSearching(true);
    try {
      setResults(await geocode(q));
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo buscar la ubicación'));
    } finally {
      setSearching(false);
    }
  };

  const parseCoord = (value: string) => (value.trim() === '' ? null : Number(value));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: PlaceInput = {
      name: form.name.trim(),
      address: form.address?.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
    };
    const options = {
      onSuccess: (saved: Place) => {
        toast.success(place ? 'Lugar actualizado' : 'Lugar creado');
        onDone(saved);
      },
      onError: (err: unknown) => toast.error(apiErrorMessage(err, 'No se pudo guardar')),
    };
    if (place) updatePlace.mutate({ id: place.id, ...body }, options);
    else createPlace.mutate(body, options);
  };

  const hasCoords = form.latitude != null && form.longitude != null;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="place-name">Nombre</Label>
        <Input
          id="place-name"
          required
          minLength={2}
          maxLength={80}
          value={form.name}
          placeholder="Parque Mahuida"
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="place-address">Dirección o indicaciones (opcional)</Label>
        <Input
          id="place-address"
          maxLength={200}
          value={form.address ?? ''}
          placeholder="Av. Larraín 9750, La Reina"
          onChange={(e) => set({ address: e.target.value })}
        />
      </div>

      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Ubicación para el pronóstico</legend>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void search();
              }
            }}
            placeholder="Busca la comuna o localidad"
            aria-label="Buscar comuna o localidad"
          />
          <Button type="button" variant="outline" onClick={search} disabled={searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            Buscar
          </Button>
        </div>

        {results && (
          <ul className="max-h-48 divide-y overflow-y-auto rounded-md border text-sm">
            {results.length === 0 && (
              <li className="p-2 text-muted-foreground">Sin resultados. Prueba con la comuna.</li>
            )}
            {results.map((r) => (
              <li key={`${r.latitude},${r.longitude}`}>
                <button
                  type="button"
                  className="w-full p-2 text-left hover:bg-accent"
                  onClick={() => {
                    set({ latitude: r.latitude, longitude: r.longitude });
                    setResults(null);
                  }}
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground"> · {r.region ?? r.country}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="place-lat" className="text-xs">
              Latitud
            </Label>
            <Input
              id="place-lat"
              type="number"
              step="any"
              min={-90}
              max={90}
              value={form.latitude ?? ''}
              onChange={(e) => set({ latitude: parseCoord(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="place-lon" className="text-xs">
              Longitud
            </Label>
            <Input
              id="place-lon"
              type="number"
              step="any"
              min={-180}
              max={180}
              value={form.longitude ?? ''}
              onChange={(e) => set({ longitude: parseCoord(e.target.value) })}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {hasCoords ? (
            <a
              href={mapUrl({ name: form.name, address: null, latitude: form.latitude, longitude: form.longitude })}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Comprobar en el mapa
            </a>
          ) : (
            'Sin coordenadas no se mostrará el pronóstico del tiempo.'
          )}
        </p>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onDone()}>
          Volver
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : place ? 'Guardar cambios' : 'Crear lugar'}
        </Button>
      </div>
    </form>
  );
}
