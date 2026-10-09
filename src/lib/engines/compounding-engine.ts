export interface PediatricDoseEvaluation {
  maxAllowableDailyDoseMg: number;
  calculatedPrescribedDailyDoseMg: number;
  percentageOfMaxDose: number;
  isOverdose: boolean;
  warningMessage?: string;
}

export class CompoundingEngine {
  /**
   * Menghitung kebutuhan bahan tablet dalam racikan
   * @param method "DTD" (Dosis per bungkus) atau "NON_DTD" (Dosis total resep)
   */
  static calculateIngredientRequirement(
    method: "DTD" | "NON_DTD",
    strengthPerTabletMg: number,
    packetCount: number,
    dosePerPacketMg?: number,
    totalPrescribedMg?: number
  ): {
    tabletsNeeded: number;
    fractionalExplanation: string;
  } {
    if (strengthPerTabletMg <= 0) {
      return { tabletsNeeded: 0, fractionalExplanation: "Kekuatan tablet tidak valid." };
    }

    if (method === "DTD") {
      const dose = dosePerPacketMg || 0;
      const totalMgNeeded = dose * packetCount;
      const exactTablets = totalMgNeeded / strengthPerTabletMg;
      const roundedTablets = Math.ceil(exactTablets * 10) / 10; // bulatkan ke 0.1 tablet

      return {
        tabletsNeeded: roundedTablets,
        fractionalExplanation: `${dose} mg x ${packetCount} bungkus = ${totalMgNeeded} mg. Dibagi ${strengthPerTabletMg} mg/tab = ${exactTablets.toFixed(2)} tablet (Dibulatkan praktis: ${roundedTablets} tab)`,
      };
    } else {
      const totalMg = totalPrescribedMg || 0;
      const exactTablets = totalMg / strengthPerTabletMg;
      const roundedTablets = Math.ceil(exactTablets * 10) / 10;

      return {
        tabletsNeeded: roundedTablets,
        fractionalExplanation: `Total ${totalMg} mg dibagi ${packetCount} bungkus. Kebutuhan: ${totalMg} mg / ${strengthPerTabletMg} mg = ${exactTablets.toFixed(2)} tablet (${roundedTablets} tab)`,
      };
    }
  }

  /**
   * Evaluasi Dosis Maksimum Anak (Young, Dilling, Clark)
   */
  static evaluatePediatricDose(params: {
    patientAgeYears?: number;
    patientWeightKg?: number;
    adultMaxDailyDoseMg: number;
    prescribedDailyDoseMg: number;
  }): PediatricDoseEvaluation {
    const { patientAgeYears, patientWeightKg, adultMaxDailyDoseMg, prescribedDailyDoseMg } = params;

    let maxAllowableDaily = adultMaxDailyDoseMg;

    if (patientWeightKg && patientWeightKg > 0) {
      // Rumus Clark (Berdasarkan Berat Badan - Paling Akurat)
      maxAllowableDaily = (patientWeightKg / 70) * adultMaxDailyDoseMg;
    } else if (patientAgeYears && patientAgeYears > 0) {
      if (patientAgeYears < 8) {
        // Rumus Young (Usia 1 - 8 tahun)
        maxAllowableDaily = (patientAgeYears / (patientAgeYears + 12)) * adultMaxDailyDoseMg;
      } else {
        // Rumus Dilling (Usia 8 - 20 tahun)
        maxAllowableDaily = (patientAgeYears / 20) * adultMaxDailyDoseMg;
      }
    }

    const percentage = Math.round((prescribedDailyDoseMg / maxAllowableDaily) * 100);
    const isOverdose = percentage > 100;

    let warningMessage: string | undefined = undefined;
    if (isOverdose) {
      warningMessage = `PERINGATAN OVERDOSIS KLINIS: Dosis yang diresepkan (${prescribedDailyDoseMg} mg/hari) mencapai ${percentage}% dari Dosis Maksimum Aman (${Math.round(maxAllowableDaily)} mg/hari)! Diperlukan konfirmasi dokter/APJ.`;
    }

    return {
      maxAllowableDailyDoseMg: Math.round(maxAllowableDaily),
      calculatedPrescribedDailyDoseMg: prescribedDailyDoseMg,
      percentageOfMaxDose: percentage,
      isOverdose,
      warningMessage,
    };
  }

  /**
   * Menghitung Biaya Embalase (Kemasan) & Tuslah (Jasa Farmasi)
   */
  static calculateFees(
    packagingType: "KAPSUL" | "PUYER_PERKAMEN" | "POT_SALEP" | "BOTOL_SIRUP",
    packetCount: number
  ): {
    embalaseCost: number;
    tuslahFee: number;
  } {
    let embalaseCost = 0;
    const baseTuslah = 7000; // Standar jasa racik apotek

    switch (packagingType) {
      case "KAPSUL":
        embalaseCost = packetCount * 300; // Rp 300 per cangkang kapsul
        break;
      case "PUYER_PERKAMEN":
        embalaseCost = packetCount * 200; // Rp 200 per lembar kertas puyer
        break;
      case "POT_SALEP":
        embalaseCost = 2500; // Rp 2.500 per pot salep
        break;
      case "BOTOL_SIRUP":
        embalaseCost = 3500; // Rp 3.500 per botol sirup kaca/PET
        break;
    }

    return {
      embalaseCost,
      tuslahFee: baseTuslah,
    };
  }

  /**
   * Menghitung Beyond Use Date (BUD) sesuai USP 795
   */
  static calculateBeyondUseDate(
    packagingType: "KAPSUL" | "PUYER_PERKAMEN" | "POT_SALEP" | "BOTOL_SIRUP"
  ): string {
    const d = new Date();
    if (packagingType === "BOTOL_SIRUP") {
      // Sediaan cair berair: 14 hari di kulkas
      d.setDate(d.getDate() + 14);
    } else if (packagingType === "POT_SALEP") {
      // Sediaan semisolida / salep: 30 hari
      d.setDate(d.getDate() + 30);
    } else {
      // Sediaan padat oral (puyer/kapsul): maksimal 60 hari
      d.setDate(d.getDate() + 60);
    }
    return d.toISOString().split("T")[0];
  }
}
