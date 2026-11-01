async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {"Content-Type":"application/json", ...(options.headers || {})}
  });
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${path}`);
  return response.json();
}

export const API = {
  settlements: () => request("/api/settlements"),
  settlement: id => request(`/api/settlements/${encodeURIComponent(id)}`),
  chat: (settlementId, message) => request("/api/chat", {
    method:"POST", body:JSON.stringify({settlementId,message})
  }),
  decision: (settlementId, action) => request("/api/decisions", {
    method:"POST", body:JSON.stringify({settlementId,action})
  }),
  audit: () => request("/api/audit"),
  hazardZones: () => request("/api/hazard-zones")
};
