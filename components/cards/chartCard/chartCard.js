import { CardComponent } from "../card.js";
import {
  API_CONFIG,
  STORAGE_KEY,
  CHART_CONFIG,
} from "../../../js/constants.js";

export function renderChartCard(
  containerId = "cards-container",
  ticker = "AAPL",
  SearchBar = null,
  initialComparisonSymbols = null
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = `
    <div class="chart-controls">
      <div class="chart-timeframe-selector">
        <label for="timeframe-select" class="sr-only">Select timeframe</label>
        <select id="timeframe-select" aria-label="Chart timeframe">
          ${CHART_CONFIG.TIMEFRAMES.map(
            (tf) =>
              `<option value="${tf.value}"${
                tf.value === CHART_CONFIG.DEFAULT_TIMEFRAME ? " selected" : ""
              }>${tf.label}</option>`
          ).join("")}
        </select>
      </div>
      <button id="compare-btn" aria-label="Compare stocks">Compare</button>
    </div>
    <div class="chart-area">
      <canvas id="price-chart" role="img" aria-label="Stock price chart"></canvas>
    </div>

    <!-- Compare Modal -->
    <div id="compare-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-hidden="true">
      <div class="modal-content">
        <h2 id="modal-title">Compare Symbols</h2>
        <div class="modal-search-section">
          <p>Add up to 4 symbols total</p>
          <label for="compare-search" class="sr-only">Search for stocks to compare</label>
          <input type="text" id="compare-search" placeholder="Search and select a symbol" autocomplete="off" aria-describedby="compare-help">
          <span id="compare-help" class="sr-only">Type to search for stocks. Use arrow keys to navigate results, Enter to select.</span>
        </div>
        <div id="selected-symbols" role="list" aria-label="Selected stocks for comparison">
          <p>Selected symbols will appear here</p>
        </div>
        <div class="modal-buttons">
          <button id="modal-close-btn" aria-label="Close comparison dialog">Exit</button>
          <button id="apply-compare-btn" aria-label="Update chart with selected stocks">Update Chart</button>
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

    const daysMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "2y": 730 };
    const days = daysMap[timeframe] || 180;
    from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const url = `${API_CONFIG.baseUrl}/stocks/aggregates/${ticker}?multiplier=1&timespan=day&from=${from}&to=${to}&limit=730`;

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
          selectedSymbols.length < CHART_CONFIG.MAX_COMPARISON_SYMBOLS &&
          !selectedSymbols.includes(selectedTicker)
        ) {
          selectedSymbols.push(selectedTicker);
          renderSelectedSymbols();
          compareSearch.value = "";
          //Temporary alerts; to be replaced with better UI feedback
        } else if (
          selectedSymbols.length >= CHART_CONFIG.MAX_COMPARISON_SYMBOLS
        ) {
          alert(
            `Maximum ${CHART_CONFIG.MAX_COMPARISON_SYMBOLS} symbols allowed`
          );
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
      selectedSymbolsDiv.innerHTML = "<p>No symbols selected</p>";
      applyCompareBtn.style.display = "none";
      return;
    }

    selectedSymbolsDiv.innerHTML = selectedSymbols
      .map(
        (sym, idx) => `
        <div role="listitem" class="selected-symbol-item">
          <span>${sym}</span>
          ${
            idx === 0
              ? '<span class="symbol-cannot-remove" aria-label="Original symbol cannot be removed">Cannot remove</span>'
              : `<button class="remove-symbol" data-symbol="${sym}" aria-label="Remove ${sym} from comparison">✕ Remove</button>`
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
        borderColor: CHART_CONFIG.COLORS[idx],
        backgroundColor: CHART_CONFIG.COLORS[idx],
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointStyle: "line",
        pointRotation: 90,
        pointHoverRadius: 300,
        pointBackgroundColor: CHART_CONFIG.COLORS[idx],
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
      await updateChartWithComparisons(CHART_CONFIG.DEFAULT_TIMEFRAME);
    } else {
      const data = await fetchAggregates(
        ticker,
        CHART_CONFIG.DEFAULT_TIMEFRAME
      );
      if (data.length) initChart(data);
    }
  })();
}
