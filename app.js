import { activeMilliseconds, calculate } from "./calc.mjs";

const $ = (id) => document.getElementById(id);
const numberFormat = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });
const timeFormat = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const quickDateFormat = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function localInputValue(date) {
  const two = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

function readDate(input) {
  const date = new Date(input.value);
  return input.value && Number.isFinite(date.getTime()) ? date : null;
}

function readNumber(input) {
  return input.value.trim() === "" ? NaN : Number(input.value);
}

function readClock(input) {
  const parts = /^(\d{2}):(\d{2})$/.exec(input.value);
  return parts ? Number(parts[1]) * 60 + Number(parts[2]) : NaN;
}

function formatDuration(milliseconds) {
  if (milliseconds === null) return "—";
  const minutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return `${hours} godz. ${rest} min`;
}

function rateForAccount(key, current, common) {
  const mode = document.querySelector(`input[name="${key}-rate-mode"]:checked`)?.value;
  const measuredOutput = $(`${key}-measured-rate`);
  if (mode === "manual") {
    measuredOutput.textContent = "";
    return { value: readNumber($(`${key}-rate`)) };
  }

  const previous = readNumber($(`${key}-previous`));
  const previousTime = readDate($(`${key}-previous-time`));
  if (!Number.isFinite(previous) || previous < 0 || !previousTime || !common.snapshot) {
    measuredOutput.textContent = "";
    return { error: "Wpisz poprzedni stan i godzinę pomiaru." };
  }
  const elapsedMinutes = activeMilliseconds(previousTime, common.snapshot, common.breakStart, common.breakEnd) / 60000;
  if (elapsedMinutes <= 0) {
    measuredOutput.textContent = "";
    return { error: "Między pomiarami musi być czas aktywnego grindu." };
  }
  if (current < previous) {
    measuredOutput.textContent = "";
    return { error: "Aktualny stan nie może być mniejszy od poprzedniego." };
  }
  const value = (current - previous) / elapsedMinutes * 10;
  measuredOutput.textContent = `Wyliczone tempo: ${decimalFormat.format(value)} / 10 min`;
  return { value };
}

function clearResult(key, message) {
  for (const id of ["progress-text", "eta", "eta-date", "remaining", "duration", "projected"]) {
    $(`${key}-${id}`).textContent = "—";
  }
  $(`${key}-progress-bar`).style.width = "0%";
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuenow", "0");
  $(`${key}-quick-eta`).textContent = "—";
  $(`${key}-message`).textContent = message;
}

function renderAccount(key, common) {
  const current = readNumber($(`${key}-current`));
  const target = readNumber($(`${key}-target`));
  if (!Number.isFinite(current) || !Number.isFinite(target) || current < 0 || target < 0) {
    clearResult(key, "Wpisz poprawny aktualny stan i cel.");
    return;
  }
  if (!common.snapshot || !common.forecast || !Number.isFinite(common.breakStart) || !Number.isFinite(common.breakEnd)) {
    clearResult(key, "Uzupełnij daty i godziny przerwy.");
    return;
  }
  const rate = rateForAccount(key, current, common);
  if (rate.error) {
    clearResult(key, rate.error);
    return;
  }
  const result = calculate({ current, target, ratePerTen: rate.value, ...common });
  if (result.error) {
    clearResult(key, result.error);
    return;
  }

  const progress = Math.round(result.progress * 10) / 10;
  $(`${key}-progress-text`).textContent = `${decimalFormat.format(progress)}%`;
  $(`${key}-progress-bar`).style.width = `${result.progress}%`;
  $(`${key}-progress-bar`).parentElement.setAttribute("aria-valuenow", String(Math.round(result.progress)));
  $(`${key}-remaining`).textContent = numberFormat.format(result.remaining);
  $(`${key}-duration`).textContent = result.activeDuration === null ? "Brak tempa" : formatDuration(result.activeDuration);

  if (result.eta) {
    const displayedEta = new Date(Math.round(result.eta.getTime() / 60000) * 60000);
    $(`${key}-eta`).textContent = result.remaining === 0 ? "Cel osiągnięty" : timeFormat.format(displayedEta);
    $(`${key}-eta-date`).textContent = dateFormat.format(displayedEta);
    $(`${key}-quick-eta`).textContent = result.remaining === 0 ? "Osiągnięty" : quickDateFormat.format(displayedEta);
  } else {
    $(`${key}-eta`).textContent = rate.value === 0 ? "Brak tempa" : "Poza zakresem";
    $(`${key}-eta-date`).textContent = "—";
    $(`${key}-quick-eta`).textContent = rate.value === 0 ? "Brak tempa" : "—";
  }
  $(`${key}-projected`).textContent = result.projected === null ? "—" : `≈ ${numberFormat.format(result.projected)} rebirthów`;
  $(`${key}-message`).textContent = result.projected === null ? "Prognoza musi być późniejsza niż pomiar." : "";
}

function render() {
  const common = {
    snapshot: readDate($("snapshot")),
    forecast: readDate($("forecast")),
    breakStart: readClock($("break-start")),
    breakEnd: readClock($("break-end")),
  };
  for (const key of ["main", "alt"]) {
    const mode = document.querySelector(`input[name="${key}-rate-mode"]:checked`)?.value;
    document.querySelector(`[data-account="${key}"] .manual-rate`).hidden = mode !== "manual";
    document.querySelector(`[data-account="${key}"] .measured-rate`).hidden = mode !== "measured";
    renderAccount(key, common);
  }
}

const now = new Date();
now.setSeconds(0, 0);
$("snapshot").value = localInputValue(now);
const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
$("forecast").value = localInputValue(midnight);
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
});
render();

