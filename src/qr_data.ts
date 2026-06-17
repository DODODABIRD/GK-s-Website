export interface QrItem {
  qrId: string;
  name: string;
  weightKg: number;
  grade: "Spec A" | "Spec B" | "IR64 Standard";
  supplier: string;
  batchNo: string;
  description: string;
}

export const DEMO_QR_ITEMS: QrItem[] = [
  {
    qrId: "KMP-RICE-10KG-001",
    name: "Beras Pandan Wangi Premium 10kg",
    weightKg: 10,
    grade: "Spec A",
    supplier: "Gapoktan Sari Tani Lombok",
    batchNo: "BATCH-202606-WN01",
    description: "Premium aromatic long-grain rice, double-polished from Sembalun Highland.",
  },
  {
    qrId: "KMP-RICE-20KG-002",
    name: "Beras Sentra Ramos Premium 20kg",
    weightKg: 20,
    grade: "Spec A",
    supplier: "Koperasi Tani Makmur Malang",
    batchNo: "BATCH-202606-ML02",
    description: "Fluffy white grade-A rice, vacuum-packed with high preservation standards.",
  },
  {
    qrId: "KMP-RICE-50KG-003",
    name: "Beras Cadangan Bulog IR64 50kg",
    weightKg: 50,
    grade: "IR64 Standard",
    supplier: "BULOG Divre NTB",
    batchNo: "BATCH-202606-BL50",
    description: "National food reserve stock, high grain integrity and low broken-grain ratio.",
  },
  {
    qrId: "KMP-RICE-10KG-004",
    name: "Beras Rojo Lele Cianjur 10kg",
    weightKg: 10,
    grade: "Spec A",
    supplier: "Gapoktan Cianjur Harmoni",
    batchNo: "BATCH-202606-CJ04",
    description: "Traditional moist variety, famous for rich aroma and sticky fluffy texture.",
  },
  {
    qrId: "KMP-RICE-25KG-005",
    name: "Beras Cianjur Pandan Wangi 25kg",
    weightKg: 25,
    grade: "Spec A",
    supplier: "Sinergi Tani Jawa Barat",
    batchNo: "BATCH-202606-CJ05",
    description: "Classic high-quality local premium rice from certified organic cooperatives.",
  }
];

/**
 * Returns a JSON string payload formatted for actual QR code embedding
 */
export function getQrPayload(item: QrItem): string {
  return JSON.stringify({
    qrId: item.qrId,
    name: item.name,
    weightKg: item.weightKg,
    grade: item.grade,
    batchNo: item.batchNo
  });
}
