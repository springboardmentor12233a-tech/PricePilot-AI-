const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
            errorData.detail || "Something went wrong"
        );
    }

    return response.json();
}


// =========================
// KPI APIs
// =========================

export const getKPISummary = () => {
    return apiRequest("/kpi/summary");
};


export const getRevenueTrend = () => {
    return apiRequest("/kpi/revenue-trend");
};


export const getTopProducts = () => {
    return apiRequest("/kpi/top-products");
};


export const getCategoryRevenue = () => {
    return apiRequest("/kpi/category-revenue");
};