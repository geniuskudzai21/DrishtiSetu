const strings = {
  en:{
    tagline:"Flood relocation decision support · Punjab",priority:"Relocation priority",priorityHint:"Ranked by risk × vulnerability",allDistricts:"All districts",
    layers:"Map layers",settlements:"Settlements",sitesLayer:"Candidate sites",floodExtent:"Flood extent",legend:"Flood risk",high:"High",mod:"Moderate",low:"Low",site:"Candidate site",
    empty:"Select a settlement from the list or map to see its risk, safer sites, and capacity.",riskScore:"Risk score",why:"Why this score",sites:"Ranked safer sites",capacity:"Carrying capacity",perCap:"Space per person (m²)",
    assistant:"Ask the assistant",ask:"Ask",decision:"Officer decision",approve:"Approve plan",reject:"Reject",notice:"Decision support only. Relocation is never executed automatically.",audit:"Audit log",
    retry:"Retry",downloadPlan:"Download plan (PDF)",noResults:"No settlements match this district.",loading:"Loading…",noActions:"No actions yet.",people:"people",vulnerability:"vulnerability",
    sufficient:"Sufficient",shortfall:"Shortfall",capacityLine:"Sites can hold {capacity} people vs {population} to relocate.",hand:"HAND",road:"road",hectares:"ha",
    sampleNotice:"API unavailable. Showing sample data; changes may not be saved.",chatError:"Could not reach the assistant. Please try again.",decisionError:"Could not save this decision. The sample demo will record it locally.",
    auditError:"Could not load the audit log. Showing locally recorded actions.",hazardError:"Could not load flood extent data. Showing the sample layer.",detailsError:"Could not load settlement details. Showing sample details."
  },
  pa:{
    tagline:"ਹੜ੍ਹ ਮੁੜ-ਵਸੇਬਾ ਫੈਸਲਾ ਸਹਾਇਤਾ · ਪੰਜਾਬ",priority:"ਮੁੜ-ਵਸੇਬੇ ਦੀ ਤਰਜੀਹ",priorityHint:"ਜੋਖਮ × ਕਮਜ਼ੋਰੀ ਅਨੁਸਾਰ ਦਰਜਾ",allDistricts:"ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ",
    layers:"ਨਕਸ਼ੇ ਦੀਆਂ ਪਰਤਾਂ",settlements:"ਬਸਤੀਆਂ",sitesLayer:"ਸੰਭਾਵੀ ਥਾਵਾਂ",floodExtent:"ਹੜ੍ਹ ਦਾ ਖੇਤਰ",legend:"ਹੜ੍ਹ ਦਾ ਜੋਖਮ",high:"ਉੱਚ",mod:"ਦਰਮਿਆਨਾ",low:"ਘੱਟ",site:"ਸੰਭਾਵੀ ਥਾਂ",
    empty:"ਜੋਖਮ, ਸੁਰੱਖਿਅਤ ਥਾਵਾਂ ਅਤੇ ਸਮਰੱਥਾ ਦੇਖਣ ਲਈ ਸੂਚੀ ਜਾਂ ਨਕਸ਼ੇ ਤੋਂ ਪਿੰਡ ਚੁਣੋ।",riskScore:"ਜੋਖਮ ਅੰਕ",why:"ਇਹ ਅੰਕ ਕਿਉਂ",sites:"ਦਰਜਾ ਪ੍ਰਾਪਤ ਸੁਰੱਖਿਅਤ ਥਾਵਾਂ",capacity:"ਸਮਰੱਥਾ",perCap:"ਪ੍ਰਤੀ ਵਿਅਕਤੀ ਥਾਂ (m²)",
    assistant:"ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ",ask:"ਪੁੱਛੋ",decision:"ਅਧਿਕਾਰੀ ਦਾ ਫੈਸਲਾ",approve:"ਯੋਜਨਾ ਮਨਜ਼ੂਰ ਕਰੋ",reject:"ਰੱਦ ਕਰੋ",notice:"ਸਿਰਫ਼ ਫੈਸਲਾ ਸਹਾਇਤਾ। ਮੁੜ-ਵਸੇਬਾ ਆਪਣੇ ਆਪ ਲਾਗੂ ਨਹੀਂ ਹੁੰਦਾ।",audit:"ਆਡਿਟ ਲੌਗ",
    retry:"ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼",downloadPlan:"ਯੋਜਨਾ ਡਾਊਨਲੋਡ (PDF)",noResults:"ਇਸ ਜ਼ਿਲ੍ਹੇ ਲਈ ਕੋਈ ਬਸਤੀ ਨਹੀਂ।",loading:"ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…",noActions:"ਹਾਲੇ ਕੋਈ ਕਾਰਵਾਈ ਨਹੀਂ।",people:"ਲੋਕ",vulnerability:"ਕਮਜ਼ੋਰੀ",
    sufficient:"ਕਾਫ਼ੀ",shortfall:"ਘਾਟ",capacityLine:"ਥਾਵਾਂ ਵਿੱਚ {capacity} ਲੋਕ ਰਹਿ ਸਕਦੇ ਹਨ; {population} ਲੋਕਾਂ ਨੂੰ ਤਬਦੀਲ ਕਰਨਾ ਹੈ।",hand:"ਹੈਂਡ",road:"ਸੜਕ",hectares:"ਹੈਕਟੇਅਰ",
    sampleNotice:"API ਉਪਲਬਧ ਨਹੀਂ। ਨਮੂਨਾ ਡਾਟਾ ਦਿਖਾਇਆ ਜਾ ਰਿਹਾ ਹੈ; ਤਬਦੀਲੀਆਂ ਸੁਰੱਖਿਅਤ ਨਹੀਂ ਹੋ ਸਕਦੀਆਂ।",chatError:"ਸਹਾਇਕ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",decisionError:"ਫੈਸਲਾ ਸੁਰੱਖਿਅਤ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਨਮੂਨਾ ਡੈਮੋ ਇਸਨੂੰ ਸਥਾਨਕ ਤੌਰ 'ਤੇ ਦਰਜ ਕਰੇਗਾ।",
    auditError:"ਆਡਿਟ ਲੌਗ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਸਥਾਨਕ ਕਾਰਵਾਈਆਂ ਦਿਖਾਈਆਂ ਜਾ ਰਹੀਆਂ ਹਨ.",hazardError:"ਹੜ੍ਹ ਖੇਤਰ ਡਾਟਾ ਲੋਡ ਨਹੀਂ ਹੋਇਆ। ਨਮੂਨਾ ਪਰਤ ਦਿਖਾਈ ਜਾ ਰਹੀ ਹੈ।",detailsError:"ਬਸਤੀ ਦੇ ਵੇਰਵੇ ਲੋਡ ਨਹੀਂ ਹੋਏ। ਨਮੂਨਾ ਵੇਰਵੇ ਦਿਖਾਏ ਜਾ ਰਹੇ ਹਨ।"
  }
};

let language = "en";
export function currentLanguage(){ return language; }
export function setLanguage(value){
  language = value === "pa" ? "pa" : "en";
  try { localStorage.setItem("drishtisetu-language", language); } catch {}
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.dataset.i18n;
    if (strings[language][key]) node.textContent = strings[language][key];
  });
  const languageButton = document.getElementById("lang");
  if (languageButton) languageButton.textContent = language === "en" ? "ਪੰਜਾਬੀ" : "English";
}
export function initializeLanguage(){
  let saved = "en";
  try { saved = localStorage.getItem("drishtisetu-language") || "en"; } catch {}
  setLanguage(saved);
}
export function t(key, values = {}){
  let text = strings[language][key] || strings.en[key] || key;
  Object.entries(values).forEach(([name,value]) => { text = text.replaceAll(`{${name}}`, String(value)); });
  return text;
}
