const ASSET_ORIGIN = window.HEXBREWERS_ASSET_ORIGIN
  || "https://pub-7b92547fbe944d259e437d18c1c425d4.r2.dev/releases/b9d0faa";

document.querySelectorAll("[data-asset]").forEach((image) => {
  image.src = `${ASSET_ORIGIN}${image.dataset.asset}`;
});

const chapters = [...document.querySelectorAll(".chapter")];
const toc = document.querySelector("#toc");
const search = document.querySelector("#rule-search");
const optionalToggle = document.querySelector("#dlc-toggle");
const noResults = document.querySelector("#no-results");
const sidebar = document.querySelector("#chapter-navigation");
const tocToggle = document.querySelector(".toc-toggle");

/* ── i18n engine ───────────────────────────────────────────────────────
   Translates every static text node via a CSS-selector → i18n-key map.
   Dynamic content (ingredients, omens, covenants, afflictions) is
   translated inline by the render helpers using tData().                */

const I18N_MAP = [
  /* Header / Sidebar */
  ['.brand strong','s001'],['.toc-toggle','s002'],['.sidebar-heading','s003'],
  ['.search-label','s004'],['.ritual-toggle span','s005'],
  /* Cover */
  ['.eyebrow','s006'],['.cover-deck','s008'],['.primary-action','s009'],
  ['.cover-actions a:not(.primary-action)','s010'],
  ['.facts div:nth-child(1) dd','s011'],['.facts div:nth-child(2) dd','s012'],
  ['.facts div:nth-child(3) dd','s013'],['.facts div:nth-child(4) dd','s014'],
  /* Ch 01 – Object */
  ['#object .chapter-title span','s015'],['#object .chapter-title h2','s016'],
  ['#object .lead-grid > div > .lead','s017'],['#object .lead-grid > div > p:not(.lead)','s018'],
  ['#object blockquote','s019'],
  ['#object .principles article:nth-child(1) b','s020'],['#object .principles article:nth-child(1) span','s021'],
  ['#object .principles article:nth-child(2) b','s022'],['#object .principles article:nth-child(2) span','s023'],
  ['#object .principles article:nth-child(3) b','s024'],['#object .principles article:nth-child(3) span','s025'],
  ['.quick-start .section-kicker','s026'],['#quick-start-title','s027'],
  ['.quick-start-heading > p','s028'],
  ['.quick-start-steps li:nth-child(1) strong','s029'],['.quick-start-steps li:nth-child(1) span','s030'],
  ['.quick-start-steps li:nth-child(2) strong','s031'],['.quick-start-steps li:nth-child(2) span','s032'],
  ['.quick-start-steps li:nth-child(3) strong','s033'],['.quick-start-steps li:nth-child(3) span','s034'],
  ['.quick-start-steps li:nth-child(4) strong','s035'],['.quick-start-steps li:nth-child(4) span','s036'],
  ['.quick-start-steps li:nth-child(5) strong','s037'],['.quick-start-steps li:nth-child(5) span','s038'],
  ['.quick-start-steps li:nth-child(6) strong','s039'],['.quick-start-steps li:nth-child(6) span','s040'],
  ['.quick-start-verdict','s041'],
  /* Ch 02 – Instruments */
  ['#instruments .chapter-title span','s042'],['#instruments .chapter-title h2','s043'],
  ['#instruments > .lead','s044'],
  ['#instruments .instrument-grid article:nth-child(1) h3','s045'],['#instruments .instrument-grid article:nth-child(1) p','s046'],
  ['#instruments .instrument-grid article:nth-child(2) h3','s047'],['#instruments .instrument-grid article:nth-child(2) p','s048'],
  ['#instruments .instrument-grid article:nth-child(3) h3','s049'],['#instruments .instrument-grid article:nth-child(3) p','s050'],
  ['#instruments .instrument-grid article:nth-child(4) h3','s051'],['#instruments .instrument-grid article:nth-child(4) p','s052'],
  ['#instruments .section-kicker','s053'],['#instruments .starting-bag h3','s054'],
  ['#instruments .starting-bag > div:first-child p','s055'],
  ['#instruments .component-register article:nth-child(1) span','s056'],['#instruments .component-register article:nth-child(1) p','s057'],
  ['#instruments .component-register article:nth-child(2) span','s058'],['#instruments .component-register article:nth-child(2) p','s059'],
  ['#instruments .component-register article:nth-child(3) span','s060'],['#instruments .component-register article:nth-child(3) p','s061'],
  ['#instruments .component-register article:nth-child(4) span','s062'],['#instruments .component-register article:nth-child(4) p','s063'],
  /* Ch 03 – Setup */
  ['#setup .chapter-title span','s064'],['#setup .chapter-title h2','s065'],
  ['#setup .ritual-steps li:nth-child(1) h3','s066'],['#setup .ritual-steps li:nth-child(1) p','s067'],
  ['#setup .ritual-steps li:nth-child(2) h3','s068'],['#setup .ritual-steps li:nth-child(2) p','s069'],
  ['#setup .ritual-steps li:nth-child(3) h3','s070'],['#setup .ritual-steps li:nth-child(3) p','s071'],
  ['#setup .ritual-steps li:nth-child(4) h3','s072'],['#setup .ritual-steps li:nth-child(4) p','s073'],
  ['#setup .ritual-steps li:nth-child(5) h3','s074'],['#setup .ritual-steps li:nth-child(5) p','s075'],
  /* Ch 04 – Round */
  ['#round .chapter-title span','s076'],['#round .chapter-title h2','s077'],
  ['#round > .lead','s078'],
  ['#round .phase-track > div:nth-child(1) span','s079'],['#round .phase-track > div:nth-child(1) small','s080'],
  ['#round .phase-track > div:nth-child(2) span','s081'],['#round .phase-track > div:nth-child(2) small','s082'],
  ['#round .phase-track > div:nth-child(3) span','s083'],['#round .phase-track > div:nth-child(3) small','s084'],
  ['#round .phase-track > div:nth-child(4) span','s085'],['#round .phase-track > div:nth-child(4) small','s086'],
  ['#round .phase-track > div:nth-child(5) span','s087'],['#round .phase-track > div:nth-child(5) small','s088'],
  ['#round .phase-track > div:nth-child(6) span','s089'],['#round .phase-track > div:nth-child(6) small','s090'],
  /* Ch 05 – Omens */
  ['#omens .chapter-title span','s091'],['#omens .chapter-title h2','s092'],
  ['#omens > .lead','s093'],
  ['#omens .omen-timings article:nth-child(1) span','s094'],['#omens .omen-timings article:nth-child(1) h3','s095'],['#omens .omen-timings article:nth-child(1) p','s096'],
  ['#omens .omen-timings article:nth-child(2) span','s097'],['#omens .omen-timings article:nth-child(2) h3','s098'],['#omens .omen-timings article:nth-child(2) p','s099'],
  ['#omens .omen-timings article:nth-child(3) span','s100'],['#omens .omen-timings article:nth-child(3) h3','s101'],['#omens .omen-timings article:nth-child(3) p','s102'],
  ['#omens .omen-reading .section-kicker','s103'],['#omens .omen-reading h3','s104'],
  ['#omens .omen-reading li:nth-child(1)','s105'],['#omens .omen-reading li:nth-child(2)','s106'],
  ['#omens .omen-reading li:nth-child(3)','s107'],['#omens .omen-reading li:nth-child(4)','s108'],
  ['#omens > .note b','s109'],['#omens > .note p','s110'],
  ['#omens .archive-subtitle','s111'],['#omens > p:not(.lead)','s112'],
  /* Ch 06 – Drawing */
  ['#drawing .chapter-title span','s113'],['#drawing .chapter-title h2','s114'],
  ['#drawing .lead','s115'],
  ['#drawing .rule-list li:nth-child(1)','s116'],['#drawing .rule-list li:nth-child(2)','s117'],
  ['#drawing .rule-list li:nth-child(3)','s118'],['#drawing .rule-list li:nth-child(4)','s119'],
  ['.example-label','s120'],['.space.start','s121'],
  ['#drawing .movement-example > p','s122'],['.diagram-button','s123'],
  /* Ch 07 – Ingredients */
  ['#ingredients .chapter-title span','s124'],['#ingredients .chapter-title h2','s125'],
  ['#ingredients .ingredient-intro .lead','s126'],['#ingredients .ingredient-intro p:not(.lead)','s127'],
  ['.recipe-picker > span','s128'],
  ['#recipe-set option:nth-child(1)','s129'],['#recipe-set option:nth-child(2)','s130'],
  ['#recipe-set option:nth-child(3)','s131'],['#recipe-set option:nth-child(4)','s132'],
  ['#recipe-set option:nth-child(5)','s133'],['#recipe-set option:nth-child(6)','s134'],
  ['.timing-key > b','s135'],
  ['.timing-key > span:nth-of-type(1)','s136'],['.timing-key > span:nth-of-type(2)','s137'],['.timing-key > span:nth-of-type(3)','s138'],
  /* Ch 08 – Pressure */
  ['#pressure .chapter-title span','s139'],['#pressure .chapter-title h2','s140'],
  ['#pressure .pressure-dial:not(.shattered) span','s141'],
  ['#pressure .pressure-copy > p:nth-child(1)','s142'],['#pressure .pressure-copy > p:nth-child(2)','s143'],
  ['#pressure .pressure-dial.shattered span','s144'],
  ['#pressure .example-heading span','s145'],['#pressure .example-heading h3','s146'],
  ['#pressure .vial-sequence > div:nth-of-type(1) small','s147'],
  ['#pressure .vial-sequence > div:nth-of-type(2) small','s148'],
  ['#pressure .vial-sequence .restored small','s149'],
  ['#pressure .vial-example > p','s150'],
  ['#pressure .choice-card > span','s151'],['#pressure .choice-card > h3','s152'],['#pressure .choice-card > p','s153'],
  /* Ch 09 – Evaluation */
  ['#evaluation .chapter-title span','s154'],['#evaluation .chapter-title h2','s155'],
  ['#evaluation > .lead','s156'],
  ['.resolution-order > span:nth-of-type(1)','s157'],['.resolution-order > span:nth-of-type(2)','s158'],
  ['.resolution-order > span:nth-of-type(3)','s159'],['.resolution-order > span:nth-of-type(4)','s160'],
  ['.resolution-order > span:nth-of-type(5)','s161'],['.resolution-order > span:nth-of-type(6)','s162'],
  ['.bonus-die-guide .section-kicker','s163'],['.bonus-die-guide h3','s164'],['.bonus-die-guide > div:first-child > p','s165'],
  ['.die-faces > span:nth-child(1)','s166'],['.die-faces > span:nth-child(2)','s167'],
  ['.die-faces > span:nth-child(3)','s168'],['.die-faces > span:nth-child(4)','s169'],
  ['.die-faces > span:nth-child(5)','s170'],['.die-faces > span:nth-child(6)','s171'],
  ['.scoring-example .example-heading span','s172'],['.scoring-example .example-heading h3','s173'],
  ['.scoring-example > p','s174'],
  ['.rat-example .example-heading span','s175'],['.rat-example .example-heading h3','s176'],
  ['.prestige-track .trailer','s177'],
  ['.prestige-track > i:nth-of-type(2)','s178'],['.prestige-track > i:nth-of-type(3)','s179'],
  ['.prestige-track .leader','s180'],
  ['.rat-example > p','s181'],
  ['.stable-reward > span','s182'],['.stable-reward > h3','s183'],
  ['.stable-reward div b:first-of-type','s184'],['.stable-reward div i','s185'],['.stable-reward div b:last-of-type','s186'],
  ['.stable-reward > p','s187'],
  ['.shattered-reward > span','s188'],['.shattered-reward > h3','s189'],
  ['.shattered-reward div b:first-of-type','s190'],['.shattered-reward div i','s191'],['.shattered-reward div b:last-of-type','s192'],
  ['.shattered-reward > p','s193'],
  ['.scoring-ledger .section-kicker','s194'],['.scoring-ledger h3','s195'],['.scoring-ledger > div:first-child > p','s196'],
  ['.scoring-ledger dl > div:nth-child(1) dd','s197'],['.scoring-ledger dl > div:nth-child(2) dd','s198'],
  ['.scoring-ledger dl > div:nth-child(3) dd','s199'],['.scoring-ledger dl > div:nth-child(4) dd','s200'],
  ['.scoring-ledger dl > div:nth-child(5) dd','s201'],['.scoring-ledger dl > div:nth-child(6) dd','s202'],
  ['.scoring-ledger dl > div:nth-child(7) dd','s203'],['.scoring-ledger dl > div:nth-child(8) dd','s204'],
  ['.scoring-ledger dl > div:nth-child(9) dd','s205'],['.scoring-ledger dl > div:nth-child(10) dd','s206'],
  ['.scoring-ledger dl > div:nth-child(11) dd','s207'],['.scoring-ledger dl > div:nth-child(12) dd','s208'],
  ['.scoring-ledger dl > div:nth-child(13) dd','s209'],['.scoring-ledger dl > div:nth-child(14) dd','s210'],
  ['.scoring-ledger dl > div:nth-child(15) dd','s211'],['.scoring-ledger dl > div:nth-child(16) dd','s212'],
  ['#evaluation > .note b','s213'],['#evaluation > .note p','s214'],
  /* Ch 10 – Market */
  ['#market .chapter-title span','s215'],['#market .chapter-title h2','s216'],
  ['#market .lead-grid .lead','s217'],
  ['#market .rule-list li:nth-child(1)','s218'],['#market .rule-list li:nth-child(2)','s219'],
  ['#market .rule-list li:nth-child(3)','s220'],['#market .rule-list li:nth-child(4)','s221'],
  ['#market .rule-list li:nth-child(5)','s222'],
  ['.market-law > b','s223'],['.market-law > span','s224'],['.market-law > em','s225'],
  ['.valid-purchase > b','s226'],['.valid-purchase > small','s229'],
  ['.invalid-purchase > b','s230'],['.invalid-purchase > small','s233'],
  ['.market-calendar article:nth-child(1) b','s234'],['.market-calendar article:nth-child(1) p','s235'],
  ['.market-calendar article:nth-child(2) b','s236'],['.market-calendar article:nth-child(2) p','s237'],
  ['.market-calendar article:nth-child(3) b','s238'],['.market-calendar article:nth-child(3) p','s239'],
  ['.stock-ledger .section-kicker','s240'],['.stock-ledger h3','s241'],['.stock-ledger > div:first-child > p','s242'],
  ['.stock-ledger dl > div:nth-child(1) dd','s244'],
  ['.stock-ledger dl > div:nth-child(2) dd','s246'],
  ['.stock-ledger dl > div:nth-child(8) dt','s252'],['.stock-ledger dl > div:nth-child(8) dd','s253'],
  ['.stock-ledger dl > div:nth-child(9) dt','s254'],['.stock-ledger dl > div:nth-child(9) dd','s255'],
  ['#market > .note b','s256'],['#market > .note p','s257'],
  /* Ch 11 – Victory */
  ['#victory .chapter-title span','s258'],['#victory .chapter-title h2','s259'],
  ['#victory > .lead','s260'],
  ['.final-conversions > div:nth-child(1) span','s261'],['.final-conversions > div:nth-child(1) strong','s262'],
  ['.final-conversions > div:nth-child(2) span','s263'],['.final-conversions > div:nth-child(2) strong','s264'],
  ['#victory > p:last-of-type','s265'],
  /* Optional – Mire Covenants */
  ['#optional-rituals .chapter-title span','s266'],['#optional-rituals .chapter-title h2','s267'],
  ['#optional-rituals > .lead','s268'],
  ['#optional-rituals .bone > span','s269'],['#optional-rituals .bone > h3','s270'],['#optional-rituals .bone > p','s271'],
  ['#optional-rituals .moon > span','s272'],['#optional-rituals .moon > h3','s273'],['#optional-rituals .moon > p','s274'],
  ['#optional-rituals .blood > span','s275'],['#optional-rituals .blood > h3','s276'],['#optional-rituals .blood > p','s277'],
  ['.seal-law > b','s278'],['.seal-law > p','s279'],
  ['.runoff-guide article:nth-child(1) .section-kicker','s280'],['.runoff-guide article:nth-child(1) h3','s281'],['.runoff-guide article:nth-child(1) p','s282'],
  ['.runoff-guide article:nth-child(2) .section-kicker','s283'],['.runoff-guide article:nth-child(2) h3','s284'],['.runoff-guide article:nth-child(2) p','s285'],
  ['.runoff-guide article:nth-child(3) .section-kicker','s286'],['.runoff-guide article:nth-child(3) h3','s287'],['.runoff-guide article:nth-child(3) p','s288'],
  ['#optional-rituals .archive-subtitle','s289'],
  /* Optional – Distillation */
  ['#distillation .chapter-title span','s290'],['#distillation .chapter-title h2','s291'],
  ['#distillation .affliction-intro .lead','s292'],['#distillation .affliction-intro > div > p:not(.lead)','s293'],
  ['.distillation-formula > div:nth-of-type(1) strong','s294'],['.distillation-formula > div:nth-of-type(1) b','s295'],['.distillation-formula > div:nth-of-type(1) small','s296'],
  ['.distillation-formula > div:nth-of-type(2) strong','s297'],['.distillation-formula > div:nth-of-type(2) small','s298'],
  ['.distillation-formula > div:nth-of-type(3) strong','s299'],['.distillation-formula > div:nth-of-type(3) b','s300'],['.distillation-formula > div:nth-of-type(3) small','s301'],
  ['.formula-result strong','s302'],['.formula-result b','s303'],['.formula-result small','s304'],
  ['.distill-example .example-heading span','s305'],['.distill-example .example-heading h3','s306'],
  ['.distill-count > span:nth-of-type(1)','s307'],['.distill-count > span:nth-of-type(2)','s308'],
  ['.distill-count > span:nth-of-type(3)','s309'],['.distill-count > strong','s310'],
  ['.distill-example > p','s311'],
  ['#distillation .archive-subtitle','s312'],
  /* Glossary */
  ['#glossary .chapter-title span','s313'],['#glossary .chapter-title h2','s314'],
  ['#glossary > .lead','s315'],
  ['.glossary-grid > div:nth-child(1) dt','s316'],['.glossary-grid > div:nth-child(1) dd','s317'],
  ['.glossary-grid > div:nth-child(2) dt','s318'],['.glossary-grid > div:nth-child(2) dd','s319'],
  ['.glossary-grid > div:nth-child(3) dt','s320'],['.glossary-grid > div:nth-child(3) dd','s321'],
  ['.glossary-grid > div:nth-child(4) dt','s322'],['.glossary-grid > div:nth-child(4) dd','s323'],
  ['.glossary-grid > div:nth-child(5) dt','s324'],['.glossary-grid > div:nth-child(5) dd','s325'],
  ['.glossary-grid > div:nth-child(6) dt','s326'],['.glossary-grid > div:nth-child(6) dd','s327'],
  ['.glossary-grid > div:nth-child(7) dt','s328'],['.glossary-grid > div:nth-child(7) dd','s329'],
  ['.glossary-grid > div:nth-child(8) dt','s330'],['.glossary-grid > div:nth-child(8) dd','s331'],
  ['.glossary-grid > div:nth-child(9) dt','s332'],['.glossary-grid > div:nth-child(9) dd','s333'],
  ['.glossary-grid > div:nth-child(10) dt','s334'],['.glossary-grid > div:nth-child(10) dd','s335'],
  ['.glossary-grid > div:nth-child(11) dt','s336'],['.glossary-grid > div:nth-child(11) dd','s337'],
  ['.glossary-grid > div:nth-child(12) dt','s338'],['.glossary-grid > div:nth-child(12) dd','s339'],
  /* Quick Reference */
  ['#quick-reference .chapter-title span','s340'],['#quick-reference .chapter-title h2','s341'],
  ['.reference-grid article:nth-child(1) b','s342'],['.reference-grid article:nth-child(1) p','s343'],
  ['.reference-grid article:nth-child(2) b','s344'],['.reference-grid article:nth-child(2) p','s345'],
  ['.reference-grid article:nth-child(3) b','s346'],['.reference-grid article:nth-child(3) p','s347'],
  ['.reference-grid article:nth-child(4) b','s348'],['.reference-grid article:nth-child(4) p','s349'],
  ['.common-mistakes h3','s350'],
  ['.common-mistakes li:nth-child(1)','s351'],['.common-mistakes li:nth-child(2)','s352'],
  ['.common-mistakes li:nth-child(3)','s353'],['.common-mistakes li:nth-child(4)','s354'],
  ['.common-mistakes li:nth-child(5)','s355'],
  /* No-results & Footer */
  ['#no-results h2','s356'],['#no-results p','s357'],
  ['footer strong','s358'],['footer p','s359'],
];

