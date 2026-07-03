const STORAGE_KEY = "prospect24_language";
const DEFAULT_LANGUAGE = "hy";
const SUPPORTED_LANGUAGES = ["hy", "ru", "en"];
const languageLogos = {
  hy: "/images/logo.webp",
  ru: "/images/logo(ru).webp",
  en: "/images/logo(en).webp",
};
const ARMENIAN_RE = /[\u0530-\u058F]/;
const TRANSLATABLE_ATTRIBUTES = ["alt", "aria-label", "title", "data-title", "data-text", "download", "content"];

const textNodeOriginals = new WeakMap();
const attributeOriginals = new WeakMap();
let currentLanguage = getSavedLanguage();
let originalDocumentTitle = "";

const normalizeText = (value) => String(value).replace(/\s+/g, " ").trim();
const entry = (ru, en) => ({ ru, en });

function makeImageTranslations(max = 20) {
  const values = {};
  for (let index = 1; index <= max; index += 1) {
    values[`Պատկեր ${index}`] = entry(`Изображение ${index}`, `Image ${index}`);
  }
  return values;
}

function makeDownloadTranslations(max = 20) {
  const values = {};
  for (let index = 1; index <= max; index += 1) {
    values[`Ներբեռնել PDF փաստաթուղթ ${index}`] = entry(
      `Скачать PDF-документ ${index}`,
      `Download PDF document ${index}`,
    );
  }
  values["Ներբեռնել xlsx փաստաթուղթ 12"] = entry("Скачать xlsx-документ 12", "Download xlsx document 12");
  return values;
}

