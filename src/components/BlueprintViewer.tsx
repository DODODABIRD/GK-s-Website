/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { POSTGRES_DDL, PYTHON_FLASK_API, MAPBOX_REACT_BLUEPRINT } from "../data";
import { Check, Copy, Code2, Database, Terminal, FileCode, CheckCircle, Info } from "lucide-react";

export default function BlueprintViewer() {
  const [activeSubTab, setActiveSubTab] = useState<"SQL" | "FLASK" | "MAPBOX">("SQL");
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    let textToCopy = "";
    if (activeSubTab === "SQL") textToCopy = POSTGRES_DDL;
    else if (activeSubTab === "FLASK") textToCopy = PYTHON_FLASK_API;
    else if (activeSubTab === "MAPBOX") textToCopy = MAPBOX_REACT_BLUEPRINT;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="blueprints-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Blueprint Subheaders */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-900 text-white rounded-lg">
              <Code2 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Cetak Biru Arsitektur SCM</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rancangan SQL, Python, dan React siap pakai untuk memetakan data geospasial demi ketahanan pangan pedesaan secara presisi.
          </p>
        </div>

        {/* Copy Indicator */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
          id="copy-blueprint-btn"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
              <span className="text-emerald-700">Salin Berhasil!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Salin Semua Kode</span>
            </>
          )}
        </button>
      </div>

      {/* Code Tab select Buttons */}
      <div className="flex border-b border-slate-100 bg-slate-50/30 p-2 gap-1 overflow-x-auto">
        <button
          id="btn-subtab-sql"
          onClick={() => setActiveSubTab("SQL")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "SQL"
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50 font-bold"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/50"
          }`}
        >
          <Database className={`w-4 h-4 ${activeSubTab === "SQL" ? "text-emerald-500" : "text-slate-400"}`} />
          <span>1. Skema Postgres + PostGIS (DDL)</span>
        </button>

        <button
          id="btn-subtab-flask"
          onClick={() => setActiveSubTab("FLASK")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "FLASK"
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50 font-bold"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/50"
          }`}
        >
          <Terminal className={`w-4 h-4 ${activeSubTab === "FLASK" ? "text-emerald-500" : "text-slate-400"}`} />
          <span>2. Rute API Python Flask</span>
        </button>

        <button
          id="btn-subtab-mapbox"
          onClick={() => setActiveSubTab("MAPBOX")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "MAPBOX"
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50 font-bold"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/50"
          }`}
        >
          <FileCode className={`w-4 h-4 ${activeSubTab === "MAPBOX" ? "text-emerald-500" : "text-slate-400"}`} />
          <span>3. Komponen React Mapbox GL JS</span>
        </button>
      </div>

      {/* Main Panel Content split with Explanatory guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-4 flex-1 min-h-0 overflow-y-auto">
        
        {/* Code Output Screen */}
        <div className="lg:col-span-3 p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-auto max-h-[500px] border-r border-slate-200 flex flex-col">
          <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-t-lg border-b border-slate-800 text-slate-400 font-sans font-medium text-[10px]">
            <span>{activeSubTab === "SQL" ? "schema.sql" : activeSubTab === "FLASK" ? "api_routes.py" : "MapboxControlTower.tsx"}</span>
            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-[#38BDF8] uppercase tracking-wider font-bold">
              {activeSubTab === "SQL" ? "PostgreSQL + PostGIS" : activeSubTab === "FLASK" ? "Python 3" : "TypeScript React"}
            </span>
          </div>
          <pre className="p-4 bg-slate-950 rounded-b-lg overflow-x-auto leading-relaxed select-all text-[11px]">
            {activeSubTab === "SQL" && POSTGRES_DDL}
            {activeSubTab === "FLASK" && PYTHON_FLASK_API}
            {activeSubTab === "MAPBOX" && MAPBOX_REACT_BLUEPRINT}
          </pre>
        </div>

        {/* Integration Explanation Cards */}
        <div className="p-6 bg-slate-50 flex flex-col gap-5 justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 font-mono">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Aliran Arsitektur</span>
            </h3>

            {activeSubTab === "SQL" && (
              <div className="space-y-3.5 text-xs text-slate-600">
                <p>
                  <strong>Indeks Spasial:</strong> Penyusunan geometri melalui indeks standar <code>GIST</code> membuat kueri dan lookup koordinat fisik 1000x lebih cepat di dalam PostgreSQL.
                </p>
                <p>
                  <strong>Otomatisasi Trigger:</strong> Database menghitung estimasi agregat kebutuhan kalori pangan secara otomatis berdasarkan angka sensus penduduk pada setiap penambahan data pos baru.
                </p>
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3">
                  <span className="font-bold text-emerald-800 text-[11px] block mb-1">💡 Tip Perintah Postgres</span>
                  <pre className="font-mono text-[10px] text-emerald-700 bg-white/80 p-1.5 rounded">CREATE EXTENSION postgis;</pre>
                  <p className="text-[10px] text-emerald-800 mt-1 pb-1">Jalankan perintah ini di konsol publik sebelum mengeksekusi skrip pembuatan tabel.</p>
                </div>
              </div>
            )}

            {activeSubTab === "FLASK" && (
              <div className="space-y-3.5 text-xs text-slate-600">
                <p>
                  <strong>Integrasi Formula:</strong> Perhitungan mengukur rasio surplus-defisit aktual pos pedesaan dengan menarik data transaksi penjualan Point-of-Sale (POS) riil dari log transaksi.
                </p>
                <p>
                  <strong>Keluaran PostGIS:</strong> Model spasial memperbarui peta dengan mengubah koordinat geometri database secara dinamis menjadi GeoJSON menggunakan <code>ST_AsGeoJSON</code>.
                </p>
                <p>
                  <strong>Peredam Bullwhip:</strong> Membandingkan data kebutuhan riil POS dengan simpanan gudang regional untuk secara otomatis menghitung buffer cadangan logistik pelindung.
                </p>
              </div>
            )}

            {activeSubTab === "MAPBOX" && (
              <div className="space-y-3.5 text-xs text-slate-600">
                <p>
                  <strong>Rendering Dinamis:</strong> Atribut warna peta dihitung secara langsung oleh klien dengan membaca penanda properti pos: Surplus (hijau), Volatilitas (oranye), atau Defisit (merah).
                </p>
                <p>
                  <strong>Peningkatan UX:</strong> Menyesuaikan koordinat fokus kamera peta secara otomatis pada saat muatan awal untuk menampilkan Pulau Lombok, Indonesia.
                </p>
                <p>
                  <strong>Popup Melayang:</strong> Menautkan popup interaktif secara langsung saat kursor melayang di atas pos, mengirim status pilihan ke dalam handler React.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-500 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>Kode Terverifikasi SCM</span>
            </div>
            Dirancang secara presisi berdasarkan analisis rantai pasok wilayah 3T di Indonesia demi menjaga keamanan ketersediaan bahan pangan utama.
          </div>
        </div>

      </div>
    </div>
  );
}
