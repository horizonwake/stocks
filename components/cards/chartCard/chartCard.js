import { CardComponent } from "../card.js";
export function renderChartCard(
  containerId = "cards-container",
  ticker = "AAPL"
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = `
        <div class="chart-timeframe-selector">
          <select id="timeframe-select">
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
            <option value="6m" selected>6 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      </div>
      <div class="chart-area">
        <canvas id="price-chart"></canvas>
      </div>
  `;

  container.append(
    new CardComponent(`${ticker} Price Chart`, "chart-card", html).render()
  );

  const select = document.getElementById("timeframe-select");
  const canvas = document.getElementById("price-chart");

  let chart = null;

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
    // Normalize and sort by timestamp ascending
    const data = rawData
      .map((d) => ({
        ts: d.timestamp ?? d.t ?? d.time ?? null,
        close: d.close ?? d.c ?? d.close_price ?? null,
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
            //backgroundColor: "rgba(0, 120, 215, 0.1)",
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
    const data = await fetchAggregates(ticker, timeframe);
    if (data.length) initChart(data);
  });

  // Initial load
  (async () => {
    const data = await fetchAggregates(ticker, "6m");
    if (data.length) initChart(data);
  })();
}