function getLang() {
  const saved = localStorage.getItem('hb-lang');
  return ['en', 'ru', 'ka'].includes(saved) ? saved : 'en';
}

function getUi() { return window.I18N?.[getLang()]?.ui ?? {}; }

function tData(text) {
  const lang = getLang();
  if (lang === 'en' || !text) return text;
  return window.I18N?.[lang]?.data?.[text] ?? text;
}

function applyLang() {
  const lang = getLang();
  document.documentElement.lang = lang;

  const languageSelect = document.querySelector('#language-select');
  if (languageSelect) languageSelect.value = lang;

  const dict = lang !== 'en' ? window.I18N?.[lang] : null;

  // Translate static HTML via selector map
  I18N_MAP.forEach(([sel, key]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (el._origHTML == null) el._origHTML = el.innerHTML;
    el.innerHTML = dict?.[key] ?? el._origHTML;
  });

  // Page title & meta description
  const titleEl = document.querySelector('title');
  if (!titleEl._orig) titleEl._orig = titleEl.textContent;
  document.title = dict?.t_title ?? titleEl._orig;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    if (!metaDesc._orig) metaDesc._orig = metaDesc.content;
    metaDesc.content = dict?.t_desc ?? metaDesc._orig;
  }

  // Search placeholder
  if (!search._origPh) search._origPh = search.placeholder;
  search.placeholder = dict?.a362 ?? search._origPh;

  // Update chapter data-titles from translated headings, then rebuild TOC
  chapters.forEach(ch => {
    if (!ch._origTitle) ch._origTitle = ch.dataset.title;
    const h = ch.querySelector('h2') || ch.querySelector('h1');
    ch.dataset.title = h ? h.textContent : ch._origTitle;
  });
  buildTOC();

  // Re-render JS-driven content
  renderIngredients();
  renderExpansionReferences();
}

