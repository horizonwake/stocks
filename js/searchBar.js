import { searchStocks } from "./api.js";

export class SearchBar {
  constructor(inputSelector, onSelect) {
    this.input = document.querySelector(inputSelector);
    this.onSelect = onSelect;
    this.dropdown = null;
    this.debounceTimer = null;
    this.debounceDelay = 300;

    this.init();
  }

  init() {
    if (!this.input) {
      console.error(
        `SearchBar: Input element not found for selector: ${this.input}`
      );
      return;
    }

    // Create dropdown container
    this.createDropdown();

    // Add event listeners
    this.input.addEventListener("input", (e) => this.handleInput(e));
    this.input.addEventListener("blur", () => {
      // Delay closing to allow click handlers to fire
      setTimeout(() => this.closeDropdown(), 100);
    });
    this.input.addEventListener("focus", () => {
      if (this.input.value.trim()) {
        this.dropdown.style.display = "block";
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(`.search-container[data-input="${this.input.id}"]`)
      ) {
        this.closeDropdown();
      }
    });
  }

  createDropdown() {
    const container = this.input.parentElement;
    container.classList.add("search-container");
    container.setAttribute("data-input", this.input.id);
    container.style.position = "relative";

    this.dropdown = document.createElement("div");
    this.dropdown.className = "search-dropdown";
    this.dropdown.style.display = "none";
    container.appendChild(this.dropdown);
  }

  handleInput(e) {
    const query = e.target.value.trim();

    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);

    if (query.length < 1) {
      this.closeDropdown();
      return;
    }

    // Debounce API call
    this.debounceTimer = setTimeout(() => {
      this.fetchAndDisplay(query);
    }, this.debounceDelay);
  }

  async fetchAndDisplay(query) {
    try {
      this.dropdown.innerHTML = '<div class="search-loading">Loading...</div>';
      this.dropdown.style.display = "block";

      const results = await searchStocks(query);

      if (results.length === 0) {
        this.dropdown.innerHTML =
          '<div class="search-empty">No results found</div>';
        return;
      }

      this.renderResults(results);
    } catch (error) {
      console.error("Search error:", error);
      this.dropdown.innerHTML =
        '<div class="search-error">Error loading results</div>';
    }
  }

  renderResults(results) {
    this.dropdown.innerHTML = results
      .map((result) => {
        const ticker = result.ticker || "";
        const name = result.name || "";
        return `
          <div class="search-result" data-ticker="${ticker}" data-name="${name}">
            <div class="search-result-ticker">${ticker}</div>
            <div class="search-result-name">${name}</div>
          </div>
        `;
      })
      .join("");

    // Add click handlers to results
    this.dropdown.querySelectorAll(".search-result").forEach((item) => {
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const ticker = item.getAttribute("data-ticker");
        const name = item.getAttribute("data-name");
        this.selectResult(ticker, name);
      });
    });
  }

  selectResult(ticker, name) {
    this.input.value = ticker;
    this.closeDropdown();

    if (this.onSelect) {
      this.onSelect(ticker);
    }
  }

  closeDropdown() {
    if (this.dropdown) {
      this.dropdown.style.display = "none";
    }
  }

  destroy() {
    clearTimeout(this.debounceTimer);
    if (this.dropdown) {
      this.dropdown.remove();
    }
  }
}
