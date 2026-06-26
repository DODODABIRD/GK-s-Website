/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Village, DistributionCenter } from "../types";
import { Map, Pin, Warehouse, Navigation, AlertCircle, TrendingUp, Info, Globe, Plus, Check, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface InteractiveMapProps {
  villages: Village[];
  dcs: DistributionCenter[];
  selectedVillageId: string | null;
  selectedDcId: string | null;
  onSelectVillage: (id: string) => void;
  onSelectDc: (id: string) => void;
  onTriggerPreset: (presetName: string) => void;
  activePreset: string;
  onAddCustomVillage: (newVillage: Omit<Village, "priceHistory15Days" | "posDailyDemandKg" | "dcInventoryReservedKg">) => void;
}

export default function InteractiveMap({
  villages,
  dcs,
  selectedVillageId,
  selectedDcId,
  onSelectVillage,
  onSelectDc,
  onTriggerPreset,
  activePreset,
  onAddCustomVillage
}: InteractiveMapProps) {
  const [mapMode, setMapMode] = useState<"LOMBOK" | "NATIONAL">("NATIONAL");
  const [mapEngine, setMapEngine] = useState<"VECTOR" | "LEAFLET">("LEAFLET");
  const [hoveredNode, setHoveredNode] = useState<{ id: string; name: string; type: "VILLAGE" | "DC" } | null>(null);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  // Stateful Pan and Zoom for Custom Satellite Image Engine
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset pan and zoom on mode change
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [mapMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('form')) {
      return;
    }
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Active selected coordinates for panning map
  const activeSelectedCoord = (() => {
    if (selectedVillageId) {
      const v = villages.find(vil => vil.id === selectedVillageId);
      if (v) return v.coordinates;
    }
    if (selectedDcId) {
      const d = dcs.find(dc => dc.id === selectedDcId);
      if (d) return d.coordinates;
    }
    return null;
  })();
  
  // Custom dialog state for building a Pin natively
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newRegion, setNewRegion] = useState<string>("");
  const [newLat, setNewLat] = useState<number>(-8.45);
  const [newLng, setNewLng] = useState<number>(116.20);
  const [newPop, setNewPop] = useState<number>(10000);
  const [newProd, setNewProd] = useState<number>(4000);
  const [newPrice, setNewPrice] = useState<number>(12800);
  const [isNew3T, setIsNew3T] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  // Lombok approx bounding box
  const lombokMinLat = -9.05;
  const lombokMaxLat = -8.2;
  const lombokMinLng = 115.85;
  const lombokMaxLng = 116.7;

  // National Indonesia approx bounding box
  const nationalMinLat = -11.0;
  const nationalMaxLat = 6.0;
  const nationalMinLng = 95.0;
  const nationalMaxLng = 141.0;

  const convertCoordinates = (lat: number, lng: number) => {
    const width = 750;
    const height = 450;

    let x = 0;
    let y = 0;

    if (mapMode === "LOMBOK") {
      // Crop coordinate if out of bounds to keep simple
      const boundedLng = Math.max(lombokMinLng, Math.min(lombokMaxLng, lng));
      const boundedLat = Math.max(lombokMinLat, Math.min(lombokMaxLat, lat));
      x = ((boundedLng - lombokMinLng) / (lombokMaxLng - lombokMinLng)) * width;
      y = ((lombokMaxLat - boundedLat) / (lombokMaxLat - lombokMinLat)) * height;
    } else {
      // National map mode
      const boundedLng = Math.max(nationalMinLng, Math.min(nationalMaxLng, lng));
      const boundedLat = Math.max(nationalMinLat, Math.min(nationalMaxLat, lat));
      x = ((boundedLng - nationalMinLng) / (nationalMaxLng - nationalMinLng)) * width;
      y = ((nationalMaxLat - boundedLat) / (nationalMaxLat - nationalMinLat)) * height;
    }

    return { x, y };
  };

  const getVillageStatus = (v: Village) => {
    const expectedDemand = v.population * v.consumptionPerCapitaKgPerDay;
    const index = ((v.aggregateProductionKgPerDay - expectedDemand) / expectedDemand) * 100;
    
    // Calculate price coefficient of variation for volatility
    const len = v.priceHistory15Days ? v.priceHistory15Days.length : 0;
    let volatility = 0;
    if (len > 1) {
      const avg = v.priceHistory15Days.reduce((a, b) => a + b, 0) / len;
      const squaredDiffs = v.priceHistory15Days.map(val => Math.pow(val - avg, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / len;
      volatility = Math.sqrt(variance) / avg;
    } else {
      volatility = 0.04; // safe default for custom added nodes
    }

    if (index < -20) return { alert: "DEFICIT", label: "Defisit Kritis", hex: "#EF4444", bgClass: "bg-rose-50 border-rose-200" };
    if (volatility > 0.08) return { alert: "VOLATILE", label: "Volatilitas Tinggi", hex: "#F59E0B", bgClass: "bg-amber-50 border-amber-200" };
    return { alert: "SURPLUS", label: "Cadangan Optimal", hex: "#10B981", bgClass: "bg-emerald-50 border-emerald-200" };
  };

  const currentFocusVillages = villages.filter(v => {
    if (mapMode === "LOMBOK") {
      // Only show regional Lombok ones
      return v.coordinates.lng >= 115.0 && v.coordinates.lng <= 117.5 && v.coordinates.lat <= -8.0;
    }
    return true; // Show all on national map
  });

  const currentFocusDcs = dcs.filter(d => {
    if (mapMode === "LOMBOK") {
      return d.coordinates.lng >= 115.0 && d.coordinates.lng <= 117.5 && d.coordinates.lat <= -8.0;
    }
    return true;
  });

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    // Enable simple click-to-place coords in spawning mode
    if (!showAddForm) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = 750;
    const height = 450;

    // Convert SVG point back to Approximate Lat / Lng
    let computedLng = 0;
    let computedLat = 0;

    if (mapMode === "LOMBOK") {
      computedLng = lombokMinLng + (clickX / width) * (lombokMaxLng - lombokMinLng);
      computedLat = lombokMaxLat - (clickY / height) * (lombokMaxLat - lombokMinLat);
    } else {
      computedLng = nationalMinLng + (clickX / width) * (nationalMaxLng - nationalMinLng);
      computedLat = nationalMaxLat - (clickY / height) * (nationalMaxLat - nationalMinLat);
    }

    setNewLng(Number(computedLng.toFixed(4)));
    setNewLat(Number(computedLat.toFixed(4)));
  };
  
  // 1. Initialize Leaflet map instance
  useEffect(() => {
    if (mapEngine !== "LEAFLET" || !mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const initialCenter: [number, number] = mapMode === "LOMBOK" ? [-8.45, 116.3] : [-2.5, 115.0];
    const initialZoom = mapMode === "LOMBOK" ? 10 : 5;

    const instance = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
    });

    // Elegant, fast, and completely free CartoDB Voyager raster tiles (rendered on OpenStreetMap database)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(instance);

    mapRef.current = instance;

    instance.on("click", (e) => {
      if (showAddForm) {
        setNewLng(Number(e.latlng.lng.toFixed(4)));
        setNewLat(Number(e.latlng.lat.toFixed(4)));
      }
    });

    // Sync any pre-selected coord immediately on mount
    if (activeSelectedCoord) {
      instance.panTo([activeSelectedCoord.lat, activeSelectedCoord.lng]);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapEngine, mapMode]);

  // 2. Clear & Redraw leaflet markers / polylines on state change
  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) return;

    // Remove existing
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];

    // Draw Routing Polylines
    currentFocusDcs.forEach((dc) => {
      dc.assignedVillages.forEach((villageId) => {
        const village = villages.find(v => v.id === villageId);
        if (!village) return;

        const isVilCurrent = selectedVillageId === village.id;
        const isDcCurrent = selectedDcId === dc.id;
        const statusMeta = getVillageStatus(village);

        const isHighlighted = isVilCurrent || isDcCurrent;
        const color = isHighlighted ? statusMeta.hex : "#64748B";
        const weight = isHighlighted ? 4.5 : 2;
        const opacity = isHighlighted ? 0.95 : 0.45;

        // Custom path line
        const polyline = L.polyline(
          [
            [dc.coordinates.lat, dc.coordinates.lng],
            [village.coordinates.lat, village.coordinates.lng]
          ],
          {
            color,
            weight,
            opacity,
            dashArray: village.is3T ? "6, 6" : undefined,
          }
        ).addTo(mapInstance);

        polylinesRef.current.push(polyline);
      });
    });

    // Draw DCs (Gudang BULOG/Depot)
    currentFocusDcs.forEach((dc) => {
      const isSelected = selectedDcId === dc.id;
      
      const dcHtml = `
        <div class="relative flex flex-col items-center select-none group" style="transform: translate(-35px, -30px); width: 70px; height: 60px; z-index: ${isSelected ? 1000 : 400};">
          <div class="w-7 h-7 rotate-45 bg-slate-900 border-2 flex items-center justify-center shadow-md rounded-md mx-auto transition-all ${
            isSelected ? "border-amber-400 scale-125 shadow-amber-500/30" : "border-slate-300 group-hover:scale-110 group-hover:border-amber-300"
          }">
            <span class="text-amber-400 font-mono text-[10px] font-black pointer-events-none" style="transform: rotate(-45deg); display: inline-block;">W</span>
          </div>
          <div class="bg-slate-950/90 backdrop-blur-sm border border-slate-800 text-amber-400 px-2 py-0.5 rounded-md text-[9px] font-black mt-2 shadow-lg tracking-tight text-center leading-tight max-w-[90px] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 lg:opacity-0 group-hover:opacity-100'}">
             ${dc.name.replace(" Warehouse", "").replace(" SCM Food", "").replace(" Depot", "")}
          </div>
        </div>
      `;

      const dcIcon = L.divIcon({
        className: "custom-leaflet-marker-dc",
        html: dcHtml,
        iconSize: [2, 2],
        iconAnchor: [1, 1],
      });

      const marker = L.marker([dc.coordinates.lat, dc.coordinates.lng], { icon: dcIcon })
        .addTo(mapInstance)
        .on("click", () => {
          onSelectDc(dc.id);
        })
        .on("mouseover", () => {
          setHoveredNode({ id: dc.id, name: dc.name, type: "DC" });
        })
        .on("mouseout", () => {
          setHoveredNode(null);
        });

      markersRef.current.push(marker);
    });

    // Draw Villages (Outposts)
    currentFocusVillages.forEach((v) => {
      const isSelected = selectedVillageId === v.id;
      const statusMeta = getVillageStatus(v);
      const expectedDemand = v.population * v.consumptionPerCapitaKgPerDay;
      const indexPercent = ((v.aggregateProductionKgPerDay - expectedDemand) / expectedDemand) * 100;
      const is3TOrDeficit = v.is3T || indexPercent < -20;

      const vilHtml = `
        <div class="relative flex flex-col items-center select-none group" style="transform: translate(-35px, -35px); width: 70px; height: 70px; z-index: ${isSelected ? 1000 : 500};">
          ${is3TOrDeficit ? '<span class="absolute top-[25px] left-1/2 -ml-2.5 w-5 h-5 bg-rose-500 rounded-full animate-ping opacity-45 pointer-events-none"></span>' : ''}
          <div
            class="w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-md mx-auto transition-all ${
              isSelected ? "border-[3px] border-slate-950 scale-125" : "border-white group-hover:scale-110 group-hover:border-slate-800"
            }"
            style="background-color: ${statusMeta.hex};"
          >
            ${v.is3T ? '<span class="text-[7px] text-white font-black leading-none uppercase">3T</span>' : ''}
          </div>
          <div class="bg-slate-950/90 backdrop-blur-sm border border-slate-800 text-white px-2 py-0.5 rounded-md text-[9px] font-bold mt-1.5 shadow-lg max-w-[85px] text-center leading-tight transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 lg:opacity-0 group-hover:opacity-100'}">
            ${v.name.replace(" Village", "").replace(" Outpost", "")}
          </div>
        </div>
      `;

      const vilIcon = L.divIcon({
        className: "custom-leaflet-marker-village",
        html: vilHtml,
        iconSize: [2, 2],
        iconAnchor: [1, 1],
      });

      const marker = L.marker([v.coordinates.lat, v.coordinates.lng], { icon: vilIcon })
        .addTo(mapInstance)
        .on("click", () => {
          onSelectVillage(v.id);
        })
        .on("mouseover", () => {
          setHoveredNode({ id: v.id, name: v.name, type: "VILLAGE" });
        })
        .on("mouseout", () => {
          setHoveredNode(null);
        });

      markersRef.current.push(marker);
    });

    // Spawn Coordinate Feedback in Leaflet Map
    if (showAddForm) {
      const spawnHtml = `
        <div class="relative flex flex-col items-center select-none" style="transform: translate(-40px, -45px); width: 80px; height: 80px;">
          <span class="absolute top-[32px] left-1/2 -ml-3 w-6 h-6 bg-rose-500 rounded-full animate-ping opacity-35 pointer-events-none"></span>
          <div class="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-lg mx-auto"></div>
          <div class="mt-1 bg-rose-955/95 text-white px-1 py-0.5 rounded text-[7px] font-black border border-rose-700 shadow whitespace-nowrap text-center">
            Spawn: ${newLat.toFixed(2)}, ${newLng.toFixed(2)}
          </div>
        </div>
      `;

      const spawnIcon = L.divIcon({
        className: "custom-leaflet-marker-spawn",
        html: spawnHtml,
        iconSize: [2, 2],
        iconAnchor: [1, 1],
      });

      const marker = L.marker([newLat, newLng], { icon: spawnIcon }).addTo(mapInstance);
      markersRef.current.push(marker);
    }
  }, [
    villages,
    dcs,
    selectedVillageId,
    selectedDcId,
    showAddForm,
    newLat,
    newLng,
    mapEngine,
    mapMode,
  ]);

  // 3. Keep map focused/centered on selection changes
  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !activeSelectedCoord) return;
    mapInstance.panTo([activeSelectedCoord.lat, activeSelectedCoord.lng]);
  }, [activeSelectedCoord]);

  const handleSubmitForm = (e: React.FormEvent) => {
     e.preventDefault();
     if (!newName.trim()) return;

     onAddCustomVillage({
       id: `v-custom-${Date.now()}`,
       name: `${newName} Node`,
       region: newRegion || (mapMode === "LOMBOK" ? "Lombok Custom Zone" : "National SCM Sector"),
       coordinates: { lat: newLat, lng: newLng },
       population: newPop,
       consumptionPerCapitaKgPerDay: 0.35,
       aggregateProductionKgPerDay: newProd,
       currentPricePerKgIdr: newPrice,
       is3T: isNew3T
     });

     setFormSuccess(true);
     setTimeout(() => {
       setFormSuccess(false);
       setShowAddForm(false);
       setNewName("");
       setNewRegion("");
     }, 1000);
  };

  return (
    <div id="interactive-map-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[640px]">
      
      {/* Header Panel */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500 text-slate-950 rounded-lg shadow-sm">
              <Map className="w-5 h-5 font-black" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Kliping Logistik Geospasial Digital Twin</h2>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-200">
                  PostGIS Live SRID:4326
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Aliran rute menunjukkan pengiriman pangan multi-moda Koperasi Merah Putih dari depot utama ke pos-pos lokal.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Actions Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Map Scope Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex shadow-inner">
            <button
              onClick={() => { setMapMode("NATIONAL"); onSelectVillage("v-sukabumi"); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mapMode === "NATIONAL"
                  ? "bg-white text-slate-900 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
              Pantauan Nasional (Jawa, Sumatra, Sulawesi)
            </button>
            <button
              onClick={() => { setMapMode("LOMBOK"); onSelectVillage("v-sembalun"); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mapMode === "LOMBOK"
                  ? "bg-white text-slate-900 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Map className="w-3.5 h-3.5 inline mr-1.5" />
              Regional Lombok (Gili, Sembalun)
            </button>
          </div>

          {/* Map Engine Selector */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex shadow-inner">
            <button
              onClick={() => setMapEngine("VECTOR")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mapEngine === "VECTOR"
                  ? "bg-white text-slate-900 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🗺️ Citra Satelit (Siluet)
            </button>
            <button
              type="button"
              onClick={() => setMapEngine("LEAFLET")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                mapEngine === "LEAFLET"
                  ? "bg-white text-slate-900 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🌐 OpenStreetMap Live
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="Free & Live" />
            </button>
          </div>

          {/* Add Spawner Pin Button */}
          <button
            onClick={() => {
              if (mapMode === "LOMBOK") {
                setNewLat(-8.45); setNewLng(116.20);
              } else {
                setNewLat(-3.0); setNewLng(115.0);
              }
              setShowAddForm(!showAddForm);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all border cursor-pointer ${
              showAddForm 
                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
                : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 hover:shadow"
            }`}
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 font-bold" />}
            {showAddForm ? "Batal Tambah" : "📍 Letakkan Pos Kustom Baru"}
          </button>

        </div>
      </div>

      {/* Map Body Canvas */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden flex items-center justify-center p-4">
        
        {/* Dynamic Abstract Map Background Silhouettes */}
        <div className="absolute inset-0 select-none opacity-40 pointer-events-none transition-all duration-500">
          <svg className="w-full h-full" viewBox="0 0 750 450" fill="none" xmlns="http://www.w3.org/2000/svg">
            {mapMode === "LOMBOK" ? (
              // Lombok coastlines & Mt Rinjani
              <g>
                <path
                  d="M70,162 C110,117 200,81 280,76 C370,72 430,90 480,72 C540,54 590,67 640,99 C690,126 710,162 730,202 C750,243 710,306 680,342 C640,387 580,378 540,397 C490,418 420,405 370,396 C320,387 260,414 210,400 C150,382 120,342 90,310 C60,279 50,234 55,202 Z"
                  fill="#E2E8F0"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {/* Mt Rinjani */}
                <circle cx="480" cy="162" r="76" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5" />
                <circle cx="480" cy="162" r="45" stroke="#94A3B8" strokeWidth="1" />
                <circle cx="480" cy="162" r="18" stroke="#64748B" strokeWidth="1" />
                <text x="445" y="165" fill="#64748B" className="font-sans text-[9px] font-bold tracking-wide uppercase">Mt. Rinjani Area</text>
                
                <text x="40" y="30" fill="#94A3B8" className="font-mono text-[9px] tracking-widest uppercase">Lombok Strait (Vulnerable Seaway)</text>
                <text x="560" y="420" fill="#94A3B8" className="font-mono text-[9px] tracking-widest uppercase">Indian Ocean</text>
              </g>
            ) : (
              // Simplified Indonesia National Archipelago Silhouette representation (Sumatra, Java, Kalimantan, Sulawesi, Lombok)
              <g>
                <rect width="100%" height="100%" fill="#F8FAFC" opacity="0.3" />
                
                {/* Sumatra */}
                <path d="M50,120 L150,180 L220,220 L180,250 L120,220 L60,170 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="110" y="185" fill="#64748B" className="font-mono text-[9px] font-semibold tracking-wider">SUMATRA</text>

                {/* Java */}
                <path d="M190,270 L340,300 L410,310 L410,320 L300,310 L190,290 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="260" y="325" fill="#64748B" className="font-mono text-[9px] font-semibold tracking-wider">JAVA</text>

                {/* Kalimantan (Borneo) */}
                <path d="M240,110 L340,100 L370,160 L350,210 L260,200 L230,150 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" opacity="0.7" />
                <text x="280" y="150" fill="#94A3B8" className="font-mono text-[9px] font-semibold tracking-wider">KALIMANTAN</text>

                {/* Sulawesi */}
                <path d="M410,130 L450,130 L430,170 L480,180 L440,210 L390,190 L400,160 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="415" y="180" fill="#64748B" className="font-mono text-[9px] font-semibold tracking-wider">SULAWESI</text>

                {/* Nusa Tenggara / Lombok Detail inset area */}
                <path d="M420,314 L440,316 L465,317 L520,320 L520,326 L465,324 L420,320 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                <text x="440" y="340" fill="#64748B" className="font-mono text-[9px] font-bold">LOMBOK/NTB</text>

                {/* Grid guidelines */}
                <line x1="0" y1="225" x2="750" y2="225" stroke="#E2E8F0" strokeDasharray="2 4" strokeWidth="1" />
                <text x="10" y="222" fill="#94A3B8" className="font-mono text-[8px] tracking-widest uppercase">Equator Line (0° Lat)</text>
              </g>
            )}
          </svg>
        </div>

        {/* Active Map Viewport */}
        <div id="map-viewport-wrapper" className="relative w-full aspect-[5/3] min-h-[350px] lg:min-h-[450px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
          {mapEngine === "LEAFLET" ? (
            <div className="w-full h-full relative z-10" id="osm-map-engine-container">
              {/* Leaflet Mount Node */}
              <div ref={mapContainerRef} className="w-full h-full" />
              
              {/* Interactive Banner confirming active free GIS OpenStreetMap stream */}
              <div className="absolute top-2 right-2 bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[8px] text-emerald-400 font-mono tracking-tight pointer-events-none z-[1000] border border-slate-800 shadow-sm animate-pulse">
                ● WEB-GIS ACTIVE (CRS:EPSG3857)
              </div>
            </div>
          ) : (
            <svg
              className={`absolute inset-0 w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onClick={handleMapClick}
            >
            <defs>
              <linearGradient id="deficitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FECDD3" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="surplusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <linearGradient id="volatileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <pattern id="dotPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#FFFFFF" opacity="0.12" />
              </pattern>
            </defs>

            {/* Scale and pan group container */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: "0 0" }}>

              {/* Satellite Background Image of Indonesia/Lombok */}
              <image
                href={
                  mapMode === "LOMBOK"
                    ? "https://upload.wikimedia.org/wikipedia/commons/4/4b/Lombok_landsat.jpg"
                    : "https://upload.wikimedia.org/wikipedia/commons/d/df/Indonesia_satellite_map.jpg"
                }
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                opacity="0.85"
              />

              {/* Grid Pattern overlay for tech SCM Spheroid feel */}
              <rect width="100%" height="100%" fill="url(#dotPattern)" pointerEvents="none" />

            {/* 1. Dynamic linkage connecting warehouses to local coordinates */}
            {currentFocusDcs.map((dc) => {
              const dcPos = convertCoordinates(dc.coordinates.lat, dc.coordinates.lng);
              
              return dc.assignedVillages.map((villageId) => {
                const village = villages.find(v => v.id === villageId);
                if (!village) return null;
                
                const vilPos = convertCoordinates(village.coordinates.lat, village.coordinates.lng);
                const isVilCurrent = selectedVillageId === village.id;
                const isDcCurrent = selectedDcId === dc.id;
                const statusMeta = getVillageStatus(village);

                return (
                  <g key={`${dc.id}-${village.id}`}>
                    {/* Glowing highlight trace */}
                    {(isVilCurrent || isDcCurrent) && (
                      <line
                        x1={dcPos.x}
                        y1={dcPos.y}
                        x2={vilPos.x}
                        y2={vilPos.y}
                        stroke={statusMeta.hex}
                        strokeWidth="7"
                        strokeOpacity="0.18"
                        className="animate-pulse"
                      />
                    )}

                    {/* Standard routing links */}
                    <line
                      x1={dcPos.x}
                      y1={dcPos.y}
                      x2={vilPos.x}
                      y2={vilPos.y}
                      stroke={isVilCurrent || isDcCurrent ? statusMeta.hex : "#64748B"}
                      strokeWidth={isVilCurrent ? "3" : "1.5"}
                      strokeDasharray={village.is3T ? "4 3" : "0"}
                      strokeOpacity={isVilCurrent || isDcCurrent ? "0.9" : "0.35"}
                      className="transition-all duration-300"
                    />

                    {/* Fast pulsing truck shipment along path */}
                    <circle r="4" fill={statusMeta.hex} stroke="#FFFFFF" strokeWidth="1">
                      <animateMotion
                        dur={village.is3T ? "4s" : "2s"}
                        repeatCount="indefinite"
                        path={`M ${dcPos.x} ${dcPos.y} L ${vilPos.x} ${vilPos.y}`}
                      />
                    </circle>
                  </g>
                );
              });
            })}

            {/* 2. Plot Villages */}
            {currentFocusVillages.map((v) => {
              const { x, y } = convertCoordinates(v.coordinates.lat, v.coordinates.lng);
              const isSelected = selectedVillageId === v.id;
              const statusMeta = getVillageStatus(v);
              const expectedDemand = v.population * v.consumptionPerCapitaKgPerDay;
              const indexPercent = ((v.aggregateProductionKgPerDay - expectedDemand) / expectedDemand) * 100;

              return (
                <g key={v.id} className="cursor-pointer group" onClick={() => onSelectVillage(v.id)}>
                  
                  {/* Glowing warning circle */}
                  {(v.is3T || indexPercent < -20) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "18" : "13"}
                      fill="none"
                      stroke={statusMeta.hex}
                      strokeWidth="1.5"
                      className="animate-ping"
                      style={{ transformOrigin: `${x}px ${y}px`, animationDuration: "3s" }}
                      opacity="0.4"
                    />
                  )}

                  {/* Village node anchor shape */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? "11" : "7"}
                    fill={
                      statusMeta.alert === "DEFICIT" 
                        ? "url(#deficitGrad)" 
                        : statusMeta.alert === "VOLATILE"
                        ? "url(#volatileGrad)"
                        : "url(#surplusGrad)"
                    }
                    stroke={isSelected ? "#0F172A" : "#FFFFFF"}
                    strokeWidth={isSelected ? "3" : "1"}
                    onMouseEnter={() => setHoveredNode({ id: v.id, name: v.name, type: "VILLAGE" })}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="transition-transform duration-200 group-hover:scale-125"
                  />

                  {v.is3T && (
                    <text
                      x={x + 10}
                      y={y + 3}
                      fill="#DC2626"
                      className="font-mono text-[8px] font-black tracking-tighter bg-white rounded"
                      style={{ pointerEvents: "none" }}
                    >
                      3T
                    </text>
                  )}

                  {/* Node title floats */}
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    className={`font-sans select-none pointer-events-none transition-opacity ${
                      isSelected 
                        ? "text-[10px] font-bold fill-slate-950 opacity-100" 
                        : "text-[9px] fill-slate-700 font-medium opacity-0 group-hover:opacity-100 lg:opacity-0"
                    }`}
                    style={{ paintOrder: "stroke fill", stroke: "#F8FAFC", strokeWidth: isSelected ? 3 : 2, strokeLinejoin: "round", strokeLinecap: "round" }}
                  >
                    {v.name.replace(" Village", "").replace(" Outpost", "")}
                  </text>
                </g>
              );
            })}

            {/* 3. Plot Safety Warehouses / DCs */}
            {currentFocusDcs.map((dc) => {
              const { x, y } = convertCoordinates(dc.coordinates.lat, dc.coordinates.lng);
              const isSelected = selectedDcId === dc.id;

              return (
                <g key={dc.id} className="cursor-pointer group" onClick={() => onSelectDc(dc.id)}>
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="20"
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{ transformOrigin: `${x}px ${y}px`, animationDuration: "12s" }}
                    />
                  )}

                  {/* Diamond Safety stock base block */}
                  <rect
                    x={x - 9}
                    y={y - 9}
                    width="18"
                    height="18"
                    rx="2"
                    transform={`rotate(45 ${x} ${y})`}
                    fill="#1E293B"
                    stroke={isSelected ? "#F59E0B" : "#FFFFFF"}
                    strokeWidth={isSelected ? "2.5" : "1"}
                    onMouseEnter={() => setHoveredNode({ id: dc.id, name: dc.name, type: "DC" })}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="transition-all duration-200 group-hover:fill-slate-800"
                  />

                  {/* Warehouse indicator text inside the square box */}
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    fill="#F59E0B"
                    className="font-mono text-[8px] select-none pointer-events-none font-bold"
                  >
                    W
                  </text>

                  {/* DC title tag */}
                  <text
                    x={x}
                    y={y - 14}
                    textAnchor="middle"
                    className={`font-sans select-none pointer-events-none transition-opacity ${
                      isSelected 
                        ? "text-[11px] font-black fill-slate-950 opacity-100" 
                        : "text-[9px] font-bold fill-slate-800 opacity-0 group-hover:opacity-100 lg:opacity-0"
                    }`}
                    style={{ paintOrder: "stroke fill", stroke: "#F8FAFC", strokeWidth: isSelected ? 4 : 2.5, strokeLinejoin: "round", strokeLinecap: "round" }}
                  >
                    {dc.name.replace(" Warehouse", "").replace(" SCM Food", "").replace(" Depot", "").replace(" Gate", "")}
                  </text>
                </g>
              );
            })}

            {/* If Adding a Pin, let user see coordinate crosshair directly under map coordinates */}
            {showAddForm && (
              <g pointerEvents="none">
                {(() => {
                  const crossDef = convertCoordinates(newLat, newLng);
                  return (
                    <>
                      <circle cx={crossDef.x} cy={crossDef.y} r="15" fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="2 2" className="animate-pulse" />
                      <line x1={crossDef.x - 20} y1={crossDef.y} x2={crossDef.x + 20} y2={crossDef.y} stroke="#EF4444" strokeWidth="1" />
                      <line x1={crossDef.x} y1={crossDef.y - 20} x2={crossDef.x} y2={crossDef.y + 20} stroke="#EF4444" strokeWidth="1" />
                      <text x={crossDef.x + 12} y={crossDef.y - 8} fill="#EF4444" className="font-mono text-[9px] font-bold bg-white px-1">Spawn Spot</text>
                    </>
                  );
                })()}
              </g>
            )}
            </g>
          </svg>
          )}

          {/* Map Overlay Toast Notification */}
          {showAddForm && (
            <div className="absolute top-3 left-3 bg-slate-900 text-white text-[11px] px-3 py-2 rounded-xl border border-slate-700 shadow-lg pointer-events-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span><strong>Placement Assist:</strong> Tap anywhere on the grid inside map boundary to lock coordinates.</span>
            </div>
          )}

          {/* Mouseover Node Card popup */}
          {hoveredNode && (
            <div className="absolute bottom-3 left-3 bg-slate-950/95 text-white p-4 rounded-xl border border-slate-800 max-w-[250px] pointer-events-none shadow-2xl transition-all leading-normal">
              <div className="flex items-center gap-1 text-[9px] text-emerald-400 uppercase font-mono font-bold tracking-wider">
                {hoveredNode.type === "VILLAGE" ? <Pin className="w-2.5 h-2.5" /> : <Warehouse className="w-2.5 h-2.5" />}
                {hoveredNode.type === "VILLAGE" ? "village endpoint" : "security depot hub"}
              </div>
              <div className="text-xs font-bold text-white mt-1 font-display">{hoveredNode.name}</div>
              
              {hoveredNode.type === "VILLAGE" ? (() => {
                const vil = villages.find(v => v.id === hoveredNode.id);
                if (!vil) return null;
                const status = getVillageStatus(vil);
                const popDemand = vil.population * vil.consumptionPerCapitaKgPerDay;
                const index = ((vil.aggregateProductionKgPerDay - popDemand) / popDemand) * 100;
                return (
                  <div className="mt-3 text-[11px] space-y-1.5 text-slate-300 border-t border-slate-800 pt-2">
                    <div className="flex justify-between"><span>Region:</span> <span className="text-white font-medium">{vil.region}</span></div>
                    <div className="flex justify-between"><span>Population:</span> <span className="text-white font-medium">{vil.population.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>SCM index:</span> <span className={`font-semibold ${index < -20 ? "text-rose-400" : "text-emerald-400"}`}>{index.toFixed(0)}%</span></div>
                    <div className="flex justify-between"><span>Rice Price:</span> <span className="text-amber-300 font-semibold">Rp{vil.currentPricePerKgIdr.toLocaleString()}/kg</span></div>
                    <div className="flex justify-between"><span>Coordinates:</span> <span className="text-slate-400 font-mono text-[9px]">{vil.coordinates.lat.toFixed(2)}°, {vil.coordinates.lng.toFixed(2)}°</span></div>
                  </div>
                );
              })() : (() => {
                const d = dcs.find(dc => dc.id === hoveredNode.id);
                if (!d) return null;
                const capPct = (d.riceInventoryKg / d.capacityKg) * 100;
                return (
                  <div className="mt-3 text-[11px] space-y-1.5 text-slate-300 border-t border-slate-800 pt-2">
                    <div className="flex justify-between"><span>Operator:</span> <span className="text-emerald-400 font-medium font-mono">{d.operator}</span></div>
                    <div className="flex justify-between"><span>Capacity:</span> <span className="text-white">{d.capacityKg / 1000} tons</span></div>
                    <div className="flex justify-between"><span>Stocks hold:</span> <span className="text-sky-300 font-semibold">{(d.riceInventoryKg / 1000).toFixed(1)} tons</span></div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div className="bg-emerald-400 h-full" style={{ width: `${capPct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Add Pin Custom Form Pop-out Window */}
          {showAddForm && (
            <div className="absolute right-3 top-3 bg-white border border-slate-200 hover:shadow-xl p-5 rounded-2xl w-[280px] text-xs space-y-4 shadow-lg overflow-y-auto max-h-[90%] z-20 transition-all text-slate-800 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 font-display text-sm">Letakkan Pos Baru</span>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-center gap-2 font-semibold">
                  <Check className="w-5 h-5 text-emerald-600 animate-bounce" />
                  <span>Pos Berhasil Ditambahkan!</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitForm} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nama Pos</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium"
                      placeholder="Contoh: Pos Bayan"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nama Wilayah</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 animate-none"
                      placeholder="Contoh: Lombok Utara"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Lintang (Lat)</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono"
                        value={newLat}
                        onChange={(e) => setNewLat(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Bujur (Lng)</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono"
                        value={newLng}
                        onChange={(e) => setNewLng(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Populasi</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                        value={newPop}
                        onChange={(e) => setNewPop(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Hasil Panen (kg)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                        value={newProd}
                        onChange={(e) => setNewProd(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Harga Beras (Rp)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="createIs3T"
                      className="w-4 h-4 text-emerald-600 border-slate-200 focus:ring-emerald-500 rounded cursor-pointer"
                      checked={isNew3T}
                      onChange={(e) => setIsNew3T(e.target.checked)}
                    />
                    <label htmlFor="createIs3T" className="font-semibold text-slate-700 cursor-pointer">Tandai sebagai zona rentan 3T</label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-sm cursor-pointer"
                  >
                    🚀 Daftarkan Pos Pangan
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Legend overlay */}
          <div className="absolute right-3 bottom-3 bg-white/95 backdrop-blur px-3 py-2.5 rounded-xl border border-slate-200 shadow-lg text-[10px] space-y-1 text-slate-600 pointer-events-none max-w-[200px]">
            <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1 mb-1.5 uppercase tracking-wider text-[8px]">LEGENDA LOGISTIK</span>
            
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
              <span>Buffer Cadangan Optimal</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
              <span>Volatilitas Harga Tinggi</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 border border-white animate-pulse" />
              <span>Defisit Rantai Pokok</span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <span className="w-3.5 h-3.5 bg-slate-800 text-amber-400 rounded flex items-center justify-center font-bold text-[7px] border border-white">W</span>
              <span>Gudang Cadangan KMP/BULOG</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-block w-4 border-t border-dashed border-slate-500" />
              <span>Rute Logistik Pos 3T (Rentan)</span>
            </div>
          </div>

          {/* Pan/Zoom controllers for vector satellite engine */}
          {mapEngine === "VECTOR" && (
            <>
              {/* Interactive Draggable Hint */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-full text-[10px] text-emerald-300 pointer-events-none flex items-center gap-1.5 border border-slate-800 shadow-xl z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold tracking-tight">Tekan & geser peta untuk rotasi/navigasi detil</span>
              </div>

              {/* Float Controls */}
              <div className="absolute left-3 bottom-3 flex flex-col gap-1.5 z-30">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(3.5, z + 0.25))}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold text-sm hover:bg-slate-800 shadow-lg cursor-pointer transition-transform active:scale-95"
                  title="Perbesar Peta"
                >
                  ＋
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.65, z - 0.25))}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold text-sm hover:bg-slate-800 shadow-lg cursor-pointer transition-transform active:scale-95"
                  title="Perkecil Peta"
                >
                  －
                </button>
                <button
                  type="button"
                  onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-amber-500 flex items-center justify-center text-[10px] hover:bg-slate-800 shadow-lg cursor-pointer transition-transform active:scale-95"
                  title="Reset Tampilan"
                >
                  🔄
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Footer statistics indicator */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2 text-slate-600">
          <Navigation className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationOrigin: "center", animationDuration: "5s" }} />
          <span>
            Menampilkan <strong className="text-slate-900">{currentFocusVillages.length} Pos Pembagian</strong> dan <strong className="text-slate-900">{currentFocusDcs.length} Depot Gudang Regional</strong> untuk wilayah {mapMode === "LOMBOK" ? "Provinsi Lombok" : "Rantai Pasok Republik Indonesia"}.
          </span>
        </div>
        <div className="text-slate-400 select-none hidden md:block uppercase tracking-widest font-mono text-[9px]">
          Matematika Spasial Aktif ST_DWithin
        </div>
      </div>

    </div>
  );
}


