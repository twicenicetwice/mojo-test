"use strict";
const shopOrigin = "https://app.mojomobile.ru";
const incoming = new URLSearchParams(location.search),
  attribution = new URLSearchParams();
for (const [key, value] of incoming)
  if (
    /^utm_(source|medium|campaign|term|content)$/.test(key) &&
    value.length <= 300
  )
    attribution.set(key, value);
function shopLink(url) {
  const u = new URL(url);
  if (u.origin === shopOrigin)
    for (const [key, value] of attribution) u.searchParams.set(key, value);
  return u.href;
}
for (const link of document.querySelectorAll("a[data-shop]"))
  link.href = shopLink(link.href);
const menu = document.querySelector(".menu");
const menuDialog = document.querySelector("#mobile-menu"),
  countryDialog = document.querySelector("#countries-dialog");
const pageLocks = new Set();
let lockedScroll = 0;
function lockPage(key) {
  if (pageLocks.has(key)) return;
  if (!pageLocks.size) {
    lockedScroll = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = -lockedScroll + "px";
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";
  }
  pageLocks.add(key);
  document.body.classList.add("page-locked");
}
function unlockPage(key) {
  if (!pageLocks.delete(key) || pageLocks.size) return;
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.documentElement.style.overflow = "";
  document.body.classList.remove("page-locked");
  const behavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, lockedScroll);
  document.documentElement.style.scrollBehavior = behavior;
}
function closeMenu() {
  if (!menuDialog.open) return;
  menuDialog.close();
  unlockPage("menu");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Открыть меню");
}
menu.addEventListener("click", () => {
  if (menuDialog.open) {
    closeMenu();
    return;
  }
  lockPage("menu");
  menuDialog.showModal();
  menu.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-label", "Закрыть меню");
  document.querySelector("#close-menu").focus();
});
document.querySelector("#close-menu").addEventListener("click", closeMenu);
menuDialog.addEventListener("close", () => {
  if (pageLocks.has("menu")) unlockPage("menu");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Открыть меню");
  if (!document.querySelector("#reminder-dialog").open)
    menu.focus({ preventScroll: true });
});
menuDialog
  .querySelectorAll('a[href^="#"]')
  .forEach((link) => link.addEventListener("click", () => closeMenu()));
menuDialog
  .querySelector("[data-remind]")
  .addEventListener("click", () => closeMenu());
window.matchMedia("(min-width: 761px)").addEventListener("change", (e) => {
  if (e.matches) closeMenu();
});
const popular = ["TR", "TH", "VN", "AE", "ID", "GE", "CN", "JP"];
const search = document.querySelector("#country-search"),
  grid = document.querySelector("#country-grid"),
  status = document.querySelector("#search-status");
const dialogSearch = document.querySelector("#all-country-search"),
  dialogGrid = document.querySelector("#all-country-grid"),
  dialogStatus = document.querySelector("#all-country-status");
let catalogue = [],
  countryTrigger = null;
