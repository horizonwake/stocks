import { API_CONFIG } from "./constants.js";

const API_BASE_URL = API_CONFIG.baseUrl;

async function apiFetch(endpoint, options = {}) {
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

export async function getTickerOverview(ticker) {
  const data = await apiFetch(`/stocks/overview/${ticker}`);
  return data.data;
}

export async function getNewsForTicker(ticker, limit = 10) {
  const params = new URLSearchParams({
    ticker: ticker,
    limit: limit.toString(),
  });

  const data = await apiFetch(`/stocks/news?${params}`);
  return data.data.results;
}

export async function getAllNews(limit = 10) {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  const data = await apiFetch(`/stocks/news?${params}`);
  return data.data.results;
}

export async function getMarketStatus() {
  const data = await apiFetch("/stocks/market-status");
  return data.data;
}
