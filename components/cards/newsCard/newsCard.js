import { CardComponent } from "../card.js";
import { NEWS_CONFIG } from "../../../js/constants.js";

export function renderNewsCard(newsData, ticker = "") {
  const container = document.getElementById("cards-container");
  const ITEMS_PER_PAGE = NEWS_CONFIG.ITEMS_PER_PAGE;
  let currentPage = 0;

  // Check if newsData is empty
  if (!newsData || newsData.length === 0) {
    const html = `<div class="news-empty-message"><p>No news available for ${ticker}</p></div>`;
    const card = new CardComponent("Recent News", "news", html).render();
    container.append(card);
    return;
  }

  function renderPage(page) {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = newsData.slice(start, end);
    const html = pageData
      .map(
        (article) => `
          <div class="news-item" style="background-image: url('${
            article.imageUrl || ""
          }');">
            <div class="news-overlay">
              <p class="article-title"><a href="${
                article.articleUrl
              }" target="_blank"><strong>${article.title}</strong></a></p>
              <p class="news-desc">${
                article.description || "No description available"
              }</p>
              <div class="news-footer">
                <p class="news-date"><small>Published: ${new Date(
                  article.publishedUtc
                ).toLocaleDateString()}</small></p>
                <a href="${
                  article.articleUrl
                }" target="_blank" class="news-full-article-btn">Full Article</a>
              </div>
            </div>
          </div>
      `
      )
      .join("");

    // Pagination
    const totalPages = Math.ceil(newsData.length / ITEMS_PER_PAGE);
    let footerContent = "";

    if (totalPages > 1) {
      const startArticle = page * ITEMS_PER_PAGE + 1;
      const endArticle = Math.min((page + 1) * ITEMS_PER_PAGE, newsData.length);
      let buckets = "";
      let bucketIndices = [];
      if (page === 0) {
        bucketIndices = [0];
        if (totalPages > 1) bucketIndices.push(1);
        if (totalPages > 2) bucketIndices.push(2);
      } else if (page === totalPages - 1) {
        if (totalPages > 2 && page - 2 >= 0) bucketIndices.push(page - 2);
        if (page - 1 >= 0) bucketIndices.push(page - 1);
        bucketIndices.push(page);
      } else {
        if (page - 1 >= 0) bucketIndices.push(page - 1);
        bucketIndices.push(page);
        if (page + 1 < totalPages) bucketIndices.push(page + 1);
      }
      for (let i of bucketIndices) {
        const bucketStart = i * ITEMS_PER_PAGE + 1;
        const bucketEnd = Math.min((i + 1) * ITEMS_PER_PAGE, newsData.length);
        if (i === page) {
          buckets += `<div class="news-bucket-active">${bucketStart}-${bucketEnd}</div>`;
        } else {
          buckets += `<a href="#" class="news-bucket" data-page="${i}">${bucketStart}-${bucketEnd}</a>`;
        }
      }
      footerContent = `<div class="news-pagination-container"> <div class="news-pagination">
        <button id="news-first" ${
          page === 0 ? "disabled" : ""
        } title="First">&#171;</button>
        <button id="news-prev" ${
          page === 0 ? "disabled" : ""
        }>&lt; prev</button>
        <div class="news-pagination-buckets">${buckets}</div>
        <button id="news-next" ${
          page === totalPages - 1 ? "disabled" : ""
        }>next &gt;</button>
        <button id="news-last" ${
          page === totalPages - 1 ? "disabled" : ""
        } title="Last">&#187;</button>
      </div> </div>
      <span class="news-pagination-total">viewing ${startArticle}-${endArticle} of ${
        newsData.length
      } articles</span>
      `;
    }

    // Clear and render card
    const card = new CardComponent(
      "Recent News",
      "news",
      html,
      footerContent
    ).render();
    // Remove previous card if exists
    const prev = document.getElementById("news");
    if (prev) prev.remove();
    container.append(card);

    // Add event listeners for pagination
    if (totalPages > 1) {
      const prevBtn = document.getElementById("news-prev");
      const nextBtn = document.getElementById("news-next");
      const firstBtn = document.getElementById("news-first");
      const lastBtn = document.getElementById("news-last");
      if (prevBtn)
        prevBtn.onclick = (e) => {
          e.preventDefault();
          if (currentPage > 0) {
            currentPage--;
            renderPage(currentPage);
          }
        };
      if (nextBtn)
        nextBtn.onclick = (e) => {
          e.preventDefault();
          if (currentPage < totalPages - 1) {
            currentPage++;
            renderPage(currentPage);
          }
        };
      if (firstBtn)
        firstBtn.onclick = (e) => {
          e.preventDefault();
          if (currentPage !== 0) {
            currentPage = 0;
            renderPage(currentPage);
          }
        };
      if (lastBtn)
        lastBtn.onclick = (e) => {
          e.preventDefault();
          if (currentPage !== totalPages - 1) {
            currentPage = totalPages - 1;
            renderPage(currentPage);
          }
        };
      // Bucket links
      document.querySelectorAll(".news-bucket").forEach((link) => {
        link.onclick = (e) => {
          e.preventDefault();
          const pageNum = parseInt(link.getAttribute("data-page"), 10);
          if (!isNaN(pageNum) && pageNum !== currentPage) {
            currentPage = pageNum;
            renderPage(currentPage);
          }
        };
      });
    }
  }

  renderPage(currentPage);
}
