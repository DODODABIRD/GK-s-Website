/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState } from "react";
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";

interface SignInProps {
  onSuccess: () => void;
}

export default function SignIn({ onSuccess }: SignInProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Silakan isi nama pengguna dan kata sandi.");
      return;
    }

    setIsLoading(true);

    // Simulated secure validation
    setTimeout(() => {
      // Allow general administrative logins for the control tower
      // Best practice is a friendly password hint in the form
      if (password === "merahputih2026" || password === "admin123") {
        onSuccess();
      } else {
        setError("Kredensial salah. Gunakan sandi hint yang tertera di bawah formulir.");
        setIsLoading(false);
      }
    }, 750);
  };

  return (
    <div id="signin-root" className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background aesthetic blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative Floating Flag Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-white" />
      </div>

      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <span className="font-mono font-black text-white text-lg tracking-widest">KMP</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Koperasi Merah Putih
            </span>
            <h2 className="text-xl font-black text-slate-100 tracking-tight font-display">
              Sistem Logistik Nusantara
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Demand Mapping & Supply Chain Control Tower untuk wilayah tertinggal, terdepan, dan terluar (3T).
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 p-3.5 rounded-xl flex gap-2 items-start text-xs text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                placeholder="administrator"
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 text-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm transition-all placeholder:text-slate-600 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Kata Sandi (Password)
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 text-slate-100 rounded-xl py-3 pl-10 pr-10 text-sm transition-all placeholder:text-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-350 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-650/10 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-red-200" />
                <span>Masuk Ke Control Tower</span>
              </>
            )}
          </button>
        </form>

        {/* Sandbox Admin Credentials Help box */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-red-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kredensial Simulasi Admin</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Untuk masuk ke dashboard, silakan masukkan username apa saja dan sandi berikut:
          </p>
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 select-all">
            <span>Sandi:</span>
            <span className="font-bold text-red-400">merahputih2026</span>
          </div>
        </div>

        {/* Security & Server specs credentials */}
        <div className="text-center pt-2 text-[9px] text-slate-600 font-mono flex items-center justify-center gap-4">
          <span>SRID: 4326 MAPPING</span>
          <span>● SECURE SSL</span>
          <span>POSTGIS CONTEXT</span>
        </div>

      </div>
    </div>
  );
}
