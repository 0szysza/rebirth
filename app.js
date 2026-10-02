import { calculate, calculateInterval, restoreSnapshot } from "./calc.mjs?v=20261002-7";

const $ = (id) => document.getElementById(id);
const accounts = [
  { key: "main", name: "Account 1", className: "main", current: "8108", target: "9999", rebirths: "158" },
  { key: "alt", name: "Account 2", className: "alt", current: "1882", target: "7777", rebirths: "117" },
  { key: "alt2", name: "Account 3", className: "alt2", current: "", target: "", rebirths: "" },
];
const accountNameLimit = 32;
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const percentFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateInputFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const calendarMonthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const calendarDayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const accountCalculations = new Map();
const previewPositions = new Map();
let accountCount = 2;
let calculatorMode = "goal";
let durationMode = "duration";
let modeStates = {};
document.body.dataset.accountCount = String(accountCount);

function accountMarkup(account) {
  const { key, name, className, current, target, rebirths } = account;
  return `
    <section class="account-card account-card--${className}" data-account="${key}" aria-labelledby="${key}-title">
      <div class="account-card__head">
        <span class="account-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></span>
        <div class="account-name">
          <div class="account-name__display">
            <h2 id="${key}-title">${name}</h2>
            <button type="button" class="account-name__edit" aria-label="Rename ${name}" title="Rename account"><svg class="icon" aria-hidden="true"><use href="#icon-square-pen"></use></svg></button>
          </div>
          <form class="account-name__form" aria-label="Rename ${name}" hidden>
            <input id="${key}-name" type="text" aria-label="Account name" maxlength="${accountNameLimit}" autocomplete="off" placeholder="${name}">
            <button type="submit" class="account-name__action account-name__save" aria-label="Save account name" title="Save name"><svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg></button>
            <button type="button" class="account-name__action account-name__cancel" aria-label="Cancel name edit" title="Cancel"><svg class="icon" aria-hidden="true"><use href="#icon-x"></use></svg></button>
            <button type="button" class="account-name__action account-name__reset" aria-label="Reset account name" title="Reset name" hidden><svg class="icon" aria-hidden="true"><use href="#icon-pen-off"></use></svg></button>
          </form>
        </div>
        <div class="account-card__quick"><span id="${key}-quick-label">ETA</span><strong id="${key}-quick-eta">—</strong></div>
      </div>
      <div class="account-card__fields">
        <div class="field"><label for="${key}-current">Starting rebirths</label><input id="${key}-current" type="number" min="0" step="1" inputmode="numeric" value="${current}"></div>
        <div class="field target-field"><label for="${key}-target">Target rebirths</label><input id="${key}-target" type="number" min="0" step="1" inputmode="numeric" value="${target}"></div>
      </div>
      <fieldset class="pace-group" aria-label="Rebirth pace"><div class="pace-fields">
        <div class="field"><label for="${key}-rebirths">Rebirths</label><input id="${key}-rebirths" type="number" min="0" step="any" inputmode="decimal" value="${rebirths}"></div>
        <span class="pace-fields__per" aria-hidden="true">per</span>
        <div class="field"><label for="${key}-minutes">Minutes</label><input id="${key}-minutes" type="number" min="0.01" step="any" inputmode="decimal" value="10"></div>
      </div></fieldset>
      <div class="account-card__results" aria-live="polite">
        <div class="progress-line"><span id="${key}-progress-label">Estimated progress</span><strong id="${key}-progress-text">—</strong></div>
        <div class="progress-inspector">
          <div class="progress-track" role="progressbar" tabindex="0" aria-label="${name} progress" aria-description="Hover, tap, or use arrow keys to inspect a point" aria-describedby="${key}-progress-tooltip" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="${key}-progress-bar"></span></div>
          <span class="progress-hover-marker" id="${key}-progress-marker" hidden aria-hidden="true"></span>
          <div class="progress-tooltip" id="${key}-progress-tooltip" role="tooltip" aria-live="off" hidden>
            <div class="progress-tooltip__head"><strong id="${key}-hover-percent">—</strong><span id="${key}-hover-count">—</span></div>
            <div class="progress-tooltip__row"><span>At this point</span><strong id="${key}-hover-time">—</strong></div>
            <div class="progress-tooltip__row interval-gain" hidden><span>Rebirths gained</span><strong id="${key}-hover-gain">—</strong></div>
            <div class="progress-tooltip__row"><span id="${key}-hover-finish-label">Estimated finish</span><strong id="${key}-hover-finish">—</strong></div>
          </div>
        </div>
        <div class="eta-block"><span id="${key}-eta-label">Estimated finish</span><strong id="${key}-eta">—</strong><small id="${key}-eta-date">—</small></div>
        <div class="stat-grid">
          <div class="stat"><span id="${key}-remaining-label">Remaining</span><strong id="${key}-remaining">—</strong></div>
          <div class="stat"><span>Time left</span><strong id="${key}-duration">—</strong></div>
          <div class="stat stat--wide"><span>Estimated now</span><strong id="${key}-projected">—</strong></div>
        </div>
        <p class="account-message" id="${key}-message"></p>
      </div>
    </section>`;
}