function normalized(text) {
  return text.toLocaleLowerCase("ru").replaceAll("ё", "е").trim();
}
function matchCountries(query) {
  const q = normalized(query);
  return catalogue.filter((c) =>
    normalized(
      c.name +
        " " +
        c.english +
        " " +
        c.code +
        (c.code === "AE"
          ? " дубай эмираты абу-даби"
          : c.code === "ID"
            ? " бали"
            : c.code === "KR"
              ? " южная корея"
              : c.code === "TH"
                ? " пхукет бангкок паттайя"
                : c.code === "VN"
                  ? " нячанг фукуок дананг"
                  : ""),
    ).includes(q),
  );
}
function countryCard(c) {
  const link = document.createElement("a");
  link.className = "country";
  link.href = shopLink(c.url);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.dataset.shop = "";
  const flag = document.createElement("img");
  flag.className = "country-flag";
  flag.src = "assets/flags/" + c.code.toLowerCase() + ".svg";
  flag.alt = "";
  flag.width = 44;
  flag.height = 33;
  flag.loading = "lazy";
  const name = document.createElement("span");
  name.className = "country-name";
  name.textContent = c.name;
  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrow.classList.add("icon", "country-arrow");
  arrow.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#i-arrow-up-right");
  arrow.append(use);
  link.append(flag, name, arrow);
  return link;
}
function paintCountries(target, rows) {
  const fragment = document.createDocumentFragment();
  rows.forEach((c) => fragment.append(countryCard(c)));
  target.replaceChildren(fragment);
}
function renderCountries() {
  if (!catalogue.length) return;
  const q = normalized(search.value);
  const found = q
    ? matchCountries(q)
    : popular
        .map((code) => catalogue.find((c) => c.code === code))
        .filter(Boolean);
  window.mojoSelectedCountry = found.length === 1 ? found[0].code : "";
  paintCountries(grid, found);
  status.textContent = q
    ? found.length
      ? "Найдено направлений: " + found.length
      : "Страна не найдена. Попробуйте другое название."
    : "";
}
function renderDialogCountries() {
  const q = normalized(dialogSearch.value);
  const found = (q ? matchCountries(q) : [...catalogue]).sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );
  paintCountries(dialogGrid, found);
  dialogStatus.textContent = found.length
    ? "Направлений: " + found.length
    : "Страна не найдена. Попробуйте другое название.";
}
function openCountries(trigger) {
  countryTrigger = trigger;
  dialogSearch.value = search.value;
  renderDialogCountries();
  lockPage("countries");
  countryDialog.showModal();
  dialogSearch.focus({ preventScroll: true });
  countryDialog.querySelector(".countries-dialog-scroll").scrollTop = 0;
}
document
  .querySelector('[data-mode="all"]')
  .addEventListener("click", (e) => openCountries(e.currentTarget));
document
  .querySelector('[data-mode="popular"]')
  .addEventListener("click", () => {
    search.value = "";
    renderCountries();
  });
document
  .querySelector("#close-countries")
  .addEventListener("click", () => countryDialog.close());
countryDialog.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    countryDialog.close();
  }
});
countryDialog.addEventListener("close", () => {
  unlockPage("countries");
  countryTrigger?.focus({ preventScroll: true });
});
countryDialog.addEventListener("click", (e) => {
  if (e.target === countryDialog) {
    const r = countryDialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      countryDialog.close();
  }
});
search.addEventListener("input", renderCountries);
dialogSearch.addEventListener("input", () => {
  renderDialogCountries();
  countryDialog.querySelector(".countries-dialog-scroll").scrollTop = 0;
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !document.querySelector("dialog[open]") &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
    !document.activeElement.isContentEditable
  ) {
    e.preventDefault();
    search.focus();
  }
});

Promise.resolve(
  JSON.parse(document.querySelector("#embedded-catalogue").textContent),
)
  .then((rows) => {
    catalogue = rows;
    window.mojoCatalogue = rows;
    renderCountries();
    document.dispatchEvent(new CustomEvent("mojo:catalogue", { detail: rows }));
  })
  .catch(() => {
    search.disabled = true;
    search.placeholder = "Все страны — в веб-магазине";
    status.textContent =
      "Каталог можно открыть по ссылке «Открыть веб-магазин».";
  });
