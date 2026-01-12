import { searchStocks } from "./api.js";

export class SearchBar {
  constructor(inputSelector, onSelect) {
    this.input = document.querySelector(inputSelector);
    this.onSelect = onSelect;
    this.dropdown = null;
    this.debounceTimer = null;
    this.debounceDelay = 350;
    this.selectedIndex = -1;
    this.results = [];

    this.init();
  }

  init() {
    if (!this.input) {
      console.error(
        `SearchBar: Input element not found for selector: ${this.inputSelector}`
      );
      return;
    }

    // Add ARIA attributes
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.setAttribute("aria-expanded", "false");
    this.input.setAttribute("aria-haspopup", "listbox");

    // Create dropdown container
    this.createDropdown();

    // Add event listeners
    this.input.addEventListener("input", (e) => this.handleInput(e));
    this.input.addEventListener("keydown", (e) => this.handleKeydown(e));
    this.input.addEventListener("blur", () => {
      // Delay closing to allow click handlers to fire
      setTimeout(() => this.closeDropdown(), 100);
    });
    this.input.addEventListener("focus", () => {
      if (this.input.value.trim()) {
        this.openDropdown();
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
    this.dropdown.setAttribute("role", "listbox");
    this.dropdown.setAttribute("id", `${this.input.id}-listbox`);
    this.dropdown.className = "search-dropdown";
    this.dropdown.style.display = "none";
    container.appendChild(this.dropdown);

    this.input.setAttribute("aria-controls", this.dropdown.id);
  }

  handleKeydown(e) {
    if (!this.dropdown || this.dropdown.style.display === "none") return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.results.length - 1
        );
        this.updateSelection();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
      case "Enter":
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          const result = this.results[this.selectedIndex];
          this.selectResult(result.ticker, result.name);
        }
        break;
      case "Escape":
        e.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  updateSelection() {
    const items = this.dropdown.querySelectorAll(".search-result");
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add("selected");
        item.setAttribute("aria-selected", "true");
        this.input.setAttribute(
          "aria-activedescendant",
          `search-result-${index}`
        );
      } else {
        item.classList.remove("selected");
        item.setAttribute("aria-selected", "false");
      }
    });
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
      this.openDropdown();

      this.results = await searchStocks(query);

      if (this.results.length === 0) {
        this.dropdown.innerHTML =
          '<div class="search-empty">No results found</div>';
        return;
      }

      this.renderResults(this.results);
    } catch (error) {
      console.error("Search error:", error);
      this.dropdown.innerHTML =
        '<div class="search-error">Error loading results</div>';
    }
  }

  openDropdown() {
    this.dropdown.style.display = "block";
    this.input.setAttribute("aria-expanded", "true");
  }

  renderResults(results) {
    this.dropdown.innerHTML = results
      .map((result, index) => {
        const ticker = result.ticker || "";
        const name = result.name || "";
        return `
          <div class="search-result" role="option" id="search-result-${index}" aria-selected="false" data-ticker="${ticker}" data-name="${name}">
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
      this.input.setAttribute("aria-expanded", "false");
      this.input.removeAttribute("aria-activedescendant");
      this.selectedIndex = -1;
    }
  }

  destroy() {
    clearTimeout(this.debounceTimer);
    if (this.dropdown) {
      this.dropdown.remove();
    }
  }
}
