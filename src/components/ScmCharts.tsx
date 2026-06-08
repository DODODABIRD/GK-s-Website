/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Village, DistributionCenter } from "../types";
import { TrendingUp, BarChart2, ShieldCheck, AlertTriangle, ArrowRightLeft } from "lucide-react";

interface ScmChartsProps {
  village: Village;
  dc: DistributionCenter | undefined;
  safetyBufferScale: number;
}

export default function ScmCharts({ village, dc, safetyBufferScale }: ScmChartsProps) {
  
  // Calculate average, standard deviation, and CV index
  const priceHistory = [...village.priceHistory15Days];
  const totalDays = priceHistory.length;
  const avgPrice = priceHistory.reduce((a, b) => a + b, 0) / totalDays;
  
  const squaredDiffs = priceHistory.map(price => Math.pow(price - avgPrice, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / totalDays;
  const stdDev = Math.sqrt(variance);
  const cvIndex = avgPrice > 0 ? stdDev / avgPrice : 0;

  // Expected village demand
  const expectedDemand = village.population * village.consumptionPerCapitaKgPerDay;
  // Safety Stock allocation
  const allocatedSafetyReserves = expectedDemand * safetyBufferScale;

  // 1. Price Volatility Line Chart coordinates
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  const minPrice = Math.min(...priceHistory) * 0.95;
  const maxPrice = Math.max(...priceHistory) * 1.05;
  const priceRange = maxPrice - minPrice;

  // Map 15 days data points to SVG coordinates
  const points = priceHistory.map((price, idx) => {
    const x = paddingX + (idx / (totalDays - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((price - minPrice) / priceRange) * (chartHeight - paddingY * 2);
    return { x, y, price, day: idx + 1 };
  });

  // Construct SVG line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  // Construct polygon path for the glowing background fill
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // 2. Dual Bar Chart (POS True Demand vs DC Allocated Buffer)
  const barChartWidth = 320;
  const barChartHeight = 180;
  const maxBarValue = Math.max(expectedDemand, allocatedSafetyReserves, 9000);

  const getBarHeight = (value: number) => {
    return (value / maxBarValue) * (barChartHeight - 40);
  };

  return (
    <div id="scm-visualizers-grid" className="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      {/* Chart 1: 15-Day Commodity Price Volatility Early Warning */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Volatilitas Harga Beras Harian (15 Hari)</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              cvIndex > 0.08 
                ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-200" 
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}>
              Indeks CV: {(cvIndex * 100).toFixed(2)}% {cvIndex > 0.08 ? "Risiko Tinggi" : "Stabil"}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Spike standar deviasi bertindak sebagai sinyal peringatan dini potensi krisis pangan lokal atau kemacetan distribusi logistik di lapangan.
          </p>
        </div>

        {/* SVG Pricing Line Chart */}
        <div className="my-4 relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
            {/* Grid horizontal markers */}
            {[0, 0.5, 1].map((ratio, index) => {
              const yVal = paddingY + ratio * (chartHeight - paddingY * 2);
              const priceVal = Math.round(maxPrice - ratio * priceRange);
              return (
                <g key={index}>
                  <line
                    x1={paddingX}
                    y1={yVal}
                    x2={chartWidth - paddingX}
                    y2={yVal}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                  <text
                    x={paddingX - 8}
                    y={yVal + 3}
                    textAnchor="end"
                    fill="#94A3B8"
                    className="font-mono text-[9px]"
                  >
                    Rp{Math.round(priceVal / 100) * 100}
                  </text>
                </g>
              );
            })}

            {/* Glowing path and crisp vector line */}
            <path d={areaPath} fill="url(#blueGrad)" fillOpacity="0.08" />
            <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />

            {/* Individual Day Dot Highlights */}
            {points.map((p, idx) => (
              <g key={idx}>
                {idx === points.length - 1 ? (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#EF4444"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="animate-ping"
                    style={{ transformOrigin: `${p.x}px ${p.y}px`, animationDuration: "1.5s" }}
                  />
                ) : null}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  className="fill-blue-600 hover:fill-blue-800 transition-colors cursor-help duration-150"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                >
                  <title>Hari {p.day}: Rp{p.price.toLocaleString()}/kg</title>
                </circle>
              </g>
            ))}

            {/* Average Target Benchmark horizontal line */}
            <line
              x1={paddingX}
              y1={chartHeight - paddingY - ((avgPrice - minPrice) / priceRange) * (chartHeight - paddingY * 2)}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY - ((avgPrice - minPrice) / priceRange) * (chartHeight - paddingY * 2)}
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            {/* Warning indicator threshold line at ~ Rp 15,000 baseline */}
            <line
              x1={paddingX}
              y1={chartHeight - paddingY - ((14500 - minPrice) / priceRange) * (chartHeight - paddingY * 2)}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY - ((14500 - minPrice) / priceRange) * (chartHeight - paddingY * 2)}
              stroke="#EF4444"
              strokeWidth="1"
              strokeDasharray="2 3"
              strokeOpacity="0.4"
            />

            {/* Price labels along X axis of days */}
            {[0, 4, 9, 14].map((dayIdx) => {
              const p = points[dayIdx];
              return p ? (
                <text
                  key={dayIdx}
                  x={p.x}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  fill="#94A3B8"
                  className="font-mono text-[9px]"
                >
                  H-{p.day}
                </text>
              ) : null;
            })}

            {/* Gradients declarations */}
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Statistical readout summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1 border-t border-slate-50 pt-3">
          <div className="bg-slate-50/50 p-2 rounded-lg">
            <span className="text-[10px] text-slate-400 block uppercase font-medium tracking-tight">Rata-rata Harga</span>
            <span className="font-bold text-slate-800">Rp{Math.round(avgPrice).toLocaleString()}</span>
          </div>
          <div className="bg-slate-50/50 p-2 rounded-lg">
            <span className="text-[10px] text-slate-400 block uppercase font-medium tracking-tight">Standar Deviasi (σ)</span>
            <span className="font-bold text-slate-800">Rp{Math.round(stdDev).toLocaleString()}</span>
          </div>
          <div className="bg-slate-50/50 p-2 rounded-lg">
            <span className="text-[10px] text-slate-400 block uppercase font-medium tracking-tight">Volatilitas (CV)</span>
            <span className={`font-bold ${cvIndex > 0.08 ? "text-rose-600" : "text-emerald-700"}`}>
              {cvIndex.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 2: Bullwhip Effect Mitigator comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Mitigasi Distorsi Bullwhip Effect</h3>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 font-mono">
              Penyelarasan POS-Gudang
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Menghubungkan data transaksi penjualan riil (Point-of-Sale) konsumen pos secara langsung dengan gudang pusat BULOG menghindari efek penumpukan pasokan berlebih.
          </p>
        </div>

        {/* Dual Bar Graphic representation */}
        <div className="flex items-end justify-center gap-12 h-[120px] my-4 relative">
          
          {/* Bar 1: Net Daily POS Demand */}
          <div className="flex flex-col items-center group relative cursor-help">
            <div className="absolute -top-7 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow pointer-events-none">
              {Math.round(expectedDemand).toLocaleString()} kg
            </div>
            <div
              style={{ height: `${getBarHeight(expectedDemand)}px` }}
              className="w-12 bg-slate-400/80 hover:bg-slate-400 rounded-t-lg transition-all duration-300 shadow-sm border border-slate-300"
            />
            <span className="text-[10px] font-bold text-slate-700 tracking-tight mt-2 uppercase text-center">Permintaan POS</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{Math.round(expectedDemand).toLocaleString()} kg</span>
          </div>

          {/* SCM Transfer linkage */}
          <div className="flex flex-col items-center justify-center self-center text-slate-400">
            <ArrowRightLeft className="w-4 h-4 text-emerald-500 mb-1 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded">
              skala x{safetyBufferScale.toFixed(2)}
            </span>
          </div>

          {/* Bar 2: DC Safety Buffer Allocation */}
          <div className="flex flex-col items-center group relative cursor-help">
            <div className="absolute -top-7 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow pointer-events-none">
              {Math.round(allocatedSafetyReserves).toLocaleString()} kg
            </div>
            <div
              style={{ height: `${getBarHeight(allocatedSafetyReserves)}px` }}
              className="w-12 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all duration-300 shadow-sm border border-emerald-400"
            />
            <span className="text-[10px] font-bold text-slate-700 tracking-tight mt-2 uppercase text-center">Alokasi Aman DC</span>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono mt-0.5">{Math.round(allocatedSafetyReserves).toLocaleString()} kg</span>
          </div>

        </div>

        {/* Action Check block to illustrate math */}
        <div className="bg-slate-50 hover:bg-slate-100/50 transition-colors p-3 rounded-lg flex items-start gap-2 text-xs">
          {dc && dc.riceInventoryKg >= allocatedSafetyReserves ? (
            <>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-slate-600">
                <span className="font-bold text-slate-950 block">Level Stok Terjamin Terpadu</span>
                <strong>{dc.name}</strong> memiliki persediaan {dc.riceInventoryKg.toLocaleString()} kg, mencukupi batas aman cadangan logistik pos.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-rose-700">
                <span className="font-bold text-rose-950 block">Peringatan Menipisnya Cadangan</span>
                Persediaan di depot utama ({dc ? dc.riceInventoryKg.toLocaleString() : "0"} kg) berada di bawah batas target aman. Lakukan restock segera!
              </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