const commonTranslations = {
  "Լեզվի ընտրություն": entry("Выбор языка", "Language selection"),
  "Հայերեն": entry("Армянский", "Armenian"),
  "Լոգո": entry("Логотип", "Logo"),
  "Հիմնական նավիգացիա": entry("Основная навигация", "Main navigation"),
  "Բջջային նավիգացիա": entry("Мобильная навигация", "Mobile navigation"),
  "Բացել մենյուն": entry("Открыть меню", "Open menu"),
  "Փաթեթի բաղադրիչներ": entry("Состав пакета", "Package components"),
  "Փաստաթղթեր": entry("Документы", "Documents"),
  "Գնահատում": entry("Оценка", "Valuation"),
  "ՊԵՏԱԿԱՆ ԳՈՒՅՔԻ ՕՏԱՐՄԱՆ ՆԵՐԴՐՈՒՄԱՅԻՆ ՓԱԹԵԹ": entry(
    "ИНВЕСТИЦИОННЫЙ ПАКЕТ\nПО ОТЧУЖДЕНИЮ\nГОСУДАРСТВЕННОГО ИМУЩЕСТВА",
    "INVESTMENT PACKAGE\nFOR ALIENATION OF\nSTATE PROPERTY",
  ),
  "ՆԵՐԴՐՈՒՄԱՅԻՆ ՓԱԹԵԹԻ ԲԱՂԱԴՐԻՉՆԵՐ": entry("СОСТАВ ИНВЕСТИЦИОННОГО ПАКЕТА", "INVESTMENT PACKAGE COMPONENTS"),
  "ՆԵՐԴՐՈՒՄԱՅԻՆ ՓԱԹԵԹԻ ԳՆԱՀԱՏՈՒՄ": entry("ОЦЕНКА ИНВЕСТИЦИОННОГО ПАКЕТА", "INVESTMENT PACKAGE VALUATION"),
  "Գլխավոր պատկեր": entry("Главное изображение", "Main image"),
  "Նախորդ պատկեր": entry("Предыдущее изображение", "Previous image"),
  "Հաջորդ պատկեր": entry("Следующее изображение", "Next image"),
  "Նախորդ": entry("Предыдущее", "Previous"),
  "Հաջորդ": entry("Следующее", "Next"),
  "Էսքիզային առաջադրանք": entry("Эскизное задание", "Sketch design assignment"),
  "Վկայական": entry("Свидетельство", "Certificate"),
  "Սխեմա": entry("Схема", "Scheme"),
  "Շենքի հատակագիծ": entry("План здания", "Building floor plan"),
  "Սեյսմիկ": entry("Сейсмика", "Seismic"),
  "կառավարության որոշում": entry("Решение правительства", "Government decision"),
  "Վեոլիա ջուր": entry("Веолия вода", "Veolia Water"),
  "ՀԷՑ": entry("Электросети Армении", "Electric Networks of Armenia"),
  "Նախագծման Թույլտվություն": entry("Разрешение на проектирование", "Design permit"),
  "Բիզնես հաշվարկ": entry("Бизнес-расчет", "Business calculation"),
  "Ներդրումային Հաշվարկ.xlsx": entry("Инвестиционный расчет.xlsx", "Investment Calculation.xlsx"),
  "ՀՀ դրամ": entry("драм", "AMD"),
  "Փաստաթուղթ": entry("Документ", "Document"),
  "Ներբեռնել": entry("Скачать", "Download"),
  "Ներբեռնել բոլորը": entry("Скачать все", "Download all"),
  "Ներբեռնել տեղեկատվությունը (.pdf)": entry("Скачать информацию (.pdf)", "Download information (.pdf)"),
  "ձախ պատկեր": entry("левое изображение", "left image"),
  "աջ պատկեր": entry("правое изображение", "right image"),
  "Ամբողջ էկրանով": entry("Во весь экран", "Fullscreen"),
  "Փակել": entry("Закрыть", "Close"),
  "դիտում": entry("просмотр", "view"),
  "Մեծացնել": entry("Увеличить", "Zoom in"),
  "Մեծացնել (+ կամ մկնիկի անիվ)": entry("Увеличить (+ или колесо мыши)", "Zoom in (+ or mouse wheel)"),
  "Փոքրացնել": entry("Уменьшить", "Zoom out"),
  "Փոքրացնել (- կամ մկնիկի անիվ)": entry("Уменьшить (- или колесо мыши)", "Zoom out (- or mouse wheel)"),
  "Վերականգնել": entry("Сбросить", "Reset"),
  "Կարգավորումներ": entry("Настройки", "Settings"),
  "ՏԵՔՍՏԻ ՉԱՓ": entry("РАЗМЕР ТЕКСТА", "TEXT SIZE"),
  "ԳՈՒՆԱՅԻՆ ԹԵՄԱ": entry("ЦВЕТОВАЯ ТЕМА", "COLOR THEME"),
  "Լուսավոր": entry("Светлая", "Light"),
  "Մութ": entry("Темная", "Dark"),
  "Կապ մեզ հետ": entry("Свяжитесь с нами", "Contact us"),
  "Հասցե": entry("Адрес", "Address"),
  "Երևան, 0010, Տիգրան Մեծի պող. 4": entry("Ереван, 0010, пр. Тиграна Меца, 4", "4 Tigran Mets Ave., Yerevan, 0010"),
  "Հեռախոս": entry("Телефон", "Phone"),
  "Էլ. փոստ": entry("Эл. почта", "Email"),
  "Հղումներ": entry("Ссылки", "Links"),
  "Սոցիալական Ցանցեր": entry("Социальные сети", "Social networks"),
  "Պատճենել հասցեն": entry("Скопировать адрес", "Copy address"),
  "Պատճենել հեռախոսահամարը": entry("Скопировать номер телефона", "Copy phone number"),
  "Պատճենել էլ. փոստը": entry("Скопировать эл. почту", "Copy email"),
  "Սեղմեք պատճենելու համար": entry("Нажмите, чтобы скопировать", "Click to copy"),
};

