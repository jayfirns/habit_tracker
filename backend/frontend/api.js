export function makeApi(baseUrl) {
  async function request(path, options = {}) {
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed (${response.status})`);
    }
    return response.status === 204 ? null : response.json();
  }

  return {
    listHabits: () => request("/habits"),
    createHabit: (payload) => request("/habits", { method: "POST", body: JSON.stringify(payload) }),
    updateHabit: (id, payload) =>
      request(`/habits/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteHabit: (id) => request(`/habits/${id}`, { method: "DELETE" }),
    completeHabit: (id, payload) =>
      request(`/habits/${id}/complete`, { method: "POST", body: JSON.stringify(payload) }),
    listGoals: () => request("/goals"),
    createGoal: (payload) => request("/goals", { method: "POST", body: JSON.stringify(payload) }),
    updateGoal: (id, payload) =>
      request(`/goals/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteGoal: (id) => request(`/goals/${id}`, { method: "DELETE" }),
    listReflections: () => request("/reflections"),
    createReflection: (payload) =>
      request("/reflections", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
}