function setDateValue(id, date, precise = false) {
  date = precise ? new Date(date) : restoreSnapshot(date.toISOString());
  $(id).dataset.value = date.toISOString();
  $(id).value = dateInputFormat.format(date);
}
function readDate(input) {
  const date = new Date(input.dataset.value);
  return Number.isFinite(date.getTime()) ? date : null;
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

function formatDateTime(date, round = true) {
  const rounded = round ? new Date(Math.round(date.getTime() / 60000) * 60000) : date;
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
  const count = data.mode === "interval" ? Math.floor(data.current + data.result.totalGain * percent / 100) : Math.round(data.target * percent / 100);
  let pointTime = formatDateTime(data.snapshot);
  if (data.mode === "interval") {
    pointTime = formatDateTime(new Date(data.snapshot.getTime() + data.durationMinutes * 60000 * percent / 100), false);
    $(`${key}-hover-gain`).textContent = `≈ ${numberFormat.format(Math.floor(data.result.totalGain * percent / 100))}`;
  } else if (count !== data.current) {
    const timestamp = data.snapshot.getTime() + (count - data.current) * data.pace.minutes / data.pace.rebirths * 60000;
    pointTime = data.pace.rebirths === 0 ? "No pace estimate"
      : Number.isFinite(timestamp) && Math.abs(timestamp) <= 8640000000000000
        ? `${count < data.current ? "≈ " : ""}${formatDateTime(new Date(timestamp))}` : "Out of range";
  }
  const goalTime = data.result.eta ? formatDateTime(data.result.eta, data.mode !== "interval")
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
  for (const id of ["progress-text", "eta", "eta-date", "remaining", "duration", "projected"]) $(`${key}-${id}`).textContent = "—";
  $(`${key}-eta-label`).textContent = calculatorMode === "interval" ? "Rebirths at interval end" : "Estimated finish";
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
  const isInterval = calculatorMode === "interval";
  if (!Number.isFinite(current) || current < 0 || (!isInterval && (!Number.isFinite(target) || target < 0))) {
    const blank = $(`${key}-current`).value.trim() === "" || (!isInterval && $(`${key}-target`).value.trim() === "");
    clearResult(key, blank ? "" : "Counts must be zero or greater.");
    return;
  }
  const pace = paceForAccount(key);
  if (pace.error) {
    const blank = $(`${key}-rebirths`).value.trim() === "" || $(`${key}-minutes`).value.trim() === "";
    clearResult(key, blank ? "" : pace.error);
    return;
  }
  if (isInterval && common.intervalError) {
    clearResult(key, common.intervalError);
    return;
  }
  const result = (isInterval ? calculateInterval : calculate)({ current, target, ...pace, ...common });
  if (result.error) {
    clearResult(key, result.error);
    return;
  }
  accountCalculations.set(key, { mode: calculatorMode, current, target, pace, snapshot: common.snapshot, durationMinutes: common.durationMinutes, result });
  $(`${key}-progress-text`).textContent = `${percentFormat.format(result.progress)}%`;
  $(`${key}-progress-bar`).style.width = `${result.progress}%`;
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuenow", result.progress.toFixed(1));
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuetext", isInterval
    ? `${percentFormat.format(result.progress)}% of the interval elapsed, estimated ${numberFormat.format(Math.floor(result.projected))} rebirths now`
    : `Estimated ${percentFormat.format(result.progress)}%, ${numberFormat.format(Math.floor(result.projected))} of ${numberFormat.format(target)} rebirths`);
  $(`${key}-remaining`).textContent = isInterval ? `≈ ${numberFormat.format(Math.floor(result.totalGain))}` : numberFormat.format(Math.ceil(result.remaining));
  $(`${key}-projected`).textContent = `≈ ${numberFormat.format(Math.floor(result.projected))} rebirths`;
  $(`${key}-duration`).textContent = formatDuration(result.activeDuration);
  if (isInterval) {
    $(`${key}-eta-label`).textContent = "Rebirths at interval end";
    $(`${key}-eta`).textContent = `≈ ${numberFormat.format(Math.floor(result.finalCount))}`;
    $(`${key}-eta-date`).textContent = `${result.reached ? "Ended" : "Ends"} ${formatDateTime(result.eta, false)}`;
    $(`${key}-quick-eta`).textContent = result.reached ? "Done" : timeFormat.format(result.eta);
  } else if (result.eta) {
    const displayedEta = new Date(Math.round(result.eta.getTime() / 60000) * 60000);
    $(`${key}-eta-label`).textContent = result.reached ? "Estimated target reached" : "Estimated finish";
    $(`${key}-eta`).textContent = timeFormat.format(displayedEta);
    $(`${key}-eta-date`).textContent = dateFormat.format(displayedEta);
    $(`${key}-quick-eta`).textContent = result.reached ? "Done" : timeFormat.format(displayedEta);
  } else {
    $(`${key}-eta-label`).textContent = "Estimated finish";
    $(`${key}-eta`).textContent = pace.rebirths === 0 ? "No pace" : "Out of range";
    $(`${key}-eta-date`).textContent = "—";
    $(`${key}-quick-eta`).textContent = pace.rebirths === 0 ? "No pace" : "—";
  }
  $(`${key}-message`).textContent = "";
  $(`${key}-message`).classList.remove("is-neutral");
  if (!$(`${key}-progress-tooltip`).hidden) showProgressTooltip(key, previewPositions.get(key) ?? result.progress);
}

