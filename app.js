import { brands, vehicles } from "./vehicles.js";

const search = document.querySelector("#model-search");
const brandNav = document.querySelector("#brand-nav");
const groupContainer = document.querySelector("#brand-groups");
const brandTemplate = document.querySelector("#brand-template");
const vehicleTemplate = document.querySelector("#vehicle-template");
const catalogTools = document.querySelector("#catalog-tools");
const catalog = document.querySelector("#catalog");
const faq = document.querySelector("#faq");
const empty = document.querySelector("#empty");
const count = document.querySelector("#result-count");
const catalogLink = document.querySelector("#catalog-link");
const faqLink = document.querySelector("#faq-link");
const dialog = document.querySelector("#model-dialog");
let selectedBrand = "all";

function normalize(value) {
  return value.normalize("NFKC").toLocaleLowerCase("mn").replace(/[\s\p{Pd}]+/gu, "");
}

function showModel(vehicle, title, photo) {
  const image = dialog.querySelector(".dialog-photo");
  const trim = dialog.querySelector("#dialog-trim");

  dialog.querySelector("#dialog-title").textContent = title;
  trim.textContent = vehicle.trim ?? "";
  trim.hidden = !vehicle.trim;
  image.src = photo;
  image.alt = title;
  dialog.showModal();
}

function createCard(brand, vehicle) {
  const title = `${brand.name} ${vehicle.name}`;
  const fullName = [title, vehicle.trim].filter(Boolean).join(" ");
  const photo = `./assets/vehicles/${vehicle.id}.webp`;
  const pdf = vehicle.pdf ? "./brochures/" + encodeURIComponent(vehicle.pdf) : null;
  const card = vehicleTemplate.content.firstElementChild.cloneNode(true);
  const trim = card.querySelector(".vehicle-trim");
  const pdfLink = card.querySelector(".pdf-link");
  const details = card.querySelector(".model-button");

  card.querySelector("img").src = photo;
  card.querySelector(".vehicle-name").textContent = title;
  trim.textContent = vehicle.trim ?? "";
  trim.hidden = !vehicle.trim;
  if (pdf) {
    pdfLink.href = pdf;
    pdfLink.hidden = false;
    pdfLink.setAttribute("aria-label", `${fullName} · Боршур үзэх`);
    details.hidden = true;
  } else {
    details.setAttribute("aria-label", `${fullName} · Загвар үзэх`);
    details.addEventListener("click", () => showModel(vehicle, title, photo));
  }

  return { card, terms: normalize(`${fullName} ${brand.aliases}`) };
}

const groups = brands.map(brand => {
  const group = brandTemplate.content.firstElementChild.cloneNode(true);
  const heading = group.querySelector("h2");
  const modelCount = group.querySelector(".group-count");
  const cards = vehicles.filter(vehicle => vehicle.brand === brand.id).map(vehicle => createCard(brand, vehicle));
  group.id = "brand-" + brand.id;
  heading.id = group.id + "-heading";
  heading.textContent = brand.name;
  group.setAttribute("aria-labelledby", heading.id);
  group.querySelector("ul").append(...cards.map(({card}) => card));

  const button = document.createElement("button");
  button.type = "button";
  button.value = brand.id;
  button.textContent = brand.name;
  button.setAttribute("aria-pressed", "false");
  brandNav.append(button);
  return { group, cards, modelCount, brandId: brand.id };
});

function filterModels() {
  const words = search.value.trim().split(/\s+/u).map(normalize).filter(Boolean);
  let total = 0;
  for (const { group, cards, modelCount, brandId } of groups) {
    const inBrand = selectedBrand === "all" || selectedBrand === brandId;
    let matches = 0;
    for (const { card, terms } of cards) {
      const match = inBrand && words.every(word => terms.includes(word));
      card.hidden = !match;
      if (match) matches += 1;
    }
    modelCount.textContent = `${matches} загвар`;
    group.hidden = matches === 0;
    total += matches;
  }
  count.textContent = `${total} загвар`;
  empty.hidden = total !== 0;
}

function setCurrent(link, current) {
  if (current) link.setAttribute("aria-current", "location");
  else link.removeAttribute("aria-current");
}

function syncLocation() {
  const isFaq = location.hash === "#faq";
  catalog.hidden = isFaq;
  catalogTools.hidden = isFaq;
  faq.hidden = !isFaq;
  setCurrent(catalogLink, !isFaq);
  setCurrent(faqLink, isFaq);
  if (isFaq) {
    faq.scrollIntoView({ block: "start" });
    return;
  }
  selectedBrand = groups.find(({ group }) => "#" + group.id === location.hash)?.brandId ?? "all";
  for (const button of brandNav.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.value === selectedBrand));
  }
  filterModels();
}

groupContainer.append(...groups.map(({ group }) => group));
document.querySelector("#catalog-note").hidden = vehicles.some(vehicle => vehicle.pdf);
brandNav.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button || button.value === selectedBrand) return;
  history.pushState(null, "", button.value === "all" ? "#models" : "#brand-" + button.value);
  syncLocation();
});
search.addEventListener("input", filterModels);
document.querySelector("#reset-search").addEventListener("click", () => {
  search.value = "";
  filterModels();
  search.focus();
});
dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});
syncLocation();
window.addEventListener("hashchange", syncLocation);
