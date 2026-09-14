'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
export function FarmMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [longitude, latitude],
      zoom: 9,
    });
    new maplibregl.Marker({ color: '#27754e' })
      .setLngLat([longitude, latitude])
      .addTo(map);
    map.addControl(new maplibregl.NavigationControl());
    return () => map.remove();
  }, [latitude, longitude]);
  return <div ref={ref} className="farm-map" aria-label="Farm location map" />;
}
