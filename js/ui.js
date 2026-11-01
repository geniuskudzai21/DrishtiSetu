import {t} from "./i18n.js";

const byId = id => document.getElementById(id);
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
};
const riskColor = risk => Number(risk) >= 75 ? "#c2410c" : Number(risk) >= 55 ? "#d99a1b" : "#2f7d4f";
const number = value => Number(value || 0).toLocaleString();

export function showLoading(){
  const list = byId("list");
  list.replaceChildren();
  for (let i=0;i<4;i++){
    const row = element("li","p-3");
    row.append(element("div","skeleton h-4 rounded w-3/4"),element("div","skeleton h-3 rounded w-1/2 mt-2"));
    list.append(row);
  }
}

export function showError(message){
  byId("error-message").textContent = message;
  byId("error-banner").classList.remove("hidden");
}
export function hideError(){ byId("error-banner").classList.add("hidden"); }

export function renderList(settlements, selectedId, onSelect){
  const district = byId("district").value;
  const items = settlements.filter(item => district === "all" || item.district === district);
  const list = byId("list");
  list.replaceChildren();
  if (!items.length){
    list.append(element("li","p-4 text-sm text-[#10231f]/60",t("noResults")));
    return;
  }
  items.forEach(item => {
    const row = element("li");
    const button = element("button","w-full text-left px-3 py-2.5 hover:bg-[#eef2f0] flex items-center gap-3");
    button.type = "button";
    button.dataset.id = item.id;
    if (String(selectedId) === String(item.id)) button.classList.add("bg-[#eef2f0]");
    const stripe = element("span","w-1.5 self-stretch rounded");
    stripe.style.backgroundColor = riskColor(item.risk);
    const labels = element("span","flex-1 min-w-0");
    labels.append(element("span","block text-sm font-medium truncate",item.name));
    labels.append(element("span","block text-xs text-[#10231f]/60",`${item.district} · ${number(item.pop)} ${t("people")}`));
    button.append(stripe,labels,element("span","text-sm font-semibold",item.priority));
    button.addEventListener("click",() => onSelect(item.id));
    row.append(button);
    list.append(row);
  });
}

export function renderEmpty(){
  byId("detail").classList.add("hidden");
  byId("empty").classList.remove("hidden");
}

export function renderDetail(settlement, audit, onSiteSelect){
  byId("empty").classList.add("hidden");
  byId("detail").classList.remove("hidden");
  byId("d-name").textContent = settlement.name || "";
  byId("d-meta").textContent = `${settlement.district || ""} · ${number(settlement.pop)} ${t("people")} · ${t("vulnerability")} ${settlement.vuln ?? "—"}`;
  const score = byId("d-score");
  score.textContent = String(settlement.risk ?? "—");
  score.style.color = riskColor(settlement.risk);

  const factors = byId("d-factors");
  factors.replaceChildren();
  (settlement.factors || []).forEach(factor => {
    const wrapper = element("div");
    const labels = element("div","flex justify-between text-xs mb-0.5");
    labels.append(element("span","",factor.k),element("span","",factor.v));
    const track = element("div","h-1.5 bg-[#eef2f0] rounded");
    const bar = element("div","h-1.5 rounded bg-[#0b6470]");
    bar.style.width = `${Math.max(0,Math.min(100,Number(factor.v)||0))}%`;
    track.append(bar);
    wrapper.append(labels,track);
    factors.append(wrapper);
  });

  const sites = byId("d-sites");
  sites.replaceChildren();
  (settlement.sites || []).forEach((site,index) => {
    const item = element("li","border border-[#d3dcd8] rounded p-2.5 text-sm cursor-pointer hover:bg-[#eef2f0]");
    item.tabIndex = 0;
    const top = element("div","flex justify-between");
    top.append(element("span","font-medium",`${index+1}. ${site.name}`),element("span","font-semibold text-[#0b6470]",site.score));
    item.append(top,element("div","text-xs text-[#10231f]/60",`${t("hand")} ${site.hand} m · ${(Number(site.area||0)/10000).toFixed(0)} ${t("hectares")} · ${t("road")} ${site.road} km`));
    item.addEventListener("click",() => onSiteSelect(site));
    item.addEventListener("keydown",event => { if (event.key === "Enter" || event.key === " ") onSiteSelect(site); });
    sites.append(item);
  });
  renderCapacity(settlement);
  renderAudit(audit, settlement.id);
}

export function renderCapacity(settlement){
  const perPerson = Math.max(1,Number(byId("perCap").value)||100);
  const capacity = (settlement.sites || []).reduce((total,site) => total + Math.floor((Number(site.area)||0)*.6/perPerson),0);
  const enough = capacity >= Number(settlement.pop || 0);
  const output = byId("d-cap");
  output.replaceChildren();
  output.append(document.createTextNode(t("capacityLine",{capacity:number(capacity),population:number(settlement.pop)})));
  output.append(document.createTextNode(" "));
  output.append(element("span",`font-medium ${enough?"text-[#2f7d4f]":"text-[#c2410c]"}`,t(enough?"sufficient":"shortfall")));
}

export function renderAudit(entries, settlementId){
  const list = byId("audit");
  list.replaceChildren();
  const matching = entries.filter(entry => String(entry.settlementId ?? entry.id) === String(settlementId));
  if (!matching.length){ list.append(element("li","",t("noActions"))); return; }
  matching.forEach(entry => {
    const time = entry.time || entry.createdAt || entry.timestamp || "";
    const action = entry.action || entry.decision || "";
    const who = entry.who || entry.actor || "";
    list.append(element("li","",`${time} · ${action}${who ? ` · ${who}` : ""}`));
  });
}

export function appendChat(role, message){
  const bubble = element("p",role === "user" ? "font-medium" : "text-[#10231f]/80",message);
  byId("chat").append(bubble);
  byId("chat").scrollTop = byId("chat").scrollHeight;
}
export function clearChat(){ byId("chat").replaceChildren(); }
