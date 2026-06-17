/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Village } from "../types";
import {
  Building2,
  Users,
  Wallet,
  AlertTriangle,
  Check,
  X,
  Play,
  RotateCw,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  PieChart,
  TrendingUp,
  BarChart2,
  PlusCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  ArrowRightLeft
} from "lucide-react";

// Types for Cooperative Governance
export interface StoreInputConditions {
  accessibility: string;
  visibility: number; // meters
  environment: string[]; // Campus, School, Residential, Traditional Market
  visitorDensity: number; // orang/m2
  trafficCondition: "Lancar" | "Macet" | "Macet Parah";
  parkingCars: number;
  parkingBikes: number;
  comment: string;
  status: "COMPLETE" | "SEDANG REVIEW AREA MANAGER" | "BUTUH REVISI" | "NOT STARTED" | "IN PROGRESS";
  reviewComment?: string;
}

export interface CompetitorInputConditions {
  directComp: number;
  indirectComp: number;
  substituteComp: number;
  comment: string;
  status: "COMPLETE" | "SEDANG REVIEW BD MANAGER" | "BUTUH REVISI" | "NOT STARTED" | "IN PROGRESS";
  reviewComment?: string;
}

export interface OperationalExpenses {
  salaries: number;
  rent: number;
  utilities: number;
  equipment: number;
  others: number;
  comment: string;
  status: "COMPLETE" | "SEDANG REVIEW BD MANAGER" | "BUTUH REVISI" | "NOT STARTED" | "IN PROGRESS";
  reviewComment?: string;
}

export interface FinancialPerformance {
  sales: number;
  otherIncome: number;
  cogs: number;
  comment: string;
  status: "COMPLETE" | "SEDANG REVIEW BD MANAGER" | "BUTUH REVISI" | "NOT STARTED" | "IN PROGRESS";
  reviewComment?: string;
}

export interface OutpostGovernanceData {
  villageId: string;
  villageName: string;
  region: string;
  is3T: boolean;
  storeInput: StoreInputConditions;
  competitorInput: CompetitorInputConditions;
  operationalInput: OperationalExpenses;
  financeInput: FinancialPerformance;
}

interface CooperativeGovernanceProps {
  villages: Village[];
}

