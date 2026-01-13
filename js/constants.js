export const API_CONFIG = {
  baseUrl: "https://api.horizonwake.com",
};

export const STORAGE_KEY = "stocks_last_search";

export const TIME_CONSTANTS = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  DEBOUNCE_DELAY: 350,
};

export const CHART_CONFIG = {
  DEFAULT_TIMEFRAME: "2y",
  MAX_COMPARISON_SYMBOLS: 4,
  COLORS: ["#0078d7", "#ff6b6b", "#51cf66", "#ffaa00ff"],
  TIMEFRAMES: [
    { value: "1m", label: "1 Month" },
    { value: "3m", label: "3 Months" },
    { value: "6m", label: "6 Months" },
    { value: "1y", label: "1 Year" },
    { value: "2y", label: "2 Years" },
  ],
};

export const NEWS_CONFIG = {
  DEFAULT_LIMIT: 10,
  MAIN_PAGE_LIMIT: 21,
  ITEMS_PER_PAGE: 3,
};
