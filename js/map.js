const mapLayers = {
  settlements:["s-circles"],
  sites:["site-pts"],
  hazards:["hazard-fill","hazard-outline"]
};
let map;
let loaded = false;

function collection(features=[]){ return {type:"FeatureCollection",features}; }
function asFeatureCollection(value){
  if (value?.type === "FeatureCollection") return value;
  if (value?.type === "Feature") return collection([value]);
  return collection();
}
function settlementFeatures(settlements){
  return settlements.filter(item => Number.isFinite(Number(item.lng)) && Number.isFinite(Number(item.lat))).map(item => ({
    type:"Feature",properties:{id:String(item.id),risk:Number(item.risk)||0,name:String(item.name||"")},
    geometry:{type:"Point",coordinates:[Number(item.lng),Number(item.lat)]}
  }));
}
function candidateFeatures(settlements){
  return settlements.flatMap(settlement => (settlement.sites||[])
    .filter(site => Number.isFinite(Number(site.lng)) && Number.isFinite(Number(site.lat)))
    .map(site => ({type:"Feature",properties:{name:String(site.name||"")},geometry:{type:"Point",coordinates:[Number(site.lng),Number(site.lat)]}})));
}

function setSourceData(name,data){
  const source = map.getSource(name);
  if (source) source.setData(data);
}
function installData(settlements,hazards){
  setSourceData("settlements",collection(settlementFeatures(settlements)));
  setSourceData("sites",collection(candidateFeatures(settlements)));
  setSourceData("hazards",asFeatureCollection(hazards));
}

export function initializeMap(onSettlementSelect){
  map = new maplibregl.Map({
    container:"map",center:[74.7,31.5],zoom:7.3,
    style:{version:8,sources:{osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap"}},layers:[{id:"osm",type:"raster",source:"osm"}]}
  });
  map.addControl(new maplibregl.NavigationControl(),"top-right");
  map.on("load",() => {
    map.addSource("hazards",{type:"geojson",data:collection()});
    map.addLayer({id:"hazard-fill",type:"fill",source:"hazards",paint:{"fill-color":"#c2410c","fill-opacity":.2}});
    map.addLayer({id:"hazard-outline",type:"line",source:"hazards",paint:{"line-color":"#c2410c","line-width":2}});
    map.addSource("settlements",{type:"geojson",data:collection()});
    map.addLayer({id:"s-circles",type:"circle",source:"settlements",paint:{
      "circle-radius":["interpolate",["linear"],["get","risk"],40,8,90,16],
      "circle-color":["step",["get","risk"],"#2f7d4f",55,"#d99a1b",75,"#c2410c"],
      "circle-opacity":.85,"circle-stroke-color":"#fff","circle-stroke-width":2
    }});
    map.addSource("sites",{type:"geojson",data:collection()});
    map.addLayer({id:"site-pts",type:"circle",source:"sites",paint:{"circle-radius":6,"circle-color":"#0b6470","circle-stroke-color":"#fff","circle-stroke-width":2}});
    map.on("click","s-circles",event => {
      const id = event.features?.[0]?.properties?.id;
      if (id !== undefined) onSettlementSelect(id);
    });
    map.on("mouseenter","s-circles",() => { map.getCanvas().style.cursor="pointer"; });
    map.on("mouseleave","s-circles",() => { map.getCanvas().style.cursor=""; });
    document.querySelectorAll("[data-map-layer]").forEach(input => {
      input.addEventListener("change",() => setLayerVisibility(input.dataset.mapLayer,input.checked));
    });
    loaded = true;
    map.resize();
  });
}

export function updateMapData(settlements,hazards){
  if (loaded) installData(settlements,hazards);
  else map.once("load",() => installData(settlements,hazards));
}
export function setLayerVisibility(name,visible){
  if (!loaded || !mapLayers[name]) return;
  mapLayers[name].forEach(layer => map.setLayoutProperty(layer,"visibility",visible?"visible":"none"));
}
export function focusSettlement(settlement){
  if (map && Number.isFinite(Number(settlement.lng)) && Number.isFinite(Number(settlement.lat))) {
    map.flyTo({center:[Number(settlement.lng),Number(settlement.lat)],zoom:11});
  }
}
export function focusSite(site){
  if (map && Number.isFinite(Number(site.lng)) && Number.isFinite(Number(site.lat))) {
    map.flyTo({center:[Number(site.lng),Number(site.lat)],zoom:12});
  }
}