export default function CooperativeGovernance({ villages }: CooperativeGovernanceProps) {
  // 1. Roles Definition
  const roles = [
    { id: "STORE_MANAGER", label: "Manajer Pos Pangan", desc: "Input Kondisi Lokasi & Akses Fisik", badge: "Pengumpulan Data" },
    { id: "RESEARCH_DEV", label: "Litbang Koperasi (BD Staff)", desc: "Input Data Kompetisi & Supplier Overlaps", badge: "Kemitraan" },
    { id: "OPERATIONAL", label: "Staf Logistik & Operasional", desc: "Input Biaya Operasional Riil Tingkat Daerah", badge: "Alokasi Biaya" },
    { id: "FINANCE", label: "Divisi Keuangan Pos", desc: "Input Laba-Rugi Beras & Rekonsiliasi", badge: "Kinerja Fiskal" },
    { id: "AREA_MANAGER", label: "Pengawas Wilayah (Area Manager)", desc: "Audit Fisik & Verifikasi Kondisi Pos", badge: "Otoritas 1" },
    { id: "BD_MANAGER", label: "Kepala Litbang SCM (BD Manager)", desc: "Validasi Lintas Divisi & Progres Pengisian", badge: "Otoritas 2" },
    { id: "CEO", label: "Ketua Koperasi / CEO", desc: "Visualisasi Konsolidasi & Simulasi Keberlanjutan", badge: "Pengambil Keputusan" },
  ] as const;

  type RoleId = typeof roles[number]["id"];
  const [currentRole, setCurrentRole] = useState<RoleId>("STORE_MANAGER");

  // 2. Initial high fidelity mock state of cooperative auditing
  const [governedOutposts, setGovernedOutposts] = useState<OutpostGovernanceData[]>([
    {
      villageId: "v-sembalun",
      villageName: "Sembalun Outpost",
      region: "East Lombok (Mountain Region)",
      is3T: true,
      storeInput: {
        accessibility: "Hanya Kendaraan Pribadi / Motor Relawan",
        visibility: 45,
        environment: ["Area Perumahan"],
        visitorDensity: 4,
        trafficCondition: "Macet",
        parkingCars: 1,
        parkingBikes: 4,
        comment: "Kondisi jalan terjal pegunungan, pengiriman truk beras fuso 20 ton sering terhambat jika cuaca buruk.",
        status: "COMPLETE",
      },
      competitorInput: {
        directComp: 4,
        indirectComp: 1,
        substituteComp: 3,
        comment: "Ada 4 pedagang beras tradisional tengkulak yang menguasai sawah kecil. 1 Warung kelontong distributor luar daerah.",
        status: "COMPLETE",
      },
      operationalInput: {
        salaries: 6500000,
        rent: 2000000,
        utilities: 1200000,
        equipment: 1800000,
        others: 4500000, // high fuel transport
        comment: "Logistik bahan bakar genset pendingin dan diesel truk sangat mahal karena tanjakan curam.",
        status: "COMPLETE",
      },
      financeInput: {
        sales: 24500000,
        otherIncome: 5000000, // government grant subsidy
        cogs: 21000000,
        comment: "Keuntungan tipis karena margin dibatasi HET beras murah agar terjangkau rakyat miskin Sembalun.",
        status: "COMPLETE",
      },
    },
    {
      villageId: "v-pemenang",
      villageName: "Pemenang Village",
      region: "North Lombok",
      is3T: false,
      storeInput: {
        accessibility: "2 jenis armada logistik (Colt Diesel & PickUp saja)",
        visibility: 100,
        environment: ["Area Sekolah", "Area Pasar Tradisional"],
        visitorDensity: 8,
        trafficCondition: "Lancar",
        parkingCars: 4,
        parkingBikes: 12,
        comment: "Dekat jalan raya utama utara. Akses bongkar muat logistik beras sangat aman bagi truk sedang.",
        status: "COMPLETE",
      },
      competitorInput: {
        directComp: 1,
        indirectComp: 2,
        substituteComp: 1,
        comment: "Minimarket modern menjual beras kemasan premium di dekat pos. Hambatan persaingan rendah.",
        status: "COMPLETE",
      },
      operationalInput: {
        salaries: 8000000,
        rent: 3500000,
        utilities: 1500000,
        equipment: 2200000,
        others: 1200000,
        comment: "Biaya operasional stabil standar perkotaan kabupaten.",
        status: "COMPLETE",
      },
      financeInput: {
        sales: 58000000,
        otherIncome: 2000000,
        cogs: 41000000,
        comment: "Aliran uang lancar, berkontribusi surplus finansial untuk menyubsidi silang outposts di 3T.",
        status: "COMPLETE",
      },
    },
    {
      villageId: "v-gili",
      villageName: "Gili Islet Outpost",
      region: "North West Islets",
      is3T: true,
      storeInput: {
        accessibility: "Hanya Kendaraan Pribadi / Motor Relawan",
        visibility: 10,
        environment: ["Area Perumahan"],
        visitorDensity: 2,
        trafficCondition: "Lancar",
        parkingCars: 0,
        parkingBikes: 0,
        comment: "Rencana pos di Gili Trawangan tidak memiliki parkir mobil karena dilarang keras motor/mobil BBM.",
        status: "BUTUH REVISI",
        reviewComment: "Gili Trawangan dilarang kendaraan motor/mobil bensin! Revisi kapasitas parkir mobil/motor jadi 0 dan ubah komentar logistik bongkar muat menggunakan kapal kayu & sepeda gerobak.",
      },
      competitorInput: {
        directComp: 0,
        indirectComp: 1,
        substituteComp: 0,
        comment: "Tidak ada saingan grosir pangan lokal. Semua dipasok lewat darat seberang laut dengan kargo kapal.",
        status: "COMPLETE",
      },
      operationalInput: {
        salaries: 4000000,
        rent: 6000000, // expensive rent
        utilities: 2500000, // expensive electricity
        equipment: 1500000,
        others: 5000000, // boat transit cost
        comment: "Sewa tempat kontainer pos tinggi. Kebutuhan angkut dermaga menyeberang selat tinggi sekali.",
        status: "COMPLETE",
      },
      financeInput: {
        sales: 15400000,
        otherIncome: 8000000, // extra island logistics subsidy
        cogs: 12100000,
        comment: "Meskipun HPP diangkut dari Mataram mahal, subsidi kepulauan menjaga kestabilan neraca beras.",
        status: "COMPLETE",
      },
    },
    {
      villageId: "v-senggigi",
      villageName: "Senggigi Coast",
      region: "West Lombok",
      is3T: false,
      storeInput: {
        accessibility: "2 jenis armada logistik (Colt Diesel & PickUp saja)",
        visibility: 80,
        environment: ["Area Perumahan", "Area Pasar Tradisional"],
        visitorDensity: 3,
        trafficCondition: "Lancar",
        parkingCars: 2,
        parkingBikes: 8,
        comment: "Lokasi strategis pantai barat, akses jalan aspal mulus.",
        status: "NOT STARTED",
      },
      competitorInput: {
        directComp: 0,
        indirectComp: 0,
        substituteComp: 0,
        comment: "",
        status: "NOT STARTED",
      },
      operationalInput: {
        salaries: 0,
        rent: 0,
        utilities: 0,
        equipment: 0,
        others: 0,
        comment: "",
        status: "NOT STARTED",
      },
      financeInput: {
        sales: 0,
        otherIncome: 0,
        cogs: 0,
        comment: "",
        status: "NOT STARTED",
      },
    },
    {
      villageId: "v-kuta",
      villageName: "Kuta Arid Hills",
      region: "South Lombok",
      is3T: true,
      storeInput: {
        accessibility: "2 jenis armada logistik (Colt Diesel & PickUp saja)",
        visibility: 95,
        environment: ["Area Pasar Tradisional"],
        visitorDensity: 6,
        trafficCondition: "Lancar",
        parkingCars: 3,
        parkingBikes: 10,
        comment: "Dekat dengan pasar desa. Rawan keterbatasan air bersih namun akses kendaraan kargo BULOG lancar.",
        status: "COMPLETE",
      },
      competitorInput: {
        directComp: 2,
        indirectComp: 0,
        substituteComp: 1,
        comment: "Terdapat 2 distributor beras besar swasta yang mematok harga di atas ketetapan HET.",
        status: "COMPLETE",
      },
      operationalInput: {
        salaries: 7000000,
        rent: 2500000,
        utilities: 1000000,
        equipment: 1800000,
        others: 2400000,
        comment: "Biaya logistik cukup diredam berkat posisi pos dekat jalan raya provinsi Praya-Kuta.",
        status: "COMPLETE",
      },
      financeInput: {
        sales: 32000000,
        otherIncome: 4500000,
        cogs: 26000000,
        comment: "Surplus margin operasional yang ideal.",
        status: "SEDANG REVIEW BD MANAGER", // Ready to audit
      },
    },
    {
      villageId: "v-sajang",
      villageName: "Sajang Forest Border",
      region: "Northeast Lombok",
      is3T: true,
      storeInput: {
        accessibility: "1 jenis armada logistik (Hanya PickUp/Roda 3)",
        visibility: 30,
        environment: ["Area Perumahan"],
        visitorDensity: 5,
        trafficCondition: "Lancar",
        parkingCars: 1,
        parkingBikes: 6,
        comment: "Pos berbatasan dengan hutan lindung. Akses truk tangki besar tidak muat karena lebar jalan sempit.",
        status: "COMPLETE",
      },
      competitorInput: {
        directComp: 1,
        indirectComp: 0,
        substituteComp: 2,
        comment: "Hanya ada ruko penggilingan padi mandiri milik sesepuh kampung setempat.",
        status: "COMPLETE",
      },
      operationalInput: {
        salaries: 5000000,
        rent: 1500000,
        utilities: 800000,
        equipment: 1200000,
        others: 3000000, // fuel transit
        comment: "Biaya kiriman pick-up melintasi hutan lumayan menggiurkan.",
        status: "COMPLETE",
      },
      financeInput: {
        sales: 18000000,
        otherIncome: 3500000,
        cogs: 15000000,
        comment: "Memerlukan subsidi distribusi terpusat KMP jangka panjang agar tidak merugi.",
        status: "COMPLETE",
      },
    }
  ]);

  // Selected Outpost for active views/inputs
  const [selectedOutpostId, setSelectedOutpostId] = useState<string>("v-sembalun");
  const selectedOutpost = governedOutposts.find(o => o.villageId === selectedOutpostId) || governedOutposts[0];

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Re-usable notification toasts for governance actions
  const [govToast, setGovToast] = useState<string | null>(null);

  // Rejection modal control
  const [rejectingSection, setRejectingSection] = useState<"STORE" | "COMPETITOR" | "OPERATIONAL" | "FINANCE" | null>(null);
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Executive CEO Decision results state
  const [simulationResults, setSimulationResults] = useState<Record<string, {
    status: "LAYAK OPERASI" | "DIREKOMENDASI RELOKASI / TUTUP" | "DATA BELUM LENGKAP";
    reason: string;
    score: number;
  }>>({});

  // Trigger SCM Outpost decision simulation (CEO level)
  const runOutpostSimulation = (outpost: OutpostGovernanceData) => {
    // 1. Check data completion
    const isCompleted =
      outpost.storeInput.status === "COMPLETE" &&
      outpost.competitorInput.status === "COMPLETE" &&
      outpost.operationalInput.status === "COMPLETE" &&
      outpost.financeInput.status === "COMPLETE";

    if (!isCompleted) {
      setSimulationResults(prev => ({
        ...prev,
        [outpost.villageId]: {
          status: "DATA BELUM LENGKAP",
          reason: "Semua form input (Kondisi Pos, Kompetitor, Biaya Operasional, Keuangan) harus berstatus COMPLETE terlebih dahulu.",
          score: 0
        }
      }));
      return;
    }

    // 2. Perform formula decision logic
    const totalRevenue = outpost.financeInput.sales + outpost.financeInput.otherIncome;
    const grossProfit = totalRevenue - outpost.financeInput.cogs;
    const opCost =
      outpost.operationalInput.salaries +
      outpost.operationalInput.rent +
      outpost.operationalInput.utilities +
      outpost.operationalInput.equipment +
      outpost.operationalInput.others;
    const netProfit = grossProfit - opCost;

    // Competition index
    const totalCompetitors = outpost.competitorInput.directComp * 2 + outpost.competitorInput.indirectComp * 1 + outpost.competitorInput.substituteComp * 0.5;

    // Accessibility penalty
    const hasBadAccess = outpost.storeInput.accessibility.includes("Hanya Kendaraan Pribadi");

    // Deficit high requirement score
    // Find village population for SCM priority
    const originalV = villages.find(v => v.id === outpost.villageId);
    const populationNum = originalV?.population || 10000;
    const yieldsNum = originalV?.aggregateProductionKgPerDay || 4000;
    const consumptionNum = populationNum * 0.35;
    const localShortage = consumptionNum - yieldsNum; // positive is shortage (deficit)

    // Compute synthetic viability score
    let score = 50; // base score
    if (netProfit > 0) score += 20;
    else score -= 15; // penalty for heavy commercial losses without subsidies

    if (localShortage > 0) score += 25; // high deficit region gets priority to stay open
    else score -= 15; // surplus region where people can feed themselves has lower KMP priority

    if (totalCompetitors > 5) score -= 15; // too many redundant distributors
    if (hasBadAccess) score -= 10; // logistic access too costly

    let status: "LAYAK OPERASI" | "DIREKOMENDASI RELOKASI / TUTUP" | "DATA BELUM LENGKAP" = "LAYAK OPERASI";
    let reason = "";

    if (score >= 45) {
      status = "LAYAK OPERASI";
      if (localShortage > 0) {
        reason = `Sangat Direkomendasikan Tetap Beroperasi. Wilayah ini krisis sandang pangan dengan defisit harian beras sebesar ${Math.round(localShortage).toLocaleString()} kg. Hadirnya Pos KMP mutlak diperlukan untuk menyambung hidup rakyat.`;
      } else {
        reason = `Koperasi mandiri dan bersinergi dengan baik. Laba bulanan surplus Rp${netProfit.toLocaleString()} melingkupi biaya logistik. Layak dikembangkan terus.`;
      }
    } else {
      status = "DIREKOMENDASI RELOKASI / TUTUP";
      if (totalCompetitors > 6 && localShortage <= 0) {
        reason = `Pengalihan Pos Direkomendasikan. Tumpang tindih tinggi dengan ${outpost.competitorInput.directComp} tengkulak beras swasta dan wilayah ini tidak defisit beras. Pindahkan aset pos ini ke daerah 3T yang lebih membutuhkan.`;
      } else {
        reason = `Kinerja Keuangan Merugi Berat (Minus Rp${Math.abs(netProfit).toLocaleString()}/blnd) ditambah jalur bongkar muat kendaraan logistik yang terlampau curam. Alokasikan kontainer ke zona strategis baru.`;
      }
    }

    setSimulationResults(prev => ({
      ...prev,
      [outpost.villageId]: {
        status,
        reason,
        score
      }
    }));

    setGovToast(`🔮 Keputusan dihasilkan untuk ${outpost.villageName}: ${status}!`);
    setTimeout(() => setGovToast(null), 4000);
  };

  // Helper calculation for completion progress of an outpost
  const calculateOutpostCompletion = (outpost: OutpostGovernanceData) => {
    let completedSections = 0;
    if (outpost.storeInput.status === "COMPLETE") completedSections++;
    if (outpost.competitorInput.status === "COMPLETE") completedSections++;
    if (outpost.operationalInput.status === "COMPLETE") completedSections++;
    if (outpost.financeInput.status === "COMPLETE") completedSections++;
    return completedSections * 25; // 0, 25, 50, 75, 100%
  };

  // 3. Action Submissions per roles
  const handleStoreInputSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const envChecked: string[] = [];
    if (formData.get("env_school")) envChecked.push("Area Sekolah");
    if (formData.get("env_market")) envChecked.push("Area Pasar Tradisional");
    if (formData.get("env_resident")) envChecked.push("Area Perumahan");

    setGovernedOutposts(prev => prev.map(p => {
      if (p.villageId === selectedOutpostId) {
        return {
          ...p,
          storeInput: {
            accessibility: formData.get("accessibility") as string,
            visibility: Number(formData.get("visibility")),
            environment: envChecked,
            visitorDensity: Number(formData.get("visitorDensity")),
            trafficCondition: formData.get("trafficCondition") as "Lancar",
            parkingCars: Number(formData.get("parkingCars")),
            parkingBikes: Number(formData.get("parkingBikes")),
            comment: formData.get("comment") as string,
            status: "SEDANG REVIEW AREA MANAGER", // triggers the supervisor review flow next
            reviewComment: undefined
          }
        };
      }
      return p;
    }));

    setGovToast("📥 Data Kondisi Pos berhasil disimpan! Status: Menunggu Verifikasi Area Manager.");
    setTimeout(() => setGovToast(null), 5000);
  };

  const handleCompetitorSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setGovernedOutposts(prev => prev.map(p => {
      if (p.villageId === selectedOutpostId) {
        return {
          ...p,
          competitorInput: {
            directComp: Number(formData.get("direct")),
            indirectComp: Number(formData.get("indirect")),
            substituteComp: Number(formData.get("substitute")),
            comment: formData.get("comment") as string,
            status: "SEDANG REVIEW BD MANAGER",
            reviewComment: undefined
          }
        };
      }
      return p;
    }));

    setGovToast("📥 Data Kompetitor diserahkan ke Litbang Pusat! Status: Menunggu Verifikasi BD Manager.");
    setTimeout(() => setGovToast(null), 5000);
  };

  const handleOperationalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setGovernedOutposts(prev => prev.map(p => {
      if (p.villageId === selectedOutpostId) {
        return {
          ...p,
          operationalInput: {
            salaries: Number(formData.get("salaries")),
            rent: Number(formData.get("rent")),
            utilities: Number(formData.get("utilities")),
            equipment: Number(formData.get("equipment")),
            others: Number(formData.get("others")),
            comment: formData.get("comment") as string,
            status: "SEDANG REVIEW BD MANAGER",
            reviewComment: undefined
          }
        };
      }
      return p;
    }));

    setGovToast("📥 Anggaran Biaya Logistik & Operasional didaftarkan! Status: Menunggu Verifikasi.");
    setTimeout(() => setGovToast(null), 5000);
  };

  const handleFinanceSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setGovernedOutposts(prev => prev.map(p => {
      if (p.villageId === selectedOutpostId) {
        return {
          ...p,
          financeInput: {
            sales: Number(formData.get("sales")),
            otherIncome: Number(formData.get("otherIncome")),
            cogs: Number(formData.get("cogs")),
            comment: formData.get("comment") as string,
            status: "SEDANG REVIEW BD MANAGER",
            reviewComment: undefined
          }
        };
      }
      return p;
    }));

    setGovToast("📥 Laporan Rekonsiliasi Finansial Beras berhasil diajukan untuk audit!");
    setTimeout(() => setGovToast(null), 5000);
  };

  // 4. Verification Action Handlers (Managers)
  const handleVerifySection = (
    villageId: string,
    section: "STORE" | "COMPETITOR" | "OPERATIONAL" | "FINANCE",
    isApproved: boolean
  ) => {
    if (isApproved) {
      setGovernedOutposts(prev => prev.map(p => {
        if (p.villageId === villageId) {
          const update = { ...p };
          if (section === "STORE") update.storeInput.status = "COMPLETE";
          else if (section === "COMPETITOR") update.competitorInput.status = "COMPLETE";
          else if (section === "OPERATIONAL") update.operationalInput.status = "COMPLETE";
          else if (section === "FINANCE") update.financeInput.status = "COMPLETE";
          return update;
        }
        return p;
      }));
      setGovToast("✔️ Dokumen disetujui (Approved) & terverifikasi!");
      setTimeout(() => setGovToast(null), 3000);
    } else {
      // Trigger Rejection comments modal
      setRejectingSection(section);
      setRejectionTargetId(villageId);
      setRejectionReason("");
    }
  };

  const submitRejection = () => {
    if (!rejectionTargetId || !rejectingSection) return;

    setGovernedOutposts(prev => prev.map(p => {
      if (p.villageId === rejectionTargetId) {
        const update = { ...p };
        if (rejectingSection === "STORE") {
          update.storeInput.status = "BUTUH REVISI";
          update.storeInput.reviewComment = rejectionReason;
        } else if (rejectingSection === "COMPETITOR") {
          update.competitorInput.status = "BUTUH REVISI";
          update.competitorInput.reviewComment = rejectionReason;
        } else if (rejectingSection === "OPERATIONAL") {
          update.operationalInput.status = "BUTUH REVISI";
          update.operationalInput.reviewComment = rejectionReason;
        } else if (rejectingSection === "FINANCE") {
          update.financeInput.status = "BUTUH REVISI";
          update.financeInput.reviewComment = rejectionReason;
        }
        return update;
      }
      return p;
    }));

    setGovToast(`❌ Dokumen dikembalikan dengan alasan revisi: "${rejectionReason}"`);
    setRejectingSection(null);
    setRejectionTargetId(null);
    setRejectionReason("");
    setTimeout(() => setGovToast(null), 4000);
  };

  const filteredOutposts = governedOutposts.filter(o =>
    o.villageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="cooperative-governance-hub" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px] animate-fadeIn">
      
      {/* Dynamic Toast Subtitle */}
      {govToast && (
        <div className="bg-red-600 text-white px-5 py-3 text-xs font-bold animate-pulse flex items-center gap-2 border-b border-red-700">
          <Clock className="w-4 h-4 animate-spin shrink-0" />
          <span>ALIRAN GOBER KMP: {govToast}</span>
        </div>
      )}

      {/* Main Header of Governance Hub */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-red-600 text-white rounded-lg font-bold font-mono text-sm tracking-wide shadow-sm transform -rotate-1">
              KMP AUDIT
            </span>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Tata Kelola Pos & Audit Keberlanjutan Koperasi</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Re-aligning SCM features according to the Koperasi Merdeka auditing manual. Swapping credentials and managing multi-role outpost inputs, supervisor edits, and CEO simulations.
          </p>
        </div>

        {/* Global Search and Outpost Selector */}
        <div className="flex items-center gap-2 max-w-xs w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari Outpost Pos Pangan..."
            className="text-xs bg-transparent border-none outline-none w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Role Switching Rail - Multi-player Simulation Bar */}
      <div className="bg-slate-900 text-slate-200 p-3 pt-3 flex flex-col border-b border-slate-950 gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1 block">
          🕹️ Simulasi Peran Anggota Koperasi (Pilih peran untuk mengubah hak akses form di bawah)
        </span>
        
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-thin">
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => {
                setCurrentRole(r.id);
                setGovToast(`Hak Akses dialihkan ke: ${r.label}`);
                setTimeout(() => setGovToast(null), 2500);
              }}
              className={`flex flex-col text-left px-3.5 py-2 rounded-xl transition-all font-sans whitespace-nowrap min-w-[200px] cursor-pointer border ${
                currentRole === r.id
                  ? "bg-red-600 text-white border-red-500 shadow-md font-extrabold scale-[1.02]"
                  : "bg-slate-800 text-slate-300 border-slate-750 hover:bg-slate-750 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold leading-tight">{r.label}</span>
                <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded font-mono ${
                  currentRole === r.id ? "bg-red-700 text-white" : "bg-slate-900 text-red-400"
                }`}>
                  {r.badge}
                </span>
              </div>
              <span className="text-[9px] text-slate-350 opacity-80 mt-0.5 leading-tight select-none truncate">
                {r.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Split Area: Outpost Status Sidebar on Left, Form Panel Work Area on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-1 min-h-[500px]">
        
        {/* Outposts Lists left sidebar */}
        <div className="lg:col-span-1 bg-slate-50/50 p-4 space-y-3 max-h-[800px] overflow-y-auto">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200">
            <span>Daftar Pos KMP</span>
            <span>DATA PROGRESS</span>
          </div>

          <div className="space-y-2">
            {filteredOutposts.map(outpost => {
              const compPct = calculateOutpostCompletion(outpost);
              const isSelected = selectedOutpostId === outpost.villageId;

              return (
                <button
                  key={outpost.villageId}
                  onClick={() => setSelectedOutpostId(outpost.villageId)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1 shadow-xs cursor-pointer ${
                    isSelected
                      ? "bg-white border-red-600 ring-1 ring-red-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                        {outpost.villageName}
                      </h4>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">
                        {outpost.region.slice(0, 22)}
                      </span>
                    </div>
                    {outpost.is3T && (
                      <span className="bg-red-100 text-red-805 text-[8px] font-extrabold border border-red-200 px-1 py-0.2 rounded uppercase">
                        3T
                      </span>
                    )}
                  </div>

                  {/* Progress completion bar */}
                  <div className="w-full mt-2 space-y-0.5">
                    <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400">
                      <span>Progres Dokumen</span>
                      <span className={`${compPct === 100 ? "text-emerald-600 font-extrabold" : "text-slate-500"}`}>
                        {compPct}% {compPct === 100 ? "LENGKAP" : "DIISI"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          compPct === 100 ? "bg-emerald-500" : "bg-red-500"
                        }`}
                        style={{ width: `${compPct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* WORK ZONE RIGHT PANEL (Span 3 based on roles) */}
        <div className="lg:col-span-3 p-6 flex flex-col justify-between min-h-0 bg-white">
          <div className="space-y-5">
            
            {/* Active Outpost Brief header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold uppercase tracking-wider font-mono">
                  Sedang Dikelola & Dites
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  {selectedOutpost.villageName}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedOutpost.region} &bull; Zona Prioritas KMP SCM
                </span>
              </div>

              {/* Status flags summaries */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[9px] font-mono tracking-wider px-2 py-1 rounded-lg border font-bold ${
                  selectedOutpost.storeInput.status === "COMPLETE" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  KONDISI: {selectedOutpost.storeInput.status}
                </span>
                <span className={`text-[9px] font-mono tracking-wider px-2 py-1 rounded-lg border font-bold ${
                  selectedOutpost.competitorInput.status === "COMPLETE" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  KOMPETITOR: {selectedOutpost.competitorInput.status}
                </span>
                <span className={`text-[9px] font-mono tracking-wider px-2 py-1 rounded-lg border font-bold ${
                  selectedOutpost.operationalInput.status === "COMPLETE" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  BIAYA: {selectedOutpost.operationalInput.status}
                </span>
                <span className={`text-[9px] font-mono tracking-wider px-2 py-1 rounded-lg border font-bold ${
                  selectedOutpost.financeInput.status === "COMPLETE" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  REKONSILIASI: {selectedOutpost.financeInput.status}
                </span>
              </div>
            </div>

            {/* ROLE WORKFLOW RENDERERS - BRIDGES HAUS TO KMP */}

            {/* ROLE 1: STORE MANAGER / MANAJER POS */}
            {currentRole === "STORE_MANAGER" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-205 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                  <Building2 className="w-5 h-5 text-red-650 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <span className="font-extrabold text-slate-900 block uppercase">Manual Input & Koreksi - Kondisi Fisik Pos Pangan</span>
                    Sebagai pengelola pos, masukkan parameter akses bongkar muat logistik dan kelayakan jalan yang mengitari lokasi penyaluran pangan murah Anda.
                  </div>
                </div>

                {/* Butuh revisi warning */}
                {selectedOutpost.storeInput.status === "BUTUH REVISI" && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2 text-xs">
                    <span className="font-extrabold text-rose-850 block uppercase text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Komentar Penolakan Dari Pengawas Wilayah (Area Manager Reject Reason)
                    </span>
                    <p className="bg-white/80 p-3 rounded border border-rose-100 font-mono text-rose-950 font-bold">
                      "{selectedOutpost.storeInput.reviewComment}"
                    </p>
                  </div>
                )}

                <form onSubmit={handleStoreInputSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  {/* Accessibility Options */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Evaluasi Akses Jalan Bongkar Muat Logistik (Aksesibilitas)
                    </label>
                    <div className="space-y-1.5 pt-1">
                      {[
                        ">2 jenis armada logistik (Fuso, Colt Diesel, PickUp)",
                        "2 jenis armada logistik (Colt Diesel & PickUp saja)",
                        "1 jenis armada logistik (Hanya PickUp/Roda 3)",
                        "Hanya Kendaraan Pribadi / Motor Relawan"
                      ].map(acc => (
                        <label key={acc} className="flex items-center gap-2 cursor-pointer leading-relaxed">
                          <input
                            type="radio"
                            name="accessibility"
                            value={acc}
                            defaultChecked={selectedOutpost.storeInput.accessibility === acc}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span>{acc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Visibilitas & Kepadatan Grid */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Visibilitas Spanduk Pos & Eksposur Jalan Utama (Meter)
                      </label>
                      <input
                        type="number"
                        name="visibility"
                        placeholder="e.g. 50"
                        min="5"
                        max="500"
                        required
                        className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs"
                        defaultValue={selectedOutpost.storeInput.visibility || 50}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Kepadatan Antrean Antara Penerima Manfaat (Jiwa / m²)
                      </label>
                      <input
                        type="number"
                        name="visitorDensity"
                        placeholder="e.g. 5"
                        min="1"
                        max="30"
                        required
                        className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs"
                        defaultValue={selectedOutpost.storeInput.visitorDensity || 4}
                      />
                    </div>
                  </div>

                  {/* Environment & Traffic */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sasaran Distribusi Utama (Jenis Lingkungan)
                    </label>
                    <div className="space-y-1.5 pt-1">
                      {[
                        { id: "school", label: "Area Sekolah / Lembaga Sosial" },
                        { id: "market", label: "Area Pasar Tradisional Desa" },
                        { id: "resident", label: "Area Pemukiman Padat Penduduk / 3T" }
                      ].map(env => (
                        <label key={env.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name={`env_${env.id}`}
                            defaultChecked={selectedOutpost.storeInput.environment.includes(env.label)}
                            className="rounded text-red-650 text-red-600 focus:ring-red-500"
                          />
                          <span>{env.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Traffic flow state selection */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                        Kepadatan Aliran Lalu Lintas Jalan Pos
                      </label>
                      <select name="trafficCondition" className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs">
                        <option value="Lancar">Lancar (Aman Tanpa Hambatan)</option>
                        <option value="Macet">Macet Paruh Waktu (Sering Antre)</option>
                        <option value="Macet Parah">Macet Parah / Longsor Pegunungan rute 3T</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Parkir Truk Logistik (Unit)
                        </label>
                        <input
                          type="number"
                          name="parkingCars"
                          min="0"
                          required
                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-center"
                          defaultValue={selectedOutpost.storeInput.parkingCars || 0}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Parkir Motor Angkut (Unit)
                        </label>
                        <input
                          type="number"
                          name="parkingBikes"
                          min="0"
                          required
                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-center"
                          defaultValue={selectedOutpost.storeInput.parkingBikes || 0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Catatan Komparasi Logistik Bongkar Muat Pengelola
                    </label>
                    <textarea
                      name="comment"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs font-sans leading-relaxed"
                      defaultValue={selectedOutpost.storeInput.comment}
                      placeholder="Tulis kendala pengiriman truk atau saran bongkar muat..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="md:col-span-2 pt-2 text-right">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ml-auto font-mono tracking-wider"
                    >
                      <span>Simpan & Ajukan Verifikasi</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ROLE 2: BD STAFF / LITBANG KOPERASI (COMPETITION) */}
            {currentRole === "RESEARCH_DEV" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-205 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                  <Users className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-900 block uppercase">Kompetisi Gudang & Overlaps Pengiriman Swasta</span>
                    Identifikasi hambatan distribusi. Daftarkan kehadiran perantara dagang (tengkulak) swasta, pasar tradisional utama, dan depot murah kompetitor di wilayah administratif yang serupa.
                  </div>
                </div>

                <form onSubmit={handleCompetitorSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Kompetisi Langsung (Tengkulak Swasta / Spekulan)
                    </label>
                    <input
                      type="number"
                      name="direct"
                      required
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-center"
                      defaultValue={selectedOutpost.competitorInput.directComp || 0}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-455 mb-1">
                      Kompetisi Tidak Langsung (Minimarket Agen Swasta)
                    </label>
                    <input
                      type="number"
                      name="indirect"
                      required
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-center"
                      defaultValue={selectedOutpost.competitorInput.indirectComp || 0}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-455 mb-1">
                      Kompetisi Kios Bayangan (Pasar Kaget / Penggiling)
                    </label>
                    <input
                      type="number"
                      name="substitute"
                      required
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-center"
                      defaultValue={selectedOutpost.competitorInput.substituteComp || 0}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Catatan Kelayakan SCM Wilayah Tumpang Tindih
                    </label>
                    <textarea
                      name="comment"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.competitorInput.comment}
                      placeholder="Sebutkan siapa saja distributor grosir swasta pesaing..."
                    />
                  </div>

                  <div className="md:col-span-3 text-right pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-slate-900 border border-slate-950 text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Kirim Laporan Kompetitor
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ROLE 3: LOGISTICS / OPERATIONAL STAF (OPERATIONAL EXPENSES) */}
            {currentRole === "OPERATIONAL" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-250 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                  <Wallet className="w-5 h-5 text-red-650 mt-0.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900 block uppercase">Anggaran Logistik & Pengeluaran Operasional Pos</span>
                    Laporkan semua biaya tetap dan pengeluaran variabel pengiriman logistik rute 3T, termasuk konsumsi bahan bakar, gaji relawan gudang, dan sewa pos.
                  </div>
                </div>

                <form onSubmit={handleOperationalSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Alokasi Gaji Pokok & Upah Relawan (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="salaries"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.operationalInput.salaries || 0}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Sewa Fasilitas Depot & Gudang Kontainer (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="rent"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.operationalInput.rent || 0}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Biaya Utilitas: Listrik Cold Storage & Air (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="utilities"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.operationalInput.utilities || 0}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Perlengkapan Digital: Timbangan & Seal Kantong (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="equipment"
                      required
                      className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.operationalInput.equipment || 0}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Biaya Transportasi Menyeberang Pulau / Bahan Bakar Truk Rute Curam (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="others"
                      required
                      className="w-full bg-slate-50 border border-slate-205 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.operationalInput.others || 0}
                    />
                  </div>

                  <div className="md:col-span-2 animate-fadeIn bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-emerald-800 text-xs font-mono font-bold flex justify-between">
                     <span>Proyeksi Akumulasi Biaya Tetap Operasional Pos SCM:</span>
                     <span className="text-sm text-slate-900 font-black">
                       Rp{(
                         (selectedOutpost.operationalInput.salaries || 0) + 
                         (selectedOutpost.operationalInput.rent || 0) + 
                         (selectedOutpost.operationalInput.utilities || 0) + 
                         (selectedOutpost.operationalInput.equipment || 0) + 
                         (selectedOutpost.operationalInput.others || 0)
                       ).toLocaleString()}
                     </span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Catatan Penghematan Rantai Pasok Tambahan
                    </label>
                    <textarea
                      name="comment"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.operationalInput.comment}
                      placeholder="Misalnya: 'Hemat biaya sewa karena menggunakan lahan hibah kelurahan desa.'"
                    />
                  </div>

                  <div className="md:col-span-2 text-right pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Catat Biaya Operasional
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ROLE 4: FINANCE / STAF KEUANGAN (FINANCE PERFORMANCE) */}
            {currentRole === "FINANCE" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-255 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                  <PieChart className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-900 block uppercase font-mono">Input Laporan Keuangan Beras Bulanan</span>
                    Masukkan kuantitas pendapatan beras koperasi dan pos subsidi pemerintah. Sistem akan menghitung margin kotor (GPM) dan laba rill bersih (NPM) otomatis dengan merujuk biaya operasional!
                  </div>
                </div>

                <form onSubmit={handleFinanceSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Penjualan Agregat Beras Murah (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="sales"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.financeInput.sales || 0}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      Pendapatan Lain / Dana Subsidi Bapanas (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="otherIncome"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.financeInput.otherIncome || 0}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                      HPP (Biaya Tebusan Pembelian Padi Tani) (Rp / bulan)
                    </label>
                    <input
                      type="number"
                      name="cogs"
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.financeInput.cogs || 0}
                    />
                  </div>

                  {/* Financial calculation outputs */}
                  <div className="md:col-span-3 bg-slate-950 text-slate-100 p-4 rounded-xl font-mono space-y-2 border border-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      Visualisasi Kalkulator Margin & Pajak SCM Pos KMP
                    </span>
                    
                    {(() => {
                      const sales = selectedOutpost.financeInput.sales || 0;
                      const income = selectedOutpost.financeInput.otherIncome || 0;
                      const totalRev = sales + income;
                      const cogs = selectedOutpost.financeInput.cogs || 0;
                      const grossProfit = totalRev - cogs;

                      const opCost =
                        (selectedOutpost.operationalInput.salaries || 0) + 
                        (selectedOutpost.operationalInput.rent || 0) + 
                        (selectedOutpost.operationalInput.utilities || 0) + 
                        (selectedOutpost.operationalInput.equipment || 0) + 
                        (selectedOutpost.operationalInput.others || 0);

                      const netProfit = grossProfit - opCost;
                      const gpm = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;
                      const npm = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1.5 font-bold text-xs select-none">
                          <div className="bg-slate-900/60 p-2 rounded">
                            <span className="text-[8px] text-slate-400 block uppercase font-sans">Total Pendapatan</span>
                            <span className="text-slate-100">Rp{totalRev.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded">
                            <span className="text-[8px] text-slate-400 block uppercase font-sans">Biaya Logistik Operasional</span>
                            <span className="text-slate-100">Rp{opCost.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded">
                            <span className="text-[8px] text-slate-400 block uppercase font-sans">Laba Bersih Koperasi</span>
                            <span className={`font-mono ${netProfit >= 0 ? "text-emerald-400" : "text-rose-450 text-rose-400"}`}>
                              Rp{netProfit.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded">
                            <span className="text-[8px] text-slate-400 block uppercase font-sans">Gross / Net Margin (%)</span>
                            <span className="text-slate-100 font-mono text-[11px] block">
                              GPM: <strong className="text-emerald-400">{gpm.toFixed(1)}%</strong>
                            </span>
                            <span className="text-slate-100 font-mono text-[11px] block mt-0.5">
                              NPM: <strong className={npm >= 0 ? "text-emerald-400" : "text-rose-450 text-rose-400"}>{npm.toFixed(1)}%</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Catatan Komparasi Laba Penjual Beras
                    </label>
                    <textarea
                      name="comment"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                      defaultValue={selectedOutpost.financeInput.comment}
                      placeholder="Sampaikan kendala setoran beras petani lokal..."
                    />
                  </div>

                  <div className="md:col-span-3 text-right pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Kirim Laporan Keuangan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ROLE 5: AREA MANAGER (AUDITS & APPROVES STORE INPUT) */}
            {currentRole === "AREA_MANAGER" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-250 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-red-650 mt-0.5 text-red-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900 block uppercase">Verifikasi Fisik & Bongkar Muat (Area Supervisor Room)</span>
                    Sebagai Pengawas Wilayah (Area Manager), Anda bertugas memvalidasi laporan Kondisi Fisik Lokasi dari Manajer Pos Pangan. Klik <strong>Benar (√)</strong> atau tunjuk <strong>Revisi (X)</strong> untuk memberikan draf catatan.
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-[#FAFBFD]/80 text-slate-700 uppercase font-mono tracking-wider font-bold text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Pos Pangan</th>
                        <th className="p-3">Kondisi Jalan & Akses</th>
                        <th className="p-3">Visibilitas Spanduk</th>
                        <th className="p-3">Antrean Penerima</th>
                        <th className="p-3">Dermaga Parkir</th>
                        <th className="p-3">Status Verifikasi</th>
                        <th className="p-3 text-center">Tindakan Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800 font-sans">
                      {governedOutposts.map(post => {
                        const s = post.storeInput;
                        return (
                          <tr key={post.villageId} className="hover:bg-slate-50/20">
                            <td className="p-3">
                              <span className="font-bold text-slate-950 block">{post.villageName}</span>
                              <span className="text-[9px] text-[#94A3B8] block">{post.region}</span>
                            </td>
                            <td className="p-3 max-w-[160px] text-[10px] break-words text-slate-600">{s.accessibility || "Belum diinput"}</td>
                            <td className="p-3 font-mono">{s.visibility ? `${s.visibility} m` : "-"}</td>
                            <td className="p-3 font-mono">{s.visitorDensity ? `${s.visitorDensity} orang/m2` : "-"}</td>
                            <td className="p-3 text-[10px] text-slate-500 leading-tight">
                              <span>Mobil/Truk: {s.parkingCars || "0"}</span><br/>
                              <span>Motor: {s.parkingBikes || "0"}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                                s.status === "COMPLETE" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                s.status === "BUTUH REVISI" ? "bg-red-100 text-red-800" :
                                s.status === "SEDANG REVIEW AREA MANAGER" ? "bg-red-500 text-white animate-pulse" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                                {s.status === "SEDANG_REVIEW_AREA_MANAGER" || s.status === "SEDANG REVIEW AREA MANAGER" ? "🚨 PERLU AUDIT" : s.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5 select-none">
                                <button
                                  onClick={() => handleVerifySection(post.villageId, "STORE", true)}
                                  className="p-1 px-2.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] uppercase font-mono font-bold font-black transition-all cursor-pointer"
                                  title="Setujui Data"
                                >
                                  √ Setujui
                                </button>
                                <button
                                  onClick={() => handleVerifySection(post.villageId, "STORE", false)}
                                  className="p-1 px-2.5 bg-rose-150 bg-rose-100 text-rose-800 hover:bg-rose-500 hover:text-white rounded-lg text-[10px] uppercase font-mono font-bold font-black transition-all cursor-pointer"
                                  title="Tolak & Butuh Revisi"
                                >
                                  X Tolak
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ROLE 6: BD MANAGER (AUDITS ALL SECTIONS) */}
            {currentRole === "BD_MANAGER" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-250 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                  <BarChart2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-900 block uppercase font-mono">Pemeriksaan & Validasi Silang Lintas Divisi (BD Manager Dashboard)</span>
                    Sebagai Kepala Penelitian Pangan, periksa seluruh kelengkapan dokumen pos dan setujui atau minta perbaikan bagi pengajuan Kompetitor, Biaya Operasional, maupun Laporan Keuangan Keuangan.
                  </div>
                </div>

                {/* Completeness Table progress bar list */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs select-none space-y-3.5">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Store Data Completion Tracker</span>
                     <button
                       onClick={() => {
                         setGovToast("🔄 Menghubungkan log data transaksi Point-of-Sale (POS) riil...");
                         setTimeout(() => setGovToast(null), 2000);
                       }}
                       className="text-[9px] bg-slate-900 text-white font-bold font-mono px-2 py-1 rounded hover:bg-slate-800 transition-all cursor-pointer"
                     >
                       REFRESH
                     </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {governedOutposts.map(p => {
                       const pct = calculateOutpostCompletion(p);
                       return (
                         <div key={p.villageId} className="border border-slate-150 p-3 rounded-lg flex items-center justify-between gap-4 font-sans">
                            <div>
                              <span className="text-xs font-bold text-slate-950 block">{p.villageName}</span>
                              <span className="text-[9px] font-mono text-slate-400">STATUS: {pct === 100 ? "READY FOR CEO" : "IN GRADING"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black font-mono font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                                {pct}%
                              </span>
                              <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-150">
                                <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                         </div>
                       );
                     })}
                   </div>
                </div>

                {/* Audit verification buttons on non-store inputs */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider font-mono">Daftar Antrean Audit Dokumen Teknis</h4>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                     <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-[#FAFBFD]/80 text-slate-700 uppercase font-mono tracking-wider font-bold text-[9px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">Pos Pangan</th>
                            <th className="p-3">Kategori Dokumen</th>
                            <th className="p-3">Ringkasan Nilai Laporan</th>
                            <th className="p-3">Catatan Pengirim</th>
                            <th className="p-3">Status Verifikasi</th>
                            <th className="p-3 text-center">Tindakan Audit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {governedOutposts.map(p => {
                            // Render a row for competitor, opCost, and finance if they are not in standard complete nor not_started
                            const docs = [
                              { id: "COMPETITOR" as const, label: "Analisis Kompetitor", status: p.competitorInput.status, summary: `${p.competitorInput.directComp} Spekulan | ${p.competitorInput.indirectComp} Minimarket`, comment: p.competitorInput.comment },
                              { id: "OPERATIONAL" as const, label: "Pengeluaran Operasional", status: p.operationalInput.status, summary: `Rp${((p.operationalInput.salaries || 0) + (p.operationalInput.rent || 0) + (p.operationalInput.others || 0)).toLocaleString()}`, comment: p.operationalInput.comment },
                              { id: "FINANCE" as const, label: "Laporan Recons Keuangan", status: p.financeInput.status, summary: `Revenues: Rp${((p.financeInput.sales || 0) + (p.financeInput.otherIncome || 0)).toLocaleString()}`, comment: p.financeInput.comment }
                            ];

                            return docs.filter(col => col.status !== "NOT_STARTED" && col.status !== "NOT STARTED").map(doc => (
                              <tr key={`${p.villageId}-${doc.id}`} className="hover:bg-slate-50/20">
                                <td className="p-3">
                                  <span className="font-bold text-slate-950 block text-[11px]">{p.villageName}</span>
                                </td>
                                <td className="p-3 font-semibold text-slate-600 font-mono text-[10px]">{doc.label}</td>
                                <td className="p-3 font-mono font-bold">{doc.summary}</td>
                                <td className="p-3 max-w-[150px] text-[10px] break-words text-slate-500 font-sans">{doc.comment || "-"}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    doc.status === "COMPLETE" ? "bg-emerald-100 text-emerald-800 border border-emerald-150" :
                                    doc.status === "BUTUH REVISI" ? "bg-rose-100 text-rose-800" :
                                    "bg-amber-100 text-amber-800 animate-pulse border border-amber-200"
                                  }`}>
                                    {doc.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center gap-1.5 select-none">
                                    <button
                                      onClick={() => handleVerifySection(p.villageId, doc.id, true)}
                                      className="p-1 px-2.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] uppercase font-bold font-black transition-all cursor-pointer"
                                    >
                                      √ Setuju
                                    </button>
                                    <button
                                      onClick={() => handleVerifySection(p.villageId, doc.id, false)}
                                      className="p-1 px-2.5 bg-rose-100 text-rose-800 hover:bg-rose-500 hover:text-white rounded-lg text-[10px] uppercase font-bold font-black transition-all cursor-pointer"
                                    >
                                      X Tolak
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                     </table>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 7: CEO / KETUA KOPERASI (DASBOARD CHART & DECISION SIMULATION COOP) */}
            {currentRole === "CEO" && (
              <div className="space-y-6">
                <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-sm space-y-3.5 border border-slate-900 select-none">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                    <span className="p-1.5 bg-red-600 text-white rounded-lg">
                      <ShieldCheck className="w-4 h-4 font-black" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-100 font-display">Hub Pengawas Kebijakan Ketua Koperasi</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Analisis data konsolidasi visual dan operasikan tombol <strong>Simulasi</strong> pada outposts untuk merumuskan status kelayakan keberlanjutan.
                      </p>
                    </div>
                  </div>

                  {/* Summary visual executive charts as requested */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 font-sans">
                     {/* Cost pie breakdown equivalent */}
                     <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Consolidated Operational Pie Ratio</span>
                        
                        {(() => {
                          const salaries = governedOutposts.reduce((acc, cur) => acc + (cur.operationalInput.salaries || 0), 0);
                          const rent = governedOutposts.reduce((acc, cur) => acc + (cur.operationalInput.rent || 0), 0);
                          const utilities = governedOutposts.reduce((acc, cur) => acc + (cur.operationalInput.utilities || 0), 0);
                          const transport = governedOutposts.reduce((acc, cur) => acc + (cur.operationalInput.others || 0), 0);
                          const total = salaries + rent + utilities + transport;

                          return (
                            <div className="flex items-center gap-3">
                              {/* Custom SVG dynamic pie segment */}
                              <div className="w-16 h-16 relative">
                                 <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                                   {/* Salaries: 40% */}
                                   <circle r="16" cx="16" cy="16" fill="transparent" stroke="#EF4444" strokeWidth="32" strokeDasharray="40 100" strokeDashoffset="0" />
                                   {/* Transport: 35% */}
                                   <circle r="16" cx="16" cy="16" fill="transparent" stroke="#F59E0B" strokeWidth="32" strokeDasharray="35 100" strokeDashoffset="-40" />
                                   {/* Rent: 15% */}
                                   <circle r="16" cx="16" cy="16" fill="transparent" stroke="#3B82F6" strokeWidth="32" strokeDasharray="15 100" strokeDashoffset="-75" />
                                   {/* Utilities: 10% */}
                                   <circle r="16" cx="16" cy="16" fill="transparent" stroke="#10B981" strokeWidth="32" strokeDasharray="10 100" strokeDashoffset="-90" />
                                 </svg>
                              </div>

                              <div className="text-[10px] text-slate-350 space-y-0.5 leading-tight font-mono">
                                <div className="flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                                  <span>Gaji: {total > 0 ? Math.round((salaries/total)*100) : 0}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                                  <span>Logistik BBM: {total > 0 ? Math.round((transport/total)*100) : 0}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                  <span>Sewa: {total > 0 ? Math.round((rent/total)*100) : 0}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>Fasilitas: {total > 0 ? Math.round((utilities/total)*100) : 0}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                     </div>

                     {/* Financial trends bars */}
                     <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Sales Performance Bar comparisons</span>
                        
                        {(() => {
                          const totalSales = governedOutposts.reduce((acc, cur) => acc + (cur.financeInput.sales || 0), 0);
                          const totalSubsidy = governedOutposts.reduce((acc, cur) => acc + (cur.financeInput.otherIncome || 0), 0);
                          const totalCogs = governedOutposts.reduce((acc, cur) => acc + (cur.financeInput.cogs || 0), 0);
                          const max = Math.max(totalSales, totalSubsidy, totalCogs, 1);

                          return (
                            <div className="flex flex-col gap-2 pt-1 font-mono text-[9px] text-slate-300">
                               <div className="space-y-0.5">
                                 <div className="flex justify-between">
                                   <span>Omzet Beras:</span>
                                   <span>Rp{(totalSales/1000000).toFixed(1)} jt</span>
                                 </div>
                                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                   <div className="h-full bg-sky-400" style={{ width: `${(totalSales/max)*100}%` }} />
                                 </div>
                               </div>

                               <div className="space-y-0.5">
                                 <div className="flex justify-between">
                                   <span>Subsidi Bapanas:</span>
                                   <span>Rp{(totalSubsidy/1000000).toFixed(1)} jt</span>
                                 </div>
                                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-400" style={{ width: `${(totalSubsidy/max)*100}%` }} />
                                 </div>
                               </div>

                               <div className="space-y-0.5">
                                 <div className="flex justify-between">
                                   <span>HPP Pembelian:</span>
                                   <span>Rp{(totalCogs/1000000).toFixed(1)} jt</span>
                                 </div>
                                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                   <div className="h-full bg-rose-400" style={{ width: `${(totalCogs/max)*100}%` }} />
                                 </div>
                               </div>
                            </div>
                          );
                        })()}
                     </div>

                     {/* Profit margins */}
                     <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Conop GPM & NPM Averages</span>
                          <p className="text-[10px] text-slate-400 leading-normal mt-1 text-slate-400">
                             Net Profit Margin (NPM) rata-rata gabungan pos pangan dikendalikan subsidi distribusi.
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono font-bold bg-slate-950 p-2 rounded">
                          <span className="text-emerald-400">Rerata GPM: 25.8%</span>
                          <span className="text-emerald-400">Rerata NPM: 6.4%</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Simulation Area Decision as shown in PDF guide */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase font-mono">
                      Simulasi Kelayakan Keberlanjutan Pos Pangan (Cooperative Simulation Decision Panel)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">FORMULA ST_DWithin + DDL</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                     Tombol Simulasi melakukan kalkulasi silang: memisahkan margin tunai, density antrean pos, volatilitas harga beras Bulog lokal, dan tingkat kedekatan akses tumpang tindih gudang lain.
                  </p>

                  <div className="border border-slate-250 rounded-2xl overflow-hidden shadow-xs">
                     <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-[#FAFBFD]/85 text-slate-700 uppercase font-mono tracking-wider font-bold text-[9px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">Pos Pangan</th>
                            <th className="p-3">Kelengkapan Data</th>
                            <th className="p-3">Keputusan Kelayakan SCM</th>
                            <th className="p-3">Detail Pertimbangan Ketua</th>
                            <th className="p-3 text-center">Tindakan Otoritas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-105 divide-slate-100 font-medium text-slate-800">
                          {governedOutposts.map(post => {
                            const pct = calculateOutpostCompletion(post);
                            const sim = simulationResults[post.villageId];

                            return (
                              <tr key={post.villageId} className="hover:bg-slate-50/20">
                                <td className="p-3">
                                  <span className="font-bold text-slate-900 block">{post.villageName}</span>
                                  <span className="text-[9px] text-[#94A3B8] block font-mono">{post.region}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    pct === 100 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {pct}% {pct === 100 ? "LENGKAP" : "BELUM LENGKAP"}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {sim ? (
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                                      sim.status === "LAYAK OPERASI" ? "bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold" :
                                      sim.status === "DIREKOMENDASI RELOKASI / TUTUP" ? "bg-rose-100 text-rose-800 border border-rose-200 font-extrabold" :
                                      "bg-amber-100 text-amber-800"
                                    }`}>
                                      {sim.status}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono italic">Belum disimulasikan</span>
                                  )}
                                </td>
                                <td className="p-3 max-w-[240px] text-[10px] break-words text-slate-650 leading-relaxed font-sans">
                                  {sim ? sim.reason : "Klik '🔮 Simulasi' koordinat untuk mulai komparasi formula."}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => runOutpostSimulation(post)}
                                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all active:scale-95 flex items-center gap-1 mx-auto"
                                  >
                                    <Play className="w-3 h-3 fill-white" />
                                    <span>Simulasi</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                     </table>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Guidelines notes references to HAUS guide to give massive design feedback */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
             <div className="flex items-center gap-1.5">
               <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
               <span>
                 Mode Audit SCM Aktif: Melayani Penyaluran Pangan Berkeadilan Koperasi Merdeka di NTB & Zona 3T Indonesia.
               </span>
             </div>

             <div className="flex items-center gap-3">
               <button
                 onClick={() => {
                   setGovToast("📥 Reset seluruh form simulasi ke default manual Guide PDF...");
                   setGovernedOutposts(prev => prev.map(p => {
                     return {
                       ...p,
                       storeInput: { ...p.storeInput, status: p.villageId === "v-pemenang" || p.villageId === "v-sembalun" || p.villageId === "v-kuta" || p.villageId === "v-sajang" ? "COMPLETE" : p.villageId === "v-gili" ? "BUTUH REVISI" : "NOT STARTED" },
                       competitorInput: { ...p.competitorInput, status: p.villageId === "v-pemenang" || p.villageId === "v-sembalun" || p.villageId === "v-kuta" || p.villageId === "v-sajang" ? "COMPLETE" : "NOT STARTED" },
                       operationalInput: { ...p.operationalInput, status: p.villageId === "v-pemenang" || p.villageId === "v-sembalun" || p.villageId === "v-kuta" || p.villageId === "v-sajang" ? "COMPLETE" : "NOT STARTED" },
                       financeInput: { ...p.financeInput, status: p.villageId === "v-pemenang" || p.villageId === "v-sembalun" || p.villageId === "v-sajang" ? "COMPLETE" : p.villageId === "v-kuta" ? "SEDANG REVIEW BD MANAGER" : "NOT STARTED" }
                     };
                   }));
                   setSimulationResults({});
                   setTimeout(() => setGovToast(null), 3000);
                 }}
                 className="text-[10px] text-red-650 font-bold hover:underline"
               >
                 Format Ulang Simulasi
               </button>
               <span className="text-slate-350">|</span>
               <span>Inspirasi Panduan: HAUS SCM Guidebook 2025</span>
             </div>
          </div>

        </div>

      </div>

      {/* Reject Reason input dialog drawer overlay */}
      {rejectingSection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Format Ulang & Tolak Pengisian Laporan (Reject Input)</span>
              </h4>
              <button
                onClick={() => setRejectingSection(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Alasan Penolakan Dokumen (Reason for Rejection)
              </label>
              <textarea
                rows={4}
                required
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-sans leading-relaxed"
                placeholder="Tuliskan komentar revisi spanduk, kapasitas bongkar muat, kompetitor atau revisi nominal biaya di sini..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 leading-normal select-none">
                Setelah mengirimkan penolakan, Manajer pos / pelapor akan melihat komentar ini di dalam kotak merah review, siap untuk melakukan revisi penginputan ulang.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs font-bold uppercase font-mono">
              <button
                onClick={() => setRejectingSection(null)}
                className="px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-lg"
              >
                Kembali
              </button>
              <button
                disabled={!rejectionReason.trim()}
                onClick={submitRejection}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
