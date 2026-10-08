const API_BASE_URL = "http://127.0.0.1:8000";

export function getToken() {
  return localStorage.getItem("pricepilot_token");
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = response.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Something went wrong");
  }

  return data;
}

export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  localStorage.setItem("pricepilot_token", data.access_token);
  return data;
}

export async function register(userData) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
}

export function logout() {
  localStorage.removeItem("pricepilot_token");
}

export async function getMe() {
  return apiRequest("/me");
}

export async function predictDemand(data) {
  return apiRequest("/predict", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProducts() {
  return apiRequest("/products");
}

export async function createProduct(payload) {
  return apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id, payload) {
  return apiRequest(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id) {
  return apiRequest(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function getDashboardData() {
  return apiRequest("/dashboard");
}

export async function getAuditLogs() {
  return apiRequest("/audit-logs");
}

export async function getUsers() {
  return apiRequest("/users");
}

export async function checkHealth() {
  return apiRequest("/health");
}