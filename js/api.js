import { apiFetch } from "../utils/httpClient.js";

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

export async function searchStocks(query, limit = 10) {
  const params = new URLSearchParams({
    search: query,
    active: "true",
    market: "stocks",
    limit: limit.toString(),
  });

  const data = await apiFetch(`/stocks/search?${params}`);
  return data.data.results || [];
}
