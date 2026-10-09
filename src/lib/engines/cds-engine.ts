import { Product } from "../types";

export type InteractionSeverity = "CRITICAL_CONTRAINDICATION" | "MODERATE" | "MINOR";

export interface DrugInteractionAlert {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  mechanism: string;
  clinicalAction: string;
  requiresApjPin: boolean;
}

export class CDSEngine {
  // Matriks Interaksi Obat Terkenal
  private static INTERACTION_RULES: {
    drugKeywordsA: string[];
    drugKeywordsB: string[];
    severity: InteractionSeverity;
    mechanism: string;
    clinicalAction: string;
    requiresApjPin: boolean;
  }[] = [
    {
      drugKeywordsA: ["codeine", "tramadol", "morfin"],
      drugKeywordsB: ["diazepam", "alprazolam", "clobazam"],
      severity: "CRITICAL_CONTRAINDICATION",
      mechanism:
        "Kombinasi Opioid dan Benzodiazepin menyebabkan depresi sistem saraf pusat dan depresi pernapasan fatal.",
      clinicalAction:
        "KONTRAINDIKASI KERAS: Hindari penggunaan bersamaan kecuali atas instruksi onkologi/paliatif tertulis dan pemantauan ketat.",
      requiresApjPin: true,
    },
    {
      drugKeywordsA: ["amlodipine"],
      drugKeywordsB: ["simvastatin"],
      severity: "MODERATE",
      mechanism:
        "Amlodipine meningkatkan konsentrasi plasma Simvastatin, meningkatkan risiko miopati dan rhabdomyolysis.",
      clinicalAction:
        "Batasi dosis Simvastatin maksimal 20 mg per hari jika diberikan bersama Amlodipine.",
      requiresApjPin: false,
    },
    {
      drugKeywordsA: ["amoxicillin", "penicillin"],
      drugKeywordsB: ["metformin"],
      severity: "MINOR",
      mechanism:
        "Amoksisilin berpotensi sedikit memengaruhi flora usus dalam penyerapan glukosa.",
      clinicalAction: "Pantau kadar glukosa darah berkala.",
      requiresApjPin: false,
    },
    {
      drugKeywordsA: ["paracetamol"],
      drugKeywordsB: ["tramadol"],
      severity: "MINOR",
      mechanism:
        "Kombinasi sinergis analgesik (sering digunakan sebagai terapi kombinasi terkontrol).",
      clinicalAction: "Pastikan total dosis paracetamol harian tidak melebihi 4000 mg.",
      requiresApjPin: false,
    },
  ];

  /**
   * Pengecekan Interaksi Obat Antar Item di Keranjang
   */
  static checkInteractions(productsInCart: Product[]): DrugInteractionAlert[] {
    const alerts: DrugInteractionAlert[] = [];

    for (let i = 0; i < productsInCart.length; i++) {
      for (let j = i + 1; j < productsInCart.length; j++) {
        const prodA = productsInCart[i];
        const prodB = productsInCart[j];

        const nameA = (prodA.genericName + " " + prodA.name).toLowerCase();
        const nameB = (prodB.genericName + " " + prodB.name).toLowerCase();

        for (const rule of this.INTERACTION_RULES) {
          const matchA1 = rule.drugKeywordsA.some((k) => nameA.includes(k));
          const matchB1 = rule.drugKeywordsB.some((k) => nameB.includes(k));

          const matchA2 = rule.drugKeywordsA.some((k) => nameB.includes(k));
          const matchB2 = rule.drugKeywordsB.some((k) => nameA.includes(k));

          if ((matchA1 && matchB1) || (matchA2 && matchB2)) {
            alerts.push({
              drugA: prodA.name,
              drugB: prodB.name,
              severity: rule.severity,
              mechanism: rule.mechanism,
              clinicalAction: rule.clinicalAction,
              requiresApjPin: rule.requiresApjPin,
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Pengecekan Alergi Pasien
   */
  static checkPatientAllergies(
    productsInCart: Product[],
    patientAllergies: string[]
  ): string[] {
    const warnings: string[] = [];

    if (!patientAllergies || patientAllergies.length === 0) return warnings;

    for (const prod of productsInCart) {
      const fullText = (prod.name + " " + prod.genericName + " " + (prod.contraindications?.join(" ") || "")).toLowerCase();

      for (const allergy of patientAllergies) {
        if (fullText.includes(allergy.toLowerCase())) {
          warnings.push(
            `BAHAYA ALERGI PASIEN: Pasien memiliki riwayat alergi terdaftar "${allergy}", yang terkandung pada obat "${prod.name}"!`
          );
        }
      }
    }

    return warnings;
  }
}