function render() {
  const common = { snapshot: readDate($("snapshot")), now: new Date() };
  if (calculatorMode === "interval") {
    if (durationMode === "until") {
      common.end = readDate($("interval-end"));
      common.durationMinutes = common.end && common.snapshot ? (common.end - common.snapshot) / 60000 : NaN;
      if (!Number.isFinite(common.durationMinutes) || common.durationMinutes <= 0) {
        common.intervalError = "Choose an end date and time after the interval start.";
      }
    } else {
      const hours = readNumber($("interval-hours"));
      const minutes = readNumber($("interval-minutes"));
      common.durationMinutes = hours * 60 + minutes;
      if (!Number.isFinite(hours) || hours < 0 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59 || !Number.isFinite(common.durationMinutes) || common.durationMinutes <= 0) {
        common.intervalError = "Enter a duration above zero (minutes: 0–59).";
      }
    }
  }
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


const pickerState = { openId: null, draft: null, year: 0, month: 0 };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const twoDigits = (value) => String(value).padStart(2, "0");

function syncPickerTime() {
  if (!pickerState.openId || !pickerState.draft) return;
  const picker = $(`${pickerState.openId}-picker`);
  const hourInput = picker.querySelector('[data-time-unit="hour"]');
  const minuteInput = picker.querySelector('[data-time-unit="minute"]');
  if (!hourInput || !minuteInput) return;
  const valid = hourInput.value !== "" && minuteInput.value !== "" && hourInput.validity.valid && minuteInput.validity.valid;
  picker.querySelector(".date-picker__apply").disabled = !valid;
  if (!valid) return false;
  const hours = Number(hourInput.value);
  const minutes = Number(minuteInput.value);
  pickerState.draft.setHours(Number.isFinite(hours) && hourInput.value !== "" ? Math.min(23, Math.max(0, Math.trunc(hours))) : pickerState.draft.getHours());
  pickerState.draft.setMinutes(Number.isFinite(minutes) && minuteInput.value !== "" ? Math.min(59, Math.max(0, Math.trunc(minutes))) : pickerState.draft.getMinutes(), 0, 0);
  return true;
}

function renderDatePicker() {
  const { openId, draft, year, month } = pickerState;
  if (!openId) return;
  const picker = $(`${openId}-picker`);
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = Array.from({ length: offset }, () => '<span class="date-picker__empty" aria-hidden="true"></span>');
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, month, day);
    const selected = sameDay(date, draft);
    const isToday = sameDay(date, today);
    cells.push(`<button type="button" class="date-picker__day${selected ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-day="${day}" aria-label="${calendarDayFormat.format(date)}" aria-pressed="${selected}">${day}</button>`);
  }
  picker.innerHTML = `
    <div class="date-picker__header">
      <button type="button" class="date-picker__nav" data-calendar-action="previous" aria-label="Previous month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
      <strong>${calendarMonthFormat.format(new Date(year, month, 1))}</strong>
      <button type="button" class="date-picker__nav" data-calendar-action="next" aria-label="Next month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
    </div>
    <div class="date-picker__weekdays" aria-hidden="true"><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span></div>
    <div class="date-picker__days" role="group" aria-label="Choose a day">${cells.join("")}</div>
    <div class="date-picker__time">
      <div class="date-picker__time-title"><svg class="icon" aria-hidden="true"><use href="#icon-clock"></use></svg><span>Time</span></div>
      <div class="date-picker__time-fields">
        <div class="field"><label for="${openId}-hour">Hour</label><input id="${openId}-hour" type="number" min="0" max="23" step="1" value="${twoDigits(draft.getHours())}" data-time-unit="hour" data-step-label="hour" data-wrap="true" data-pad="2" inputmode="numeric"></div>
        <span class="date-picker__time-colon" aria-hidden="true">:</span>
        <div class="field"><label for="${openId}-minute">Minute</label><input id="${openId}-minute" type="number" min="0" max="59" step="1" value="${twoDigits(draft.getMinutes())}" data-time-unit="minute" data-step-label="minute" data-wrap="true" data-pad="2" inputmode="numeric"></div>
      </div>
    </div>
    <div class="date-picker__footer"><button type="button" data-calendar-action="now">Now</button><span></span><button type="button" data-calendar-action="cancel">Cancel</button><button type="button" class="date-picker__apply" data-calendar-action="apply">Apply</button></div>`;
  initNumberControls(picker);
  if (!picker.hidden) positionDatePicker();
}

