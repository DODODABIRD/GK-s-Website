import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  Info, 
  Sparkles,
  Volume2,
  VolumeX
} from "lucide-react";
import { Village } from "../types";

interface NotificationItem {
  id: string;
  type: "CRITICAL" | "WARNING" | "RESOLVED" | "SYSTEM";
  title: string;
  message: string;
  timestamp: string;
  villageName?: string;
}

interface NotificationSystemProps {
  villages: Village[];
  isImbalanceModeActive: boolean;
}

export default function NotificationSystem({ villages, isImbalanceModeActive }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "init-notif",
      type: "SYSTEM",
      title: "Sistem Pemantauan Aktif",
      message: "Dashboard Koperasi Merah Putih terhubung dengan pos 3T di Nusa Tenggara Barat.",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Sound generator
  const playChime = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number, vol: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = audioCtx.currentTime;
      // Gentle chime: E5 -> A5 (warm & high-tech)
      playTone(659.25, now, 0.25, 0.06); 
      playTone(880.00, now + 0.1, 0.35, 0.06);
    } catch (e) {
      console.warn("Audio Context chime error:", e);
    }
  };

  // Keep a ref to the latest villages and imbalance state to avoid stale closure in setTimeout
  const stateRef = useRef({ villages, isImbalanceModeActive });
  useEffect(() => {
    stateRef.current = { villages, isImbalanceModeActive };
  }, [villages, isImbalanceModeActive]);

  // Handle periodic notification scheduling
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const generateNotification = () => {
      const current = stateRef.current;
      const { villages: currentVillages, isImbalanceModeActive: activeMode } = current;

      // Find villages with active deficits
      const deficitVillages = currentVillages.filter(v => {
        const expectedDemand = v.population * v.consumptionPerCapitaKgPerDay;
        const balance = v.aggregateProductionKgPerDay - expectedDemand;
        const index = (balance / expectedDemand) * 100;
        return index < -20;
      });

      let newNotif: NotificationItem;

      // Decide if we trigger a shortage alert or a general system event
      const shouldTriggerShortage = deficitVillages.length > 0 && (Math.random() > 0.3 || activeMode);

      if (shouldTriggerShortage) {
        // Choose a random shortage village
        const randomVillage = deficitVillages[Math.floor(Math.random() * deficitVillages.length)];
        const expectedDemand = randomVillage.population * randomVillage.consumptionPerCapitaKgPerDay;
        const shortageAmount = Math.round(expectedDemand - randomVillage.aggregateProductionKgPerDay);

        const isCritical = shortageAmount > 1500;
        newNotif = {
          id: `notif-${Date.now()}`,
          type: isCritical ? "CRITICAL" : "WARNING",
          title: isCritical ? `🚨 Defisit Kritis: ${randomVillage.name}` : `⚠️ Peringatan Stok: ${randomVillage.name}`,
          message: `Kekurangan pasokan harian beras sebesar -${shortageAmount.toLocaleString()} kg. Harga beras melambung ke Rp ${randomVillage.currentPricePerKgIdr.toLocaleString()}/kg!`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          villageName: randomVillage.name
        };
      } else {
        // Fallback to beautiful standard village / cooperative event notifications
        const events = [
          {
            title: "🌾 Logistik KMP Aman",
            message: "Pendistribusian beras subsidi ke Pos Senggigi Coast berjalan tertib dan tepat sasaran.",
            type: "SYSTEM" as const
          },
          {
            title: "📈 Stabilitas Pasar",
            message: "Intervensi harga beras di Pemenang Village berhasil meredam lonjakan inflasi bahan pokok.",
            type: "RESOLVED" as const
          },
          {
            title: "🌤️ Laporan Cuaca Tani",
            message: "Matahari terik di dataran tinggi Sembalun sangat optimal untuk penjemuran padi hasil panen lokal.",
            type: "SYSTEM" as const
          },
          {
            title: "⚡ Rerouting Selesai",
            message: "Penyeimbangan stok lumbung pangan Bulog Mataram ke wilayah pesisir tuntas dilaksanakan.",
            type: "RESOLVED" as const
          }
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        newNotif = {
          id: `notif-${Date.now()}`,
          type: randomEvent.type,
          title: randomEvent.title,
          message: randomEvent.message,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
      }

      setNotifications(prev => {
        // Keep only the last 3 notifications
        const next = [newNotif, ...prev];
        return next.slice(0, 3);
      });

      playChime();

      // Schedule next notification recursively
      scheduleNext();
    };

    const scheduleNext = () => {
      const activeMode = stateRef.current.isImbalanceModeActive;
      // Normal: 4 to 8 seconds. Imbalance active: 2 to 4 seconds.
      const delay = activeMode 
        ? Math.random() * 2000 + 2000  // 2 - 4s
        : Math.random() * 4000 + 4000; // 4 - 8s

      timerId = setTimeout(generateNotification, delay);
    };

    // Schedule the first one
    scheduleNext();

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getBorderColor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "CRITICAL": return "border-red-500 bg-red-50/95";
      case "WARNING": return "border-amber-500 bg-amber-50/95";
      case "RESOLVED": return "border-emerald-500 bg-emerald-50/95";
      default: return "border-slate-300 bg-white/95";
    }
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "CRITICAL": return <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse shrink-0" />;
      case "WARNING": return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case "RESOLVED": return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      default: return <Info className="w-5 h-5 text-indigo-600 shrink-0" />;
    }
  };

  return (
    <div id="floating-notification-system" className="fixed bottom-4 right-4 z-50 w-80 md:w-96 flex flex-col space-y-2 pointer-events-none">
      
      {/* Header Widget */}
      <div className="bg-slate-900 text-white rounded-xl p-2.5 px-4 shadow-xl flex items-center justify-between border border-slate-800 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isImbalanceModeActive ? "bg-red-400" : "bg-emerald-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isImbalanceModeActive ? "bg-red-500" : "bg-emerald-500"}`}></span>
          </span>
          <span className="text-[11px] font-black tracking-wider uppercase font-mono flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> 
            {isImbalanceModeActive ? "Simulasi Ketidakseimbangan Aktif" : "Sinyal Monitor Desa 3T"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isImbalanceModeActive && (
            <span className="text-[9px] bg-red-950 border border-red-800 text-red-300 px-1.5 py-0.5 rounded-full font-bold animate-pulse font-mono shrink-0">
              ⚡ CEPAT (2-4s)
            </span>
          )}

          {/* Sound Toggle Button */}
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            title={isMuted ? "Bunyikan Alarm" : "Senapkan Alarm"}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all pointer-events-auto cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Open/Close Drawer Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all pointer-events-auto cursor-pointer text-[10px] font-bold px-1.5"
          >
            {isOpen ? "Sembunyikan" : `Tampilkan (${notifications.length})`}
          </button>
        </div>
      </div>

      {/* Notifications Stack */}
      {isOpen && notifications.length > 0 && (
        <div className="flex flex-col space-y-2 pointer-events-auto max-h-[350px] overflow-y-auto pr-1">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`border-l-4 rounded-xl p-3 shadow-lg flex gap-3 transition-all duration-300 hover:translate-x-[-4px] ${getBorderColor(notif.type)}`}
            >
              <div className="mt-0.5">{getIcon(notif.type)}</div>
              
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 text-[11px] font-sans leading-tight">{notif.title}</span>
                  <span className="font-mono text-[8px] text-slate-400 font-semibold shrink-0 ml-2">{notif.timestamp}</span>
                </div>
                <p className="text-[10px] text-slate-700 leading-normal font-medium">{notif.message}</p>
                
                {notif.villageName && (
                  <div className="pt-1 flex items-center justify-between text-[9px]">
                    <span className="text-slate-500 font-medium">Prioritas Distribusi: <b>Pos KMP {notif.villageName}</b></span>
                    <span className="text-indigo-600 hover:underline font-bold cursor-pointer">Luncurkan Reroute ➜</span>
                  </div>
                )}
              </div>

              <button 
                onClick={(e) => handleDismiss(notif.id, e)}
                className="p-0.5 hover:bg-slate-200/50 rounded self-start text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