/* ── TOC builder (called on every language switch) ──────────────────── */

function buildTOC() {
  toc.innerHTML = '';
  chapters.forEach((chapter, index) => {
    const link = document.createElement("a");
    link.href = `#${chapter.id}`;
    link.dataset.target = chapter.id;
    link.innerHTML = `<small>${String(index).padStart(2, "0")}</small><span>${chapter.dataset.title}</span>`;
    link.addEventListener("click", () => {
      sidebar.classList.remove("is-open");
      tocToggle.setAttribute("aria-expanded", "false");
    });
    toc.append(link);
  });
  applyFilters();
}

/* ── Data arrays (unchanged) ────────────────────────────────────────── */

const recipeIngredients = [
  {
    name: "Frostbile", color: "blue", values: "1 · 2 · 4", timing: "immediate", image: "/images/core/ingredients/ingredient-frostbile.webp",
    recipes: [
      ["Draw extra chips equal to this chip's value. Place at most one; return the rest.", "5 / 10 / 19"],
      ["The next 1, 2, or 4 draws cannot deny both scoring rewards when they cause an explosion.", "5 / 10 / 19"],
      ["When this chip itself lands on a ruby field, gain 1 ruby.", "4 / 8 / 14"],
      ["When this chip itself lands on a ruby field, gain Prestige equal to its value.", "5 / 10 / 20"],
      ["If pressure is 2 or lower after placement, gain 1 ruby.", "5 / 9 / 17"],
      ["At 6 or 7 pressure after placement, gain Prestige equal to its value.", "6 / 11 / 18"],
    ],
  },
  {
    name: "Bloodthorn", color: "red", values: "1 · 2 · 4", timing: "immediate", image: "/images/core/ingredients/ingredient-bloodthorn.webp",
    recipes: [
      ["Moves +1 with 1–2 Brimstones already in the crucible, or +2 with at least 3.", "6 / 10 / 16"],
      ["Waits beside the crucible when drawn. When you stop, place it, save it, or return it to the bag.", "4 / 8 / 14"],
      ["After a Voidshard, you may move additional spaces equal to that Voidshard's value.", "5 / 9 / 15"],
      ["After placement, every value-1 Voidshard moves 1 extra space this round.", "7 / 11 / 17"],
      ["Moves +1 for every three distinct non-white colors already placed, up to +2.", "6 / 10 / 16"],
      ["Moves +1 per Echo Reed already placed, up to +3.", "5 / 9 / 15"],
    ],
  },
  {
    name: "Plaguedust", color: "yellow", values: "1 · 2 · 4", timing: "immediate", image: "/images/core/ingredients/ingredient-plaguedust.webp",
    recipes: [
      ["If placed after a Voidshard, you may return that Voidshard to your bag.", "8 / 12 / 18"],
      ["The next chip placed moves twice its normal distance.", "9 / 13 / 19"],
      ["One Plaguedust raises the safe pressure limit to 8; three raise it to 9.", "8 / 12 / 18"],
      ["Move your first, second, and third Plaguedust +1, +2, and +3 spaces respectively.", "8 / 12 / 18"],
      ["If placed after a Voidshard, gain 1 ruby.", "8 / 12 / 18"],
      ["If placed after a Voidshard, advance your droplet 1 space.", "9 / 13 / 19"],
    ],
  },
  {
    name: "Deathweave", color: "green", values: "1 · 2 · 4", timing: "end", image: "/images/core/ingredients/ingredient-deathweave.webp",
    recipes: [
      ["Each Deathweave among the last two placed chips awards 1 ruby.", "4 / 8 / 14"],
      ["Each Deathweave among the last two grants a chip reward based on its value.", "6 / 11 / 18"],
      ["At exactly 7 pressure, move the last chip by the total value of Deathweave in the crucible.", "6 / 11 / 21"],
      ["For each Deathweave among the last two, spend 1 ruby to advance the droplet 1 space.", "4 / 8 / 14"],
      ["Each Deathweave among the last two awards 1 Prestige.", "5 / 9 / 15"],
      ["Each Deathweave among the last two advances your droplet 1 space.", "6 / 10 / 16"],
    ],
  },
  {
    name: "Wraithbloom", color: "purple", values: "1", timing: "end", image: "/images/core/ingredients/ingredient-wraithbloom.webp",
    recipes: [
      ["One grants 1 Prestige; two grant 1 Prestige and 1 ruby; three grant 2 Prestige and droplet +1.", "9"],
      ["Trade up to three placed Wraithblooms for increasingly powerful chips, Prestige, rubies, and droplet movement.", "12"],
      ["Each Wraithbloom grants 1–3 Prestige based on how far into the crucible it landed.", "10"],
      ["Placed Wraithblooms upgrade eligible non-white ingredients: 1→2, 2→4, or 1→4.", "11"],
      ["Gain Prestige equal to your distinct non-white colors, up to 4.", "10"],
      ["Gain 1 ruby per Wraithbloom and up to 2 Prestige from your Wraithblooms.", "12"],
    ],
  },
];