function positionDatePicker() {
  const id = pickerState.openId;
  if (!id) return;
  const picker = $(`${id}-picker`);
  picker.classList.remove("is-above", "is-floating");
  const field = $(id).getBoundingClientRect();
  const height = picker.getBoundingClientRect().height;
  if (window.innerHeight - field.bottom >= height + 8) return;
  picker.classList.add(field.top >= height + 8 ? "is-above" : "is-floating");
}

function closeDatePicker(restoreFocus = false) {
  const id = pickerState.openId;
  if (!id) return;
  $(`${id}-picker`).hidden = true;
  $(id).setAttribute("aria-expanded", "false");
  document.querySelector(`[data-date-for="${id}"]`).setAttribute("aria-expanded", "false");
  pickerState.openId = null;
  pickerState.draft = null;
  if (restoreFocus) $(id).focus();
}

function openDatePicker(id) {
  if (pickerState.openId === id) return;
  closeDatePicker();
  pickerState.openId = id;
  pickerState.draft = new Date(readDate($(id)) || new Date());
  pickerState.year = pickerState.draft.getFullYear();
  pickerState.month = pickerState.draft.getMonth();
  renderDatePicker();
  $(`${id}-picker`).hidden = false;
  positionDatePicker();
  $(id).setAttribute("aria-expanded", "true");
  document.querySelector(`[data-date-for="${id}"]`).setAttribute("aria-expanded", "true");
  $(`${id}-picker`).querySelector(".date-picker__day.is-selected")?.focus();
}

window.addEventListener("resize", () => {
  if (pickerState.openId) positionDatePicker();
});