document.querySelector("#copy-code").addEventListener("click", async () => {
  const message = document.querySelector("#copy-status");
  try {
    if (!navigator.clipboard) throw new Error("clipboard");
    await navigator.clipboard.writeText("*#06#");
    message.textContent =
      "Код скопирован. Вставьте его в приложении «Телефон».";
  } catch {
    message.textContent = "Введите *#06# вручную в приложении «Телефон».";
  }
});
const mobileBar = document.querySelector(".mobile-bar");
(function () {
  const pad = (n) => String(n).padStart(2, "0");
  const localISO = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function calculateReminder(flight, lead, time, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(flight) || !/^\d{2}:\d{2}$/.test(time))
      return { error: "Укажите дату вылета и время напоминания." };
    const [year, month, day] = flight.split("-").map(Number),
      [hour, minute] = time.split(":").map(Number),
      offset = Number(lead);
    if (
      year < 1900 ||
      year > 9999 ||
      hour > 23 ||
      minute > 59 ||
      ![0, 1, 3, 7].includes(offset)
    )
      return { error: "Проверьте дату, время и срок напоминания." };
    const departure = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (localISO(departure) !== flight)
      return { error: "Проверьте дату вылета." };
    if (flight < localISO(now))
      return { error: "Дата вылета уже прошла. Выберите предстоящую поездку." };
    const start = new Date(year, month - 1, day, 12, 0, 0, 0);
    start.setDate(start.getDate() - offset);
    start.setHours(hour, minute, 0, 0);
    if (start.getHours() !== hour || start.getMinutes() !== minute)
      return {
        error:
          "Это время недоступно из-за перевода часов. Выберите другое время.",
      };
    if (start <= now)
      return {
        error:
          "Время напоминания уже прошло. Выберите меньше дней до вылета или другое время.",
      };
    return {
      start,
      end: new Date(start.getTime() + 15 * 60 * 1000),
      departure,
      flight,
      lead: offset,
    };
  }
  const utc = (d) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const escapeText = (s) =>
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  function foldLine(line) {
    let result = "",
      part = "",
      bytes = 0;
    for (const character of line) {
      const count = new TextEncoder().encode(character).length;
      if (bytes + count > 75) {
        result += part + "\r\n";
        part = " ";
        bytes = 1;
      }
      part += character;
      bytes += count;
    }
    return result + part;
  }
  function buildICS(event) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mojo Mobile//Travel reminder//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + event.uid,
      "DTSTAMP:" + utc(event.created || new Date()),
      "DTSTART:" + utc(event.start),
      "DTEND:" + utc(event.end),
      "SUMMARY:" + escapeText(event.title),
      "DESCRIPTION:" + escapeText(event.description),
      "URL:" + event.url,
      "STATUS:CONFIRMED",
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "TRIGGER:PT0S",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + escapeText(event.title),
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.map(foldLine).join("\r\n") + "\r\n";
  }
  function googleURL(event) {
    const url = new URL("https://calendar.google.com/calendar/render");
    url.search = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: utc(event.start) + "/" + utc(event.end),
      details: event.description,
    }).toString();
    return url.href;
  }
  window.MojoCalendar = { calculateReminder, buildICS, googleURL, localISO };
  const dialog = document.querySelector("#reminder-dialog"),
    form = document.querySelector("#reminder-form"),
    flight = document.querySelector("#flight-date"),
    lead = document.querySelector("#lead-days"),
    time = document.querySelector("#reminder-time"),
    country = document.querySelector("#reminder-country"),
    error = document.querySelector("#reminder-error"),
    preview = document.querySelector("#event-preview"),
    status = document.querySelector("#calendar-status"),
    google = document.querySelector("#google-calendar"),
    download = document.querySelector("#download-calendar");
  let currentEvent = null,
    lastTrigger = null,
    rows = [],
    openCountry = "";
  const eventIDs = new Map();
  const longDate = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    shortDate = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }),
    clock = new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const zone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "местное время";
  document.querySelector("#timezone-note").textContent =
    "Время вашего устройства: " + zone + ".";
  function populate(rowsIn) {
    rows = rowsIn;
    const previous = country.value;
    country.replaceChildren(new Option("Выберу позже", ""));
    for (const c of [...rows].sort((a, b) =>
      a.name.localeCompare(b.name, "ru"),
    ))
      country.add(new Option(c.name, c.code));
    country.value = previous || openCountry;
    update(false);
  }
  document.addEventListener("mojo:catalogue", (e) => populate(e.detail));
  if (window.mojoCatalogue) populate(window.mojoCatalogue);
  function update(showError = true) {
    status.textContent = "";
    const result = calculateReminder(flight.value, lead.value, time.value);
    currentEvent = null;
    google.disabled = true;
    download.disabled = true;
    preview.hidden = true;
    error.textContent = "";
    flight.removeAttribute("aria-invalid");
    time.removeAttribute("aria-invalid");
    if (result.error) {
      if (showError && (flight.value || time.value !== "10:00"))
        error.textContent = result.error;
      return null;
    }
    const selected = rows.find((c) => c.code === country.value),
      url = selected ? selected.url : "https://app.mojomobile.ru/";
    const link = new URL(url);
    link.searchParams.set("utm_source", "calendar");
    link.searchParams.set("utm_medium", "reminder");
    link.searchParams.set("utm_campaign", "before_flight");
    const title = "Купить eSIM Mojo Mobile";
    const description = [
      selected
        ? "Выбрать eSIM Mojo Mobile: " + selected.name + "."
        : "Выбрать eSIM Mojo Mobile для поездки.",
      "Вылет: " + longDate.format(result.departure) + ".",
      "Купить: " + link.href,
      "Telegram: https://t.me/mojo_mobile_bot?startapp",
      "Проверьте совместимость телефона и срок активации выбранного тарифа.",
    ].join("\n");
    const key = [flight.value, lead.value, time.value, country.value].join("|");
    if (!eventIDs.has(key)) {
      const random =
        window.crypto && typeof window.crypto.randomUUID === "function"
          ? window.crypto.randomUUID()
          : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      eventIDs.set(key, random + "@mojomobile.ru");
    }
    currentEvent = {
      ...result,
      title,
      description,
      url: link.href,
      uid: eventIDs.get(key),
      created: new Date(),
    };
    document.querySelector("#event-preview-date").textContent =
      shortDate.format(result.start) + " · " + clock.format(result.start);
    document.querySelector("#event-preview-country").textContent =
      (selected ? selected.name + " · " : "") +
      "Вылет " +
      shortDate.format(result.departure);
    preview.hidden = false;
    google.disabled = false;
    download.disabled = false;
    return currentEvent;
  }
  function openReminder(trigger) {
    lastTrigger = trigger;
    flight.min = localISO(new Date());
    openCountry = window.mojoSelectedCountry || "";
    if (openCountry && rows.some((c) => c.code === openCountry))
      country.value = openCountry;
    update(false);
    dialog.showModal();
    lockPage("reminder");
    flight.focus({ preventScroll: true });
  }
  for (const button of document.querySelectorAll("[data-remind]"))
    button.addEventListener("click", () => openReminder(button));
  document
    .querySelector("#close-reminder")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    unlockPage("reminder");
    lastTrigger?.focus({ preventScroll: true });
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  for (const input of [flight, lead, time, country]) {
    input.addEventListener("input", () => update());
    input.addEventListener("change", () => update());
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const event = update();
    if (!event) {
      error.textContent = calculateReminder(
        flight.value,
        lead.value,
        time.value,
      ).error;
      return;
    }
    const a = document.createElement("a");
    a.href = googleURL(event);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.append(a);
    a.click();
    a.remove();
    status.textContent =
      "Сохраните открытое событие в Google Календаре и проверьте уведомление. Если окно не открылось, скачайте файл для календаря.";
  });
  download.addEventListener("click", () => {
    const event = update();
    if (!event) return;
    const blob = new Blob([buildICS(event)], {
        type: "text/calendar;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "Mojo-Mobile-" + localISO(event.start) + ".ics";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent =
      "Файл готов. Откройте его в календаре, сохраните событие и проверьте уведомление.";
  });
})();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const sectionNodes = document.querySelectorAll(
  ".section-heading,.channel-card,.how-heading,.steps li,.device-heading,.device-guide,.faq-heading,.faq-list,.checkout-inner,.footer-main",
);
if (!reduceMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
    },
    { threshold: 0.1 },
  );
  sectionNodes.forEach((node, i) => {
    node.classList.add("reveal");
    if (node.matches(".channel-card,.steps li"))
      node.style.transitionDelay = (i % 3) * 60 + "ms";
    revealObserver.observe(node);
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      sectionNodes.forEach((n) => n.classList.add("is-revealed"));
      revealObserver.disconnect();
    }
  });
}
const faqAnimations = new WeakMap();
function setFAQ(details, open) {
  const running = faqAnimations.get(details);
  if (running) {
    running.cancel();
    faqAnimations.delete(details);
  }
  const summary = details.querySelector("summary");
  summary.setAttribute("aria-expanded", String(open));
  if (reduceMotion.matches) {
    details.open = open;
    details.style.height = "";
    details.style.overflow = "";
    return;
  }
  const start = details.getBoundingClientRect().height;
  details.open = true;
  details.style.height = "";
  const end = open
    ? details.getBoundingClientRect().height
    : summary.getBoundingClientRect().height + 2;
  details.style.overflow = "hidden";
  const animation = details.animate(
    [{ height: start + "px" }, { height: end + "px" }],
    { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" },
  );
  faqAnimations.set(details, animation);
  animation.onfinish = () => {
    details.open = open;
    details.style.height = "";
    details.style.overflow = "";
    faqAnimations.delete(details);
  };
}
document.querySelectorAll(".faq details").forEach((details) => {
  const summary = details.querySelector("summary");
  summary.setAttribute("aria-expanded", "false");
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    const open = summary.getAttribute("aria-expanded") !== "true";
    if (open)
      document.querySelectorAll(".faq details").forEach((other) => {
        if (other !== details && other.open) setFAQ(other, false);
      });
    setFAQ(details, open);
  });
});
if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting)
          document.querySelectorAll("#navigation a").forEach((link) => {
            const active = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
    },
    { rootMargin: "-15% 0px -65% 0px" },
  );
  document
    .querySelectorAll("#countries,#how,#devices")
    .forEach((node) => navObserver.observe(node));
}
const topButton = document.querySelector("#back-to-top"),
  header = document.querySelector(".header");