const fixedIngredients = [
  { name: "Voidshard", color: "white", values: "1 · 2 · 3", timing: "passive", image: "/images/core/ingredients/ingredient-voidshard.webp", effect: "Advances by its value and adds that value to pressure. The crucible shatters when pressure exceeds 7.", cost: "Not sold" },
  { name: "Brimstone", color: "orange", values: "1", timing: "passive", image: "/images/core/ingredients/ingredient-brimstone.webp", effect: "A safe ingredient. Advances 1 space without adding pressure and has no special effect.", cost: "3" },
  { name: "Shadowmoss", color: "black", values: "1", timing: "end", image: "/images/core/ingredients/ingredient-shadowmoss.webp", effect: "Compare Shadowmoss counts. A tie advances your droplet 1; having more also grants 1 ruby.", cost: "10" },
  { name: "Echo Reed", color: "echo", values: "variable", timing: "immediate", image: "/images/dlc/mirewrought-pacts/ingredients/ingredient-echo-reed.webp", effect: "Its movement is set by the active Echo recipe and becomes fixed when placed.", cost: "8", optional: true },
  { name: "Embercore", color: "orange", values: "6", timing: "passive", image: "/images/dlc/mirewrought-pacts/ingredients/ingredient-embercore-6.webp", effect: "A safe value-6 ingredient that also counts as Brimstone for orange-based effects.", cost: "12", optional: true },
];

