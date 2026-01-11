import { CardComponent } from "../card.js";
import format from "../../../utils/format.js";
export function renderCompanyProfile(data) {
  const container = document.getElementById("cards-container");

  const location = data?.address
    ? `<p>
      <strong>Location:</strong> ${format.toTitleCase(data?.address?.city)}, ${
        data?.address?.state
      }
      </p>`
    : "";
  const industry = data?.sicDescription
    ? `<p><strong>Industry:</strong> ${format.toTitleCase(
        data?.sicDescription
      )}</p>`
    : "";
  const html = `
      <p><strong>Ticker:</strong> ${data?.ticker}</p>
      ${location}
      <p><strong>Market Cap:</strong> $${format.magnitude(data?.marketCap)}</p>
      ${industry}
      <div class="description"><p> ${data?.description}</p></div>
  `;
  const footerContent = `<p></p><a href=${
    data?.homepageUrl
  } target="_blank">${data?.homepageUrl.replace(/^https?:\/\//, "")}</a></p>`;
  container.append(
    new CardComponent(
      "Company Profile",
      "company-overview",
      html,
      footerContent
    ).render()
  );
}
