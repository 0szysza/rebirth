import { calculate } from "./calc.mjs?v=20261002-2";

const $ = (id) => document.getElementById(id);
const accounts = [
  { key: "main", name: "Main", className: "main", current: "8108", target: "9999", rebirths: "158" },
  { key: "alt", name: "Alt 1", className: "alt", current: "1882", target: "7777", rebirths: "117" },
  { key: "alt2", name: "Alt 2", className: "alt2", current: "", target: "", rebirths: "" },
];
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const percentFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const accountCalculations = new Map();
const previewPositions = new Map();
let accountCount = 2;
document.body.dataset.accountCount = String(accountCount);

function accountMarkup(account) {
  const { key, name, className, current, target, rebirths } = account;
  return `
    <section class="account-card account-card--${className}" data-account="${key}" aria-labelledby="${key}-title">
      <div class="account-card__head">
        <span class="account-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></span>
        <h3 id="${key}-title">${name}</h3>
        <div class="account-card__quick"><span>ETA</span><strong id="${key}-quick-eta">—</strong></div>
      </div>
      <div class="account-card__fields">
        <div class="field"><label for="${key}-current">Current rebirths</label><input id="${key}-current" type="number" min="0" step="1" inputmode="numeric" value="${current}"></div>
        <div class="field"><label for="${key}-target">Target rebirths</label><input id="${key}-target" type="number" min="0" step="1" inputmode="numeric" value="${target}"></div>
      </div>
      <fieldset class="pace-group" aria-label="Rebirth pace"><div class="pace-fields">
        <div class="field"><label for="${key}-rebirths">Rebirths</label><input id="${key}-rebirths" type="number" min="0" step="any" inputmode="decimal" value="${rebirths}"></div>
        <span class="pace-fields__per" aria-hidden="true">per</span>
        <div class="field"><label for="${key}-minutes">Minutes</label><input id="${key}-minutes" type="number" min="0.01" step="any" inputmode="decimal" value="10"></div>
      </div></fieldset>
      <div class="account-card__results" aria-live="polite">
        <div class="progress-line"><span>Progress to target</span><strong id="${key}-progress-text">—</strong></div>
        <div class="progress-inspector">
          <div class="progress-track" role="progressbar" tabindex="0" aria-label="${name} progress" aria-description="Hover, tap, or use arrow keys to inspect a point" aria-describedby="${key}-progress-tooltip" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="${key}-progress-bar"></span></div>
          <span class="progress-hover-marker" id="${key}-progress-marker" hidden aria-hidden="true"></span>
          <div class="progress-tooltip" id="${key}-progress-tooltip" role="tooltip" aria-live="off" hidden>
            <div class="progress-tooltip__head"><strong id="${key}-hover-percent">—</strong><span id="${key}-hover-count">—</span></div>
            <div class="progress-tooltip__row"><span>At this point</span><strong id="${key}-hover-time">—</strong></div>
            <div class="progress-tooltip__row"><span>Estimated finish</span><strong id="${key}-hover-finish">—</strong></div>
          </div>
        </div>
        <div class="eta-block"><span>Estimated finish</span><strong id="${key}-eta">—</strong><small id="${key}-eta-date">—</small></div>
        <div class="stat-grid">
          <div class="stat"><span>Remaining</span><strong id="${key}-remaining">—</strong></div>
          <div class="stat"><span>Time needed</span><strong id="${key}-duration">—</strong></div>
        </div>
        <p class="account-message" id="${key}-message"></p>
      </div>
    </section>`;
}

