import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Clock,
  ShoppingBag,
  SlidersHorizontal,
  X,
  Footprints
} from 'lucide-react';

// Custom Map center changer on pin selection
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

const FALLBACK_POSITION = { lat: 40.9835, lng: 29.0275 }; // Moda, Kadıköy

export const MapView = () => {
  const {
    listings,
    setSelectedListing,
    maxDistance,
    setMaxDistance,
    userPosition: realPosition,
    geoStatus,
    requestLocation,
  } = useApp();
  // Hold the id, not the object: listings are re-anchored when the location fix lands, and
  // a captured copy would keep the pre-fix coordinates and fly the map to the wrong city.
  const [selectedPinId, setSelectedPinId] = useState(listings[0]?.id || null);
  const selectedPin = listings.find(l => l.id === selectedPinId) || listings[0] || null;
  const setSelectedPin = (item) => setSelectedPinId(item?.id || null);
  const [filterType, setFilterType] = useState('all');

  // Ask once when the map opens: someone who navigated to a map expects it to locate
  // them, and a prompt fired anywhere else in the app would be unexplained.
  useEffect(() => {
    if (geoStatus === 'idle') requestLocation();
  }, [geoStatus, requestLocation]);

  const position = realPosition || FALLBACK_POSITION;
  const userPosition = [position.lat, position.lng];

  const filteredMapListings = listings.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    return item.distanceKm <= maxDistance;
  });

  // Calculate estimated walking time: 1 km ~ 12 min
  const walkingMinutes = selectedPin ? Math.max(2, Math.round(selectedPin.distanceKm * 12)) : 0;

  // Custom User Location Pin Icon
  const geoLabel = realPosition ? 'Konumunuz' : 'Varsayılan';
  const userIcon = L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="width:24px;height:24px;border-radius:50%;background:#0F5238;color:white;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);">
          📍
        </div>
        <span style="background:white;color:#0F5238;font-size:8px;font-weight:900;padding:1px 4px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2);margin-top:2px;white-space:nowrap;">${geoLabel}</span>
      </div>
    `,
    iconSize: [30, 36],
    iconAnchor: [15, 36],
  });

  // Store Pin Icon generator
  const createStoreIcon = (item, isSelected) => {
    const isFree = item.type === 'free';
    const bg = isSelected ? '#0F5238' : isFree ? '#10B981' : '#ffffff';
    const text = isSelected ? '#ffffff' : isFree ? '#ffffff' : '#0F5238';
    const label = isFree ? '🌱 Ücretsiz' : `${item.priceDiscounted}₺`;

    return L.divIcon({
      className: 'custom-store-icon',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:${isSelected ? 'scale(1.2)' : 'scale(1)'};transition:transform 0.2s;">
          <div style="background:${bg};color:${text};font-size:10px;font-weight:900;padding:3px 6px;border-radius:12px;border:2px solid ${isSelected ? '#95D5B2' : '#52B788'};box-shadow:0 4px 12px rgba(0,0,0,0.25);white-space:nowrap;">
            ${label}
          </div>
          <div style="width:6px;height:6px;background:${bg};transform:rotate(45deg);margin-top:-3px;border-right:2px solid ${isSelected ? '#95D5B2' : '#52B788'};border-bottom:2px solid ${isSelected ? '#95D5B2' : '#52B788'};"></div>
        </div>
      `,
      iconSize: [50, 30],
      iconAnchor: [25, 30],
    });
  };

  return (
    <div className="relative h-[650px] w-full rounded-2xl overflow-hidden shadow-lg border border-[#2D6A4F]/20 flex flex-col bg-[#E8FFF0]">
      
      {/* Top Floating Controls */}
      <div className="absolute top-2.5 left-2.5 z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 space-y-1">
        <div className="flex items-center gap-1 text-[9px] font-bold text-[#0F5238] dark:text-[#92F7C3]">
          <SlidersHorizontal className="w-2.5 h-2.5 text-[#52B788]" />
          <span>Mesafe: {maxDistance} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="15"
          value={maxDistance}
          onChange={(e) => setMaxDistance(Number(e.target.value))}
          className="w-24 accent-[#2D6A4F] cursor-pointer h-1"
        />
      </div>

      <div className="absolute top-2.5 right-2.5 z-[1000] flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
        {[
          { id: 'all', label: 'Tümü' },
          { id: 'free', label: 'Ücretsiz' },
          { id: 'discounted', label: 'İndirimli' },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold transition ${
              filterType === type.id
                ? 'bg-[#2D6A4F] text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Interactive Leaflet Map Stage */}
      <div className="relative flex-1 w-full h-full z-10">
        <MapContainer
          center={userPosition}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapRecenter center={selectedPin ? [selectedPin.lat, selectedPin.lng] : userPosition} />

          {/* User Marker */}
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              <div className="text-xs font-bold text-[#0F5238]">
                {realPosition ? '📍 Sizin Konumunuz' : '📍 Varsayılan Konum (Kadıköy Moda)'}
              </div>
            </Popup>
          </Marker>

          {/* Store Markers */}
          {filteredMapListings.map((item) => {
            const isSelected = selectedPin?.id === item.id;
            return (
              <Marker
                key={item.id}
                position={[item.lat, item.lng]}
                icon={createStoreIcon(item, isSelected)}
                eventHandlers={{
                  click: () => setSelectedPin(item),
                }}
              />
            );
          })}

          {/* Walking Route Polyline from User to Selected Store */}
          {selectedPin && (
            <Polyline
              positions={[
                userPosition,
                [selectedPin.lat, selectedPin.lng]
              ]}
              pathOptions={{
                color: '#0F5238',
                weight: 4,
                dashArray: '6, 8',
                opacity: 0.8
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Selected Store Bottom Drawer with Walking Estimate */}
      {selectedPin && (
        <div className="bg-white dark:bg-gray-900 p-3 border-t border-gray-100 dark:border-gray-800 z-[1000] animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={selectedPin.image}
                alt={selectedPin.title}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#D1FEE5] dark:bg-[#0F5238] text-[#006C48] dark:text-[#95D5B2]">
                    {selectedPin.category}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-[#52B788]" />
                    {selectedPin.distanceKm}km
                  </span>
                  <span className="text-[9px] text-[#0F5238] dark:text-[#95D5B2] font-bold flex items-center gap-0.5 bg-[#F0FFF4] dark:bg-gray-800 px-1 py-0.2 rounded">
                    <Footprints className="w-2.5 h-2.5 text-[#52B788]" />
                    ~{walkingMinutes} dk yürüme
                  </span>
                </div>
                <h3 className="text-[11px] font-bold text-[#0F5238] dark:text-gray-100 truncate mt-0.5">
                  {selectedPin.title}
                </h3>
                <div className="flex items-center gap-1 text-[9px] text-[#006C48] dark:text-gray-400">
                  <Clock className="w-2.5 h-2.5 text-[#2D6A4F]" />
                  <span>{selectedPin.pickupStartTime}–{selectedPin.pickupEndTime} • {selectedPin.portionsAvailable} paket kaldı</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPin(null)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black text-[#0F5238] dark:text-[#92F7C3]">
                {selectedPin.priceDiscounted === 0 ? 'ÜCRETSİZ' : `${selectedPin.priceDiscounted} ₺`}
              </span>
              {selectedPin.priceOriginal > 0 && (
                <span className="text-[9px] text-gray-400 line-through ml-1">
                  {selectedPin.priceOriginal} ₺
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedListing(selectedPin)}
              className="flex items-center gap-1 py-1.5 px-3 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-[10px] rounded-xl shadow transition"
            >
              <ShoppingBag className="w-3 h-3 text-[#95D5B2]" />
              <span>Kurtar</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
