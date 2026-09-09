const API_BASE_URL = "http://127.0.0.1:8000";

export async function loginUser(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Login failed");
  }

  return response.json();
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products/`);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export async function getPriceRecommendation(productData: {
  category: string;
  brand: string;
  region: string;
  channel: string;
  season: string;
  base_price: number;
  inventory_level: number;
  month: number;
  day_of_week: number;
}) {
  const response = await fetch(`${API_BASE_URL}/predictions/recommend-price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error("Failed to get price recommendation");
  }

  return response.json();
}

export async function getDemandForecast(days: number = 30) {
  const response = await fetch(`${API_BASE_URL}/predictions/demand-forecast?days=${days}`);

  if (!response.ok) {
    throw new Error("Failed to get demand forecast");
  }

  return response.json();
}