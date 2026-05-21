const API_BASE = "http://localhost:8000/api/v1";

export const api = {
    async login(id, username) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, username })
        });
        return res.json();
    },
    async submitRecord(recordData) {
        const res = await fetch(`${API_BASE}/game/record`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recordData)
        });
        return res.json();
    },
    async getHistory(userId) {
        const res = await fetch(`${API_BASE}/game/user/${userId}/history`);
        return res.json();
    },
    async getMarketInfo(seed, day) {
        const res = await fetch(`${API_BASE}/game/market-info?seed=${seed}&day=${day}`);
        return res.json();
    }
};