for (const id of ["snapshot", "interval-end"]) {
  const input = $(id);
  input.addEventListener("click", () => openDatePicker(id));
  input.addEventListener("keydown", (event) => {
    if (!["Enter", " ", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    openDatePicker(id);
  });
  document.querySelector(`[data-date-for="${id}"]`).addEventListener("click", () => openDatePicker(id));
}

document.addEventListener("click", (event) => {
  const dayButton = event.target.closest(".date-picker__day");
  if (dayButton && pickerState.openId) {
    syncPickerTime();
    const { year, month, draft } = pickerState;
    pickerState.draft = new Date(year, month, Number(dayButton.dataset.day), draft.getHours(), draft.getMinutes());
    renderDatePicker();
    $(`${pickerState.openId}-picker`).querySelector(".date-picker__day.is-selected")?.focus();
    return;
  }
  const action = event.target.closest("[data-calendar-action]")?.dataset.calendarAction;
  if (!action || !pickerState.openId) return;
  if (action === "cancel") return closeDatePicker(true);
  if (action === "apply") {
    if (syncPickerTime() === false) return;
    const id = pickerState.openId;
    setDateValue(id, pickerState.draft);
    closeDatePicker(true);
    render();
    saveState();
    return;
  }
  if (action === "now") {
    pickerState.draft = new Date();
    pickerState.draft.setSeconds(0, 0);
    pickerState.year = pickerState.draft.getFullYear();
    pickerState.month = pickerState.draft.getMonth();
  } else {
    syncPickerTime();
    const view = new Date(pickerState.year, pickerState.month + (action === "next" ? 1 : -1), 1);
    pickerState.year = view.getFullYear();
    pickerState.month = view.getMonth();
  }
  renderDatePicker();
});

document.addEventListener("input", (event) => {
  if (event.target.matches('.date-picker [data-time-unit]')) syncPickerTime();
});
document.addEventListener("pointerdown", (event) => {
  if (pickerState.openId && !event.target.closest(".date-control")) closeDatePicker();
});
document.addEventListener("keydown", (event) => {
  if (!pickerState.openId) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeDatePicker(true);
    return;
  }
  const day = event.target.closest(".date-picker__day");
  const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
  if (!day || !delta) return;
  event.preventDefault();
  syncPickerTime();
  const { year, month, draft } = pickerState;
  pickerState.draft = new Date(year, month, Number(day.dataset.day) + delta, draft.getHours(), draft.getMinutes());
  pickerState.year = pickerState.draft.getFullYear();
  pickerState.month = pickerState.draft.getMonth();
  renderDatePicker();
  $(`${pickerState.openId}-picker`).querySelector(".date-picker__day.is-selected")?.focus();
});


$("accounts-grid").innerHTML = accounts.map(accountMarkup).join("");
initNumberControls($("accounts-grid"));
initNumberControls($("interval-settings"));
function defaultAccountName(account) {
  return `Account ${accounts.indexOf(account) + 1}`;
}

function normalizeAccountName(account, value) {
  return (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, accountNameLimit) : "") || defaultAccountName(account);
}

function updateAccountNameReset(account) {
  const card = document.querySelector(`[data-account="${account.key}"]`);
  const defaultName = defaultAccountName(account);
  card.querySelector(".account-name__form .account-name__reset").hidden = normalizeAccountName(account, $(`${account.key}-name`).value) === defaultName;
}

function setAccountName(account, value) {
  account.name = normalizeAccountName(account, value);
  const card = document.querySelector(`[data-account="${account.key}"]`);
  const heading = $(`${account.key}-title`);
  heading.textContent = account.name;
  heading.title = account.name;
  card.querySelector(".account-name__edit").setAttribute("aria-label", `Rename ${account.name}`);
  card.querySelector(".account-name__form").setAttribute("aria-label", `Rename ${account.name}`);
  card.querySelector(".progress-track").setAttribute("aria-label", `${account.name} progress`);
  $(`${account.key}-name`).value = account.name;
  updateAccountNameReset(account);
}

function closeAccountNameEditor(account, save = false, restoreFocus = true) {
  const card = document.querySelector(`[data-account="${account.key}"]`);
  const form = card.querySelector(".account-name__form");
  if (form.hidden) return;
  if (save) {
    setAccountName(account, $(`${account.key}-name`).value);
    saveState();
  } else {
    $(`${account.key}-name`).value = account.name;
  }
  form.hidden = true;
  card.querySelector(".account-name__display").hidden = false;
  updateAccountNameReset(account);
  if (restoreFocus) card.querySelector(".account-name__edit").focus();
}

