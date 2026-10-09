import { Product, SipnapReportRow, SPOrder, Transaction } from "../types";

export class RegulatoryEngine {
  /**
   * Menghasilkan Payload FHIR Kemenkes SATUSEHAT (R4) untuk MedicationDispense
   */
  static generateSatuSehatMedicationDispensePayload(
    tx: Transaction,
    apotekOrgId = "10000004", // Dummy Sandbox Apotek Org ID
    pharmacistIhsId = "100000000001"
  ) {
    return {
      resourceType: "MedicationDispense",
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/dispense/${apotekOrgId}`,
          value: tx.invoiceNumber,
        },
      ],
      status: "completed",
      category: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/medicationdispense-category",
            code: "community",
            display: "Community Pharmacy",
          },
        ],
      },
      medicationCodeableConcept: {
        coding: tx.items.map((item) => ({
          system: "http://sys-ids.kemkes.go.id/kfa",
          code: item.product.kfaCode || "93000000",
          display: item.product.name,
        })),
      },
      subject: {
        reference: `Patient/${tx.customerName.replace(/\s+/g, "-").toLowerCase()}`,
        display: tx.customerName,
      },
      performer: [
        {
          actor: {
            reference: `Practitioner/${pharmacistIhsId}`,
            display: tx.cashierName,
          },
        },
      ],
      quantity: {
        value: tx.items.reduce((acc, it) => acc + it.quantity, 0),
        unit: "unit",
      },
      whenHandedOver: tx.timestamp,
      dosageInstruction: tx.items.map((it) => ({
        text: it.racikanData?.dosageSigna || "Sesuai petunjuk dokter / aturan etiket",
      })),
    };
  }

  /**
   * Menghasilkan Baris Laporan SIPNAP (Sistem Pelaporan Narkotika & Psikotropika Kemenkes)
   */
  static generateSipnapRows(transactions: Transaction[], products: Product[]): SipnapReportRow[] {
    const controlledClasses = ["NARKOTIKA", "PSIKOTROPIKA"];
    const rows: SipnapReportRow[] = [];
    let counter = 1;

    for (const tx of transactions) {
      for (const item of tx.items) {
        if (controlledClasses.includes(item.product.drugClass)) {
          const initialStock = item.selectedBatch.currentStock + item.quantity;
          const finalStock = item.selectedBatch.currentStock;

          rows.push({
            no: counter++,
            kfaCode: item.product.kfaCode || "93099990",
            productName: item.product.name,
            dosageForm: item.product.baseUnit,
            unit: item.selectedUnit,
            initialStock,
            incomingQty: 0,
            incomingInvoiceNo: "-",
            incomingPbfName: "PT. Kimia Farma TD",
            outgoingPrescriptionQty: item.quantity,
            prescriptionNo: tx.prescriptionNumber || `RXP-${tx.invoiceNumber}`,
            prescriptionDate: tx.timestamp.split("T")[0],
            doctorName: tx.doctorName || "dr. Hendra Wijaya, Sp.PD",
            doctorSip: "SIP.503/442/01/DS/2023",
            patientName: tx.customerName,
            patientAddress: "DKI Jakarta",
            destructionQty: 0,
            finalStock,
          });
        }
      }
    }

    return rows;
  }

  /**
   * Format Surat Pesanan Resmi 5 Jenis BPOM
   */
  static generateSpTemplate(sp: SPOrder): string {
    const itemRows = sp.items
      .map(
        (it, idx) =>
          `<tr>
            <td style="border:1px solid #ccc; padding:6px; text-align:center;">${idx + 1}</td>
            <td style="border:1px solid #ccc; padding:6px;">${it.productName}</td>
            <td style="border:1px solid #ccc; padding:6px;">${it.genericName}</td>
            <td style="border:1px solid #ccc; padding:6px;">${it.form}</td>
            <td style="border:1px solid #ccc; padding:6px; text-align:center; font-weight:bold;">${it.quantity} ${it.unit}</td>
            <td style="border:1px solid #ccc; padding:6px;">${it.note || "-"}</td>
          </tr>`
      )
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #111;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; text-transform: uppercase;">SURAT PESANAN OBAT ${sp.type}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px;">Nomor SP: <strong>${sp.spNumber}</strong></p>
        </div>
        
        <p style="font-size: 13px; line-height: 1.6;">
          Yang bertanda tangan di bawah ini:<br/>
          Nama Apoteker : <strong>${sp.apjName}</strong><br/>
          Nomor SIPA    : <strong>${sp.apjSipa}</strong><br/>
          Jabatan       : Apoteker Penanggung Jawab (APJ)<br/>
          Nama Apotek   : Apotek Kerso Waras<br/>
          Nomor SIA     : 440/0912/DPMPTSP/JEPARA/2021<br/>
          Alamat Apotek : Jl. Raya Jepara-Bugel No.Perempatan, RT.04/RW.01, Mojo, Kerso, Kedung, Jepara 59463
        </p>

        <p style="font-size: 13px;">
          Mengajukan pesanan kepada:<br/>
          PBF Tujuan    : <strong>${sp.pbfName}</strong><br/>
          Alamat PBF    : ${sp.pbfAddress}
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="border:1px solid #ccc; padding:6px;">No</th>
              <th style="border:1px solid #ccc; padding:6px;">Nama Dagang</th>
              <th style="border:1px solid #ccc; padding:6px;">Bahan Aktif / Generik</th>
              <th style="border:1px solid #ccc; padding:6px;">Bentuk Sediaan</th>
              <th style="border:1px solid #ccc; padding:6px;">Jumlah</th>
              <th style="border:1px solid #ccc; padding:6px;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
          <div style="text-align: center; width: 240px;">
            <p style="font-size: 12px; margin-bottom: 50px;">Jepara, ${sp.date}<br/>Apoteker Penanggung Jawab,</p>
            <p style="font-size: 12px; font-weight: bold; text-decoration: underline; margin: 0;">${sp.apjName}</p>
            <p style="font-size: 11px; margin: 2px 0 0 0;">SIPA: ${sp.apjSipa}</p>
          </div>
        </div>
      </div>
    `;
  }
}
