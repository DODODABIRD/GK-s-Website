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
  ArrowRight
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
  timestamp: string;
  itemName: string;
  weightKg: number;
  qrId: string;
  targetDcName: string;
  grade: string;
  batchNo: string;
  status: "SUCCESS" | "VERIFY_FAILED";
}

export default function QrInventoryScanner({ dcs, onUpdateInventory }: QrInventoryScannerProps) {
  // Config
  const [selectedDcId, setSelectedDcId] = useState<string>(dcs[0]?.id || "");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedItem, setScannedItem] = useState<QrItem | null>(null);
  const [lastScannedPayload, setLastScannedPayload] = useState<string | null>(null);
  const [scanIntervalActive, setScanIntervalActive] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([
    {
      id: "log-init-1",
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

  // Audio Beep Generator using Web Audio API for extreme polish
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = 880; // High frequency beep
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

  // Video and Canvas references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
  const startCamera = async () => {
    setCameraError(null);
    setScannedItem(null);
    setLastScannedPayload(null);
    
    try {
      const constraints = {
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS
        videoRef.current.play();
        setIsCameraActive(true);
        setScanIntervalActive(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Permission Denied. Please grant camera access in your browser settings to scan standard QR codes."
          : `Unavailable: ${err.message || "No camera device detected on this system."}`
      );
      setIsCameraActive(false);
    }
  };

  // Trigger effect to clean up streams on unmount
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

      const video = videoRef.current;
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
  }, [isCameraActive, scanIntervalActive, selectedDcId]);

  // Handle scanned raw payload (JSON string or item ID)
  const handleDecodedPayload = (payload: string) => {
    // Prevent double scanning of the same item in quick succession
    if (payload === lastScannedPayload) return;
    setLastScannedPayload(payload);

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
        playBeep();
        processInventoryAdd(matchedItem);
        // Playful visual toast and stop the camera feedback
        setScannedItem(matchedItem);
        setScanIntervalActive(false); // pause scanning for user feedback
      } else {
        // Unknown QR Code scanned
        playBeep();
        const unverifiedID = payload.length > 25 ? `${payload.substring(0, 22)}...` : payload;
        const targetDc = dcs.find(d => d.id === selectedDcId);
        
        const newLog: ScanLog = {
          id: `log-${Date.now()}`,
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
  const processInventoryAdd = (item: QrItem) => {
    const targetDc = dcs.find(d => d.id === selectedDcId);
    if (!targetDc) return;

    // Dispatch weight additions
    onUpdateInventory(selectedDcId, item.weightKg, item.name);

    // Save scan transaction log
    const newLog: ScanLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("id-ID"),
      itemName: item.name,
      weightKg: item.weightKg,
      qrId: item.qrId,
      targetDcName: targetDc.name,
      grade: item.grade,
      batchNo: item.batchNo,
      status: "SUCCESS"
    };

    setScanLogs(prev => [newLog, ...prev]);
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
            alert("No valid QR Code could be detected in this photo. Please upload a clear, high-contrast QR image.");
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
    setScanIntervalActive(true);
  };

  const selectedDc = dcs.find(d => d.id === selectedDcId) || dcs[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      
      {/* LEFT SECTION (7 Cols): The Scanner View & Interactive Cam */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-red-100 text-red-700 font-mono text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Live QR-Link Enabled
            </span>
          </div>
          <h4 className="text-base font-black text-slate-900 mt-1 tracking-tight flex items-center gap-1.5">
            <QrCode className="w-5 h-5 text-emerald-600" /> Stockpile QR Intake Scanner
          </h4>
          <p className="text-xs text-slate-500">
            Automate grain delivery registrations. Scan bag QR codes at Bulog outposts to adjust active supply buffers instantly.
          </p>
        </div>

        {/* Step 1: Select Warehouse Target */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-600" />
            <span>Target Depot / Warehouse Penampung:</span>
          </label>
          <select
            value={selectedDcId}
            onChange={(e) => {
              setSelectedDcId(e.target.value);
              // Clean previous scans to permit reindexing if needed
              setLastScannedPayload(null);
            }}
            className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 font-sans font-semibold text-slate-800 outline-none transition-all"
          >
            {dcs.map((dc) => (
              <option key={dc.id} value={dc.id}>
                {dc.operator} ➜ {dc.name} ({Math.round((dc.riceInventoryKg / dc.capacityKg) * 100)}% Filled)
              </option>
            ))}
          </select>

          {selectedDc && (
            <div className="flex justify-between items-center text-[10px] font-mono bg-emerald-50/50 border border-emerald-100/80 px-3 py-2 rounded-lg text-emerald-800">
              <span>Holding Stock: <b>{(selectedDc.riceInventoryKg / 1000).toFixed(1)}t</b> / {selectedDc.capacityKg / 1000}t</span>
              <span className="bg-emerald-200/50 text-emerald-900 font-bold px-2 py-0.5 rounded-full">{selectedDc.operator} Operator</span>
            </div>
          )}
        </div>

        {/* Step 2: The Camera/Scanning Box */}
        <div className="relative bg-slate-950 border-2 border-slate-900 rounded-2xl aspect-video w-full overflow-hidden flex flex-col items-center justify-center shadow-md">
          
          {/* Active Canvas / Stream View */}
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
                  <div className="relative w-44 h-44 md:w-56 md:h-56 border-2 border-emerald-500 rounded-2xl flex items-center justify-center">
                    {/* Laser scanning bar effect */}
                    <div className="absolute left-1 shadow-lg shadow-emerald-500/50 right-1 h-0.5 bg-emerald-400 opacity-90 animate-infinite-laser rounded-full" />
                    
                    {/* Visual markers */}
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-md"></span>
                    <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-md"></span>
                    <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-md"></span>
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-md"></span>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Scanned Result Card Feedback Overlay */}
          {scannedItem && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
              <div className="bg-emerald-500 text-white rounded-full p-2.5 animate-bounce shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h5 className="text-white text-[15px] font-black mt-3 flex items-center gap-1.5">
                VERIFIED LOGISTICS ENTRY
              </h5>
              <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-3.5 mt-3 space-y-1.5 text-slate-300 text-xs text-left leading-normal">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="font-mono text-[9px] text-slate-500">QR BATCH</span>
                  <span className="font-mono text-slate-400 text-[10px] font-bold">{scannedItem.qrId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="font-sans text-slate-400">Komoditas:</span>
                  <span className="font-bold text-white text-right">{scannedItem.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Kuantitas</span>
                    <span className="font-bold font-mono text-emerald-400 text-xs">+{scannedItem.weightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Grade</span>
                    <span className="font-bold text-slate-300 text-xs">{scannedItem.grade}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 text-center">
                  Successfully stored into <span className="text-slate-300 font-bold">{selectedDc?.name}</span>
                </div>
              </div>
              <button
                onClick={handleRescan}
                className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-sans py-2 px-5 rounded-lg transition-all shadow shadow-emerald-500/20 active:scale-95 uppercase tracking-wider"
              >
                Scan Next Item
              </button>
            </div>
          )}

          {/* Last QR scan was unregistered payload */}
          {!scannedItem && !scanIntervalActive && lastScannedPayload && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
              <div className="bg-rose-500 text-white rounded-full p-2.5 animate-pulse shadow-lg">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h5 className="text-white text-[14px] font-black mt-3">UNREGISTERED SCM BARCODE</h5>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                The payload scanned does not map to any recognized Koperasi Merah Putih stockpile specification database.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded p-2 text-[10px] font-mono text-rose-450 text-rose-400 mt-3 truncate max-w-sm">
                Payload: {lastScannedPayload}
              </div>
              <button
                onClick={handleRescan}
                className="mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all"
              >
                Sistem Reset Scanner
              </button>
            </div>
          )}

          {/* Blank Screen Camera controller state */}
          {!isCameraActive && !scannedItem && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                <Camera className="w-8 h-8 text-slate-500" />
              </div>
              <div>
                <span className="text-slate-300 text-xs font-bold block">Live Camera Scanner Offline</span>
                <span className="text-[11px] text-slate-500 mt-1 max-w-sm block leading-normal">
                  Requires webcam access permissions. Activate camera block to scan real stockpiles or drops during delivery audits.
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={startCamera}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow shadow-emerald-500/20"
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

          {/* Scanning Box controls */}
          {isCameraActive && scanIntervalActive && (
            <div className="absolute bottom-3 right-3 left-3 flex justify-between items-center z-10 bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded-xl p-2.5">
              <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1.5 pl-1.5 tracking-tight font-extrabold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> SCANNING LIVE FRAME
              </span>
              <button
                onClick={stopCamera}
                className="bg-slate-800 hover:bg-slate-700 text-rose-400 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all uppercase tracking-wide"
              >
                <CameraOff className="w-3.5 h-3.5" /> Stop Kamera
              </button>
            </div>
          )}

          {/* Camera feedback errors */}
          {cameraError && (
            <div className="absolute top-2 left-2 right-2 bg-rose-950/90 border border-rose-800 rounded-lg p-2.5 text-rose-200 text-[10px] flex gap-2 items-start z-10 font-sans shadow-lg leading-normal">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <div>
                <span className="font-bold">Camera Blocked or Unavailable:</span>
                <p className="opacity-90">{cameraError}</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT SECTION (5 Cols): Printable Station & Audit Logs */}
      <div className="lg:col-span-5 flex flex-col space-y-5">
        
        {/* Printable/模擬 Demo Station */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
          <div>
            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" /> Simulator Intake & QR Printing
            </h5>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
              Click <b>Simulate Scan</b> below to instantly process rice additions inside your current target warehouse without opening a webcam feed.
            </p>
          </div>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
            {DEMO_QR_ITEMS.map((item) => {
              const qrPayload = getQrPayload(item);
              // Standard sharp Google Charts / QRServer chart API generator URL for sharp display
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrPayload)}&bgcolor=fafafa&color=0f172a`;

              return (
                <div 
                  key={item.qrId} 
                  className="group relative flex gap-3 border border-slate-150 p-2.5 rounded-xl hover:border-slate-300 transition-all bg-slate-50/50 hover:bg-white"
                >
                  {/* High Definition QR Image representation */}
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                    <img 
                      src={qrUrl} 
                      alt="QR Code" 
                      className="w-full h-full object-contain mix-blend-multiply" 
                      referrerPolicy="no-referrer"
                    />
                    {/* Visual zoom frame tool-holder */}
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/65 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-none">
                      <span className="text-[7px] text-emerald-400 font-mono font-bold tracking-tight">SCAN ME</span>
                    </div>
                  </div>

                  {/* Specification metadata */}
                  <div className="flex-1 flex flex-col justify-between text-[11px] h-16">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 leading-tight block truncate max-w-[130px]">{item.name}</span>
                        <span className="font-mono text-[9px] font-black text-emerald-600 shrink-0">+{item.weightKg}kg</span>
                      </div>
                      <span className="text-[9px] text-slate-450 text-slate-400 block line-clamp-1">{item.supplier}</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-slate-100 pt-1">
                      <span className="font-mono text-[8px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-semibold">{item.batchNo}</span>
                      
                      <button
                        onClick={() => {
                          playBeep();
                          processInventoryAdd(item);
                          setScannedItem(item);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5 transition-all active:scale-95 shrink-0"
                      >
                        Simulate Scan <ArrowRight className="w-2.5 h-2.5" />
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
              <History className="w-4 h-4 text-slate-500" /> Scanned Log Receipts
            </h5>
            
            <div className="space-y-2.5 mt-2.5 max-h-[170px] overflow-y-auto pr-1 text-[11px]">
              {scanLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-450 text-xs flex flex-col items-center gap-1">
                  <PackageOpen className="w-8 h-8 text-slate-300" />
                  No scanner entries found
                </div>
              ) : (
                scanLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-start border-l-2 p-1.5 pl-2.5 bg-slate-50/50 rounded-r-lg border-emerald-500">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{log.itemName}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 space-x-1.5 font-sans">
                        <span>Depot: <b>{log.targetDcName.replace(" BULOG Warehouse", "").replace(" SCM Food Hub", "").replace(" BAPANAS Outpost", "")}</b></span>
                        <span className="text-slate-350">•</span>
                        <span>Batch: {log.batchNo}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[9px] font-bold text-slate-800 block">+{log.weightKg} kg</span>
                      <span className="font-mono text-[8px] text-slate-400">{log.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[9px] text-slate-400 text-center flex items-center justify-center gap-1 font-mono">
            <span>Audit trail digitally checksummed. Data persists locally.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