const covenantReference = [
  ["bone", "Ossuary Mercy", "ossuary-mercy", "Ruby phase: refill your spent Cursed Vial."],
  ["bone", "Marrow Exchange", "marrow-exchange", "Ruby phase: gain 2 rubies."],
  ["bone", "Graveward", "graveward", "Ruby phase: advance your droplet 2 spaces."],
  ["bone", "Pale Reckoning", "pale-reckoning", "Ruby phase: gain 3 Prestige."],
  ["moon", "Moonstep", "moonstep", "Before your first draw: advance your droplet 1 space."],
  ["moon", "Silver Ward", "silver-ward", "Before your first draw: if the next draw shatters, retain both round rewards."],
  ["moon", "Lunar Tithe", "lunar-tithe", "Before your first draw: gain 2 rubies."],
  ["moon", "Eclipse Stride", "eclipse-stride", "Before your first draw: advance your droplet 2 spaces."],
  ["blood", "Crimson Credit", "crimson-credit", "Market phase: gain 5 coins for this round."],
  ["blood", "Sanguine Bargain", "sanguine-bargain", "Market phase: lose 2 Prestige and gain 8 coins for this round."],
  ["blood", "Red Harvest", "red-harvest", "Market phase: gain 2 rubies."],
  ["blood", "Heartprice", "heartprice", "Market phase: advance your droplet 2 spaces."],
];

