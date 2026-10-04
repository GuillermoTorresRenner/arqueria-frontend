import { lazy, Suspense, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LocateFixed, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  geocode,
  reverseGeocode,
  useCreatePlace,
  useDeletePlace,
  usePlaces,
  useUpdatePlace,
  type GeocodingResult,
  type PlaceInput,
} from '@/hooks/use-activities';
import { useConfirm } from '@/features/confirm-store';
import { apiErrorMessage } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Place } from '@/types';
import type { LatLng } from './MapPicker';

/// Leaflet pesa ~150 KB: se descarga solo al abrir el formulario de un lugar
const MapPicker = lazy(() => import('./MapPicker').then((m) => ({ default: m.MapPicker })));

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
    <Modal
      title={editing === 'new' ? 'Nuevo lugar' : editing ? 'Editar lugar' : 'Lugares'}
      onClose={onClose}
      className="max-w-2xl"
    >
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
  const [locating, setLocating] = useState(false);
  /// Cambia para que el mapa vuele al punto (búsqueda, mi ubicación)
  const [focus, setFocus] = useState(0);
  /// Dirección del punto marcado, cuando ya había otra escrita
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const lastPick = useRef(0);
  const addressRef = useRef(form.address);
  addressRef.current = form.address;
  const createPlace = useCreatePlace();
  const updatePlace = useUpdatePlace();
  const saving = createPlace.isPending || updatePlace.isPending;

  const set = (patch: Partial<PlaceInput>) => setForm((prev) => ({ ...prev, ...patch }));
  const point =
    form.latitude != null && form.longitude != null
      ? { latitude: form.latitude, longitude: form.longitude }
      : null;

  const search = async () => {
    const q = query.trim() || form.name.trim();
    if (!q) return;
    setSearching(true);
    try {
      setResults(await geocode(q));
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo buscar la dirección'));
    } finally {
      setSearching(false);
    }
  };

  const choose = (r: GeocodingResult) => {
    setForm((prev) => ({
      ...prev,
      latitude: r.latitude,
      longitude: r.longitude,
      // Solo completa lo que esté vacío: no pisa lo que escribió el admin
      name: prev.name.trim() ? prev.name : r.name,
      address: prev.address?.trim() ? prev.address : r.address,
    }));
    setSuggestion(null);
    setResults(null);
    setFocus((f) => f + 1);
  };

  /// Punto marcado en el mapa: se busca su dirección para proponerla
  const pick = async ({ latitude, longitude }: LatLng, fly = false) => {
    set({ latitude: round6(latitude), longitude: round6(longitude) });
    if (fly) setFocus((f) => f + 1);
    const id = ++lastPick.current;
    try {
      const found = await reverseGeocode(latitude, longitude);
      if (id !== lastPick.current || !found) return;
      // La dirección se lee al llegar la respuesta, no al hacer clic
      const current = addressRef.current?.trim();
      if (current) {
        setSuggestion(current === found.address ? null : found.address);
      } else {
        set({ address: found.address });
        setSuggestion(null);
      }
    } catch {
      // Sin dirección no pasa nada: el punto ya quedó marcado
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no permite obtener la ubicación');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void pick({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }, true);
      },
      () => {
        setLocating(false);
        toast.error('No pudimos obtener tu ubicación. Revisa los permisos del navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Ubicación</legend>
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
            placeholder="Busca una dirección, parque o recinto"
            aria-label="Buscar dirección, parque o recinto"
          />
          <Button type="button" variant="outline" onClick={search} disabled={searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Buscar</span>
          </Button>
        </div>

        {results && (
          <ul className="max-h-48 divide-y overflow-y-auto rounded-md border text-sm">
            {results.length === 0 && (
              <li className="p-2 text-muted-foreground">
                Sin resultados. Prueba con otra forma de escribirlo o marca el punto en el mapa.
              </li>
            )}
            {results.map((r) => (
              <li key={`${r.latitude},${r.longitude}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 p-2 text-left hover:bg-accent"
                  onClick={() => choose(r)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    <span className="font-medium">{r.name}</span>
                    {r.address && r.address !== r.name && (
                      <span className="block text-xs text-muted-foreground">{r.address}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="overflow-hidden rounded-md border">
          <Suspense fallback={<div className="h-72 skeleton rounded-none" />}>
            <MapPicker value={point} focus={focus} onPick={pick} className="h-72 w-full" />
          </Suspense>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {point
              ? 'Haz clic en el mapa o arrastra el pin para ajustar el punto.'
              : 'Busca la dirección o haz clic en el mapa para marcar el lugar.'}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={useMyLocation} disabled={locating}>
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
            )}
            Usar mi ubicación
          </Button>
        </div>
      </fieldset>

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
        {suggestion && (
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            Dirección del punto marcado: <span className="text-foreground">{suggestion}</span>
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                set({ address: suggestion });
                setSuggestion(null);
              }}
            >
              Usar esta
            </button>
          </p>
        )}
      </div>

      <details className="rounded-md border px-3 py-2 text-sm">
        <summary className="cursor-pointer select-none text-muted-foreground">
          Coordenadas {point ? `(${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)})` : '— sin marcar'}
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2 pb-1">
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
              onBlur={() => setFocus((f) => f + 1)}
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
              onBlur={() => setFocus((f) => f + 1)}
            />
          </div>
        </div>
        <p className="pb-1 text-xs text-muted-foreground">
          Sirven para el pronóstico del tiempo y el enlace al mapa.
        </p>
      </details>

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

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
