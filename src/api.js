const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };
  try {
    const res = await fetch(url, config);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API request failed: ${url}`, err.message);
    return null;
  }
}

export const api = {
  contacts: {
    list: (params) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.search) q.set("search", params.search);
      if (params?.sort) q.set("sort", params.sort);
      return request(`/contacts?${q.toString()}`);
    },
    get: (id) => request(`/contacts/${id}`),
    create: (data) =>
      request("/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/contacts/${id}`, { method: "DELETE" }),
    sync: (contacts) =>
      request("/contacts/sync", {
        method: "POST",
        body: JSON.stringify({ contacts }),
      }),
    dedup: () =>
      request("/contacts/dedup", { method: "POST" }),
    reset: () =>
      request("/contacts/reset", { method: "POST" }),
  },
  server: {
    status: () => request("/status"),
  },
  history: {
    list: (page = 1) => request(`/history?page=${page}`),
    create: (data) =>
      request("/history", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    today: () => request("/history/today"),
  },
  stats: {
    get: () => request("/stats"),
  },
};
