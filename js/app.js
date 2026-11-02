import {API} from "./api.js";
import {SAMPLE_SETTLEMENTS,SAMPLE_HAZARD_ZONES,sampleChat} from "./sample.js";
import {initializeLanguage,setLanguage,t,currentLanguage} from "./i18n.js";
import {initializeMap,updateMapData,focusSettlement,focusSite} from "./map.js";
import {appendChat,clearChat,hideError,renderAudit,renderCapacity,renderDetail,renderEmpty,renderList,showError,showLoading} from "./ui.js";

const state = {settlements:[],selected:null,audit:[],hazards:{type:"FeatureCollection",features:[]},usingSample:false};
const byId = id => document.getElementById(id);
const firstValue = (object,keys,fallback) => {
  for (const key of keys) if (object?.[key] !== undefined && object[key] !== null) return object[key];
  return fallback;
};

function normalizeSite(site={}){
  return {
    ...site,name:String(firstValue(site,["name","label"],"Unnamed site")),
    score:Number(firstValue(site,["score","suitability"],0)),hand:Number(firstValue(site,["hand","heightAboveDrainage"],0)),
    area:Number(firstValue(site,["area","areaM2"],0)),road:Number(firstValue(site,["road","roadDistanceKm"],0)),
    lng:Number(firstValue(site,["lng","longitude"],NaN)),lat:Number(firstValue(site,["lat","latitude"],NaN))
  };
}
function normalizeSettlement(item={}){
  const risk = Number(firstValue(item,["risk","riskScore"],0));
  const vuln = Number(firstValue(item,["vuln","vulnerability"],0));
  return {
    ...item,id:firstValue(item,["id","settlementId"],""),
    name:String(firstValue(item,["name","settlementName"],"Unnamed settlement")),
    district:String(firstValue(item,["district","districtName"],"")),
    lng:Number(firstValue(item,["lng","longitude"],NaN)),lat:Number(firstValue(item,["lat","latitude"],NaN)),
    pop:Number(firstValue(item,["pop","population"],0)),vuln,risk,
    priority:Number(firstValue(item,["priority"],Math.round(risk*.6+vuln*.4))),
    factors:Array.isArray(item.factors)?item.factors.map(factor=>({k:String(firstValue(factor,["k","name","label"],"Factor")),v:Number(firstValue(factor,["v","value","score"],0))})):[],
    sites:Array.isArray(item.sites)?item.sites.map(normalizeSite):[]
  };
}
function unwrapList(value,key){
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.data)) return value.data;
  return [];
}
function normalizeChat(value){
  if (typeof value === "string") return value;
  return String(firstValue(value,["answer","response","message","text"],""));
}
function render(){
  renderList(state.settlements,state.selected?.id,selectSettlement);
  if (state.selected) renderDetail(state.selected,state.audit,focusSite);
  else renderEmpty();
  updateMapData(state.settlements,state.hazards);
}
function showFallbackError(message){
  state.usingSample = true;
  showError(message);
}

async function loadInitialData(){
  showLoading();
  try {
    const data = await API.settlements();
    const items = unwrapList(data,"settlements");
    state.settlements = items.map(normalizeSettlement).sort((a,b)=>b.priority-a.priority);
    if (state.selected && !state.settlements.some(item => String(item.id) === String(state.selected.id))) state.selected = null;
    state.usingSample = false;
    hideError();
  } catch (error) {
    console.error(error);
    state.settlements = SAMPLE_SETTLEMENTS.map(normalizeSettlement);
    if (state.selected && !state.settlements.some(item => String(item.id) === String(state.selected.id))) state.selected = null;
    showFallbackError(t("sampleNotice"));
  }
  try {
    const data = await API.audit();
    state.audit = unwrapList(data,"audit");
  } catch (error) {
    console.error(error);
    state.audit = [];
    if (!state.usingSample) showError(t("auditError"));
  }
  try {
    state.hazards = await API.hazardZones();
    if (!state.usingSample) hideError();
  } catch (error) {
    console.error(error);
    state.hazards = SAMPLE_HAZARD_ZONES;
    if (!state.usingSample) showError(t("hazardError"));
  }
  render();
}

async function selectSettlement(id){
  const found = state.settlements.find(item => String(item.id) === String(id));
  if (!found) return;
  state.selected = found;
  clearChat();
  render();
  focusSettlement(found);
  try {
    const response = await API.settlement(id);
    const detail = response?.settlement || response?.data || response;
    const normalized = normalizeSettlement({...found,...detail});
    state.selected = {...found,...normalized};
    render();
  } catch (error) {
    console.error(error);
    if (!state.usingSample) showError(t("detailsError"));
  }
}

async function askAssistant(){
  const input = byId("q");
  const question = input.value.trim();
  if (!question || !state.selected) return;
  appendChat("user",question);
  input.value = "";
  try {
    const answer = normalizeChat(await API.chat(state.selected.id,question));
    appendChat("assistant",answer || t("chatError"));
  } catch (error) {
    console.error(error);
    appendChat("assistant",sampleChat(state.selected,question));
    showError(t("chatError"));
  }
}

async function decide(action){
  if (!state.selected) return;
  const adminToken = byId("admin-token").value.trim();
  if (!adminToken){
    showError(t("tokenRequired"));
    return;
  }
  try {
    const result = await API.decision(state.selected.id,action,adminToken);
    state.audit.unshift(result);
    hideError();
  } catch (error) {
    console.error(error);
    showError(error.status === 401 ? t("invalidToken") : t("decisionError"));
  }
  renderAudit(state.audit,state.selected.id);
}

initializeLanguage();
initializeMap(selectSettlement);
byId("lang").addEventListener("click",() => {
  setLanguage(currentLanguage()==="en"?"pa":"en");
  render();
});
byId("district").addEventListener("change",() => renderList(state.settlements,state.selected?.id,selectSettlement));
byId("perCap").addEventListener("input",() => { if (state.selected) renderCapacity(state.selected); });
byId("ask").addEventListener("click",askAssistant);
byId("q").addEventListener("keydown",event => { if (event.key==="Enter") askAssistant(); });
byId("approve").addEventListener("click",() => decide("Approved"));
byId("reject").addEventListener("click",() => decide("Rejected"));
byId("retry").addEventListener("click",loadInitialData);
byId("print-plan").addEventListener("click",() => window.print());
loadInitialData();
