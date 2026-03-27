"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SCHOOLS: { name: string; lat: number; lng: number }[] = [
  { name: "신정중학교", lat: 35.5467, lng: 129.3056 },
  { name: "신일중학교", lat: 35.5580, lng: 129.3218 },
  { name: "학성중학교", lat: 35.5600, lng: 129.3340 },
  { name: "월평중학교", lat: 35.5389, lng: 129.3044 },
  { name: "동평중학교", lat: 35.5343, lng: 129.3218 },
  { name: "태화중학교", lat: 35.5530, lng: 129.3095 },
  { name: "울산강남중학교", lat: 35.5291, lng: 129.3331 },
  { name: "옥동중학교", lat: 35.5370, lng: 129.2936 },
  { name: "울산중앙중학교", lat: 35.5477, lng: 129.3222 },
  { name: "문수중학교", lat: 35.5243, lng: 129.3433 },
  { name: "울산서여자중학교", lat: 35.5404, lng: 129.3096 },
  { name: "야음중학교", lat: 35.5243, lng: 129.3165 },
  { name: "옥현중학교", lat: 35.5360, lng: 129.2997 },
  { name: "삼호중학교", lat: 35.5196, lng: 129.3169 },
  { name: "대현중학교", lat: 35.5201, lng: 129.3370 },
  { name: "무거중학교", lat: 35.5245, lng: 129.3038 },
];

function createSchoolIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:12px;height:12px;
      background:#6366f1;
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 0 8px rgba(99,102,241,0.6);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export default function SchoolMap({ className }: { className?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [35.538, 129.316],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const icon = createSchoolIcon();

    SCHOOLS.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], { icon }).addTo(map);
      marker.bindTooltip(s.name.replace("중학교", "중"), {
        permanent: false,
        direction: "top",
        className: "school-tooltip",
        offset: [0, -8],
      });
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .school-tooltip {
          background: rgba(30,41,59,0.95) !important;
          color: #e2e8f0 !important;
          border: 1px solid rgba(99,102,241,0.3) !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .school-tooltip::before {
          border-top-color: rgba(30,41,59,0.95) !important;
        }
      `}</style>
      <div ref={mapRef} className={`rounded-2xl overflow-hidden ${className || ""}`} style={{ minHeight: 350 }} />
    </>
  );
}
