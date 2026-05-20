/**
 * BoviFertil-Pro uchun Google Apps Script.
 * 1) Google Sheets oching.
 * 2) Extensions → Apps Script.
 * 3) Shu kodni joylang.
 * 4) Deploy → New deployment → Web app.
 * 5) Execute as: Me.
 * 6) Who has access: Anyone.
 * 7) Deploy qiling va Web App URL manzilini ilovaga kiriting.
 */

const SHEET_NAME = "BoviFertil-Pro";

function doGet() {
  return ContentService
    .createTextOutput("BoviFertil-Pro Google Sheets API ishlayapti. Web ilovadan POST yuboring.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet_(ss, SHEET_NAME);
    ensureHeaders_(sheet);

    const payloadText = e.parameter.payload || (e.postData ? e.postData.contents : "");
    let data = {};

    // Agar body "payload={...}" shaklida kelsa
    if (payloadText && payloadText.trim().startsWith("{")) {
      data = JSON.parse(payloadText);
    } else if (e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      // x-www-form-urlencoded contents fallback
      const decoded = decodeURIComponent(String(payloadText).replace(/^payload=/, "").replace(/\+/g, " "));
      data = JSON.parse(decoded);
    }

    const row = [
      new Date(),
      data.createdAt || "",
      data.inventory || "",
      data.breed || "",
      data.age || "",
      data.weight || "",
      data.milk || "",
      data.lactationDay || "",
      data.bcs || "",
      data.servicePeriod || "",
      data.inseminations || "",
      data.heatSign || "",
      data.energy || "",
      data.protein || "",
      data.mineral || "",
      data.feedQuality || "",
      data.water || "",
      data.riskScore || "",
      data.riskLevel || "",
      data.riskFactors || "",
      data.recommendations || "",
      data.calendar || "",
      data.notes || ""
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({status:"success", message:"Saved to Google Sheets"}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({status:"error", message:err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headers = [
    "Server vaqti",
    "Ilovadagi sana",
    "Inventar raqam",
    "Zot",
    "Yosh",
    "Tirik vazn, kg",
    "Kunlik sut, litr",
    "Laktatsiya kuni",
    "BCS",
    "Servis davri",
    "Urug‘lantirishlar soni",
    "Kuyikish belgisi",
    "Energiya taʼminoti",
    "Protein taʼminoti",
    "Mineral-vitamin",
    "Yem-xashak sifati",
    "Suv taʼminoti",
    "Xavf foizi",
    "Xavf darajasi",
    "Xavf omillari",
    "Profilaktik tavsiyalar",
    "Reproduktiv kalendar",
    "Izoh"
  ];

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const empty = firstRow.every(v => v === "");
  if (empty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
}