const afflictionReference = [
  ["Ashen Breath", "ashen-breath", "Each breath sheds warm grey cinders.", "1 Prestige at 2 progress; 2 Prestige at 4."],
  ["Glassvein Chill", "glassvein-chill", "Veins ring like frozen crystal beneath the skin.", "At 2: 1 Prestige. At 4: also next brew +1. At 5: 2 Prestige."],
  ["Hollow Bloom", "hollow-bloom", "Pale flowers open wherever a memory has faded.", "1 Prestige per 2 progress; at 6, also advance the droplet 1."],
  ["Embersleep", "embersleep", "Dreams smoulder beneath a skin of cooling ash.", "At 3: 1 Prestige and next brew +1. At 5: 3 Prestige and next brew +2."],
  ["Moonwater Fever", "moonwater-fever", "Silver heat rises whenever moonlight touches glass.", "At 3: 1 Prestige and next brew +1. At 5: 3 Prestige and next brew +1."],
  ["Thorn Memory", "thorn-memory", "Forgotten names return as barbs beneath the tongue.", "1 Prestige at 2, 2 Prestige at 4, or 4 Prestige at 6 progress."],
  ["Mirror Hunger", "mirror-hunger", "Reflections consume details their owner can no longer recall.", "Prestige equals progress minus 2, up to 4; next brew +2 at 7."],
  ["Silent Chorus", "silent-chorus", "Unheard voices gather wherever the afflicted stands still.", "Even progress grants half as Prestige; odd progress grants one-third. Next brew +1 at 5."],
];

const omenReference = [
  ["01", "Ember in the Ash", "All players roll the bonus die once."],
  ["02", "The Cinder Toll", "Choose whether to use rat tails normally or exchange 1–3 of them for the same number of rubies."],
  ["03", "Borrowed Spark", "All players advance their droplet 1 space."],
  ["04", "The Crawling Moon", "Each player may trade 1 ruby for any value-1 ingredient except Wraithbloom or Shadowmoss."],
  ["05", "Bones of Chance", "Each player samples 5 chips; the lowest total gains Frostbile 2 and the others gain 1 ruby."],
  ["06", "Ashen Charity", "Each player samples 4 chips and may upgrade one sampled ingredient of the same color."],
  ["07", "Quiet Hands", "Choose 4 Prestige or remove one value-1 Voidshard from your bag."],
  ["08", "Ruby Rain", "The player or players with the least Prestige gain 1 Deathweave."],
  ["09", "Mercy in Smoke", "Choose a Shadowmoss, any value-2 ingredient, or 3 rubies."],
  ["10", "The Last Laugh", "Double every rat-tail bonus this round."],
  ["11", "Thread of Death", "Choose any value-4 ingredient or gain 1 Prestige per rat tail."],
  ["12", "Cold Ledger", "The player or players with the fewest rubies gain 1 ruby."],
  ["13", "Thorn Harvest", "Choose: advance your droplet 2 spaces or take 1 Wraithbloom."],
  ["14", "Golden Rot", "Ruby scoring spaces pay 2 rubies this round."],
  ["15", "Wraith Choir", "Return the first Voidshard drawn this round to your bag."],
  ["16", "Moss Beneath Doors", "A stopped brewer may sample up to 5 chips and place one without triggering its action."],
  ["17", "Brimstone Chorus", "After placing the first 5 chips, each brewer may restart the round once."],
  ["18", "Measured Breath", "Exactly 7 Voidshard pressure advances your droplet 1 space."],
  ["19", "Steady Pulse", "The explosion threshold is 9 this round."],
  ["20", "Twin Rubies", "All Cursed Vials refill for free at the end of the round."],
  ["21", "Spare Flask", "When a brewer shatters, the player to their left gains any value-2 ingredient."],
  ["22", "Guild Applause", "Every Brimstone moves 1 additional space this round."],
  ["23", "Hidden Ember", "A ruby scoring space also grants 2 additional Prestige."],
  ["24", "Still Night", "Bonus-die winners roll twice this round."],
  ["V1", "Retort Rain", "Every brewer gains 1 additional Distillation progress this round.", true],
  ["V2", "Sevenfold Refraction", "Exactly 7 Voidshard pressure contributes 2 Distillation progress instead of 1.", true],
  ["V3", "Cracks in Company", "Each adjacent shattered rival contributes 2 Distillation progress instead of 1.", true],
  ["V4", "Mercy of the Thin Veil", "Every brewer's Distillation progress is at least 3 this round.", true],
];

