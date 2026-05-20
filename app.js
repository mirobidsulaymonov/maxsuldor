const STORAGE_KEY = "bovifertil_records_v2";
const URL_KEY = "bovifertil_google_script_url";

const form = document.getElementById("cowForm");
const recordsBody = document.getElementById("recordsBody");
const statusBox = document.getElementById("statusBox");
const scriptUrlInput = document.getElementById("scriptUrl");

let lastRecord = null;

function getRecords(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch(e){ return []; }
}
function saveRecords(records){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function showStatus(text, type="info"){
  statusBox.textContent = text;
  statusBox.style.borderColor = type === "error" ? "#fecaca" : type === "ok" ? "#bbf7d0" : "#cbd5e1";
  statusBox.style.background = type === "error" ? "#fff1f2" : type === "ok" ? "#f0fdf4" : "#f8fafc";
}
function val(data, name){ return data.get(name); }
function num(data, name){ return Number(data.get(name) || 0); }

function calculateRisk(data){
  let score = 0;
  const factors = [];
  const recs = [];

  const bcs = num(data, "bcs");
  const servicePeriod = num(data, "servicePeriod");
  const inseminations = num(data, "inseminations");
  const milk = num(data, "milk");
  const lactationDay = num(data, "lactationDay");

  if (bcs <= 2.0) { score += 22; factors.push("Tana konditsiyasi juda past: energiya tanqisligi ehtimoli yuqori."); recs.push("Ratsion energiya zichligini oshiring, sifatli konsentrat va muvozanatli yem qo‘shing."); }
  else if (bcs === 2.5) { score += 12; factors.push("BCS past: tug‘ruqdan keyingi salbiy energiya balansi kuzatilishi mumkin."); recs.push("BCS 3.0–3.5 oralig‘iga yetguncha 14 kunlik monitoring yuriting."); }
  else if (bcs >= 4.0) { score += 14; factors.push("BCS yuqori: semizlik reproduktiv siklga salbiy taʼsir qilishi mumkin."); recs.push("Ortiqcha konsentratni kamaytirib, ratsionni zootexnik meʼyor asosida qayta tuzing."); }

  if (servicePeriod > 120) { score += 20; factors.push("Servis davri 120 kundan oshgan."); recs.push("Veterinariya ko‘rigi, bachadon holati va metabolik buzilishlar bo‘yicha tekshiruv rejalashtiring."); }
  else if (servicePeriod > 90) { score += 10; factors.push("Servis davri meʼyordan cho‘zila boshlagan."); recs.push("Kuyikish monitoringini kuchaytiring va urug‘lantirish vaqtini qayta baholang."); }

  if (inseminations >= 4) { score += 18; factors.push("Takroriy urug‘lantirishlar soni yuqori."); recs.push("Reproduktiv tekshiruv, sperma sifati va urug‘lantirish texnikasini tahlil qiling."); }
  else if (inseminations === 3) { score += 9; factors.push("Urug‘lantirishlar soni o‘rta xavf darajasida."); recs.push("Kuyikishni aniqlash aniqligini oshiring."); }

  const heat = val(data, "heatSign");
  if (heat === "weak") { score += 10; factors.push("Kuyikish belgisi sust."); recs.push("Kuyikishni ertalab-kechqurun kuzatish va faollik monitoringini yo‘lga qo‘ying."); }
  if (heat === "none") { score += 18; factors.push("Kuyikish belgisi kuzatilmayapti."); recs.push("Energiya, fosfor, A/E vitaminlari va ginekologik holatni tekshiring."); }

  if (val(data,"energy") === "low") { score += 20; factors.push("Ratsionda energiya yetishmovchiligi bor."); recs.push("Quruq modda isteʼmoli va energiya balansini oshirish bo‘yicha ratsionni qayta hisoblang."); }
  else if (val(data,"energy") === "medium") { score += 10; factors.push("Energiya taʼminoti qisman yetarli."); recs.push("Yuqori mahsuldorlik davrida energiya manbalarini optimallashtiring."); }

  if (val(data,"protein") === "low") { score += 14; factors.push("Protein yetishmovchiligi ehtimoli mavjud."); recs.push("Hazmlanuvchi protein manbalarini meʼyor asosida qo‘shing."); }
  else if (val(data,"protein") === "medium") { score += 7; factors.push("Protein taʼminoti qisman yetarli."); recs.push("Protein-energiya nisbatini tekshiring."); }

  if (val(data,"mineral") === "none") { score += 18; factors.push("Mineral-vitamin qo‘shimchalar berilmaydi."); recs.push("Ca:P nisbati, mikroelementlar va A, D, E vitaminlari bo‘yicha premiks dasturini kiriting."); }
  else if (val(data,"mineral") === "sometimes") { score += 9; factors.push("Mineral-vitamin qo‘shimchalar muntazam emas."); recs.push("Premiks va mineral tuzlarni doimiy jadval asosida bering."); }

  if (val(data,"feedQuality") === "bad") { score += 18; factors.push("Yem-xashak sifati past yoki mog‘or xavfi bor."); recs.push("Mog‘orlangan yemni ratsiondan chiqarib, yem sifatini laborator tekshiruvdan o‘tkazing."); }
  else if (val(data,"feedQuality") === "medium") { score += 6; factors.push("Yem-xashak sifati o‘rtacha."); recs.push("Silos, pichan va konsentrat sifatini yaxshilang."); }

  if (val(data,"water") === "bad") { score += 10; factors.push("Suv taʼminoti yetarli emas."); recs.push("Toza suvga erkin kirishni taʼminlang, suv idishlarini dezinfeksiya qiling."); }
  else if (val(data,"water") === "medium") { score += 5; factors.push("Suv taʼminoti qisman cheklangan."); recs.push("Suv isteʼmolini sut mahsuldorligi bilan moslashtiring."); }

  if (milk >= 30 && lactationDay <= 90 && bcs <= 2.5) {
    score += 10;
    factors.push("Yuqori sut mahsuldorligi va erta laktatsiyada BCS pastligi salbiy energiya balansini kuchaytiradi.");
    recs.push("Erta laktatsiya davrida ketoz va atsidoz xavfini nazorat qiling.");
  }

  score = Math.min(100, score);
  let level = "Past xavf", klass = "low", desc = "Ko‘rsatkichlar nisbatan meʼyorda.";
  if (score >= 66) { level = "Yuqori xavf"; klass = "high"; desc = "Alimentar bepushtlik xavfi yuqori, tezkor profilaktika zarur."; }
  else if (score >= 34) { level = "O‘rta xavf"; klass = "mid"; desc = "Ayrim omillar xavf tug‘diradi, monitoring va tuzatish kerak."; }

  if (!factors.length) factors.push("Muhim xavf omili aniqlanmadi.");
  if (!recs.length) recs.push("Meʼyoriy ratsion, BCS monitoringi va reproduktiv kalendarni davom ettiring.");

  return {score, level, klass, desc, factors, recs};
}

function buildCalendar(){
  const now = new Date();
  const days = [7,14,21,30,45].map(d => {
    const x = new Date(now); x.setDate(x.getDate()+d);
    return x.toLocaleDateString("uz-UZ");
  });
  return [
    `${days[0]} — tana konditsiyasi va sut mahsuldorligini qayta baholash`,
    `${days[1]} — ratsion samaradorligini tekshirish`,
    `${days[2]} — kuyikish belgilarini nazorat qilish`,
    `${days[3]} — veterinariya/zootexnik ko‘rik`,
    `${days[4]} — reproduktiv holat bo‘yicha yakuniy monitoring`
  ];
}

function recordFromForm(data){
  const risk = calculateRisk(data);
  const calendar = buildCalendar();
  return {
    id: Date.now().toString(),
    createdAt: new Date().toLocaleString("uz-UZ"),
    inventory: val(data,"inventory"),
    breed: val(data,"breed"),
    age: num(data,"age"),
    weight: num(data,"weight"),
    milk: num(data,"milk"),
    lactationDay: num(data,"lactationDay"),
    bcs: num(data,"bcs"),
    servicePeriod: num(data,"servicePeriod"),
    inseminations: num(data,"inseminations"),
    heatSign: val(data,"heatSign"),
    energy: val(data,"energy"),
    protein: val(data,"protein"),
    mineral: val(data,"mineral"),
    feedQuality: val(data,"feedQuality"),
    water: val(data,"water"),
    notes: val(data,"notes"),
    riskScore: risk.score,
    riskLevel: risk.level,
    riskFactors: risk.factors.join(" | "),
    recommendations: risk.recs.join(" | "),
    calendar: calendar.join(" | "),
    sentToSheets: false
  };
}

function renderReport(record){
  lastRecord = record;
  const risk = {score: record.riskScore, level: record.riskLevel, desc: record.riskScore>=66?"Alimentar bepushtlik xavfi yuqori.":record.riskScore>=34?"O‘rta xavf, profilaktik tuzatish talab etiladi.":"Past xavf, monitoring davom ettiriladi."};
  document.getElementById("riskPercent").textContent = `${risk.score}%`;
  document.getElementById("riskLevel").textContent = risk.level;
  document.getElementById("riskDesc").textContent = risk.desc;
  document.getElementById("heroRisk").textContent = `${risk.score}%`;
  document.getElementById("heroRisk").style.background = `conic-gradient(${risk.score>=66?"#dc2626":risk.score>=34?"#f59e0b":"#16803a"} ${risk.score*3.6}deg,#e5efe7 0deg)`;
  document.getElementById("heroRiskText").textContent = risk.level;

  fillList("riskFactors", record.riskFactors.split(" | "));
  fillList("recommendations", record.recommendations.split(" | "));
  fillList("calendarList", record.calendar.split(" | "));
}
function fillList(id, items){
  const ul = document.getElementById(id);
  ul.innerHTML = items.map(x => `<li>${escapeHtml(x)}</li>`).join("");
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function renderRecords(){
  const records = getRecords();
  recordsBody.innerHTML = records.slice().reverse().map(r => `
    <tr>
      <td>${escapeHtml(r.createdAt)}</td>
      <td><b>${escapeHtml(r.inventory)}</b></td>
      <td>${escapeHtml(r.breed)}</td>
      <td>${escapeHtml(r.milk)} l</td>
      <td>${escapeHtml(r.bcs)}</td>
      <td><span class="pill ${r.riskScore>=66?"high":r.riskScore>=34?"mid":"low"}">${r.riskScore}% — ${escapeHtml(r.riskLevel)}</span></td>
      <td>${r.sentToSheets ? "✅ yuborilgan" : "⏳ lokal"}</td>
    </tr>
  `).join("") || `<tr><td colspan="7">Hali yozuv yo‘q.</td></tr>`;

  document.getElementById("totalRecords").textContent = records.length;
  document.getElementById("lowRecords").textContent = records.filter(r=>r.riskScore<34).length;
  document.getElementById("midRecords").textContent = records.filter(r=>r.riskScore>=34 && r.riskScore<66).length;
  document.getElementById("highRecords").textContent = records.filter(r=>r.riskScore>=66).length;
}

async function sendToGoogleSheets(record){
  const url = localStorage.getItem(URL_KEY);
  if(!url){
    showStatus("Google Apps Script URL kiritilmagan. Avval Google Sheets sozlamasiga URL manzilni yozing.", "error");
    return false;
  }
  const payload = new URLSearchParams();
  payload.append("payload", JSON.stringify(record));

  try{
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
      body: payload.toString()
    });
    markAsSent(record.id);
    showStatus("Maʼlumot Google Sheets’ga yuborildi. Jadvalni ochib tekshiring.", "ok");
    return true;
  }catch(err){
    showStatus("Google Sheets’ga yuborishda xatolik: " + err.message, "error");
    return false;
  }
}
function markAsSent(id){
  const records = getRecords();
  const idx = records.findIndex(r=>r.id===id);
  if(idx>=0){ records[idx].sentToSheets = true; saveRecords(records); renderRecords(); }
}
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const data = new FormData(form);
  const record = recordFromForm(data);
  const records = getRecords();
  records.push(record);
  saveRecords(records);
  renderReport(record);
  renderRecords();
  showStatus("Hisoblandi va lokal xotiraga saqlandi. Google Sheets’ga yuborish uchun yashil tugmani bosing.", "ok");
});