function readNumber(input) {
  return input.value.trim() === "" ? NaN : Number(input.value);
}
function formatDuration(milliseconds) {
  if (milliseconds === null) return "No pace";
  if (!Number.isFinite(milliseconds)) return "Out of range";
  const minutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest}m`;
}

function paceForAccount(key) {
  const rebirths = readNumber($(`${key}-rebirths`));
  const minutes = readNumber($(`${key}-minutes`));
  if (!Number.isFinite(rebirths) || rebirths < 0 || !Number.isFinite(minutes) || minutes <= 0) {
    return { error: "Enter rebirths and a number of minutes above zero." };
  }
  return { rebirths, minutes };
}

function formatDateTime(date) {
  const rounded = new Date(Math.round(date.getTime() / 60000) * 60000);
  return `${shortDateFormat.format(rounded)}, ${timeFormat.format(rounded)}`;
}

function hideProgressTooltip(key) {
  $(`${key}-progress-tooltip`).hidden = true;
  $(`${key}-progress-marker`).hidden = true;
  previewPositions.delete(key);
}

function showProgressTooltip(key, rawPercent) {
  const data = accountCalculations.get(key);
  if (!data) return;
  const percent = Math.max(0, Math.min(100, Math.round(rawPercent * 10) / 10));
  const count = Math.round(data.target * percent / 100);
  let pointTime = formatDateTime(data.snapshot);
  if (count !== data.current) {
    const timestamp = data.snapshot.getTime() + (count - data.current) * data.pace.minutes / data.pace.rebirths * 60000;
    pointTime = data.pace.rebirths === 0 ? "No pace estimate"
      : Number.isFinite(timestamp) && Math.abs(timestamp) <= 8640000000000000
        ? `${count < data.current ? "≈ " : ""}${formatDateTime(new Date(timestamp))}` : "Out of range";
  }
  const goalTime = data.result.remaining === 0 ? "Goal reached"
    : data.result.eta ? formatDateTime(data.result.eta)
      : data.pace.rebirths === 0 ? "No pace" : "Out of range";
  $(`${key}-hover-percent`).textContent = `${percentFormat.format(percent)}%`;
  $(`${key}-hover-count`).textContent = `${numberFormat.format(count)} rebirths`;
  $(`${key}-hover-time`).textContent = pointTime;
  $(`${key}-hover-finish`).textContent = goalTime;

  const tooltip = $(`${key}-progress-tooltip`);
  const marker = $(`${key}-progress-marker`);
  const track = $(`${key}-progress-bar`).parentElement;
  tooltip.hidden = false;
  marker.hidden = false;
  const x = track.clientWidth * percent / 100;
  const halfWidth = tooltip.offsetWidth / 2;
  tooltip.style.left = `${Math.max(halfWidth, Math.min(track.clientWidth - halfWidth, x))}px`;
  marker.style.left = `${x}px`;
  previewPositions.set(key, percent);
}

function clearResult(key, message, neutral = false) {
  accountCalculations.delete(key);
  hideProgressTooltip(key);
  for (const id of ["progress-text", "eta", "eta-date", "remaining", "duration"]) $(`${key}-${id}`).textContent = "—";
  $(`${key}-quick-eta`).textContent = "—";
  $(`${key}-progress-bar`).style.width = "0%";
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuenow", "0");
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuetext", "Progress unavailable");
  $(`${key}-message`).textContent = message;
  $(`${key}-message`).classList.toggle("is-neutral", neutral);
}

function renderAccount(key, common) {
  const current = readNumber($(`${key}-current`));
  const target = readNumber($(`${key}-target`));
  if (!Number.isFinite(current) || !Number.isFinite(target) || current < 0 || target < 0) {
    const blank = $(`${key}-current`).value.trim() === "" || $(`${key}-target`).value.trim() === "";
    clearResult(key, blank ? "" : "Counts must be zero or greater.");
    return;
  }
  const pace = paceForAccount(key);
  if (pace.error) {
    const blank = $(`${key}-rebirths`).value.trim() === "" || $(`${key}-minutes`).value.trim() === "";
    clearResult(key, blank ? "" : pace.error);
    return;
  }
  const result = calculate({ current, target, ...pace, ...common });
  if (result.error) {
    clearResult(key, result.error);
    return;
  }
  accountCalculations.set(key, { current, target, pace, snapshot: common.snapshot, result });
  $(`${key}-progress-text`).textContent = `${percentFormat.format(result.progress)}%`;
  $(`${key}-progress-bar`).style.width = `${result.progress}%`;
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuenow", result.progress.toFixed(1));
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuetext", `${percentFormat.format(result.progress)}%, ${numberFormat.format(current)} of ${numberFormat.format(target)} rebirths`);
  $(`${key}-remaining`).textContent = numberFormat.format(result.remaining);
  $(`${key}-duration`).textContent = formatDuration(result.activeDuration);
  if (result.eta) {
    const displayedEta = new Date(Math.round(result.eta.getTime() / 60000) * 60000);
    $(`${key}-eta`).textContent = result.remaining === 0 ? "Goal reached" : timeFormat.format(displayedEta);
    $(`${key}-eta-date`).textContent = dateFormat.format(displayedEta);
    $(`${key}-quick-eta`).textContent = result.remaining === 0 ? "Done" : timeFormat.format(displayedEta);
  } else {
    $(`${key}-eta`).textContent = pace.rebirths === 0 ? "No pace" : "Out of range";
    $(`${key}-eta-date`).textContent = "—";
    $(`${key}-quick-eta`).textContent = pace.rebirths === 0 ? "No pace" : "—";
  }
  $(`${key}-message`).textContent = "";
  $(`${key}-message`).classList.remove("is-neutral");
  if (!$(`${key}-progress-tooltip`).hidden) showProgressTooltip(key, previewPositions.get(key) ?? result.progress);
}

function render() {
  const common = { snapshot: new Date() };
  for (const [index, account] of accounts.entries()) {
    const card = document.querySelector(`[data-account="${account.key}"]`);
    card.hidden = index >= accountCount;
    if (card.hidden) {
      hideProgressTooltip(account.key);
      continue;
    }
    renderAccount(account.key, common);
  }
}

function initNumberControls(root) {
  root.querySelectorAll('input[type="number"]').forEach((input) => {
    if (input.closest(".number-control")) return;
    const label = input.dataset.stepLabel || input.labels?.[0]?.textContent.trim() || "value";
    const control = document.createElement("div");
    control.className = "number-control";
    input.before(control);
    control.append(input);
    control.insertAdjacentHTML("beforeend", `
      <span class="number-control__steps">
        <button type="button" class="number-control__step" data-direction="1" aria-label="Increase ${label}"><svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1.5 6 4.5-4 4.5 4"/></svg></button>
        <button type="button" class="number-control__step" data-direction="-1" aria-label="Decrease ${label}"><svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1.5 2 4.5 4 4.5-4"/></svg></button>
      </span>`);
  });
}

function stepNumber(input, direction) {
  const step = Number(input.dataset.stepSize || (input.step === "any" ? 1 : input.step) || 1);
  const min = input.min === "" ? -Infinity : Number(input.min);
  const max = input.max === "" ? Infinity : Number(input.max);
  const current = input.value.trim() === "" ? NaN : Number(input.value);
  let next = Number.isFinite(current) ? current + direction * step
    : direction > 0 ? Math.max(Number.isFinite(min) ? min : 0, step) : Number.isFinite(min) ? min : 0;
  if (input.dataset.wrap === "true") {
    if (next > max) next = min;
    if (next < min) next = max;
  } else {
    next = Math.min(max, Math.max(min, next));
  }
  next = Number(next.toFixed(4));
  input.value = input.dataset.pad ? String(next).padStart(Number(input.dataset.pad), "0") : String(next);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".number-control__step");
  if (!button) return;
  stepNumber(button.closest(".number-control").querySelector("input"), Number(button.dataset.direction));
});


$("accounts-grid").innerHTML = accounts.map(accountMarkup).join("");
initNumberControls($("accounts-grid"));
document.querySelectorAll(".progress-track").forEach((track) => {
  const key = track.closest("[data-account]").dataset.account;
  const inspectPointer = (event) => {
    const rect = track.getBoundingClientRect();
    showProgressTooltip(key, (event.clientX - rect.left) / rect.width * 100);
  };
  track.addEventListener("pointermove", inspectPointer);
  track.addEventListener("pointerdown", inspectPointer);
  track.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") hideProgressTooltip(key);
  });
  track.addEventListener("focus", () => showProgressTooltip(key, previewPositions.get(key) ?? accountCalculations.get(key)?.result.progress ?? 0));
  track.addEventListener("blur", () => hideProgressTooltip(key));
  track.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Escape") {
      hideProgressTooltip(key);
      track.blur();
      return;
    }
    const current = previewPositions.get(key) ?? accountCalculations.get(key)?.result.progress ?? 0;
    const next = event.key === "Home" ? 0 : event.key === "End" ? 100
      : current + (event.key === "ArrowRight" ? 0.1 : -0.1);
    showProgressTooltip(key, next);
  });
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".progress-inspector")) {
    for (const account of accounts) hideProgressTooltip(account.key);
  }
});
const storageKey = "rebirth-calculator:v1";
const accountFields = ["current", "target", "rebirths", "minutes"];

function saveState() {
  const state = {
    accountCount,
    accounts: Object.fromEntries(accounts.map(({ key }) => [key,
      Object.fromEntries(accountFields.map((field) => [field, $(`${key}-${field}`).value]))])),
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The calculator still works when browser storage is unavailable.
  }
}

function restoreState() {
  let state;
  try {
    state = JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch {
    return;
  }
  if (!state || typeof state !== "object") return;
  if ([1, 2, 3].includes(state.accountCount)) accountCount = state.accountCount;
  for (const { key } of accounts) {
    for (const field of accountFields) {
      const value = state.accounts?.[key]?.[field];
      if (typeof value === "string" && value.length <= 100) $(`${key}-${field}`).value = value;
    }
  }
}

function setAccountCount(count, persist = true) {
  accountCount = count;
  document.body.dataset.accountCount = String(accountCount);
  $("accounts-grid").dataset.count = String(accountCount);
  document.querySelectorAll(".account-count").forEach((item) => {
    const active = Number(item.dataset.count) === accountCount;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  render();
  if (persist) saveState();
}

document.querySelectorAll(".account-count").forEach((button) => button.addEventListener("click", () => setAccountCount(Number(button.dataset.count))));
restoreState();
document.querySelectorAll("#accounts-grid input").forEach((input) => {
  const update = () => { render(); saveState(); };
  input.addEventListener("input", update);
  input.addEventListener("change", update);
});
const toolMenu = document.querySelector(".tool-menu");
document.addEventListener("pointerdown", (event) => {
  if (!toolMenu.contains(event.target)) toolMenu.open = false;
});
toolMenu.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toolMenu.open = false;
    toolMenu.querySelector("summary").focus();
  }
});
setAccountCount(accountCount, false);