/* ── Rendering ──────────────────────────────────────────────────────── */

function ingredientCard(ingredient, recipeIndex) {
  const lang = getLang();
  const dict = lang !== 'en' ? window.I18N?.[lang] : null;
  const recipe = ingredient.recipes?.[recipeIndex];
  const effect = tData(recipe?.[0] || ingredient.effect);
  const rawCost = recipe?.[1] || ingredient.cost;
  const displayCost = rawCost === 'Not sold' ? (dict?.ui?.notSold || 'Not sold') : rawCost;
  const valuesLabel = dict?.ui?.values || 'VALUES';
  const marketLabel = dict?.ui?.marketCost || 'MARKET COST';
  const timingLabel = dict?.ui?.timing?.[ingredient.timing] || ingredient.timing;
  const guidance = window.HEXBREWERS_RECIPE_GUIDANCE?.[ingredient.color]?.[String(recipeIndex + 1)];
  const localizedGuidance = window.HEXBREWERS_RECIPE_GUIDANCE_I18N?.[lang]?.[ingredient.color]?.[String(recipeIndex + 1)];
  const ruling = localizedGuidance || guidance;
  const rulingUi = dict?.ui?.ruling ?? {};
  const optional = ingredient.optional ? ' data-optional-ingredient="true"' : "";
  return `<article class="ingredient-card color-${ingredient.color}"${optional}>
    <div class="ingredient-portrait"><img src="${ASSET_ORIGIN}${ingredient.image}" alt="${ingredient.name}"></div>
    <div class="ingredient-copy"><header><div><h3>${ingredient.name}</h3><small>${valuesLabel} · ${ingredient.values}</small></div><span class="timing ${ingredient.timing}">${timingLabel}</span></header><p>${effect}</p>
    ${ruling ? `<details class="codex-ruling" open><summary>${rulingUi.complete || 'COMPLETE RULING'}</summary><div class="codex-ruling-meta"><span><b>${rulingUi.timing || 'TIMING'}</b>${ruling.timing}</span><span><b>${rulingUi.resolution || 'RESOLUTION'}</b>${ruling.choice}</span></div><dl><div><dt>${rulingUi.trigger || 'Trigger'}</dt><dd>${ruling.trigger}</dd></div><div><dt>${rulingUi.resolve || 'Resolve'}</dt><dd>${ruling.resolution}</dd></div><div><dt>${rulingUi.multiple || 'Multiple copies'}</dt><dd>${ruling.multiple}</dd></div><div><dt>${rulingUi.example || 'Example'}</dt><dd>${ruling.example}</dd></div><div><dt>${rulingUi.works || 'Works well with'}</dt><dd>${ruling.worksWellWith}</dd></div><div><dt>${rulingUi.tradeoff || 'Tradeoff'}</dt><dd>${ruling.tradeoff}</dd></div></dl></details>` : ''}
    <div class="ingredient-cost"><b>${marketLabel}</b><strong>${displayCost}</strong></div></div>
  </article>`;
}

function renderRecipeStrategies(recipeSet) {
  const container = document.querySelector('#recipe-strategies');
  if (!container) return;
  const lang = getLang();
  const strategies = window.HEXBREWERS_RECIPE_STRATEGIES_I18N?.[lang]?.[String(recipeSet)] || window.HEXBREWERS_RECIPE_STRATEGIES?.[String(recipeSet)] || [];
  const ui = window.I18N?.[lang]?.ui?.strategies ?? {};
  if (!strategies.length) {
    container.innerHTML = `<div><span>${ui.expansion || 'EXPANSION FORMULA'}</span><h3>${ui.expansionTitle || 'Specialized Mirewrought recipes'}</h3><p>${ui.expansionText || 'Sets V and VI are expansion configurations. Their complete individual rulings appear below.'}</p></div>`;
    return;
  }
  container.innerHTML = `<header><span>${ui.kicker || 'THREE VIABLE STRATEGY PATHS'}</span><h3>${(ui.title || 'Set {set} at a glance').replace('{set}', recipeSet)}</h3><p>${ui.intro || 'These are starting plans, not forced builds. Draw order, Omens, rivals, and market stock should change your decisions.'}</p></header><div>${strategies.map(strategy => `<article><h4>${strategy.name}</h4><p>${strategy.thesis}</p><small><b>${ui.counterweight || 'COUNTERWEIGHT'}</b>${strategy.counterweight}</small></article>`).join('')}</div>`;
}

