import React, { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  Warehouse, 
  QrCode, 
  History, 
  AlertTriangle, 
  PackageOpen, 
  RefreshCw, 
  FileImage,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  ArrowLeftRight,
  UserCheck,
  Ban
} from "lucide-react";
import { DEMO_QR_ITEMS, QrItem, getQrPayload } from "../qr_data";

interface DistributionCenter {
  id: string;
  name: string;
  region: string;
  riceInventoryKg: number;
  capacityKg: number;
  operator: string;
}

interface QrInventoryScannerProps {
  dcs: DistributionCenter[];
  onUpdateInventory: (dcId: string, itemWeightKg: number, itemName: string) => void;
}

interface ScanLog {
  id: string;
  type: "IN" | "OUT";
  timestamp: string;
  itemName: string;
  weightKg: number;
  qrId: string;
  targetDcName: string;
  grade: string;
  batchNo: string;
  status: "SUCCESS" | "VERIFY_FAILED" | "INSUFFICIENT_STOCK";
  recipient?: string;
}

export default function QrInventoryScanner({ dcs, onUpdateInventory }: QrInventoryScannerProps) {
  // Config & State
  const [selectedDcId, setSelectedDcId] = useState<string>(dcs[0]?.id || "");
  const [scannerMode, setScannerMode] = useState<"IN" | "OUT">("IN");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedItem, setScannedItem] = useState<QrItem | null>(null);
  const [lastScannedPayload, setLastScannedPayload] = useState<string | null>(null);
  const [scanIntervalActive, setScanIntervalActive] = useState(false);
  
  // QR Out custom fields
  const [recipient, setRecipient] = useState<string>("Warga Setempat (Bantuan Sosial)");
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [insufficientStockError, setInsufficientStockError] = useState<string | null>(null);

  const [scanLogs, setScanLogs] = useState<ScanLog[]>([
    {
      id: "log-init-1",
      type: "IN",
      timestamp: new Date(Date.now() - 30 * 60000).toLocaleTimeString("id-ID"),
      itemName: "Beras Pandan Wangi Premium 10kg",
      weightKg: 10,
      qrId: "KMP-RICE-10KG-001",
      targetDcName: dcs[0]?.name || "Mataram BULOG Warehouse",
      grade: "Spec A",
      batchNo: "BATCH-202606-WN01",
      status: "SUCCESS"
    }
  ]);

  // Audio Beep Generator using Web Audio API
  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

  // Video and Canvas references
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoFullscreenRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setScanIntervalActive(false);
  };

  // Start camera stream safely
  const startCamera = async (isFullscreen = false) => {
    setCameraError(null);
    setScannedItem(null);
    setLastScannedPayload(null);
    setInsufficientStockError(null);
    
    try {
      const constraints = {
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: isFullscreen ? 1280 : 640 },
          height: { ideal: isFullscreen ? 720 : 480 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const activeVideoRef = isFullscreen ? videoFullscreenRef : videoRef;
      
      if (activeVideoRef.current) {
        activeVideoRef.current.srcObject = stream;
        activeVideoRef.current.setAttribute("playsinline", "true"); // required for iOS
        activeVideoRef.current.play();
        setIsCameraActive(true);
        setScanIntervalActive(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Izin Kamera Ditolak. Harap izinkan akses kamera di peramban Anda untuk memindai kode QR."
          : `Kamera Tidak Tersedia: ${err.message || "Tidak ada perangkat kamera yang terdeteksi di terminal ini."}`
      );
      setIsCameraActive(false);
    }
  };

  // Fullscreen HTML5 API Trigger
  const toggleFullscreenMode = async () => {
    if (!isFullscreenActive) {
      setIsFullscreenActive(true);
      // Try HTML5 requestFullscreen on container if supported
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch (err) {
        console.warn("Native fullscreen request rejected:", err);
      }
      // Re-trigger camera for fullscreen resolution
      if (isCameraActive) {
        stopCamera();
        setTimeout(() => startCamera(true), 250);
      }
    } else {
      setIsFullscreenActive(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.warn("Native fullscreen exit rejected:", err);
      }
      if (isCameraActive) {
        stopCamera();
        setTimeout(() => startCamera(false), 250);
      }
    }
  };

  // Clean up on unmount or on fullscreen toggle changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing loop using jsQR
  useEffect(() => {
    if (!isCameraActive || !scanIntervalActive) return;

    let scanThrottleTimeout = false;

    const tick = () => {
      if (!isCameraActive || !scanIntervalActive) return;

      const video = isFullscreenActive ? videoFullscreenRef.current : videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_CURRENT_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          // Sync internal canvas size to actual video stream size
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Only feed to jsQR at intervals (throttled for high frame performance)
          if (!scanThrottleTimeout) {
            scanThrottleTimeout = true;
            setTimeout(() => { scanThrottleTimeout = false; }, 200); // 5 decodes per second max

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const decodedQR = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (decodedQR && decodedQR.data) {
              handleDecodedPayload(decodedQR.data);
            }
          }
        }
      }
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraActive, scanIntervalActive, selectedDcId, scannerMode, isFullscreenActive, recipient]);

  // Handle scanned raw payload (JSON string or item ID)
  const handleDecodedPayload = (payload: string) => {
    // Prevent double scanning of the same item in quick succession
    if (payload === lastScannedPayload) return;
    setLastScannedPayload(payload);
    setInsufficientStockError(null);

    try {
      let isItemFound = false;
      let matchedItem: QrItem | null = null;

      // 1. Try to parse as JSON
      if (payload.trim().startsWith("{")) {
        const parsed = JSON.parse(payload);
        if (parsed.qrId) {
          matchedItem = DEMO_QR_ITEMS.find(it => it.qrId === parsed.qrId) || {
            qrId: parsed.qrId,
            name: parsed.name || "Custom Grain Stockpile",
            weightKg: parsed.weightKg || 10,
            grade: parsed.grade || "Spec A",
            supplier: "Sistem Eksternal",
            batchNo: parsed.batchNo || "BATCH-CUSTOM",
            description: "QR item parsed through custom JSON properties."
          };
          isItemFound = true;
        }
      } 
      
      // 2. Try to match raw ID string
      if (!isItemFound) {
        const match = DEMO_QR_ITEMS.find(it => it.qrId === payload.trim());
        if (match) {
          matchedItem = match;
          isItemFound = true;
        }
      }

      if (isItemFound && matchedItem) {
        processStockTransaction(matchedItem);
      } else {
        // Unknown QR Code scanned
        playBeep(440, 0.3); // Low error tone
        const unverifiedID = payload.length > 25 ? `${payload.substring(0, 22)}...` : payload;
        const targetDc = dcs.find(d => d.id === selectedDcId);
        
        const newLog: ScanLog = {
          id: `log-${Date.now()}`,
          type: scannerMode,
          timestamp: new Date().toLocaleTimeString("id-ID"),
          itemName: `Unverified QR Payload: "${unverifiedID}"`,
          weightKg: 0,
          qrId: "UNKNOWN",
          targetDcName: targetDc?.name || "Direct Buffer Outpost",
          grade: "N/A",
          batchNo: "N/A",
          status: "VERIFY_FAILED"
        };
        setScanLogs(prev => [newLog, ...prev]);
        setScanIntervalActive(false);
      }
    } catch (e) {
      console.error("Payload verification error:", e);
    }
  };

  // Perform updates to parent warehouse metrics
  const processStockTransaction = (item: QrItem) => {
    const targetDc = dcs.find(d => d.id === selectedDcId);
    if (!targetDc) return;

    if (scannerMode === "OUT") {
      // Outgoing: reduce stock. Ensure stock is sufficient
      if (targetDc.riceInventoryKg < item.weightKg) {
        // Insufficient stock warning
        playBeep(330, 0.4); // Low double warning tone
        const errorMsg = `Stok gudang ${targetDc.name} tidak mencukupi! Hanya tersisa ${(targetDc.riceInventoryKg).toLocaleString()} kg, sedangkan kebutuhan pengeluaran adalah ${item.weightKg} kg.`;
        setInsufficientStockError(errorMsg);
        
        const newLog: ScanLog = {
          id: `log-${Date.now()}`,
          type: "OUT",
          timestamp: new Date().toLocaleTimeString("id-ID"),
          itemName: item.name,
          weightKg: item.weightKg,
          qrId: item.qrId,
          targetDcName: targetDc.name,
          grade: item.grade,
          batchNo: item.batchNo,
          status: "INSUFFICIENT_STOCK",
          recipient: recipient
        };
        setScanLogs(prev => [newLog, ...prev]);
        setScanIntervalActive(false);
        return;
      }

      // Deduct stock
      onUpdateInventory(selectedDcId, -item.weightKg, item.name);
      playBeep(660, 0.12);
      setTimeout(() => playBeep(880, 0.15), 100); // happy double beep for success
    } else {
      // Incoming: add stock
      onUpdateInventory(selectedDcId, item.weightKg, item.name);
      playBeep(880, 0.15); // standard scan beep
    }

    // Save scan transaction log
    const newLog: ScanLog = {
      id: `log-${Date.now()}`,
      type: scannerMode,
      timestamp: new Date().toLocaleTimeString("id-ID"),
      itemName: item.name,
      weightKg: item.weightKg,
      qrId: item.qrId,
      targetDcName: targetDc.name,
      grade: item.grade,
      batchNo: item.batchNo,
      status: "SUCCESS",
      recipient: scannerMode === "OUT" ? recipient : undefined
    };

    setScanLogs(prev => [newLog, ...prev]);
    setScannedItem(item);
    setScanIntervalActive(false); // pause scanning for user feedback
  };

  // Handle uploaded QR Code image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);
          if (decoded && decoded.data) {
            handleDecodedPayload(decoded.data);
          } else {
            alert("Tidak ada Kode QR yang terdeteksi dalam foto ini. Pastikan foto QR tegak lurus dan cukup terang.");
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Restart scanning after success
  const handleRescan = () => {
    setScannedItem(null);
    setLastScannedPayload(null);
    setInsufficientStockError(null);
    setScanIntervalActive(true);
  };

  const selectedDc = dcs.find(d => d.id === selectedDcId) || dcs[0];

  return (
    <div ref={containerRef} className="relative flex flex-col space-y-6">
      
      {/* 1. standard (inline) layout view */}
      {!isFullscreenActive && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
          
          {/* LEFT SECTION (7 Cols): The Scanner View & Interactive Cam */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Header with Dual Mode Tabs */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-1 px-2.5 bg-red-100 text-red-700 font-mono text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Terminal Pos 3T Aktif
                </span>

                {/* Fullscreen Trigger Button */}
                <button
                  onClick={toggleFullscreenMode}
                  className="p-1.5 px-3 bg-indigo-50 hover:bg-indigo-150 border border-indigo-200 hover:border-indigo-300 text-indigo-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Layar Penuh (Fullscreen)</span>
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 bg-slate-200/60 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => {
                    setScannerMode("IN");
                    handleRescan();
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    scannerMode === "IN"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>📥 QR MASUK (IN)</span>
                </button>
                <button
                  onClick={() => {
                    setScannerMode("OUT");
                    handleRescan();
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    scannerMode === "OUT"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>📤 QR KELUAR (OUT)</span>
                </button>
              </div>

              <div className="mt-1">
                <h4 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <QrCode className={`w-5 h-5 ${scannerMode === "IN" ? "text-emerald-600" : "text-indigo-600"}`} />
                  {scannerMode === "IN" ? "Penerimaan Stok (QR In)" : "Pengeluaran Stok (QR Out)"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {scannerMode === "IN" 
                    ? "Registrasi otomatis beras masuk lumbung pos. Scan kode QR pada karung untuk menambah kapasitas."
                    : "Pencatatan distribusi beras untuk warga atau pos pembantu. Scan kode QR untuk mengurangi persediaan."}
                </p>
              </div>
            </div>

            {/* Step 1: Select Warehouse Target */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3.5 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Warehouse className="w-4 h-4 text-slate-500" />
                    <span>Pilih Gudang Logistik:</span>
                  </label>
                  <select
                    value={selectedDcId}
                    onChange={(e) => {
                      setSelectedDcId(e.target.value);
                      setLastScannedPayload(null);
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-2 font-semibold text-slate-800 outline-none transition-all"
                  >
                    {dcs.map((dc) => (
                      <option key={dc.id} value={dc.id}>
                        {dc.operator} ➜ {dc.name} ({(dc.riceInventoryKg / 1000).toFixed(1)}t)
                      </option>
                    ))}
                  </select>
                </div>

                {scannerMode === "OUT" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <span>Penerima / Alokasi:</span>
                    </label>
                    <select
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-2 font-semibold text-slate-800 outline-none transition-all"
                    >
                      <option value="Warga Setempat (Bantuan Sosial)">Warga Setempat (Bansos)</option>
                      <option value="Desa Sembalun (Pos Pembantu)">Desa Sembalun (Pos Pembantu)</option>
                      <option value="Desa Gili Islet (Pesisir)">Desa Gili Islet (Pesisir)</option>
                      <option value="Senggigi Coast (Operasi Pasar)">Senggigi Coast (Operasi Pasar)</option>
                      <option value="Warga Lansia & Dhuafa">Warga Lansia & Dhuafa</option>
                    </select>
                  </div>
                )}
              </div>

              {selectedDc && (
                <div className={`flex justify-between items-center text-[10px] font-mono border px-3 py-2 rounded-lg ${
                  scannerMode === "IN" 
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                    : "bg-indigo-50/50 border-indigo-100 text-indigo-800"
                }`}>
                  <span>Kapasitas Gudang: <b>{(selectedDc.riceInventoryKg / 1000).toFixed(1)}t</b> / {selectedDc.capacityKg / 1000}t</span>
                  <span className="bg-white px-2 py-0.5 rounded shadow-2xs font-bold text-[9px]">{selectedDc.operator} Operator</span>
                </div>
              )}
            </div>

            {/* Step 2: The Camera/Scanning Box */}
            <div className="relative bg-slate-950 border-2 border-slate-900 rounded-2xl aspect-video w-full overflow-hidden flex flex-col items-center justify-center shadow-md">
              
              {isCameraActive ? (
                <div className="absolute inset-0 w-full h-full">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    muted 
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning Target Box Interface overlay */}
                  {scanIntervalActive && (
                    <div className="absolute inset-0 border-4 border-black/40 flex items-center justify-center pointer-events-none">
                      <div className={`relative w-44 h-44 md:w-56 md:h-56 border-2 rounded-2xl flex items-center justify-center ${
                        scannerMode === "IN" ? "border-emerald-500" : "border-indigo-500"
                      }`}>
                        {/* Laser scanning bar effect */}
                        <div className={`absolute left-1 shadow-lg right-1 h-0.5 opacity-90 animate-infinite-laser rounded-full ${
                          scannerMode === "IN" ? "bg-emerald-400 shadow-emerald-500/50" : "bg-indigo-400 shadow-indigo-500/50"
                        }`} />
                        
                        {/* Visual markers */}
                        <span className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 -mt-1 -ml-1 rounded-tl-md ${scannerMode === "IN" ? "border-emerald-400" : "border-indigo-400"}`}></span>
                        <span className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 -mt-1 -mr-1 rounded-tr-md ${scannerMode === "IN" ? "border-emerald-400" : "border-indigo-400"}`}></span>
                        <span className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 -mb-1 -ml-1 rounded-bl-md ${scannerMode === "IN" ? "border-emerald-400" : "border-indigo-400"}`}></span>
                        <span className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 -mb-1 -mr-1 rounded-br-md ${scannerMode === "IN" ? "border-emerald-400" : "border-indigo-400"}`}></span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Scanned Result Card Feedback Overlay */}
              {scannedItem && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
                  <div className={`rounded-full p-2.5 animate-bounce shadow-lg text-white ${
                    scannerMode === "IN" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-500 shadow-indigo-500/20"
                  }`}>
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h5 className="text-white text-[15px] font-black mt-3 uppercase tracking-wider">
                    {scannerMode === "IN" ? "VERIFIED LOGISTICS ENTRY" : "DISTRIBUSI LOGISTIK VERIFIKASI"}
                  </h5>
                  <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-3.5 mt-3 space-y-1.5 text-slate-300 text-xs text-left leading-normal">
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="font-mono text-[9px] text-slate-500">KODE BATCH QR</span>
                      <span className="font-mono text-slate-400 text-[10px] font-bold">{scannedItem.qrId}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="font-sans text-slate-400">Komoditas:</span>
                      <span className="font-bold text-white text-right">{scannedItem.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Kuantitas</span>
                        <span className={`font-bold font-mono text-xs ${
                          scannerMode === "IN" ? "text-emerald-400" : "text-indigo-400"
                        }`}>
                          {scannerMode === "IN" ? `+${scannedItem.weightKg}` : `-${scannedItem.weightKg}`} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Grade Beras</span>
                        <span className="font-bold text-slate-300 text-xs">{scannedItem.grade}</span>
                      </div>
                    </div>
                    {scannerMode === "OUT" && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/50 mt-1 flex justify-between">
                        <span>Penerima Alokasi:</span>
                        <span className="font-bold text-white">{recipient}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 pt-1 text-center">
                      Operasi lumbung pada <span className="text-slate-300 font-bold">{selectedDc?.name}</span> sukses.
                    </div>
                  </div>
                  <button
                    onClick={handleRescan}
                    className={`mt-4 text-white text-xs font-bold font-sans py-2 px-5 rounded-lg transition-all active:scale-95 uppercase tracking-wider ${
                      scannerMode === "IN" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    Scan Barang Berikutnya
                  </button>
                </div>
              )}

              {/* Error: Insufficient Stock Warning Overlay */}
              {insufficientStockError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
                  <div className="bg-rose-500 text-white rounded-full p-2.5 animate-pulse shadow-lg">
                    <Ban className="w-8 h-8" />
                  </div>
                  <h5 className="text-white text-[14px] font-black mt-3 text-rose-500">⚠️ TRANSAKSI BLOCKED</h5>
                  <p className="text-xs text-slate-300 max-w-sm mt-2 leading-relaxed">
                    {insufficientStockError}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Silakan pilih lumbung lain, kurangi jumlah pengeluaran, atau isi ulang stok terlebih dahulu.
                  </p>
                  <button
                    onClick={handleRescan}
                    className="mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all"
                  >
                    Atur Ulang Scanner
                  </button>
                </div>
              )}

              {/* Error: Unregistered barcode */}
              {!scannedItem && !insufficientStockError && !scanIntervalActive && lastScannedPayload && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
                  <div className="bg-rose-500 text-white rounded-full p-2.5 animate-pulse shadow-lg">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h5 className="text-white text-[14px] font-black mt-3">KODE QR TIDAK TERDAFTAR</h5>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 leading-normal">
                    Format kode QR ini tidak dikenal oleh basis data pangan Koperasi Merah Putih. Pastikan menggunakan QR standar pasokan.
                  </p>
                  <div className="bg-slate-900 border border-slate-800 rounded p-2 text-[10px] font-mono text-rose-400 mt-3 truncate max-w-sm">
                    Isi QR: {lastScannedPayload}
                  </div>
                  <button
                    onClick={handleRescan}
                    className="mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all"
                  >
                    Reset Sistem Scanner
                  </button>
                </div>
              )}

              {/* Camera Offline Screen */}
              {!isCameraActive && !scannedItem && !insufficientStockError && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                    <Camera className="w-8 h-8 text-slate-500" />
                  </div>
                  <div>
                    <span className="text-slate-300 text-xs font-bold block">Kamera Scanner Offline</span>
                    <span className="text-[11px] text-slate-500 mt-1 max-w-sm block leading-normal">
                      Membutuhkan izin webcam. Aktifkan modul kamera di terminal pos untuk memindai karung beras secara instan.
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => startCamera(false)}
                      className={`text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow ${
                        scannerMode === "IN" 
                          ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" 
                          : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Aktifkan Kamera Live</span>
                    </button>
                    
                    <label className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                      <FileImage className="w-4 h-4 text-slate-400" />
                      <span>Unggah Foto QR</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Camera Active Control Overlay */}
              {isCameraActive && scanIntervalActive && (
                <div className="absolute bottom-3 right-3 left-3 flex justify-between items-center z-10 bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded-xl p-2.5">
                  <span className={`text-[10px] font-mono flex items-center gap-1.5 pl-1.5 tracking-tight font-extrabold animate-pulse ${
                    scannerMode === "IN" ? "text-emerald-400" : "text-indigo-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${scannerMode === "IN" ? "bg-emerald-500" : "bg-indigo-500"}`} />
                    PEMINDAIAN KAMERA AKTIF ({scannerMode})
                  </span>
                  <button
                    onClick={stopCamera}
                    className="bg-slate-800 hover:bg-slate-700 text-rose-400 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all uppercase tracking-wide cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" /> Stop Kamera
                  </button>
                </div>
              )}

              {/* Camera access errors */}
              {cameraError && (
                <div className="absolute top-2 left-2 right-2 bg-rose-950/90 border border-rose-800 rounded-lg p-2.5 text-rose-200 text-[10px] flex gap-2 items-start z-10 shadow-lg leading-normal animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <div>
                    <span className="font-bold">Kamera Terblokir:</span>
                    <p className="opacity-90">{cameraError}</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SECTION (5 Cols): Interactive Printing Simulator & Audit Logs */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            
            {/* Simulation Station */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
              <div>
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <QrCode className={`w-3.5 h-3.5 ${scannerMode === "IN" ? "text-emerald-600" : "text-indigo-600"}`} />
                  Simulator Cetak & Barcode ({scannerMode === "IN" ? "Masuk" : "Keluar"})
                </h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                  Pilih karung beras untuk simulasi transaksi instan tanpa membuka kamera perangkat.
                </p>
              </div>

              <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                {DEMO_QR_ITEMS.map((item) => {
                  const qrPayload = getQrPayload(item);
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrPayload)}&bgcolor=fafafa&color=0f172a`;

                  return (
                    <div 
                      key={item.qrId} 
                      className="group relative flex gap-3 border border-slate-150 p-2.5 rounded-xl hover:border-slate-300 transition-all bg-slate-50/50 hover:bg-white"
                    >
                      {/* QR Preview representation */}
                      <div className="w-15 h-15 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                        <img 
                          src={qrUrl} 
                          alt="QR Code" 
                          className="w-full h-full object-contain mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/65 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-none">
                          <span className={`text-[7px] font-mono font-bold tracking-tight ${
                            scannerMode === "IN" ? "text-emerald-400" : "text-indigo-400"
                          }`}>{scannerMode === "IN" ? "SCAN IN" : "SCAN OUT"}</span>
                        </div>
                      </div>

                      {/* Specification metadata */}
                      <div className="flex-1 flex flex-col justify-between text-[11px] h-15">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-900 leading-tight block truncate max-w-[120px]">{item.name}</span>
                            <span className={`font-mono text-[9px] font-black shrink-0 ${
                              scannerMode === "IN" ? "text-emerald-600" : "text-indigo-600"
                            }`}>{scannerMode === "IN" ? `+${item.weightKg}` : `-${item.weightKg}`}kg</span>
                          </div>
                          <span className="text-[9px] text-slate-400 block line-clamp-1">{item.supplier}</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-slate-100 pt-1 mt-1">
                          <span className="font-mono text-[8px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-semibold">{item.batchNo}</span>
                          
                          <button
                            onClick={() => {
                              setInsufficientStockError(null);
                              processStockTransaction(item);
                            }}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex items-center gap-0.5 transition-all active:scale-95 shrink-0 cursor-pointer ${
                              scannerMode === "IN" 
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200" 
                                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200"
                            }`}
                          >
                            Simulasi Scan <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Log / Scanned History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex-1 flex flex-col justify-between shadow-sm">
              <div>
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <History className="w-4 h-4 text-slate-500" /> Riwayat Transaksi Pos Desa
                </h5>
                
                <div className="space-y-2 mt-2 max-h-[170px] overflow-y-auto pr-1 text-[11px]">
                  {scanLogs.length === 0 ? (
                    <div className="text-center py-6 text-slate-450 text-xs flex flex-col items-center gap-1">
                      <PackageOpen className="w-8 h-8 text-slate-300" />
                      Belum ada pemindaian tercatat
                    </div>
                  ) : (
                    scanLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex justify-between items-start border-l-2 p-1.5 pl-2.5 bg-slate-50/50 rounded-r-lg ${
                          log.status === "INSUFFICIENT_STOCK"
                            ? "border-rose-500"
                            : log.status === "VERIFY_FAILED"
                            ? "border-amber-400"
                            : log.type === "IN"
                            ? "border-emerald-500"
                            : "border-indigo-500"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 leading-snug">{log.itemName}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="font-bold">Lumbung: {log.targetDcName.replace(" BULOG Warehouse", "").replace(" SCM Food Hub", "").replace(" BAPANAS Outpost", "")}</span>
                              <span className="text-slate-300">•</span>
                              <span>Batch: {log.batchNo}</span>
                            </div>
                            {log.recipient && (
                              <div className="text-slate-600">
                                Penerima: <span className="font-semibold text-slate-700">{log.recipient}</span>
                              </div>
                            )}
                            {log.status === "INSUFFICIENT_STOCK" && (
                              <div className="text-rose-600 font-bold font-mono text-[8px] uppercase">
                                ❌ GAGAL: STOK TIDAK CUKUP
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-mono text-[9px] font-bold block ${
                            log.status === "INSUFFICIENT_STOCK"
                              ? "text-rose-500 line-through"
                              : log.type === "IN"
                              ? "text-emerald-600"
                              : "text-indigo-600"
                          }`}>
                            {log.type === "IN" ? "+" : "-"}{log.weightKg} kg
                          </span>
                          <span className="font-mono text-[8px] text-slate-400">{log.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[9px] text-slate-400 text-center flex items-center justify-center gap-1 font-mono">
                <span>Registrasi POS tervalidasi enkripsi lokal.</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. FULLSCREEN IMMERSIVE SCANNER VIEW OVERLAY (DESIGNED ESPECIALLY FOR VILLAGERS) */}
      {isFullscreenActive && (
        <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col text-white p-6 md:p-8 animate-fadeIn font-sans select-none pointer-events-auto">
          
          {/* Header Row */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-4 gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 px-3 bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                  🖥️ MODE MONITOR FULLSCREEN (OUTGOING DISTRIBUTION)
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight mt-1 text-white flex items-center gap-2">
                <QrCode className="w-6 h-6 text-indigo-400" />
                Terminal Distribusi Mandiri Warga Desa
              </h1>
              <p className="text-xs text-slate-400">
                Pencatatan beras bantuan pangan langsung di desa. Sangat mudah digunakan oleh siapa saja.
              </p>
            </div>

            <div className="flex gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
              {/* Back to normal screen toggle */}
              <button
                onClick={toggleFullscreenMode}
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Minimize2 className="w-4 h-4 text-rose-400" />
                <span>Tutup Layar Penuh (Keluar)</span>
              </button>
            </div>
          </header>

          {/* Grid Layout inside Fullscreen */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
            
            {/* Left 7 Columns: Video Stream or Scanned Success Card (HUGE AND NOTICEABLE) */}
            <div className="lg:col-span-7 flex flex-col space-y-4 overflow-hidden h-full">
              
              {/* Selection Fields for villagers (large sizes) */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Warehouse className="w-4 h-4 text-indigo-400" />
                    <span>Lumbung Pengirim (Depot):</span>
                  </label>
                  <select
                    value={selectedDcId}
                    onChange={(e) => {
                      setSelectedDcId(e.target.value);
                      setLastScannedPayload(null);
                    }}
                    className="w-full text-sm bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-3 font-bold text-white outline-none transition-all"
                  >
                    {dcs.map((dc) => (
                      <option key={dc.id} value={dc.id} className="text-slate-950">
                        {dc.operator} - {dc.name} ({(dc.riceInventoryKg / 1000).toFixed(1)} Ton Tersisa)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>Penerima Manfaat / Kelompok:</span>
                  </label>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full text-sm bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-3 font-bold text-white outline-none transition-all"
                  >
                    <option value="Warga Setempat (Bantuan Sosial)" className="text-slate-950">Warga Setempat (Bansos)</option>
                    <option value="Desa Sembalun (Pos Pembantu)" className="text-slate-950">Desa Sembalun (Pos Pembantu)</option>
                    <option value="Desa Gili Islet (Pesisir)" className="text-slate-950">Desa Gili Islet (Pesisir)</option>
                    <option value="Senggigi Coast (Operasi Pasar)" className="text-slate-950">Senggigi Coast (Operasi Pasar)</option>
                    <option value="Warga Lansia & Dhuafa" className="text-slate-950">Warga Lansia & Dhuafa</option>
                  </select>
                </div>
              </div>

              {/* Huge Scanning Stage Box */}
              <div className="flex-1 bg-black border-2 border-slate-800 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center min-h-[300px]">
                
                {isCameraActive ? (
                  <div className="absolute inset-0 w-full h-full">
                    <video 
                      ref={videoFullscreenRef} 
                      className="w-full h-full object-cover" 
                      muted 
                      playsInline
                    />
                    
                    {/* Pulsing scanning guide overlay */}
                    {scanIntervalActive && (
                      <div className="absolute inset-0 border-8 border-black/50 flex flex-col items-center justify-center pointer-events-none">
                        <div className="relative w-64 h-64 md:w-80 md:h-80 border-4 border-indigo-400 rounded-3xl flex items-center justify-center animate-pulse">
                          <div className="absolute left-1 shadow-2xl shadow-indigo-500/50 right-1 h-1 bg-indigo-400 rounded-full animate-infinite-laser" />
                          
                          <span className="absolute top-0 left-0 w-8 h-8 border-t-8 border-l-8 border-indigo-400 -mt-2 -ml-2 rounded-tl-xl"></span>
                          <span className="absolute top-0 right-0 w-8 h-8 border-t-8 border-r-8 border-indigo-400 -mt-2 -mr-2 rounded-tr-xl"></span>
                          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-8 border-l-8 border-indigo-400 -mb-2 -ml-2 rounded-bl-xl"></span>
                          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-8 border-r-8 border-indigo-400 -mb-2 -mr-2 rounded-br-xl"></span>
                        </div>
                        <div className="bg-slate-950/90 text-indigo-300 font-mono text-[11px] px-4 py-2 rounded-xl mt-6 font-bold tracking-widest border border-slate-800 animate-pulse text-center">
                          PASTIKAN KODE QR BERADA DI DALAM KOTAK PENYELARASAN
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Massive Scanned Success Screen (Indonesian and Highly Visual) */}
                {scannedItem && (
                  <div className="absolute inset-0 bg-indigo-950/98 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn overflow-y-auto">
                    <div className="bg-emerald-500 text-white rounded-full p-4 animate-bounce shadow-xl shadow-emerald-500/30">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-white text-xl md:text-2xl font-black mt-4 tracking-wide uppercase">
                      ✅ BARANG KELUAR BERHASIL TERVERIFIKASI
                    </h2>
                    <p className="text-xs text-indigo-200 mt-1 uppercase tracking-widest font-mono">
                      LOGISTIK STOK TELAH BERKURANG SECARA OTOMATIS
                    </p>

                    <div className="w-full max-w-lg bg-slate-950 border-2 border-indigo-850 rounded-2xl p-5 mt-4 space-y-3.5 text-slate-300 text-sm text-left">
                      <div className="flex justify-between border-b border-indigo-900 pb-2">
                        <span className="font-mono text-xs text-indigo-400">PENGIRIM (DEPOT)</span>
                        <span className="font-bold text-white text-right">{selectedDc?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-900 pb-2">
                        <span className="font-mono text-xs text-indigo-400">PENERIMA ALOKASI</span>
                        <span className="font-bold text-white text-right">{recipient}</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-900 pb-2">
                        <span className="font-sans text-indigo-300">Komoditas Keluar:</span>
                        <span className="font-bold text-white text-right text-base">{scannedItem.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/80 px-4 py-3 rounded-xl border border-indigo-950">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Beban Distribusi</span>
                          <span className="font-bold font-mono text-indigo-400 text-lg">-{scannedItem.weightKg} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Grade Mutu</span>
                          <span className="font-bold text-slate-200 text-lg">{scannedItem.grade}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-indigo-300 text-center font-semibold pt-1">
                        Sisa stok di lumbung saat ini: <span className="text-white font-bold">{((selectedDc?.riceInventoryKg || 0) / 1000).toFixed(2)} Ton</span>
                      </div>
                    </div>

                    <button
                      onClick={handleRescan}
                      className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-wider cursor-pointer"
                    >
                      Pindai Karung Selanjutnya
                    </button>
                  </div>
                )}

                {/* Massive Insufficient Stock Warning Card */}
                {insufficientStockError && (
                  <div className="absolute inset-0 bg-slate-950/98 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
                    <div className="bg-rose-500 text-white rounded-full p-4 animate-pulse shadow-xl shadow-rose-500/20">
                      <Ban className="w-12 h-12" />
                    </div>
                    <h2 className="text-rose-500 text-xl md:text-2xl font-black mt-4 uppercase tracking-wide">
                      🛑 GAGAL: STOK TIDAK CUKUP
                    </h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1">
                      JUMLAH BARANG KELUAR MELEBIHI PERSEDIAAN GUDANG
                    </p>

                    <div className="w-full max-w-md bg-slate-900 border-2 border-rose-900 p-5 rounded-2xl mt-4 space-y-2 text-slate-200 text-xs md:text-sm text-left">
                      <p className="font-semibold text-rose-200 leading-relaxed text-center">
                        {insufficientStockError}
                      </p>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 mt-2">
                        💡 <b>Saran Tindakan:</b> Hubungi koordinator desa untuk melakukan re-routing atau pengisian lumbung (restock) guna menjaga ketersediaan cadangan pangan di wilayah ini.
                      </div>
                    </div>

                    <button
                      onClick={handleRescan}
                      className="mt-6 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3.5 px-6 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                    >
                      Ulangi Pemindaian
                    </button>
                  </div>
                )}

                {/* Massive Unknown QR Code scanned */}
                {!scannedItem && !insufficientStockError && !scanIntervalActive && lastScannedPayload && (
                  <div className="absolute inset-0 bg-slate-950/98 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
                    <div className="bg-amber-500 text-white rounded-full p-4 animate-bounce shadow-lg">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                    <h2 className="text-white text-lg md:text-xl font-black mt-4">KODE QR BARANG TIDAK DIKENAL</h2>
                    <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
                      Sistem penimbangan terpadu tidak mengenali data karung ini. Periksa kembali jenis cetakan kode QR lumbung.
                    </p>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-400 mt-4 truncate max-w-md">
                      Data QR: {lastScannedPayload}
                    </div>
                    <button
                      onClick={handleRescan}
                      className="mt-6 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
                    >
                      Coba Pindai Ulang
                    </button>
                  </div>
                )}

                {/* Fullscreen Offline Block */}
                {!isCameraActive && !scannedItem && !insufficientStockError && (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-indigo-900 flex items-center justify-center text-indigo-400 shadow-inner">
                      <Camera className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-white text-lg font-bold">Kamera Pengeluaran Belum Aktif</h2>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Harap aktifkan kamera untuk memindai karung beras distribusi bantuan pangan.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <button
                        onClick={() => startCamera(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/35 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Aktifkan Kamera Laptop / HP</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Floating controls inside Fullscreen Live */}
                {isCameraActive && scanIntervalActive && (
                  <div className="absolute bottom-4 right-4 left-4 flex justify-between items-center z-10 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                    <span className="text-indigo-400 text-xs font-mono flex items-center gap-2 pl-2 tracking-wider font-extrabold animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      TERMINAL SCAN LIVE KELUAR AKTIF (OUT)
                    </span>
                    <button
                      onClick={stopCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all uppercase tracking-wide cursor-pointer"
                    >
                      <CameraOff className="w-4 h-4" /> Matikan Kamera
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Right 5 Columns: Massive Simulator List for easy scanning (HUGE FONTS) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-hidden h-full">
              
              <div className="space-y-4 overflow-hidden flex flex-col h-full">
                <div>
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Simulasi Cepat (Tanpa Kamera)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Silakan klik salah satu jenis beras di bawah untuk mensimulasikan pemindaian instan karung keluar.
                  </p>
                </div>

                {/* Large Simulator List */}
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[150px]">
                  {DEMO_QR_ITEMS.map((item) => {
                    return (
                      <div
                        key={`full-${item.qrId}`}
                        onClick={() => {
                          setInsufficientStockError(null);
                          processStockTransaction(item);
                        }}
                        className="group flex justify-between items-center bg-slate-950 border border-slate-800 p-3.5 rounded-xl hover:bg-slate-850 hover:border-indigo-800 transition-all cursor-pointer"
                      >
                        <div className="space-y-1">
                          <span className="font-extrabold text-white text-xs block leading-tight">{item.name}</span>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 font-mono">
                            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold">{item.batchNo}</span>
                            <span>Grade: {item.grade}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-indigo-400">-{item.weightKg} kg</span>
                          <div className="p-1 px-2.5 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded text-[10px] font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all uppercase tracking-wide">
                            PILIH ➜
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status footer for villagers */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 shrink-0 font-mono">
                <span>📍 Koperasi Merah Putih NTB</span>
                <span>ID: LUMBUNG-3T-SECURE-V1</span>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