const projectTranslations = {
  "Քասախ | Մարզ Կոտայք, համայնք Նաիրի, գյուղ Քասախ, Վ. Սարգսյան փողոց 8/4 շինություն": entry(
    "Касах | Котайкская область, община Наири, село Касах, ул. В. Саргсяна, строение 8/4",
    "Kasakh | Kotayk Province, Nairi community, Kasakh village, V. Sargsyan Street 8/4 building",
  ),
  "ՄԱՐԶ ԿՈՏԱՅՔ, ՀԱՄԱՅՆՔ ՆԱԻՐԻ, ԳՅՈՒՂ ՔԱՍԱԽ, Վ. ՍԱՐԳՍՅԱՆ ՓՈՂՈՑ 8/4 ՇԻՆՈՒԹՅՈՒՆ": entry(
    "КОТАЙКСКАЯ ОБЛАСТЬ, ОБЩИНА НАИРИ, СЕЛО КАСАХ, УЛ. В. САРГСЯНА, СТРОЕНИЕ 8/4",
    "KOTAYK PROVINCE, NAIRI COMMUNITY, KASAKH VILLAGE, V. SARGSYAN STREET 8/4 BUILDING",
  ),
  "ՀՀ Կոտայքի մարզի Նաիրի խոշորցված համայնքի Քասախ վարչական շրջանի կենտրոնական հատվածում՝ Վ. Սարգսյան փողոց 8/4 շինություն հասցեում, գտնվում է 8740 քմ հողամասը, որի վրա առկա է 1830.3 քմ մակերեսով երկհարկանի շինություն։": entry(
    "В центральной части административного района Касах укрупненной общины Наири Котайкской области, по адресу ул. В. Саргсяна, строение 8/4, расположен земельный участок площадью 8740 кв. м, на котором находится двухэтажное строение площадью 1830.3 кв. м.",
    "In the central part of the Kasakh administrative district of the enlarged Nairi community in Kotayk Province, at V. Sargsyan Street 8/4 building, there is an 8740 sq. m land plot with an existing two-storey building of 1830.3 sq. m.",
  ),
  "Նախատեսվում է վերկառուցել երկհարկանի շինությունը և կառուցել 3-րդ հարկ։ Ընդհանուր վերակառուցման արդյունքում լինելու է 2380.6 քմ ժամանակակից բիզնես կենտրոն։": entry(
    "Планируется реконструировать двухэтажное строение и надстроить 3-й этаж. В результате общей реконструкции будет создан современный бизнес-центр площадью 2380.6 кв. м.",
    "It is planned to reconstruct the two-storey building and add a 3rd floor. As a result, a modern business center of 2380.6 sq. m will be created.",
  ),
  "ՀԱՐԿԵՐԻ ՆԿԱՐԱԳՐՈՒԹՅՈՒՆ": entry("ОПИСАНИЕ ЭТАЖЕЙ", "FLOOR DESCRIPTION"),
  "1-ին հարկում ընդհանուր 765.1քմ տարածքում նախատեսվում է գրասենյակային տարածքներ, ադմինիստրատիվ սենյակներ, բուֆետ, դահլիճ սպասասրահ և այլն։": entry(
    "На 1-м этаже общей площадью 765.1 кв. м предусмотрены офисные помещения, административные комнаты, буфет, зал ожидания и др.",
    "On the 1st floor, with a total area of 765.1 sq. m, office spaces, administrative rooms, a buffet, a waiting hall and other areas are planned.",
  ),
  "2-րդ հարկում ընդհանուր 766.9քմ տարածքում նախատեսվում է գրասենյակային տարածքներ, օժանդակ սենյակներ և ճեմասրահ։": entry(
    "На 2-м этаже общей площадью 766.9 кв. м предусмотрены офисные помещения, вспомогательные комнаты и холл.",
    "On the 2nd floor, with a total area of 766.9 sq. m, office spaces, auxiliary rooms and a hall are planned.",
  ),
  "3-րդ հարկում ընդհանուր 848.6քմ տարածքում նախատեսվում է գրասենյակային տարածքներ, ճեմասրահ և այլն։": entry(
    "На 3-м этаже общей площадью 848.6 кв. м предусмотрены офисные помещения, холл и др.",
    "On the 3rd floor, with a total area of 848.6 sq. m, office spaces, a hall and other areas are planned.",
  ),
};

const translations = {
  ...commonTranslations,
  ...projectTranslations,
  ...makeImageTranslations(),
  ...makeDownloadTranslations(),
};

function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function saveLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore localStorage failures in restricted browser modes.
  }
}

function getTranslation(source, lang = currentLanguage) {
  if (lang === DEFAULT_LANGUAGE) return source;
  return translations[normalizeText(source)]?.[lang] || source;
}
function getLanguageLogo(lang = currentLanguage) {
  const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  return languageLogos[safeLang] ?? languageLogos[DEFAULT_LANGUAGE];
}

function cssString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function applyCssText(lang) {
  document.documentElement.style.setProperty(
    "--i18n-view-label",
    cssString(lang === "hy" ? "👁 Դիտել" : lang === "ru" ? "👁 Смотреть" : "👁 View"),
  );
  document.documentElement.style.setProperty(
    "--i18n-loading-label",
    cssString(lang === "hy" ? "Բեռնում..." : lang === "ru" ? "Загрузка..." : "Loading..."),
  );
}

function applyLanguageLogos(lang) {
  document.querySelectorAll("[data-i18n-logo]").forEach((image) => {
    image.src = getLanguageLogo(lang);
  });
}

function translateTextNodes(lang) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "SVG"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return ARMENIAN_RE.test(node.nodeValue) || textNodeOriginals.has(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    if (!textNodeOriginals.has(node)) textNodeOriginals.set(node, node.nodeValue);
    const original = textNodeOriginals.get(node);
    node.nodeValue = lang === DEFAULT_LANGUAGE ? original : getTranslation(original, lang);
  });
}

