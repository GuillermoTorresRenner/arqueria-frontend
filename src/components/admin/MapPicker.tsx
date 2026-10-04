import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/// Centro por defecto: Santiago
const DEFAULT_CENTER: [number, number] = [-33.45, -70.66];

export interface LatLng {
  latitude: number;
  longitude: number;
}

/// Pin propio con el color del sitio. El icono por defecto de Leaflet carga
/// imágenes por rutas relativas que el bundler no resuelve.
const pin = L.divIcon({
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 41],
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1z" fill="hsl(var(--primary))" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="15.5" r="5.5" fill="white"/>
  </svg>`,
});

/**
 * Mapa de OpenStreetMap para marcar un lugar: clic en el mapa o arrastrar el
 * pin. Cuando cambia `focus` (búsqueda, «mi ubicación»), el mapa vuela hasta
 * el punto; un clic en el mapa no lo mueve.
 */
export function MapPicker({
  value,
  focus,
  onPick,
  className,
}: {
  value: LatLng | null;
  /// Cambiarlo centra el mapa en `value`
  focus: number;
  /// Punto elegido por el usuario en el mapa
  onPick: (point: LatLng) => void;
  className?: string;
}) {
  const position = useMemo<[number, number] | null>(
    () => (value ? [value.latitude, value.longitude] : null),
    [value],
  );

  return (
    <MapContainer
      center={position ?? DEFAULT_CENTER}
      zoom={position ? 16 : 11}
      scrollWheelZoom
      className={className}
      // El mapa está dentro de un formulario: el teclado del mapa no debe
      // robar Enter ni las flechas a los campos
      keyboard={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onPick={onPick} />
      <FlyTo position={position} focus={focus} />
      {position && (
        <Marker
          position={position}
          icon={pin}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng();
              onPick({ latitude: lat, longitude: lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

function ClickHandler({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({
    click: (e) => onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
  });
  return null;
}

/// Centra el mapa en el punto cuando se pide (no en cada clic)
function FlyTo({ position, focus }: { position: [number, number] | null; focus: number }) {
  const map = useMap();
  useEffect(() => {
    if (focus && position) map.flyTo(position, 16, { duration: 0.8 });
    // Solo `focus` dispara el vuelo: la posición nueva llega con él
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focus]);

  // Dentro de un modal el contenedor puede medirse antes de tener tamaño
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}
