import { getTickerOverview, getNewsForTicker } from "./api.js";
import { renderNewsCard } from "../components/cards/newsCard/newsCard.js";
import { renderCompanyProfile } from "../components/cards/companyProfileCard/companyProfileCard.js";
import { renderChartCard } from "../components/cards/chartCard/chartCard.js";
import { API_CONFIG } from "./constants.js";
import { SearchBar } from "./searchBar.js";

async function renderStockOverview(ticker) {
  const container = document.getElementById("cards-container");
  const overviewTitle = document.getElementById("overview-title");
  container.innerHTML = "";
  try {
    const info = await getTickerOverview(ticker.toUpperCase());
    const news = await getNewsForTicker(ticker.toUpperCase(), 21);
    const baseUrl = API_CONFIG.baseUrl;

    const logoUrl = info.branding?.logo_url
      ? `${baseUrl}${info.branding.logo_url}`
      : null;

    const logoIcon = info.branding?.icon_url
      ? `${baseUrl}${info.branding?.icon_url}`
      : null;

    // Update favicon
    const link = document.querySelector('link[rel="icon"]');
    link.href = logoIcon;

    if (info.name) {
      overviewTitle.innerText = `Overview: ${info.ticker}`;
    }

    // update logo
    if (logoUrl) {
      const logoContainer = document.createElement("div");
      const imgElement = document.createElement("img");
      const tickerTitle = document.createElement("h2");
      const nameTitle = document.createElement("h2");
      nameTitle.innerText = info.name;
      tickerTitle.innerText = info.ticker;
      logoContainer.className = "cards-title";
      imgElement.src = logoUrl;
      imgElement.alt = `${info.name} logo`;
      imgElement.className = "company-logo";
      container.appendChild(logoContainer);
      logoContainer.appendChild(imgElement);
      logoContainer.appendChild(nameTitle);
      logoContainer.appendChild(tickerTitle);
    }

    if (info.type === "CS") {
      renderChartCard("cards-container", info.ticker);
      renderCompanyProfile(info);
      renderNewsCard(news);
    } else {
      container.innerHTML = `<p class="error">This ticker is not a stock.</p>`;
    }
  } catch (error) {
    console.error("Error loading stock data:", error);
    container.innerHTML = `<p class="error">We're having trouble finding that ticker. Please try another.</p>`;
  }
}

// Handle form submit
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
const searchBar = new SearchBar("#ticker-input", (ticker) => {
  renderStockOverview(ticker);
  document.getElementById("ticker-input").value = "";
});