for (const account of accounts) {
  const card = document.querySelector(`[data-account="${account.key}"]`);
  const form = card.querySelector(".account-name__form");
  card.querySelector(".account-name__edit").addEventListener("click", () => {
    for (const other of accounts) closeAccountNameEditor(other, false, false);
    card.querySelector(".account-name__display").hidden = true;
    form.hidden = false;
    const input = $(`${account.key}-name`);
    input.value = account.name;
    updateAccountNameReset(account);
    input.focus();
    input.select();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    closeAccountNameEditor(account, true);
  });
  card.querySelector(".account-name__cancel").addEventListener("click", () => closeAccountNameEditor(account));
  $(`${account.key}-name`).addEventListener("input", () => updateAccountNameReset(account));
  card.querySelectorAll(".account-name__reset").forEach((button) => button.addEventListener("click", () => {
    setAccountName(account, defaultAccountName(account));
    saveState();
    closeAccountNameEditor(account, false, false);
    card.querySelector(".account-name__edit").focus();
  }));
  form.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeAccountNameEditor(account);
  });
}

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
  modeStates[calculatorMode] = captureModeState();
  const goal = modeStates.goal || modeStates[calculatorMode];
  const state = {
    accountCount,
    calculatorMode,
    modes: modeStates,
    snapshot: goal.snapshot,
    accounts: Object.fromEntries(accounts.map(({ key, name }) => [key,
      { name, ...goal.accounts[key] }])),
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The calculator still works when browser storage is unavailable.
  }
}

function captureModeState() {
  return {
    snapshot: $("snapshot").dataset.value,
    hours: $("interval-hours").value,
    minutes: $("interval-minutes").value,
    durationMode,
    end: $("interval-end").dataset.value || null,
    accounts: Object.fromEntries(accounts.map(({key}) => [key,
      Object.fromEntries(accountFields.map(field => [field, $(`${key}-${field}`).value]))])),
  };
}

function applyModeState(state) {
  const saved = new Date(state.snapshot);
  setDateValue("snapshot", calculatorMode === "interval" && Number.isFinite(saved.getTime()) ? saved : restoreSnapshot(state.snapshot), calculatorMode === "interval");
  for (const [id, field, fallback] of [["interval-hours", "hours", "2"], ["interval-minutes", "minutes", "0"]]) {
    $(id).value = typeof state[field] === "string" && state[field].length <= 100 ? state[field] : fallback;
  }
  durationMode = state.durationMode === "until" ? "until" : "duration";
  const end = typeof state.end === "string" ? new Date(state.end) : null;
  if (end && Number.isFinite(end.getTime())) {
    setDateValue("interval-end", end, true);
  } else {
    delete $("interval-end").dataset.value;
    $("interval-end").value = "";
  }
  for (const {key} of accounts) {
    for (const field of accountFields) {
      const value = state.accounts?.[key]?.[field];
      if (typeof value === "string" && value.length <= 100) $(`${key}-${field}`).value = value;
    }
  }
}