topButton.addEventListener("click", () =>
  window.scrollTo({
    top: 0,
    behavior: reduceMotion.matches ? "instant" : "smooth",
  }),
);
const utilitiesObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const pastHero = entry.boundingClientRect.bottom < 0;
      topButton.classList.toggle("visible", pastHero);
      mobileBar.classList.toggle("visible", pastHero && !entry.isIntersecting);
      header.classList.toggle(
        "is-scrolled",
        !entry.isIntersecting || window.scrollY > 32,
      );
    }
  },
  { threshold: 0 },
);
utilitiesObserver.observe(document.querySelector(".departure-hero"));
let scrollFrame = false;
window.addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = true;
    requestAnimationFrame(() => {
      header.classList.toggle("is-scrolled", window.scrollY > 32);
      scrollFrame = false;
    });
  },
  { passive: true },
);
document
  .querySelectorAll(".primary,.checkout-channels>a:first-child,.mobile-bar>a")
  .forEach((button) => {
    button.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = button.getBoundingClientRect();
      button.style.setProperty("--pointer-x", e.clientX - r.left + "px");
      button.style.setProperty("--pointer-y", e.clientY - r.top + "px");
      button.classList.add("pointer-lit");
    });
    button.addEventListener("pointerleave", () =>
      button.classList.remove("pointer-lit"),
    );
  });
document.querySelector("#reminder-dialog").addEventListener("close", () => {
  if (
    menuDialog.contains(document.activeElement) ||
    document.activeElement === document.body
  )
    menu.focus({ preventScroll: true });
});