document.getElementById("sendLastBtn").addEventListener("click", async ()=>{
  if(!lastRecord){
    const records = getRecords();
    lastRecord = records[records.length-1];
  }
  if(!lastRecord){ showStatus("Yuborish uchun yozuv yo‘q.", "error"); return; }
  await sendToGoogleSheets(lastRecord);
});
document.getElementById("sendAllBtn").addEventListener("click", async ()=>{
  const unsent = getRecords().filter(r=>!r.sentToSheets);
  if(!unsent.length){ showStatus("Yuborilmagan yozuvlar yo‘q.", "ok"); return; }
  for(const r of unsent){ await sendToGoogleSheets(r); }
});
document.getElementById("saveUrlBtn").addEventListener("click", ()=>{
  const url = scriptUrlInput.value.trim();
  if(!url.startsWith("https://script.google.com/")){
    showStatus("URL noto‘g‘ri. Google Apps Script Web App URL https://script.google.com/... bilan boshlanishi kerak.", "error");
    return;
  }
  localStorage.setItem(URL_KEY, url);
  showStatus("Google Apps Script URL saqlandi.", "ok");
});
document.getElementById("demoBtn").addEventListener("click", ()=>{
  form.inventory.value = "DEMO-125";
  form.breed.value = "Golshteyn";
  form.age.value = "4";
  form.weight.value = "560";
  form.milk.value = "32";
  form.lactationDay.value = "65";
  form.bcs.value = "2.5";
  form.servicePeriod.value = "125";
  form.inseminations.value = "4";
  form.heatSign.value = "weak";
  form.energy.value = "low";
  form.protein.value = "medium";
  form.mineral.value = "sometimes";
  form.feedQuality.value = "medium";
  form.water.value = "good";
  form.notes.value = "Demo: yuqori mahsuldorlik, BCS past, servis davri cho‘zilgan.";
  location.hash = "#form";
});
document.getElementById("clearBtn").addEventListener("click", ()=>form.reset());
document.getElementById("deleteAllBtn").addEventListener("click", ()=>{
  if(confirm("Barcha lokal yozuvlar o‘chirilsinmi?")){
    localStorage.removeItem(STORAGE_KEY); renderRecords(); showStatus("Lokal yozuvlar o‘chirildi.", "ok");
  }
});
document.getElementById("exportCsvBtn").addEventListener("click", ()=>{
  const records = getRecords();
  if(!records.length){ showStatus("CSV uchun yozuv yo‘q.", "error"); return; }
  const headers = Object.keys(records[0]);
  const csv = [headers.join(",")].concat(records.map(r=>headers.map(h=>`"${String(r[h]??"").replaceAll('"','""')}"`).join(","))).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bovifertil_records.csv";
  a.click();
});
scriptUrlInput.value = localStorage.getItem(URL_KEY) || "";
renderRecords();
