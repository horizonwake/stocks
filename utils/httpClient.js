import { API_CONFIG } from "../js/constants.js";

const API_BASE_URL = API_CONFIG.baseUrl;

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  let response;
  try {
    const headers = {
      ...options.headers,
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("Fetch failed:", error);
    throw new Error(`Network error: ${error.message}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}
