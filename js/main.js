import { getTickerOverview, getNewsForTicker } from "./api.js";
import { renderNewsCard } from "../components/cards/newsCard/newsCard.js";
import { renderCompanyProfile } from "../components/cards/companyProfileCard/companyProfileCard.js";
import { renderChartCard } from "../components/cards/chartCard/chartCard.js";
import {
  API_CONFIG,
  STORAGE_KEY,
  TIME_CONSTANTS,
  NEWS_CONFIG,
} from "./constants.js";
import { SearchBar } from "../components/shared/searchBar/searchBar.js";

// Load from localStorage on page load
function loadLastSearch() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { ticker, comparisonSymbols, timestamp } = JSON.parse(stored);

      // Check if data is less than 24 hours old
      if (timestamp && Date.now() - timestamp < TIME_CONSTANTS.ONE_DAY_MS) {
        return { ticker, comparisonSymbols };
      }
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }
  return null;
}

// Save to localStorage
function saveLastSearch(ticker, comparisonSymbols = []) {
  try {
    const data = {
      ticker,
      comparisonSymbols,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

async function renderStockOverview(ticker, initialComparisonSymbols = null) {
  const container = document.getElementById("cards-container");
  container.innerHTML = "";
  try {
    const info = await getTickerOverview(ticker.toUpperCase());
    const news = await getNewsForTicker(
      ticker.toUpperCase(),
      NEWS_CONFIG.MAIN_PAGE_LIMIT
    );
    const baseUrl = API_CONFIG.baseUrl;

    const logoUrl = info.branding?.logo_url
      ? `${baseUrl}${info.branding.logo_url}`
      : null;

    const logoIcon = info.branding?.icon_url
      ? `${baseUrl}${info.branding?.icon_url}`
      : null;

    // Update favicon
    const link = document.querySelector('link[rel="icon"]');
    if (logoIcon) {
      link.href = logoIcon;
    } else {
      link.href = "favicon.ico";
    }

    const logoContainer = document.createElement("div");
    const nameTitle = document.createElement("h2");
    nameTitle.innerText = info.name;
    logoContainer.className = "cards-title";

    // update logo
    if (logoUrl) {
      const imgElement = document.createElement("img");
      imgElement.src = logoUrl;
      imgElement.alt = `${info.name} logo`;
      imgElement.className = "company-logo";
      logoContainer.appendChild(imgElement);
    }
    logoContainer.appendChild(nameTitle);
    container.appendChild(logoContainer);
    if (info.type === "CS") {
      renderChartCard(
        "cards-container",
        info.ticker,
        SearchBar,
        initialComparisonSymbols
      );
      renderCompanyProfile(info);
      renderNewsCard(news, info.ticker);

      // Save to localStorage after render
      saveLastSearch(info.ticker, initialComparisonSymbols || [info.ticker]);
    } else {
      container.innerHTML = `<p class="error">This ticker is not a stock.</p>`;
    }
  } catch (error) {
    console.error("Error loading stock data:", error);
    container.innerHTML = `<p class="error">We're having trouble finding that ticker. Please try another.</p>`;
  }
}

document.getElementById("ticker-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const input = document.getElementById("ticker-input");
  const ticker = input.value.trim();
  if (ticker) {
    renderStockOverview(ticker);
    input.value = "";
  }
});

// Initialize search bar with predictive search
new SearchBar("#ticker-input", (ticker) => {
  renderStockOverview(ticker);
  document.getElementById("ticker-input").value = "";
});

// Load last search
window.addEventListener("DOMContentLoaded", () => {
  const lastSearch = loadLastSearch();
  if (lastSearch && lastSearch.ticker) {
    renderStockOverview(lastSearch.ticker, lastSearch.comparisonSymbols);
  }
});
