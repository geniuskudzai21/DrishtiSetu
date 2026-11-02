async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {"Content-Type":"application/json", ...(options.headers || {})}
  });
  if (!response.ok) {
    const error = new Error(`Request failed (${response.status}) for ${path}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export const API = {
  settlements: () => request("/api/settlements"),
  settlement: id => request(`/api/settlements/${encodeURIComponent(id)}`),
  chat: (settlementId, message) => request("/api/chat", {
    method:"POST", body:JSON.stringify({settlementId,message})
  }),
  decision: (settlementId, action, adminToken) => request("/api/decisions", {
    method:"POST",
    headers:{Authorization:`Bearer ${adminToken}`},
    body:JSON.stringify({settlementId,action})
  }),
  audit: () => request("/api/audit"),
  hazardZones: () => request("/api/hazard-zones")
};
