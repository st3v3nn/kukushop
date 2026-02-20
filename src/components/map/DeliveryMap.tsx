import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${emoji}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const restaurantIcon = createCustomIcon('hsl(4, 85%, 50%)', '🍗');
const customerIcon = createCustomIcon('hsl(142, 76%, 36%)', '📍');
const riderIcon = createCustomIcon('hsl(45, 100%, 51%)', '🛵');

interface Location {
  lat: number;
  lng: number;
  label?: string;
}

interface DeliveryMapProps {
  restaurantLocation?: Location;
  customerLocation?: Location;
  riderLocation?: Location;
  showRoute?: boolean;
  className?: string;
  zoom?: number;
  interactive?: boolean;
}

// Component to fit bounds to all markers
const FitBounds = ({ locations }: { locations: Location[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
};

// Nairobi default center
const NAIROBI_CENTER: Location = { lat: -1.2921, lng: 36.8219 };

export const DeliveryMap = ({
  restaurantLocation = { lat: -1.2864, lng: 36.8172, label: 'Kuku ni Sisi Restaurant' },
  customerLocation,
  riderLocation,
  showRoute = true,
  className,
  zoom = 14,
  interactive = true,
}: DeliveryMapProps) => {
  const center = riderLocation || restaurantLocation || NAIROBI_CENTER;

  const allLocations = [
    restaurantLocation,
    customerLocation,
    riderLocation,
  ].filter(Boolean) as Location[];

  // Generate a simple route line (in reality, you'd use a routing API)
  const routePoints = showRoute && customerLocation && restaurantLocation
    ? [
      [restaurantLocation.lat, restaurantLocation.lng],
      ...(riderLocation
        ? [[riderLocation.lat, riderLocation.lng]]
        : []),
      [customerLocation.lat, customerLocation.lng],
    ] as [number, number][]
    : [];

  return (
    <div className={cn("h-48 w-full rounded-xl overflow-hidden", className)}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allLocations.length > 1 && <FitBounds locations={allLocations} />}

        {/* Restaurant Marker */}
        {restaurantLocation && (
          <Marker
            position={[restaurantLocation.lat, restaurantLocation.lng]}
            icon={restaurantIcon}
          >
            <Popup>{restaurantLocation.label || 'Restaurant'}</Popup>
          </Marker>
        )}

        {/* Customer Marker */}
        {customerLocation && (
          <Marker
            position={[customerLocation.lat, customerLocation.lng]}
            icon={customerIcon}
          >
            <Popup>{customerLocation.label || 'Delivery Location'}</Popup>
          </Marker>
        )}

        {/* Rider Marker */}
        {riderLocation && (
          <Marker
            position={[riderLocation.lat, riderLocation.lng]}
            icon={riderIcon}
          >
            <Popup>{riderLocation.label || 'Rider'}</Popup>
          </Marker>
        )}

        {/* Route Line */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color="hsl(4, 85%, 50%)"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
};

// Static map placeholder for non-interactive use
export const StaticMapPlaceholder = ({
  className,
  message = "Live tracking available"
}: {
  className?: string;
  message?: string;
}) => (
  <div className={cn(
    "h-48 w-full rounded-xl bg-muted flex items-center justify-center relative overflow-hidden",
    className
  )}>
    <div className="absolute inset-0 opacity-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
    </div>
    <div className="text-center z-10">
      <div className="text-4xl mb-2">🗺️</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);