function getAttributeOriginals(element) {
  if (!attributeOriginals.has(element)) attributeOriginals.set(element, new Map());
  return attributeOriginals.get(element);
}

function translateAttributes(lang) {
  document.querySelectorAll("*").forEach((element) => {
    const originals = getAttributeOriginals(element);
    TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
      if (!element.hasAttribute(attr)) return;
      if (!originals.has(attr)) {
        const value = element.getAttribute(attr);
        if (!ARMENIAN_RE.test(value)) return;
        originals.set(attr, value);
      }
      const original = originals.get(attr);
      element.setAttribute(attr, lang === DEFAULT_LANGUAGE ? original : getTranslation(original, lang));
    });
  });
}

function translateDocumentTitle(lang) {
  if (!originalDocumentTitle) originalDocumentTitle = document.title;
  document.title = lang === DEFAULT_LANGUAGE ? originalDocumentTitle : getTranslation(originalDocumentTitle, lang);
}

function updateLanguageButtons(lang) {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDownloadProgressLabel(lang) {
  if (lang === "ru") return "Загрузка...";
  if (lang === "en") return "Downloading...";
  return "Ներբեռնում...";
}

function getDownloadProgressPercent(text) {
  const cleanText = text.trim();

  for (const lang of SUPPORTED_LANGUAGES) {
    const label = getDownloadProgressLabel(lang);
    const match = cleanText.match(new RegExp(`^${escapeRegExp(label)}\\s*(\\d+)%$`));
    if (match) return match[1];
  }

  return null;
}

function translateDynamicText(lang = currentLanguage) {
  document.querySelectorAll(".smart-download").forEach((element) => {
    const progress = getDownloadProgressPercent(element.textContent);

    if (progress !== null) {
      const nextText = `${getDownloadProgressLabel(lang)} ${progress}%`;
      if (element.textContent !== nextText) {
        element.textContent = nextText;
      }
    }
  });

  const toast = document.getElementById("toast");
  if (toast?.textContent.trim() === "✓ Պատճենված") {
    const nextText = `✓ ${lang === "hy" ? "Պատճենված" : lang === "ru" ? "Скопировано" : "Copied"}`;
    if (toast.textContent !== nextText) {
      toast.textContent = nextText;
    }
  }
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function showCopyToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = `✓ ${currentLanguage === "hy" ? "Պատճենված" : currentLanguage === "ru" ? "Скопировано" : "Copied"}`;
  if (toast.classList.contains("show")) return;

  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 800);
}

function copyContactValue(element) {
  const number = element.dataset.number;
  const text = element.dataset.text || number;

  if (number && isMobileDevice()) {
    window.location.href = `tel:${number}`;
    return;
  }

  if (!text || !navigator.clipboard) return;
  navigator.clipboard.writeText(text).then(showCopyToast);
}

function initContactCopyHandlers() {
  document.querySelectorAll(".contact-value").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      copyContactValue(element);
    }, true);

    element.addEventListener("keypress", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      copyContactValue(element);
    }, true);
  });
}

function initDynamicTextObservers() {
  if (typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver(() => translateDynamicText());
  document.querySelectorAll(".smart-download, #toast").forEach((element) => {
    observer.observe(element, { childList: true, characterData: true, subtree: true });
  });
}

function applyLanguage(lang, options = {}) {
  const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  currentLanguage = safeLang;
  if (options.persist !== false) saveLanguage(safeLang);

  document.documentElement.lang = safeLang;
  translateDocumentTitle(safeLang);
  translateTextNodes(safeLang);
  translateAttributes(safeLang);
  updateLanguageButtons(safeLang);
  applyLanguageLogos(safeLang);
  applyCssText(safeLang);
  translateDynamicText(safeLang);

  window.dispatchEvent(
    new CustomEvent("prospect24:languagechange", {
      detail: { lang: safeLang },
    }),
  );}

function initLanguageSwitcher() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang));
  });

  applyLanguage(currentLanguage, { persist: false });
  initContactCopyHandlers();
  initDynamicTextObservers();
}

window.prospectI18n = {
  applyLanguage,
  getLanguage: () => currentLanguage,
  getLogoSrc: getLanguageLogo,
  t: getTranslation,
  translations,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLanguageSwitcher);
} else {
  initLanguageSwitcher();
}
