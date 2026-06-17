/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Village,
  DistributionCenter,
  PresetType,
  ControlTowerMetrics,
} from "./types";
import { INITIAL_VILLAGES, INITIAL_DCS } from "./data";
import InteractiveMap from "./components/InteractiveMap";
import BlueprintViewer from "./components/BlueprintViewer";
import ScmCharts from "./components/ScmCharts";
import SignIn from "./components/SignIn";
import CooperativeGovernance from "./components/CooperativeGovernance";
import QrInventoryScanner from "./components/QrInventoryScanner";
import {
  LayoutDashboard,
  Database,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  Leaf,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  Warehouse,
  MapPin,
  HelpCircle,
  Building2,
  Info,
  Truck,
  RotateCw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRightLeft,
  XSquare,
  Sparkles,
  PlusCircle,
  ListFilter,
  LogOut,
} from "lucide-react";

interface TransitLog {
  id: string;
  commodity: string;
  driver: string;
  origin: string;
  destination: string;
  status: "In Transit" | "Critical" | "Loading" | "Dispatched" | "Completed";
  weight: number; // tons
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      typeof window !== "undefined" &&
      localStorage.getItem("kmp_authenticated") === "true"
    );
  });
  const [villages, setVillages] = useState<Village[]>(INITIAL_VILLAGES);
  const [dcs, setDcs] = useState<DistributionCenter[]>(INITIAL_DCS);
  const [selectedVillageId, setSelectedVillageId] =
    useState<string>("v-sembalun");
  const [selectedDcId, setSelectedDcId] = useState<string>("dc-selong");

  // High-fidelity SCM Admin Tabs: "MAP_MONITOR", "ASSETS", "PRICING", "SHIPMENTS", "BLUEPRINTS", "AUDIT_GOVERNANCE"
  const [activeTab, setActiveTab] = useState<
    | "MAP_MONITOR"
    | "ASSETS"
    | "PRICING"
    | "SHIPMENTS"
    | "BLUEPRINTS"
    | "AUDIT_GOVERNANCE"
  >("MAP_MONITOR");
  const [activePreset, setActivePreset] = useState<PresetType>("STANDARD");
  const [safetyBufferScale, setSafetyBufferScale] = useState<number>(1.35);

  // Dynamic Multi-Modal shipments state
  const [transitLogs, setTransitLogs] = useState<TransitLog[]>([
    {
      id: "TRX-0982",
      commodity: "Premium Rice Brand",
      driver: "Budi Santoso",
      origin: "Medan Sumatra Food Hub",
      destination: "Gili Islet Outpost",
      status: "Critical",
      weight: 12.5,
    },
    {
      id: "TRX-0983",
      commodity: "Staple Rice Bulog",
      driver: "Ahmad Dahlan",
      origin: "Jakarta-Sukabumi Bulog Depot",
      destination: "Sukabumi Node",
      status: "Dispatched",
      weight: 24.0,
    },
    {
      id: "TRX-0984",
      commodity: "Shallots Seed Grade",
      driver: "Wawan Hermawan",
      origin: "Praya SCM Food Hub",
      destination: "Kuta Arid Hills",
      status: "In Transit",
      weight: 4.8,
    },
    {
      id: "TRX-0985",
      commodity: "Red Hot Chillies",
      driver: "Ketut Alit",
      origin: "Mataram BULOG Warehouse",
      destination: "Pemenang Village",
      status: "Loading",
      weight: 6.2,
    },
    {
      id: "TRX-0986",
      commodity: "Industrial Granulated Sugar",
      driver: "Andi Wijaya",
      origin: "Makassar Bapanas Gate",
      destination: "Gowa Center",
      status: "In Transit",
      weight: 18.0,
    },
  ]);

  // SCM Rerouting alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Dispatched Transit form state
  const [dispatchCommodity, setDispatchCommodity] =
    useState<string>("Rice Bulog Spec");
  const [dispatchDriver, setDispatchDriver] = useState<string>("Rian Hidayat");
  const [dispatchOrigin, setDispatchOrigin] = useState<string>(
    "Mataram BULOG Warehouse",
  );
  const [dispatchDest, setDispatchDest] = useState<string>("Sembalun Outpost");
  const [dispatchWeight, setDispatchWeight] = useState<number>(15.0);

  // Filter conditions for Bottom logs
  const [hideCompletedLogs, setHideCompletedLogs] = useState<boolean>(false);
  const [filter3TOnly, setFilter3TOnly] = useState<boolean>(false);

  const activeVillage =
    villages.find((v) => v.id === selectedVillageId) || villages[0];
  const activeDc = dcs.find((d) => d.id === selectedDcId) || dcs[0];

  // Align DC selection when village selection shifts
  useEffect(() => {
    const parentDc = dcs.find((d) =>
      d.assignedVillages.includes(selectedVillageId),
    );
    if (parentDc) {
      setSelectedDcId(parentDc.id);
    }
  }, [selectedVillageId, dcs]);

  // Aggregate stats computations
  const [liveMetrics, setLiveMetrics] = useState<ControlTowerMetrics>({
    totalSurplusKg: 0,
    totalDeficitKg: 0,
    activeDeficitCount: 0,
    activeVolatilityCount: 0,
    averageRicePriceIdr: 0,
  });

  useEffect(() => {
    let totalSurplus = 0;
    let totalDeficit = 0;
    let deficitCount = 0;
    let volatilityCount = 0;
    let sumPrice = 0;

    villages.forEach((v) => {
      const expectedDemand = v.population * v.consumptionPerCapitaKgPerDay;
      const netSupplyBalance = v.aggregateProductionKgPerDay - expectedDemand;
      const index = (netSupplyBalance / expectedDemand) * 100;

      // Volatility
      const len = v.priceHistory15Days ? v.priceHistory15Days.length : 0;
      let volatility = 0;
      if (len > 1) {
        const avg = v.priceHistory15Days.reduce((a, b) => a + b, 0) / len;
        const sqDiffs = v.priceHistory15Days.map((val) =>
          Math.pow(val - avg, 2),
        );
        const variance = sqDiffs.reduce((a, b) => a + b, 0) / len;
        volatility = Math.sqrt(variance) / avg;
      }

      if (netSupplyBalance > 0) {
        totalSurplus += netSupplyBalance;
      } else {
        totalDeficit += Math.abs(netSupplyBalance);
      }

      if (index < -20) {
        deficitCount++;
      }
      if (volatility > 0.08) {
        volatilityCount++;
      }
      sumPrice += v.currentPricePerKgIdr;
    });

    setLiveMetrics({
      totalSurplusKg: Math.round(totalSurplus),
      totalDeficitKg: Math.round(totalDeficit),
      activeDeficitCount: deficitCount,
      activeVolatilityCount: volatilityCount,
      averageRicePriceIdr: Math.round(sumPrice / villages.length),
    });
  }, [villages]);

  // Scale node metrics from Sandbox parameters
  const handleScaleVillageParameter = (
    key: "aggregateProductionKgPerDay" | "population" | "currentPricePerKgIdr",
    value: number,
  ) => {
    setVillages((prev) =>
      prev.map((v) => {
        if (v.id === selectedVillageId) {
          const updated = { ...v, [key]: value };
          if (key === "currentPricePerKgIdr" && v.priceHistory15Days) {
            const hist = [...v.priceHistory15Days];
            if (hist.length > 0) hist[hist.length - 1] = value;
            updated.priceHistory15Days = hist;
          }
          return updated;
        }
        return v;
      }),
    );
  };

  // Add spawned custom node to simulation state
  const handleAddCustomVillage = (
    newV: Omit<
      Village,
      "priceHistory15Days" | "posDailyDemandKg" | "dcInventoryReservedKg"
    >,
  ) => {
    const fullNewV: Village = {
      ...newV,
      priceHistory15Days: [
        newV.currentPricePerKgIdr * 0.95,
        newV.currentPricePerKgIdr * 0.97,
        newV.currentPricePerKgIdr * 0.98,
        newV.currentPricePerKgIdr,
      ],
      posDailyDemandKg: newV.population * newV.consumptionPerCapitaKgPerDay,
      dcInventoryReservedKg: Math.round(
        newV.population * newV.consumptionPerCapitaKgPerDay * 0.6,
      ),
    };

    setVillages((prev) => [fullNewV, ...prev]);

    // Assign to closest DC based on latitude proximity automatically
    let closestDcId = dcs[0].id;
    let minDist = 999999;
    dcs.forEach((dc) => {
      const d =
        Math.abs(dc.coordinates.lat - newV.coordinates.lat) +
        Math.abs(dc.coordinates.lng - newV.coordinates.lng);
      if (d < minDist) {
        minDist = d;
        closestDcId = dc.id;
      }
    });

    setDcs((prev) =>
      prev.map((dc) => {
        if (dc.id === closestDcId) {
          return {
            ...dc,
            assignedVillages: [...dc.assignedVillages, fullNewV.id],
          };
        }
        return dc;
      }),
    );

    setSelectedVillageId(fullNewV.id);
    setSelectedDcId(closestDcId);

    setToastMessage(
      `📍 Custom Demand Anchor "${newV.name}" created at ${newV.coordinates.lat}°, ${newV.coordinates.lng}° & allocated to ${dcs.find((d) => d.id === closestDcId)?.name}!`,
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Trigger Rerouting Strategy - SCM Rebalancer
  const triggerRerouteStrategy = () => {
    // 1. Rebalance DC reserves down and deficit village yields / allocations up.
    // This reduces shortages, simulating robust automated corrective action!
    setDcs((prev) =>
      prev.map((dc) => {
        // Deduct standard dispatch allocation amounts from safety warehouses
        return {
          ...dc,
          riceInventoryKg: Math.max(
            20000,
            Math.round(dc.riceInventoryKg - 15000),
          ),
        };
      }),
    );

    setVillages((prev) =>
      prev.map((v) => {
        const surplusDemand = v.population * v.consumptionPerCapitaKgPerDay;
        const index =
          ((v.aggregateProductionKgPerDay - surplusDemand) / surplusDemand) *
          100;
        if (index < -20) {
          // Boost local reserves / production to resolve active deficit shortages!
          return {
            ...v,
            aggregateProductionKgPerDay: Math.round(
              v.aggregateProductionKgPerDay + surplusDemand * 0.55,
            ),
            currentPricePerKgIdr: Math.round(v.currentPricePerKgIdr * 0.88), // drop price via supply injection
          };
        }
        return v;
      }),
    );

    // 2. Prepend dispatch entries to Bottom database log
    const newTrxs: TransitLog[] = [
      {
        id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
        commodity: "Emergency Rice Carrier",
        driver: "Coop Team Alpha",
        origin: "Medan Sumatra Food Hub",
        destination: "Sembalun Outpost",
        status: "In Transit",
        weight: 45.0,
      },
      {
        id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
        commodity: "Buffer Grains Truck",
        driver: "BULOG Driver C",
        origin: "Jakarta-Sukabumi Bulog Depot",
        destination: "Gili Islet Outpost",
        status: "In Transit",
        weight: 32.0,
      },
    ];
    setTransitLogs((prev) => [...newTrxs, ...prev]);

    setToastMessage(
      "⚡ SCM REROUTING DISPATCH SUCCESS: Diverting 77 Tons of grain from Surplus Warehouses to Critical Deficit Villages. Shortages cleared, prices mitigating down!",
    );
    setTimeout(() => setToastMessage(null), 7000);
  };

  // Manual dispatch truck submission
  const handleAddNewDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrx: TransitLog = {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      commodity: dispatchCommodity,
      driver: dispatchDriver,
      origin: dispatchOrigin,
      destination: dispatchDest,
      status: "Dispatched",
      weight: dispatchWeight,
    };

    setTransitLogs((prev) => [newTrx, ...prev]);
    setToastMessage(
      `🚚 New Dispatch registered! Driver ${dispatchDriver} deployed heading to ${dispatchDest}.`,
    );

    // Clear form fields
    setDispatchDriver("Syarifuddin");
    setDispatchWeight(10);

    setTimeout(() => setToastMessage(null), 5000);
  };

  // Mark Log delivered
  const markDelivered = (trxId: string) => {
    setTransitLogs((prev) =>
      prev.map((log) => {
        if (log.id === trxId) {
          return { ...log, status: "Completed" };
        }
        return log;
      }),
    );

    // Elevate destination village yields slightly on delivery
    const completedLog = transitLogs.find((l) => l.id === trxId);
    if (completedLog) {
      setVillages((prev) =>
        prev.map((v) => {
          if (
            v.name
              .toLowerCase()
              .includes(
                completedLog.destination
                  .toLowerCase()
                  .replace(" node", "")
                  .replace(" outpost", ""),
              )
          ) {
            return {
              ...v,
              aggregateProductionKgPerDay: Math.round(
                v.aggregateProductionKgPerDay + completedLog.weight * 1000,
              ),
              currentPricePerKgIdr: Math.max(
                9500,
                Math.round(v.currentPricePerKgIdr * 0.95),
              ),
            };
          }
          return v;
        }),
      );
      setToastMessage(
        `✔️ ${completedLog.id} completed! Food buffer delivered. Village storage pools increased.`,
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Handle QR stock scans
  const handleUpdateDcInventory = (
    dcId: string,
    itemWeightKg: number,
    itemName: string,
  ) => {
    setDcs((prev) =>
      prev.map((d) => {
        if (d.id === dcId) {
          const newInventory = Math.min(
            d.capacityKg,
            d.riceInventoryKg + itemWeightKg,
          );
          return {
            ...d,
            riceInventoryKg: newInventory,
          };
        }
        return d;
      }),
    );
    setToastMessage(
      `📦 Scan QR Berhasil! Menambahkan +${itemWeightKg} kg stockpile (${itemName}) ke gudang logistik.`,
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Trigger SCM Preset Scenario
  const applyPresetScenario = (preset: string) => {
    setActivePreset(preset as PresetType);
    const baseVillages = JSON.parse(
      JSON.stringify(INITIAL_VILLAGES),
    ) as Village[];
    const baseDcs = JSON.parse(
      JSON.stringify(INITIAL_DCS),
    ) as DistributionCenter[];

    if (preset === "STANDARD") {
      setVillages(baseVillages);
      setDcs(baseDcs);
      setSafetyBufferScale(1.35);
    } else if (preset === "SEVERE_DROUGHT") {
      const updated = baseVillages.map((v) => {
        const croppedProd = Math.round(v.aggregateProductionKgPerDay * 0.25);
        const spikedPrice = Math.round(v.currentPricePerKgIdr * 1.45);
        const customHistory = v.priceHistory15Days.map((p, idx) => {
          const ratio = 1 + (idx / 14) * 0.45;
          return Math.round(p * ratio + Math.random() * 200);
        });
        return {
          ...v,
          aggregateProductionKgPerDay: croppedProd,
          currentPricePerKgIdr: v.is3T ? spikedPrice + 1200 : spikedPrice,
          priceHistory15Days: customHistory,
        };
      });
      setVillages(updated);
      setDcs(
        baseDcs.map((d) => ({
          ...d,
          riceInventoryKg: Math.round(d.riceInventoryKg * 0.45),
        })),
      );
      setSafetyBufferScale(1.9);
    } else if (preset === "PEAK_HARVEST") {
      const updated = baseVillages.map((v) => {
        const highProd = Math.round(v.aggregateProductionKgPerDay * 2.1);
        const stablePrice = Math.round(v.currentPricePerKgIdr * 0.77);
        const customHistory = v.priceHistory15Days.map((p, idx) => {
          const ratio = 0.8 + (idx / 14) * 0.05;
          return Math.round(p * ratio);
        });
        return {
          ...v,
          aggregateProductionKgPerDay: highProd,
          currentPricePerKgIdr: stablePrice,
          priceHistory15Days: customHistory,
        };
      });
      setVillages(updated);
      setDcs(
        baseDcs.map((d) => ({
          ...d,
          riceInventoryKg: Math.round(d.capacityKg * 0.95),
        })),
      );
      setSafetyBufferScale(1.1);
    } else if (preset === "HOLIDAY_DEMAND") {
      const updated = baseVillages.map((v) => ({
        ...v,
        consumptionPerCapitaKgPerDay: v.consumptionPerCapitaKgPerDay * 1.35,
        currentPricePerKgIdr: Math.round(v.currentPricePerKgIdr * 1.18),
      }));
      setVillages(updated);
      setDcs(
        baseDcs.map((d) => ({
          ...d,
          riceInventoryKg: Math.round(d.riceInventoryKg * 0.75),
        })),
      );
      setSafetyBufferScale(1.65);
    }
  };

  const currentExpectedDemand =
    activeVillage.population * activeVillage.consumptionPerCapitaKgPerDay;
  const currentIndex =
    ((activeVillage.aggregateProductionKgPerDay - currentExpectedDemand) /
      currentExpectedDemand) *
    100;

  // Filter logs logic
  const filteredTransitLogs = transitLogs.filter((log) => {
    if (hideCompletedLogs && log.status === "Completed") return false;
    if (filter3TOnly) {
      // Find destination details
      const vil = villages.find((v) =>
        v.name
          .toLowerCase()
          .includes(
            log.destination
              .toLowerCase()
              .replace(" node", "")
              .replace(" outpost", ""),
          ),
      );
      if (vil && !vil.is3T) return false;
    }
    return true;
  });

  if (!isAuthenticated) {
    return (
      <SignIn
        onSuccess={() => {
          localStorage.setItem("kmp_authenticated", "true");
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* SCM Banner Notification / Toasts */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-xl border border-emerald-500 shadow-2xl max-w-md animate-fadeIn flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs text-slate-300 uppercase tracking-widest font-display">
              Perintah Disposisi Logistik
            </div>
            <div className="text-xs text-white leading-relaxed mt-1 font-medium">
              {toastMessage}
            </div>
          </div>
        </div>
      )}

      {/* Top Application Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 navbar shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo brand & profile */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-md shadow-red-500/20 transform rotate-1">
              <span className="font-black text-sm text-white font-mono tracking-widest">
                KMP
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-red-100 text-red-700 border border-red-200/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Koperasi Merah Putih
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Mitra Bapanas
                </span>
              </div>
              <h1 className="text-base font-black text-slate-900 tracking-tight font-display">
                Menara Kontrol Rantai Pasok & Pemetaan Permintaan
              </h1>
            </div>
          </div>

          {/* Super Admin Status Profile badge */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-950">
                Administrator Utama KMP
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                Sektor Lombok & Nasional
              </div>
            </div>

            <button
              id="logout-button"
              onClick={() => {
                localStorage.removeItem("kmp_authenticated");
                setIsAuthenticated(false);
              }}
              title="Keluar"
              className="ml-2.5 p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout containing both left sidebar rails and main stage */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 gap-6">
        {/* Left Sidebar control rail */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-5">
          {/* Sidebar Tabs Button Group */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 pt-1.5 block">
              Menu Logistik
            </span>

            <button
              id="tab-map-monitor"
              onClick={() => setActiveTab("MAP_MONITOR")}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "MAP_MONITOR"
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                <span>Peta Permintaan & Pos</span>
              </div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-mono">
                Aktif
              </span>
            </button>

            <button
              id="tab-assets"
              onClick={() => setActiveTab("ASSETS")}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "ASSETS"
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Warehouse className="w-4 h-4 text-emerald-500" />
                <span>Aset Gudang & Beras</span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                {dcs.length}
              </span>
            </button>

            <button
              id="tab-pricing"
              onClick={() => setActiveTab("PRICING")}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "PRICING"
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Pantauan Harga Pasar</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${liveMetrics.activeVolatilityCount > 0 ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-emerald-100 text-emerald-800"}`}
              >
                {liveMetrics.activeVolatilityCount} Alert
              </span>
            </button>

            <button
              id="tab-shipments"
              onClick={() => setActiveTab("SHIPMENTS")}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "SHIPMENTS"
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-500" />
                <span>Rute Dispatch Armada</span>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono">
                14 Aktif
              </span>
            </button>

            <button
              id="tab-governance"
              onClick={() => setActiveTab("AUDIT_GOVERNANCE")}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "AUDIT_GOVERNANCE"
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Tata Kelola & Audit Pos</span>
              </div>
              <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold font-mono">
                8 Outposts
              </span>
            </button>

            <button
              id="tab-blueprints"
              onClick={() => setActiveTab("BLUEPRINTS")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "BLUEPRINTS"
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Hub Cetak Biru SQL</span>
            </button>
          </div>

          {/* Quick Preset Actions Selector inside sidebar also */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Skenario Simulasi Krisis
            </span>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => applyPresetScenario("STANDARD")}
                className={`py-2 px-3 text-left rounded-lg text-xs font-bold border transition-all ${
                  activePreset === "STANDARD"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-extrabold"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                🌾 Aliran Pasokan Normal
              </button>

              <button
                onClick={() => applyPresetScenario("SEVERE_DROUGHT")}
                className={`py-2 px-3 text-left rounded-lg text-xs font-bold border transition-all ${
                  activePreset === "SEVERE_DROUGHT"
                    ? "bg-red-50 border-red-300 text-red-950 font-extrabold"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                🍂 Gagal Panen Kekeringan
              </button>

              <button
                onClick={() => applyPresetScenario("PEAK_HARVEST")}
                className={`py-2 px-3 text-left rounded-lg text-xs font-bold border transition-all ${
                  activePreset === "PEAK_HARVEST"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-extrabold"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                🚜 Surplus Panen Raya Melimpah
              </button>

              <button
                onClick={() => applyPresetScenario("HOLIDAY_DEMAND")}
                className={`py-2 px-3 text-left rounded-lg text-xs font-bold border transition-all ${
                  activePreset === "HOLIDAY_DEMAND"
                    ? "bg-sky-50 border-sky-300 text-sky-950 font-extrabold"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                🎉 Lonjakan Hari Raya Ramadhan
              </button>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed pt-1 select-none text-slate-400">
              Klik untuk memicu skenario. Indeks volatilitas dan parameter
              logistik akan memperbarui peta seketika.
            </p>
          </div>

          {/* Quick summary SCM Info card */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <ShieldAlert className="w-4 h-4 font-black" />
              <span>Coop Mission Policy</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              We secure vital access to basic grains within rural and 3T
              frontiers to stabilize localized price volatility.
            </p>
          </div>
        </aside>

        {/* Main Stage Panel Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* TOP THREE STATISTICAL CARDS ROW (DENSE, GORGEOUS) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CARD 1: Critical Deficit Nodes */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Titik Defisit Aktif
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    +12% VS MINGGU LALU
                  </span>
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div>
                    <span className="text-3xl font-black font-display text-slate-900">
                      {liveMetrics.activeDeficitCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1.5">
                      Peringatan zona
                    </span>
                  </div>

                  {/* Miniature SVG Sparkline visualizer */}
                  <div className="w-24 h-8">
                    <svg className="w-full h-full" viewBox="0 0 100 30">
                      <path
                        d="M 0 25 Q 15 10, 30 22 T 60 5 T 90 28"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 0 25 Q 15 10, 30 22 T 60 5 T 90 28 L 100 30 L 0 30 Z"
                        fill="#EF4444"
                        fillOpacity="0.06"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-450 text-slate-500 mt-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>
                  Memerlukan perutean armada otomatis dari Depot BULOG.
                </span>
              </p>
            </div>

            {/* CARD 2: National Surplus Margin */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Margin Surplus Pangan
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Akses Aman
                  </span>
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div>
                    <span className="text-2xl font-black text-slate-900 font-display">
                      {(
                        ((liveMetrics.totalSurplusKg -
                          liveMetrics.totalDeficitKg) /
                          (liveMetrics.totalSurplusKg || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      Kelebihan Harian
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    Total Surplus: +
                    {(liveMetrics.totalSurplusKg / 1000).toFixed(1)} ton
                  </span>
                </div>
              </div>

              {/* Graphical Double Progress ratio bar */}
              <div className="space-y-1.5 mt-2.5">
                <div className="w-full bg-rose-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
                  <div
                    className="bg-emerald-500 h-full rounded-l transition-all duration-300"
                    style={{
                      width: `${Math.max(50, 100 - liveMetrics.activeDeficitCount * 12)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>
                    Tercukupi:{" "}
                    {Math.max(50, 100 - liveMetrics.activeDeficitCount * 12)}%
                  </span>
                  <span>
                    Kritis Defisit:{" "}
                    {Math.min(50, liveMetrics.activeDeficitCount * 12)}%
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Active Multi-Modal Transits */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Armada Transit Aktif
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />{" "}
                    Live Feed
                  </span>
                </div>

                <div className="mt-2 text-xl font-bold font-display text-slate-900 flex items-center justify-between">
                  <span>Total 1.284 Ton</span>
                  <span className="text-xs text-slate-400 font-normal">
                    Di {filteredTransitLogs.length} Koordinator
                  </span>
                </div>
              </div>

              {/* Transit Multi-modal sub-counters */}
              <div className="grid grid-cols-3 gap-1 grid-divider border-t border-slate-100 pt-3.5 text-center mt-3 text-[10px] text-slate-600">
                <div className="border-r border-slate-100">
                  <span className="font-bold text-slate-900 font-mono">
                    8 Armada
                  </span>
                  <span className="block text-[8px] text-slate-400 uppercase">
                    Rute Darat
                  </span>
                </div>
                <div className="border-r border-slate-100">
                  <span className="font-bold text-slate-900 font-mono">
                    4 Kapal
                  </span>
                  <span className="block text-[8px] text-slate-400 uppercase">
                    Rute Laut
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 font-mono">
                    2 Pesawat
                  </span>
                  <span className="block text-[8px] text-slate-400 uppercase">
                    Rute Udara
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Tab Selector Buttons for Mobile view (Since left sidebar is hidden in tiny widths) */}
          <section className="lg:hidden flex overflow-x-auto gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm scrollbar-none">
            {(
              [
                "MAP_MONITOR",
                "ASSETS",
                "PRICING",
                "SHIPMENTS",
                "AUDIT_GOVERNANCE",
                "BLUEPRINTS",
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-bold rounded-lg shrink-0 whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab === "MAP_MONITOR" && "Peta Demand"}
                {tab === "ASSETS" && `Aset Gudang (${dcs.length})`}
                {tab === "PRICING" && "Indeks Harga"}
                {tab === "SHIPMENTS" && "Rute Armada"}
                {tab === "AUDIT_GOVERNANCE" && "Tata Kelola & Audit"}
                {tab === "BLUEPRINTS" && "Cetak Biru"}
              </button>
            ))}
          </section>

          {/* MAIN Dynamic View Panels depending on activeTab */}

          {/* TAB 1: DEMAND MAP VIEW */}
          {activeTab === "MAP_MONITOR" && (
            <div className="space-y-6">
              {/* Top Row: Map and Calibration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Span 2): Interactive map */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">
                  <InteractiveMap
                    villages={villages}
                    dcs={dcs}
                    selectedVillageId={selectedVillageId}
                    selectedDcId={selectedDcId}
                    onSelectVillage={setSelectedVillageId}
                    onSelectDc={setSelectedDcId}
                    onTriggerPreset={applyPresetScenario}
                    activePreset={activePreset}
                    onAddCustomVillage={handleAddCustomVillage}
                  />
                </div>

                {/* Right Column (Span 1): Calibration side widget controllers */}
                <div className="space-y-6">
                  {/* Calibration console card */}
                  <div
                    id="scm-node-sandbox"
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-700 tracking-wider uppercase font-mono bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-lg text-red-800">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>Jangkar Kalibrasi Pos</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight mt-2">
                          {activeVillage.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium tracking-wide block">
                          {activeVillage.region}
                        </span>
                      </div>

                      {activeVillage.is3T && (
                        <span className="text-[9px] font-black tracking-widest text-white bg-red-600 px-2 py-1 rounded-lg uppercase animate-pulse">
                          ZONA 3T
                        </span>
                      )}
                    </div>

                    {/* Interactive Formula Readouts */}
                    <div className="bg-slate-55 bg-slate-50/50 border border-slate-205 p-3.5 rounded-xl space-y-2 text-xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Perhitungan Surplus-Defisit Aktual
                      </span>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Hasil Produksi Lokal:
                        </span>
                        <span className="font-mono font-bold">
                          {activeVillage.aggregateProductionKgPerDay.toLocaleString()}{" "}
                          kg/hari
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Estimasi Kebutuhan Riil:
                        </span>
                        <span className="font-mono text-slate-650">
                          {activeVillage.population.toLocaleString()} jiwa
                          &times; 0,35kg ={" "}
                          {Math.round(currentExpectedDemand).toLocaleString()}{" "}
                          kg
                        </span>
                      </div>

                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 items-center">
                        <span className="font-bold text-slate-800">
                          Indeks Bersih SCM:
                        </span>
                        <span
                          className={`text-sm font-black font-mono ${currentIndex < -20 ? "text-rose-600 bg-rose-50 px-2 rounded" : "text-emerald-700 bg-emerald-50 px-2 rounded"}`}
                        >
                          {currentIndex.toFixed(1)}%
                        </span>
                      </div>

                      {currentIndex < -20 ? (
                        <div className="bg-rose-50 border border-rose-100/80 p-2 rounded-lg text-[10px] text-rose-805 leading-relaxed mt-2 text-rose-800">
                          📌 Kebutuhan melampaui hasil panen! Pasokan otomatis
                          dialihkan dari depot utama{" "}
                          <strong>{activeDc.name}</strong> untuk memitigasi
                          krisis harga.
                        </div>
                      ) : (
                        <div className="bg-emerald-55 bg-emerald-50/40 p-2 rounded-lg text-[10px] text-emerald-850 leading-relaxed mt-2 text-emerald-800">
                          🌾 Produksi aman dan stabil. Buffer cadangan mencukupi
                          untuk memitigasi distorsi rantai pasok (Bullwhip
                          effect).
                        </div>
                      )}
                    </div>

                    {/* Sliders Controllers */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        Kalibrasi Parameter Pos
                      </span>

                      {/* Local Yield */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-705">
                          <label>Produksi Panen Lokal:</label>
                          <span className="font-mono text-emerald-600 font-bold">
                            {activeVillage.aggregateProductionKgPerDay.toLocaleString()}{" "}
                            kg
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="22000"
                          step="200"
                          value={activeVillage.aggregateProductionKgPerDay}
                          onChange={(e) =>
                            handleScaleVillageParameter(
                              "aggregateProductionKgPerDay",
                              e.target.valueAsNumber,
                            )
                          }
                          className="w-full h-1.5 bg-slate-100 rounded"
                        />
                      </div>

                      {/* Population size */}
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-xs font-bold text-slate-705">
                          <label>Populasi Penduduk:</label>
                          <span className="font-mono text-slate-600 font-bold">
                            {activeVillage.population.toLocaleString()} jiwa
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1000"
                          max="45000"
                          step="500"
                          value={activeVillage.population}
                          onChange={(e) =>
                            handleScaleVillageParameter(
                              "population",
                              e.target.valueAsNumber,
                            )
                          }
                          className="w-full h-1.5 bg-slate-100 rounded"
                        />
                      </div>

                      {/* Pricing */}
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-xs font-bold text-slate-705">
                          <label>Harga Pangan Pokok:</label>
                          <span className="font-mono text-amber-600 font-bold">
                            Rp
                            {activeVillage.currentPricePerKgIdr.toLocaleString()}
                            /kg
                          </span>
                        </div>
                        <input
                          type="range"
                          min="8500"
                          max="22000"
                          step="100"
                          value={activeVillage.currentPricePerKgIdr}
                          onChange={(e) =>
                            handleScaleVillageParameter(
                              "currentPricePerKgIdr",
                              e.target.valueAsNumber,
                            )
                          }
                          className="w-full h-1.5 bg-slate-100 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SCM Active alerts list (VOLATILITY MONITOR + SPARKLINE INDICATORS) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-widest block">
                        Volatility warning signals
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        DAILY SIGMA ALERT
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Alerts item 1 */}
                      <div className="flex items-center justify-between hover:bg-slate-50/55 p-1 rounded-xl transition-all">
                        <div className="flex gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse mt-1 shrink-0" />
                          <div>
                            <span className="font-bold text-xs text-slate-950 block">
                              Sukabumi Node
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Rice Grade A
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-black text-rose-500 block">
                            +18.4%
                          </span>
                          <span className="text-[8px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded font-mono">
                            24h delta
                          </span>
                        </div>
                      </div>

                      {/* Alerts item 2 */}
                      <div className="flex items-center justify-between hover:bg-slate-50/55 p-1 rounded-xl transition-all">
                        <div className="flex gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                          <div>
                            <span className="font-bold text-xs text-slate-950 block">
                              Gili Outpost
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Vegetable Chilli
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-black text-amber-500 block">
                            +14.2%
                          </span>
                          <span className="text-[8px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded font-mono">
                            24h delta
                          </span>
                        </div>
                      </div>

                      {/* Alerts item 3 */}
                      <div className="flex items-center justify-between hover:bg-slate-50/55 p-1 rounded-xl transition-all">
                        <div className="flex gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <div>
                            <span className="font-bold text-xs text-slate-950 block">
                              Gowa Center
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Staple Sugar
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-600 block">
                            +1.1%
                          </span>
                          <span className="text-[8px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded font-mono">
                            24h stable
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BULLWHIP PREVENTION QUEUE */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-widest block">
                        Bullwhip Prevention Match
                      </span>
                      <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-mono">
                        True POS Sync
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      To suppress warehouse stock hoarding distortions, we match
                      POS true consumer demand immediately with central depots.
                    </p>

                    <div className="space-y-4 pt-1">
                      {/* Item 1 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Java Central - Sukabumi Core</span>
                          <span className="font-mono text-emerald-600 text-[11px]">
                            8.5k DC / 6.0k POS Demand
                          </span>
                        </div>

                        {/* High-craft Double-layered Progress bars (Green vs Blue) */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden flex">
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: "30%" }}
                            />
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: "70%" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Sulawesi Core - Gowa Frontier</span>
                          <span className="font-mono text-rose-500 text-[11px]">
                            4.0k DC / 7.5k POS Demand
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden flex">
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: "65%" }}
                            />
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: "35%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TRIGGER REROUTE STRATEGY - CORNER CTA */}
                    <div className="pt-2">
                      <button
                        onClick={triggerRerouteStrategy}
                        className="w-full bg-slate-950 text-white text-xs font-black uppercase py-3 rounded-xl hover:bg-slate-800 hover:shadow shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-emerald-400 font-bold" />
                        <span>Trigger Reroute Strategy</span>
                      </button>
                      <span className="text-[9px] text-slate-400 text-center block mt-1">
                        Diverts excess Medan Sumatran yields down to depleted
                        Lombok outposts.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Full-Width Column: SCM Charts isolated row to prevent any overlap bugs in grid constraints */}
              <div className="w-full mt-6">
                <ScmCharts
                  village={activeVillage}
                  dc={activeDc}
                  safetyBufferScale={safetyBufferScale}
                />
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY ASSETS LIST & WAREHOUSE CONTROL PANEL */}
          {activeTab === "ASSETS" && (
            <div
              id="scm-inventory-assets-screen"
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Enterprise Warehouse Stockpile Assets
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage central bulk warehouses operated by BULOG, BAPANAS and
                  Koperasi Merah Putih. Check capacity indexes and villages
                  buffer reserves.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {dcs.map((dc) => {
                  const capacityPct = Math.round(
                    (dc.riceInventoryKg / dc.capacityKg) * 100,
                  );
                  return (
                    <div
                      key={dc.id}
                      className="border border-slate-200 p-5 rounded-2xl space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                            <Warehouse className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                            {dc.operator}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-950 mt-3">
                          {dc.name}
                        </h4>
                        <span className="text-[11px] text-slate-405 text-slate-400">
                          {dc.region}
                        </span>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-sans">
                              Stocks Hold
                            </span>
                            <span className="font-bold text-slate-800">
                              {(dc.riceInventoryKg / 1000).toFixed(1)} tons
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-sans">
                              Full Capacity
                            </span>
                            <span className="font-bold text-slate-800">
                              {(dc.capacityKg / 1000).toFixed(1)} tons
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium text-slate-500">
                            <span>Fill Capacity Level</span>
                            <span>{capacityPct}% Filled</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-150">
                            <div
                              className="bg-slate-900 h-full rounded-full"
                              style={{ width: `${capacityPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                          <button
                            onClick={() => {
                              // Replenish manually inside active local state
                              setDcs((prev) =>
                                prev.map((d) => {
                                  if (d.id === dc.id) {
                                    return {
                                      ...d,
                                      riceInventoryKg: Math.min(
                                        d.capacityKg,
                                        d.riceInventoryKg + 20000,
                                      ),
                                    };
                                  }
                                  return d;
                                }),
                              );
                              setToastMessage(
                                `⚡ Restocked +20 Tons grain reserves at ${dc.name}!`,
                              );
                              setTimeout(() => setToastMessage(null), 4000);
                            }}
                            className="w-full bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold uppercase py-2 rounded-lg font-mono tracking-wider transition-all"
                          >
                            ➕ Replenish Stock (+20t)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QR Code Stockpile Intake Scan Section */}
              <QrInventoryScanner
                dcs={dcs}
                onUpdateInventory={handleUpdateDcInventory}
              />

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs flex gap-3 text-slate-600">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-950 block pb-1">
                    Automated Bullwhip Attenuation System is active
                  </span>
                  Warehouse supply levels are tuned directly on demand
                  fluctuation limits. Excess output at the agricultural depots
                  automatically gates supply queues, decreasing surplus
                  transport emissions.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICE VOLATILITY AND COMMODITY BENCHMARK MATRIX */}
          {activeTab === "PRICING" && (
            <div
              id="scm-pricing-benchmark-screen"
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Daily Commodity Market Price Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review daily market fluctuations of key staple products across
                  the archipelago. System flags localized price standard
                  deviation deviations (&gt;8% CV limit).
                </p>
              </div>

              <div className="border border-slate-250 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left font-sans text-xs max-w-full">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200/50">
                    <tr>
                      <th className="p-4">Food Node Name</th>
                      <th className="p-4">Staple Product</th>
                      <th className="p-4">Daily Price Rate</th>
                      <th className="p-4">15-Day Historical Curve</th>
                      <th className="p-4">Volatility Coefficient</th>
                      <th className="p-4">Flag Risk Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {villages.map((v) => {
                      const priceHistory = v.priceHistory15Days || [
                        12000, 12200,
                      ];
                      const totalDays = priceHistory.length;
                      const avgPrice =
                        priceHistory.reduce((a, b) => a + b, 0) / totalDays;
                      const squaredDiffs = priceHistory.map((price) =>
                        Math.pow(price - avgPrice, 2),
                      );
                      const variance =
                        squaredDiffs.reduce((a, b) => a + b, 0) / totalDays;
                      const stdDev = Math.sqrt(variance);
                      const cvIndex = avgPrice > 0 ? stdDev / avgPrice : 0.035;

                      return (
                        <tr
                          key={v.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4 font-bold text-slate-900">
                            {v.name}
                          </td>
                          <td className="p-4 text-slate-600 font-medium font-mono">
                            Premium Rice Spec A
                          </td>
                          <td className="p-4 font-bold font-mono">
                            Rp{v.currentPricePerKgIdr.toLocaleString()}/kg
                          </td>
                          <td className="p-4">
                            {/* Micro-scale sparkline curve for the row */}
                            <div className="w-28 h-6 bg-slate-50 border border-slate-100 rounded px-1 flex items-center justify-center">
                              <svg
                                className="w-full h-full"
                                viewBox="0 0 100 20"
                              >
                                <path
                                  d={priceHistory
                                    .map((pr, idx) => {
                                      const x =
                                        (idx / (totalDays - 1)) * 95 + 2.5;
                                      const y =
                                        18 -
                                        ((pr - Math.min(...priceHistory)) /
                                          (Math.max(...priceHistory) -
                                            Math.min(...priceHistory) || 1)) *
                                          14;
                                      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                                    })
                                    .join(" ")}
                                  fill="none"
                                  stroke={
                                    cvIndex > 0.08 ? "#EF4444" : "#10B981"
                                  }
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold">
                            {(cvIndex * 100).toFixed(2)}%
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                cvIndex > 0.08
                                  ? "bg-rose-100 text-rose-850 animate-pulse font-extrabold border border-rose-200"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {cvIndex > 0.08
                                ? "📢 VOLATILE PRICE ALERT"
                                : "✔️ SECURED PRICE"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ROUTE DISPATCH SCHEDULER & DISPATCH MAKER */}
          {activeTab === "SHIPMENTS" && (
            <div
              id="scm-scheduler-screen"
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left part (Span 2): Active Transit Routes list */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Active Multi-Modal Route Dispatch
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Pulsing truck / vessel dispatches tracked in real-time
                      coordinates. Click "Delivered" once grains arrive to
                      release storage buffers.
                    </p>
                  </div>

                  <div className="border border-slate-250 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs bg-white">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-mono tracking-wider font-bold text-[9px] border-b border-slate-150">
                        <tr>
                          <th className="p-3">Route ID</th>
                          <th className="p-3">Commodity</th>
                          <th className="p-3">Driver Coordinator</th>
                          <th className="p-3">Leg</th>
                          <th className="p-3">Payload</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Telemetry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {transitLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold font-mono">
                              {log.id}
                            </td>
                            <td className="p-3 text-slate-600 font-mono text-[11px]">
                              {log.commodity}
                            </td>
                            <td className="p-3 font-semibold">{log.driver}</td>
                            <td className="p-3 text-[10px] text-slate-450 leading-tight">
                              <span className="block text-slate-500">
                                Origin: {log.origin}
                              </span>
                              <span className="block text-slate-900 font-semibold gap-1">
                                Dest: 📍 {log.destination}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-905">
                              {log.weight} Tons
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  log.status === "Critical"
                                    ? "bg-rose-100 text-rose-800 animate-pulse border border-rose-200"
                                    : log.status === "In Transit"
                                      ? "bg-sky-100 text-sky-850"
                                      : log.status === "Completed"
                                        ? "bg-emerald-100 text-emerald-800 font-bold"
                                        : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {log.status === "Critical"
                                  ? "🚨 DELAYED RISK"
                                  : log.status}
                              </span>
                            </td>
                            <td className="p-3">
                              {log.status !== "Completed" ? (
                                <button
                                  onClick={() => markDelivered(log.id)}
                                  className="px-2 py-1 bg-emerald-600 font-mono tracking-tight text-[10px] text-white font-bold hover:bg-emerald-700 hover:shadow rounded active:scale-95 transition-all uppercase"
                                >
                                  Mark delivered
                                </button>
                              ) : (
                                <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                                  ✔️ Closed out
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right part (Span 1): Dispatch Truck Form */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <form onSubmit={handleAddNewDispatch} className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-205 pb-2">
                        <Truck className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                          Deploy Route Transit Carrier
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-450 mt-1 select-none text-slate-400">
                        Manually dispatch rice carriers from safety warehouses
                        to rural nodes. This increments active stock levels at
                        endpoint directly upon arrival coordinates.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Commodity Specifics
                      </label>
                      <select
                        value={dispatchCommodity}
                        onChange={(e) => setDispatchCommodity(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                      >
                        <option value="Rice Bulog Grade Premium">
                          Premium Bulog Rice (50kg sack)
                        </option>
                        <option value="Shallot Seeds Grade B">
                          Red Shallot Seed Splendid
                        </option>
                        <option value="Dry Red Capsicum Chillies">
                          Hot Dried Chillies Sacks
                        </option>
                        <option value="Granulated Sugar Standard">
                          Cane Sugar Grain Double-A
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Coordinator Driver (Operator)
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                        value={dispatchDriver}
                        onChange={(e) => setDispatchDriver(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Origin DC
                        </label>
                        <select
                          value={dispatchOrigin}
                          onChange={(e) => setDispatchOrigin(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                        >
                          {dcs.map((dc) => (
                            <option key={dc.id} value={dc.name}>
                              {dc.name
                                .replace(" Warehouse", "")
                                .replace(" Depot", "")
                                .replace(" SCM Food", "")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Destination Village
                        </label>
                        <select
                          value={dispatchDest}
                          onChange={(e) => setDispatchDest(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                        >
                          {villages.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name
                                .replace(" Village", "")
                                .replace(" Outpost", "")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Total Payload Cargo (Tons)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="120"
                        required
                        value={dispatchWeight}
                        onChange={(e) =>
                          setDispatchWeight(e.target.valueAsNumber)
                        }
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 border border-slate-950 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 hover:shadow font-mono tracking-widest active:scale-95 transition-all"
                    >
                      🚀 Authorize Dispatch Command
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SQL BLUEPRINTS HUB (Bypasses rendering map tabs) */}
          {activeTab === "BLUEPRINTS" && (
            <div className="animate-fadeIn">
              <BlueprintViewer />
            </div>
          )}

          {/* TAB 6: COOPERATIVE AUDIT & GOVERNANCE FLOW */}
          {activeTab === "AUDIT_GOVERNANCE" && (
            <div className="animate-fadeIn">
              <CooperativeGovernance villages={villages} />
            </div>
          )}

          {/* LIVE TRANSIT LOG BOTTOM SECTION (GORGEOUS TABLE ACCORDING TO SPECS, ALWAYS RENDERED EXCEPT ON BLUEPRINTS / GOVERNANCE TABS) */}
          {activeTab !== "BLUEPRINTS" && activeTab !== "AUDIT_GOVERNANCE" && (
            <section
              id="bottom-transit-table"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              {/* Table control filters bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-1.5 pt-1.5">
                    <Layers className="text-emerald-600 w-4.5 h-4.5" />
                    <span>
                      Point-of-Sale (POS) & Logistics Live Transit Log
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 select-none hover:text-slate-700">
                    Displays active shipments. Triggering the SCM reroute
                    Strategy or dispatching manually appends rows here
                    instantly.
                  </p>
                </div>

                {/* Filters Checkbox panel */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 flex-wrap">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                    <ListFilter className="w-3.5 h-3.5" /> Table Filters
                  </span>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 text-emerald-600 border-slate-200 focus:ring-emerald-500 rounded"
                      checked={hideCompletedLogs}
                      onChange={(e) => setHideCompletedLogs(e.target.checked)}
                    />
                    <span>Hide Completed Runs</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 text-emerald-600 border-slate-200 focus:ring-emerald-500 rounded"
                      checked={filter3TOnly}
                      onChange={(e) => setFilter3TOnly(e.target.checked)}
                    />
                    <span>3T Frontiers Only</span>
                  </label>
                </div>
              </div>

              {/* Transit core table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead className="bg-[#FAFBFD]/80 text-slate-650 opacity-90 border-b border-slate-200 font-bold text-[9px] uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-3">Reference ID</th>
                      <th className="p-3">Commodity Type</th>
                      <th className="p-3">Dispatcher Driver</th>
                      <th className="p-3">SCM Route Leg</th>
                      <th className="p-3 font-right">Net Capacity</th>
                      <th className="p-3">Status Badging</th>
                      <th className="p-3">Interactive Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTransitLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-slate-400 font-medium font-mono text-[11px]"
                        >
                          ⚠️ No active transport logs found matching selected
                          filters constraint. Trigger SCM re-route or deploy
                          dispatch carrier.
                        </td>
                      </tr>
                    ) : (
                      filteredTransitLogs.map((log) => {
                        const is3TLog = villages.find((v) =>
                          v.name
                            .toLowerCase()
                            .includes(
                              log.destination
                                .toLowerCase()
                                .replace(" node", "")
                                .replace(" outpost", ""),
                            ),
                        )?.is3T;
                        return (
                          <tr
                            key={log.id}
                            className={`hover:bg-slate-50/50 transition-colors ${is3TLog ? "bg-red-50/15" : ""}`}
                          >
                            <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                              {log.id}
                              {is3TLog && (
                                <span className="bg-red-100 text-red-800 text-[8px] font-extrabold px-1.5 py-0.2 rounded">
                                  3T Outpost
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 font-mono text-[11px] font-semibold">
                              {log.commodity}
                            </td>
                            <td className="p-3 font-bold text-slate-950 font-display">
                              {log.driver}
                            </td>
                            <td className="p-3 text-slate-500 text-[10px] leading-tight font-sans">
                              <span className="block text-slate-400 font-medium font-mono uppercase text-[9px]">
                                ORIGIN:{" "}
                                {log.origin
                                  .replace(" Warehouse", "")
                                  .replace(" Depot", "")
                                  .replace(" Gate", "")}
                              </span>
                              <span className="block text-slate-900 font-semibold mt-0.5">
                                📍 DEST: {log.destination}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800 text-[11px]">
                              {log.weight} Tons
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full font-mono border ${
                                  log.status === "Critical"
                                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse animate-duration-1000 font-black"
                                    : log.status === "In Transit"
                                      ? "bg-sky-50 text-sky-800 border-sky-150"
                                      : log.status === "Completed"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-150"
                                        : "bg-slate-50 text-slate-700 border-slate-150"
                                }`}
                              >
                                {log.status === "Critical"
                                  ? "🚨 CRITICAL DELAY"
                                  : log.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">
                              {log.status !== "Completed" ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => markDelivered(log.id)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-black rounded-lg uppercase shadow-xs select-all transition-all font-semibold"
                                  >
                                    Confirm Arrival
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Simulate a fast re-routing target swap inside the local list!
                                      setTransitLogs((prev) =>
                                        prev.map((item) => {
                                          if (item.id === log.id) {
                                            return {
                                              ...item,
                                              destination:
                                                item.destination ===
                                                "Gili Islet Outpost"
                                                  ? "Pemenang Village"
                                                  : "Gili Islet Outpost",
                                              status: "In Transit",
                                            };
                                          }
                                          return item;
                                        }),
                                      );
                                      setToastMessage(
                                        `🔄 Re-routed ${log.id} immediately to alternate high-vulnerability endpoint!`,
                                      );
                                      setTimeout(
                                        () => setToastMessage(null),
                                        4000,
                                      );
                                    }}
                                    className="px-2 py-1 border border-slate-250 hover:bg-slate-100 hover:text-slate-900 text-slate-650 rounded-lg text-[10px] transition-all font-bold uppercase"
                                  >
                                    Reroute SCM
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono font-medium text-[11px] flex items-center gap-1">
                                  ✔️ Order Closed Successfully
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Control tower footer credentials info */}
      <footer className="bg-[#0F172A] text-slate-400 py-8 border-t border-slate-800 text-xs mt-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3.5">
          <div className="flex justify-center items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold font-mono text-white text-xs">
              KMP
            </div>
            <p className="font-display font-black text-slate-100 text-base">
              Koperasi Merah Putih Food Logistics Intelligence Core
            </p>
          </div>
          <p className="max-w-2xl mx-auto text-slate-400 text-[11px] leading-relaxed">
            An interactive multi-modal administrative blueprint matching raw
            Point-of-Sale (POS) village demand to hulu safety warehouses.
            Developed specifically for food buffer optimization inside rural &
            3T sub-provinces, Indonesia.
          </p>
          <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 text-[#94A3B8] pt-2 text-[10px] font-mono border-t border-slate-800/80 max-w-xl mx-auto">
            <span>SRID: 4326 Mapping</span>
            <span>POSTGIS GEOPLOTS: ACTIVE</span>
            <span>COEFF_CV_RISK: 8%</span>
            <span>DOWNSTREAM_BULLWHIP_DAMPER: ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