function syncCalculatorMode() {
  const isInterval = calculatorMode === "interval";
  document.body.dataset.calculatorMode = calculatorMode;
  $("interval-settings").hidden = !isInterval;
  $("calculator-description").textContent = isInterval
    ? "Set your starting rebirths and pace to see how much each account gains over time."
    : "Set your rebirth counts and pace to see when each account reaches its goal.";
  document.querySelector('label[for="snapshot"]').textContent = isInterval ? "Interval starts at" : "Counts recorded at";
  $("snapshot-help").textContent = isInterval
    ? "Enter the counts you had at this starting time. The interval keeps the same end when you return. Choose Now in this calendar when recording fresh counts."
    : "Enter the rebirth counts you had at this time. This saved starting point keeps your finish time fixed. Estimates assume you keep rebirthing at the entered pace.";
  $("snapshot-picker").setAttribute("aria-label", isInterval ? "Interval start date and time" : "Recorded date and time");
  document.querySelector('[data-date-for="snapshot"]').setAttribute("aria-label", isInterval ? "Choose interval start date and time" : "Choose recorded date and time");
  document.querySelectorAll(".calculation-mode").forEach(button => {
    const active = button.dataset.mode === calculatorMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  for (const {key} of accounts) {
    const card = document.querySelector(`[data-account="${key}"]`);
    card.querySelector(".target-field").hidden = isInterval;
    card.querySelector(".interval-gain").hidden = !isInterval;
    $(`${key}-quick-label`).textContent = isInterval ? "ENDS" : "ETA";
    $(`${key}-progress-label`).textContent = isInterval ? "Interval progress" : "Estimated progress";
    $(`${key}-remaining-label`).textContent = isInterval ? "Rebirths gained" : "Remaining";
    $(`${key}-hover-finish-label`).textContent = isInterval ? "Interval ends" : "Estimated finish";
    hideProgressTooltip(key);
  }
  syncDurationMode();
}

function syncDurationMode() {
  $("duration-fields").hidden = durationMode !== "duration";
  $("end-time-field").hidden = durationMode !== "until";
  document.querySelectorAll(".duration-mode").forEach(button => {
    const active = button.dataset.durationMode === durationMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setDurationMode(mode) {
  if (!["duration", "until"].includes(mode) || mode === durationMode) return;
  closeDatePicker();
  if (mode === "until" && !readDate($("interval-end"))) {
    const duration = readNumber($("interval-hours")) * 60 + readNumber($("interval-minutes"));
    const end = new Date(readDate($("snapshot")).getTime() + duration * 60000);
    setDateValue("interval-end", Number.isFinite(end.getTime()) && duration > 0
      ? end : new Date(readDate($("snapshot")).getTime() + 120 * 60000), true);
  }
  durationMode = mode;
  accounts.forEach(({key}) => hideProgressTooltip(key));
  syncDurationMode();
  render();
  saveState();
}

function setCalculatorMode(mode) {
  if (!["goal", "interval"].includes(mode) || mode === calculatorMode) return;
  saveState();
  closeDatePicker();
  accounts.forEach(account => closeAccountNameEditor(account, false, false));
  if (!modeStates[mode]) modeStates[mode] = { ...captureModeState(), snapshot: new Date().toISOString(), durationMode: "duration", end: null };
  calculatorMode = mode;
  applyModeState(modeStates[mode]);
  syncCalculatorMode();
  render();
  saveState();
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
  for (const account of accounts) {
    setAccountName(account, state.accounts?.[account.key]?.name);
  }
  modeStates.goal = { ...captureModeState(), snapshot: restoreSnapshot(state.snapshot, readDate($("snapshot"))).toISOString(), accounts: state.accounts || captureModeState().accounts };
  for (const mode of ["goal", "interval"]) {
    if (state.modes?.[mode] && typeof state.modes[mode] === "object") modeStates[mode] = state.modes[mode];
  }
  calculatorMode = state.calculatorMode === "interval" && modeStates.interval ? "interval" : "goal";
  applyModeState(modeStates[calculatorMode]);
}

function setAccountCount(count, persist = true) {
  accountCount = count;
  accounts.slice(count).forEach((account) => closeAccountNameEditor(account, false, false));
  document.body.dataset.accountCount = String(accountCount);
  $("accounts-grid").dataset.count = String(accountCount);
  document.querySelectorAll(".account-count[data-count]").forEach((item) => {
    const active = Number(item.dataset.count) === accountCount;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  render();
  if (persist) saveState();
}

document.querySelectorAll(".account-count[data-count]").forEach((button) => button.addEventListener("click", () => setAccountCount(Number(button.dataset.count))));
document.querySelectorAll(".calculation-mode").forEach(button => button.addEventListener("click", () => setCalculatorMode(button.dataset.mode)));
document.querySelectorAll(".duration-mode").forEach(button => button.addEventListener("click", () => setDurationMode(button.dataset.durationMode)));
setDateValue("snapshot", new Date());
restoreState();
syncCalculatorMode();
// Persist the initial timestamp once, including migration from older saved inputs.
saveState();
document.querySelectorAll('#accounts-grid input[type="number"], #interval-settings input[type="number"]').forEach((input) => {
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
setInterval(render, 10000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
window.addEventListener("pageshow", render);
