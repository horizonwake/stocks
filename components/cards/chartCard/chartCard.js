import { CardComponent } from "../card.js";

export function renderChartCard(
  containerId = "cards-container",
  ticker = "AAPL",
  SearchBar = null,
  initialComparisonSymbols = null
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <div class="chart-timeframe-selector">
        <label for="timeframe-select" class="sr-only">Select timeframe</label>
        <select id="timeframe-select" aria-label="Chart timeframe">
          <option value="1m">1 Month</option>
          <option value="3m">3 Months</option>
          <option value="6m" selected>6 Months</option>
          <option value="1y">1 Year</option>
        </select>
      </div>
      <button id="compare-btn" aria-label="Compare stocks" style="padding: 0.5rem 1rem; color: white; border: none; border-radius: 4px; cursor: pointer;">Compare</button>
    </div>
    <div class="chart-area">
      <canvas id="price-chart" role="img" aria-label="Stock price chart"></canvas>
    </div>

    <!-- Compare Modal -->
    <div id="compare-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-hidden="true" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 2000; align-items: center; justify-content: center;">
      <div style="background-color: white; border-radius: 8px; padding: 2rem; width: 90%; max-width: 500px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        <h2 id="modal-title" style="margin-top: 0;">Compare Symbols</h2>
        <div style="margin-bottom: 1.5rem;">
          <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">Add up to 4 symbols total</p>
          <label for="compare-search" class="sr-only">Search for stocks to compare</label>
          <input type="text" id="compare-search" placeholder="Search and select a symbol" autocomplete="off" aria-describedby="compare-help" style="padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;">
          <span id="compare-help" class="sr-only">Type to search for stocks. Use arrow keys to navigate results, Enter to select.</span>
        </div>
        <div id="selected-symbols" role="list" aria-label="Selected stocks for comparison" style="margin-bottom: 1.5rem; min-height: 100px; border: 1px solid #eee; border-radius: 4px; padding: 1rem;">
          <p style="color: #666; font-size: 0.9rem;">Selected symbols will appear here</p>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button id="modal-close-btn" aria-label="Close comparison dialog" style="padding: 0.75rem 1.5rem; border: 1px solid #ccc; background-color: white; border-radius: 4px; cursor: pointer;">Exit</button>
          <button id="apply-compare-btn" aria-label="Update chart with selected stocks" style="padding: 0.75rem 1.5rem; background-color: #0078d7; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">Update Chart</button>
        </div>
      </div>
    </div>
  `;

  container.append(
    new CardComponent(`${ticker} Price Chart`, "chart-card", html).render()
  );

  const select = document.getElementById("timeframe-select");
  const canvas = document.getElementById("price-chart");
  const compareBtn = document.getElementById("compare-btn");
  const compareModal = document.getElementById("compare-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const applyCompareBtn = document.getElementById("apply-compare-btn");
  const selectedSymbolsDiv = document.getElementById("selected-symbols");
  const compareSearch = document.getElementById("compare-search");

  const STORAGE_KEY = "stocks_last_search";

  let chart = null;
  let selectedSymbols =
    initialComparisonSymbols && initialComparisonSymbols.length > 0
      ? [...initialComparisonSymbols]
      : [ticker];
  let comparisonSymbols =
    initialComparisonSymbols && initialComparisonSymbols.length > 0
      ? [...initialComparisonSymbols]
      : [ticker];
  let compareSearchBar = null; // Store SearchBar instance

  // Save comparison to localStorage
  function saveComparison() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        data.comparisonSymbols = comparisonSymbols;
        data.timestamp = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error saving comparison to localStorage:", error);
    }
  }

  async function fetchAggregates(ticker, timeframe) {
    const now = new Date();
    let from,
      to = now.toISOString().split("T")[0];

    const daysMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365 };
    const days = daysMap[timeframe] || 180;
    from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const url = `https://api.horizonwake.com/stocks/aggregates/${ticker}?multiplier=1&timespan=day&from=${from}&to=${to}&limit=365`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      // API may return { data: { results: [...] } } or { results: [...] }
      return (json.data && json.data.results) || json.results || [];
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  }

  function initChart(rawData) {
    // sort by timestamp ascending
    const data = rawData
      .map((d) => ({
        ts: d.timestamp,
        close: d.close,
      }))
      .filter((d) => d.ts != null && d.close != null)
      .sort((a, b) => a.ts - b.ts);

    const labels = data.map((d) => new Date(d.ts).toLocaleDateString());
    const closes = data.map((d) => d.close);

    const ctx = canvas.getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${ticker} Close Price`,
            data: closes,
            borderColor: "#0078d7",
            backgroundColor: "#0078d7",
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointStyle: "line",
            pointRotation: 90,
            pointHoverRadius: 300,
            pointBackgroundColor: "#0078d7",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, position: "top" },
          zoom: {
            zoom: {
              wheel: { enabled: true, speed: 0.05 },
              pinch: { enabled: true },
              mode: "x",
            },
            pan: {
              enabled: true,
              mode: "x",
              modifierKey: "ctrl",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: "Price ($)" },
            grid: {
              display: true,
              color: "#f0f0f0",
            },
          },
          x: {
            title: { display: true, text: "Date" },
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  select.addEventListener("change", async (e) => {
    const timeframe = e.target.value;
    if (comparisonSymbols.length > 1) {
      await updateChartWithComparisons(timeframe);
    } else {
      const data = await fetchAggregates(ticker, timeframe);
      if (data.length) initChart(data);
    }
  });

  // Modal handlers
  const closeModal = () => {
    compareModal.style.display = "none";
    compareModal.setAttribute("aria-hidden", "true");
    compareSearch.value = "";
    compareBtn.focus(); // Return focus to trigger element
  };

  compareBtn.addEventListener("click", () => {
    compareModal.style.display = "flex";
    compareModal.setAttribute("aria-hidden", "false");
    renderSelectedSymbols();
    setTimeout(() => compareSearch.focus(), 100); // Focus search input

    // Only create SearchBar once
    if (!compareSearchBar && SearchBar) {
      compareSearchBar = new SearchBar("#compare-search", (selectedTicker) => {
        if (
          selectedSymbols.length < 4 &&
          !selectedSymbols.includes(selectedTicker)
        ) {
          selectedSymbols.push(selectedTicker);
          renderSelectedSymbols();
          compareSearch.value = "";
          //Temporary alerts; to be replaced with better UI feedback
        } else if (selectedSymbols.length >= 4) {
          alert("Maximum 4 symbols allowed");
        } else if (selectedSymbols.includes(selectedTicker)) {
          alert("Symbol already added");
        }
      });
    }
  });

  modalCloseBtn.addEventListener("click", closeModal);

  compareModal.addEventListener("click", (e) => {
    if (e.target === compareModal) {
      closeModal();
    }
  });

  // Focus trap for modal
  const trapFocus = (e) => {
    if (e.key !== "Tab") return;

    const focusableElements = compareModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusableArray = Array.from(focusableElements);
    const firstElement = focusableArray[0];
    const lastElement = focusableArray[focusableArray.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  // Keyboard handlers for modal
  compareModal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    } else {
      trapFocus(e);
    }
  });

  function renderSelectedSymbols() {
    if (selectedSymbols.length === 0) {
      selectedSymbolsDiv.innerHTML =
        '<p style="color: #666; font-size: 0.9rem;">No symbols selected</p>';
      applyCompareBtn.style.display = "none";
      return;
    }

    selectedSymbolsDiv.innerHTML = selectedSymbols
      .map(
        (sym, idx) => `
        <div role="listitem" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background-color: #f5f5f5; border-radius: 4px; margin-bottom: 0.5rem;">
          <span style="font-weight: 600;">${sym}${
          idx === 0 ? " (Original)" : ""
        }</span>
          ${
            idx === 0
              ? '<span style="color: #999; font-size: 0.85rem;" aria-label="Original symbol cannot be removed">Cannot remove</span>'
              : `<button class="remove-symbol" data-symbol="${sym}" aria-label="Remove ${sym} from comparison" style="background-color: #ff4444; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; cursor: pointer; font-size: 0.85rem;">✕ Remove</button>`
          }
        </div>
      `
      )
      .join("");

    document.querySelectorAll(".remove-symbol").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const sym = e.target.getAttribute("data-symbol");
        selectedSymbols = selectedSymbols.filter((s) => s !== sym);
        renderSelectedSymbols();
      });
    });

    applyCompareBtn.style.display = "block";
  }

  applyCompareBtn.addEventListener("click", async () => {
    comparisonSymbols = [...selectedSymbols];
    saveComparison();
    compareModal.style.display = "none";
    compareModal.setAttribute("aria-hidden", "true");
    compareBtn.focus();
    const timeframe = select.value;
    await updateChartWithComparisons(timeframe);
  });

  async function updateChartWithComparisons(timeframe) {
    const allData = {};

    for (const sym of comparisonSymbols) {
      const data = await fetchAggregates(sym, timeframe);
      allData[sym] = data;
    }

    initChartWithComparisons(allData);
  }

  function initChartWithComparisons(dataBySymbol) {
    const allTimestamps = new Set();

    Object.values(dataBySymbol).forEach((data) => {
      data.forEach((d) => {
        allTimestamps.add(d.timestamp);
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    const labels = sortedTimestamps.map((ts) =>
      new Date(ts).toLocaleDateString()
    );

    const colors = ["#0078d7", "#ff6b6b", "#51cf66", "#ffaa00ff"];
    const datasets = comparisonSymbols.map((sym, idx) => {
      const symbolData = dataBySymbol[sym];
      const dataMap = {};
      symbolData.forEach((d) => {
        dataMap[d.timestamp] = d.close;
      });

      const closes = sortedTimestamps.map((ts) => dataMap[ts] ?? null);

      return {
        label: sym,
        data: closes,
        borderColor: colors[idx],
        backgroundColor: colors[idx],
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointStyle: "line",
        pointRotation: 90,
        pointHoverRadius: 300,
        pointBackgroundColor: colors[idx],
      };
    });

    const ctx = canvas.getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, position: "top" },
          zoom: {
            zoom: {
              wheel: { enabled: true, speed: 0.05 },
              pinch: { enabled: true },
              mode: "x",
            },
            pan: {
              enabled: true,
              mode: "x",
              modifierKey: "ctrl",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: "Price ($)" },
            grid: { display: true },
          },
          x: {
            title: { display: true, text: "Date" },
            grid: { display: false },
          },
        },
      },
    });
  }

  // Initial load
  (async () => {
    if (initialComparisonSymbols && initialComparisonSymbols.length > 1) {
      await updateChartWithComparisons("6m");
    } else {
      const data = await fetchAggregates(ticker, "6m");
      if (data.length) initChart(data);
    }
  })();
}
