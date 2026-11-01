export const SAMPLE_SETTLEMENTS = [
  {id:1,name:"Dera Baba Nanak",district:"Gurdaspur",lng:75.0236,lat:32.0336,pop:6200,vuln:78,risk:88,factors:[{k:"Distance to river (Ravi)",v:92},{k:"Height above drainage",v:88},{k:"Past flood frequency",v:90},{k:"Land cover",v:62}],sites:[{name:"Site G-1 (north ridge)",score:86,hand:14,area:420000,road:1.8,lng:75,lat:32.075},{name:"Site G-2",score:79,hand:11,area:260000,road:3.2,lng:75.07,lat:32.07}]},
  {id:2,name:"Ramdas",district:"Amritsar",lng:74.9266,lat:31.9776,pop:9800,vuln:70,risk:81,factors:[{k:"Distance to river (Ravi)",v:84},{k:"Height above drainage",v:80},{k:"Past flood frequency",v:85},{k:"Land cover",v:58}],sites:[{name:"Site A-1",score:82,hand:12,area:380000,road:2.1,lng:74.89,lat:31.93},{name:"Site A-2",score:74,hand:10,area:300000,road:4,lng:74.96,lat:31.93}]},
  {id:3,name:"Ajnala",district:"Amritsar",lng:74.7646,lat:31.8415,pop:15400,vuln:64,risk:67,factors:[{k:"Distance to river (Ravi)",v:70},{k:"Height above drainage",v:66},{k:"Past flood frequency",v:72},{k:"Land cover",v:55}],sites:[{name:"Site A-3",score:77,hand:11,area:520000,road:1.2,lng:74.72,lat:31.88}]},
  {id:4,name:"Gatti Rajoke",district:"Ferozepur",lng:74.597,lat:30.923,pop:3100,vuln:82,risk:90,factors:[{k:"Distance to river (Sutlej)",v:95},{k:"Height above drainage",v:91},{k:"Past flood frequency",v:93},{k:"Land cover",v:60}],sites:[{name:"Site F-1",score:84,hand:13,area:210000,road:2.6,lng:74.64,lat:30.97},{name:"Site F-2",score:71,hand:10,area:150000,road:5.1,lng:74.55,lat:30.97}]},
  {id:5,name:"Mamdot",district:"Ferozepur",lng:74.44,lat:30.88,pop:7400,vuln:66,risk:74,factors:[{k:"Distance to river (Sutlej)",v:80},{k:"Height above drainage",v:76},{k:"Past flood frequency",v:78},{k:"Land cover",v:57}],sites:[{name:"Site F-3",score:80,hand:12,area:340000,road:2,lng:74.4,lat:30.93}]},
  {id:6,name:"Fatuhiwala",district:"Ferozepur",lng:74.52,lat:30.95,pop:2200,vuln:48,risk:41,factors:[{k:"Distance to river (Sutlej)",v:44},{k:"Height above drainage",v:40},{k:"Past flood frequency",v:46},{k:"Land cover",v:38}],sites:[{name:"Site F-4",score:70,hand:9,area:90000,road:3.3,lng:74.49,lat:30.99}]}
].map(item => ({...item,priority:Math.round(item.risk*.6+item.vuln*.4)})).sort((a,b)=>b.priority-a.priority);

export const SAMPLE_HAZARD_ZONES = {
  type:"FeatureCollection",
  features:[{
    type:"Feature",
    properties:{name:"Illustrative flood extent"},
    geometry:{type:"Polygon",coordinates:[[[74.53,30.9],[74.67,30.91],[74.71,30.98],[74.61,31.02],[74.53,30.9]]]}
  }]
};

export function sampleChat(settlement, question) {
  const top = [...(settlement.factors || [])].sort((a,b) => Number(b.v)-Number(a.v))[0];
  return `${settlement.name} has a risk score of ${settlement.risk}/100. The largest listed driver is ${top?.k || "the available risk factors"}${top ? ` (${top.v}/100)` : ""}. Review the ranked safer sites before making a decision.`;
}
