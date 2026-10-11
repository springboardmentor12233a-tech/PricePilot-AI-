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

export async function getKPIs(token: string) {
  const response = await fetch(`${API_BASE_URL}/predictions/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch KPIs");
  return response.json();
}

export async function getAIInsights(context: string) {
  const response = await fetch(`${API_BASE_URL}/predictions/ai-insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });

  if (!response.ok) {
    throw new Error("Failed to get AI insights");
  }

  return response.json();
}

export async function getCompetitorAnalysis(token: string) {
  const response = await fetch(`${API_BASE_URL}/predictions/competitor-analysis`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch competitor analysis");
  return response.json();
}

export async function getProfitability(token: string) {
  const response = await fetch(`${API_BASE_URL}/predictions/profitability`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch profitability data");
  return response.json();
}

export async function getAlerts() {
  const response = await fetch(`${API_BASE_URL}/predictions/alerts`);
  if (!response.ok) throw new Error("Failed to fetch alerts");
  return response.json();
}

export async function sendChatMessage(message: string, history: { role: string; content: string }[]) {
  const response = await fetch(`${API_BASE_URL}/predictions/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!response.ok) throw new Error("Chat failed");
  return response.json();
}

export async function getAllUsers(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export async function updateUserRole(userId: number, role: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) throw new Error("Failed to update role");
  return response.json();
}

export async function toggleUserActive(userId: number, activate: boolean, token: string) {
  const endpoint = activate ? "activate" : "deactivate";
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/${endpoint}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to update user status");
  return response.json();
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/auth/health`);
  if (!response.ok) throw new Error("Failed to fetch health status");
  return response.json();
}

export async function createUserAsAdmin(
  userData: { username: string; email: string; password: string; role: string },
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create user");
  }
  return response.json();
}

export async function deleteUser(userId: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete user");
  }
  return response.json();
}

export async function createProduct(
  productData: {
    product_name: string;
    category: string;
    brand: string;
    base_price: number;
    current_price: number;
    inventory_level: number;
  },
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/products/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to create product");
  return response.json();
}

export async function updateProduct(
  productId: number,
  productData: {
    product_name: string;
    category: string;
    brand: string;
    base_price: number;
    current_price: number;
    inventory_level: number;
  },
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
}

export async function deleteProduct(productId: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete product");
  return response.json();
}

export async function getStockAlerts(token: string) {
  const response = await fetch(`${API_BASE_URL}/predictions/stock-alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stock alerts");
  return response.json();
}

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return typeof data.detail === "string" ? data.detail : fallback;
  } catch {
    return fallback;
  }
}

export async function createRestockRequest(
  data: { product_id: number; quantity: number },
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/restock/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to create restock request"));
  return response.json();
}

export async function getRestockRequests(token: string) {
  const response = await fetch(`${API_BASE_URL}/restock/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch restock requests");
  return response.json();
}

export async function updateRestockStatus(
  requestId: number,
  status: "approved" | "rejected",
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/restock/${requestId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(await readError(response, "Failed to update request"));
  return response.json();
}