function renderIngredients() {
  const grid = document.querySelector("#ingredient-grid");
  if (!grid) return;
  const recipeIndex = Number(document.querySelector("#recipe-set").value) - 1;
  renderRecipeStrategies(recipeIndex + 1);
  grid.innerHTML = [...fixedIngredients.slice(0, 3), ...recipeIngredients, ...fixedIngredients.slice(3)]
    .map((ingredient) => ingredientCard(ingredient, recipeIndex)).join("");
  grid.querySelectorAll('[data-optional-ingredient="true"]').forEach((card) => {
    card.hidden = !optionalToggle.checked;
  });
}

function renderExpansionReferences() {
  const lang = getLang();
  const dict = lang !== 'en' ? window.I18N?.[lang] : null;

  const omenGrid = document.querySelector("#omen-reference");
  if (omenGrid) omenGrid.innerHTML = omenReference.map(([number, name, effect, optional]) => {
    const label = optional ? (dict?.ui?.veilglass || 'VEILGLASS') : (dict?.ui?.omen || 'OMEN');
    return `
    <article class="omen-reference${optional ? " is-optional" : ""}"${optional ? ' data-optional-omen="true"' : ""}>
      <header><b>${label} ${number}</b><h4>${name}</h4></header><p>${tData(effect)}</p>
    </article>`;
  }).join("");

  const covenantGrid = document.querySelector("#covenant-reference");
  if (covenantGrid) covenantGrid.innerHTML = covenantReference.map(([kind, name, slug, effect]) => {
    const label = dict?.ui?.covenant?.[kind] || `${kind.toUpperCase()} COVENANT`;
    return `
    <article class="reference-card covenant-${kind}"><img src="${ASSET_ORIGIN}/images/dlc/mirewrought-pacts/covenants/covenant-${kind}-${slug}.webp" alt="${name}"><div><span>${label}</span><h4>${name}</h4><p>${tData(effect)}</p></div></article>`;
  }).join("");

  const afflictionGrid = document.querySelector("#affliction-reference");
  if (afflictionGrid) afflictionGrid.innerHTML = afflictionReference.map(([name, slug, symptom, reward]) => {
    const label = dict?.ui?.affliction || 'AFFLICTION CONTRACT';
    const emblemWord = dict?.ui?.emblem || 'emblem';
    return `
    <article class="reference-card"><img src="${ASSET_ORIGIN}/images/dlc/veilglass-afflictions/afflictions/affliction-emblem-${slug}.webp" alt="${name} ${emblemWord}"><div><span>${label}</span><h4>${name}</h4><em>${tData(symptom)}</em><p>${tData(reward)}</p></div></article>`;
  }).join("");
}

/* ── Intersection Observer ──────────────────────────────────────────── */

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll("#toc a").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.target === entry.target.id);
    });
  });
}, { rootMargin: "-18% 0px -65%", threshold: 0.01 });

chapters.forEach((chapter) => observer.observe(chapter));

/* ── Filters ────────────────────────────────────────────────────────── */

function applyFilters() {
  const term = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  chapters.forEach((chapter) => {
    const hidesOptional = chapter.dataset.optional === "true" && !optionalToggle.checked;
    const missesSearch = term && !chapter.textContent.toLocaleLowerCase().includes(term);
    const hidden = hidesOptional || missesSearch;
    chapter.hidden = hidden;
    const link = document.querySelector(`#toc a[data-target="${chapter.id}"]`);
    if (link) link.hidden = hidden;
    if (!hidden) visible += 1;
  });
  noResults.hidden = visible !== 0;
  document.querySelectorAll('[data-optional-ingredient="true"]').forEach((card) => {
    card.hidden = !optionalToggle.checked;
  });
  document.querySelectorAll('[data-optional-omen="true"]').forEach((card) => {
    card.hidden = !optionalToggle.checked;
  });
}

/* ── Event listeners ────────────────────────────────────────────────── */

search.addEventListener("input", applyFilters);
optionalToggle.addEventListener("change", () => { applyFilters(); applyLang(); });
document.querySelector("#recipe-set")?.addEventListener("change", renderIngredients);

tocToggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("is-open");
  tocToggle.setAttribute("aria-expanded", String(open));
});

document.querySelector("#replay-placement").addEventListener("click", () => {
  const token = document.querySelector(".moving-token");
  token.classList.remove("is-moving");
  requestAnimationFrame(() => requestAnimationFrame(() => token.classList.add("is-moving")));
});

addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? Math.min(1, scrollY / max) : 0;
  document.querySelector("#progress-bar").style.transform = `scaleX(${progress})`;
}, { passive: true });

// Language selector
document.querySelector('#language-select')?.addEventListener('change', (event) => {
    localStorage.setItem('hb-lang', event.target.value);
    applyLang();
});

/* ── Init ───────────────────────────────────────────────────────────── */

document.querySelector(".moving-token").classList.add("is-moving");
applyLang(); // renders everything + applies saved language

// Asset-backed chapters gain height while their illustrations decode. Restore the
// requested deep link after that layout settles so a shared chapter URL opens at
// the chapter heading rather than midway through the preceding page.
addEventListener("load", () => {
  if (!location.hash) return;
  const restoreDeepLink = () => {
    const target = document.querySelector(location.hash);
    if (target) scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + scrollY - 80), behavior: "instant" });
  };
  requestAnimationFrame(() => requestAnimationFrame(restoreDeepLink));
  setTimeout(restoreDeepLink, 700);
});
