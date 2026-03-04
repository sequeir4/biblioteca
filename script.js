const DEFAULT_CONFIG = {
  timezone: "Europe/Lisbon",
  libraryName: "Biblioteca Orlando Ribeiro",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Biblioteca+Orlando+Ribeiro"
};

const ids = {
  card: document.getElementById("status-card"),
  badge: document.getElementById("status-badge"),
  main: document.getElementById("status-main"),
  detail: document.getElementById("status-detail"),
  soon: document.getElementById("status-soon"),
  nextChange: document.getElementById("next-change"),
  selectedDayHours: document.getElementById("selected-day-hours"),
  previousDayTitle: document.getElementById("previous-day-title"),
  previousDayHours: document.getElementById("previous-day-hours"),
  nextDayTitle: document.getElementById("next-day-title"),
  nextDayHours: document.getElementById("next-day-hours"),
  selectedDateInput: document.getElementById("selected-date"),
  prevDayButton: document.getElementById("prev-day"),
  nextDayButton: document.getElementById("next-day"),
  mapsLink: document.getElementById("maps-link")
};

let appState = {
  config: null,
  selectedDate: new Date()
};

function formatDate(date, locale = "pt-PT") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function formatHour(date, locale = "pt-PT") {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

function toDateWithTime(baseDate, hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function isLastWednesday(date) {
  if (date.getDay() !== 3) {
    return false;
  }

  const plusSeven = addDays(date, 7);
  return plusSeven.getMonth() !== date.getMonth();
}

function isHoliday(date, config) {
  return (config.holidayDates || []).includes(dateKey(date));
}

function inEffectiveWindow(date, config) {
  if (!config.effectiveStart || !config.effectiveEnd) {
    return true;
  }

  const key = dateKey(date);
  return key >= config.effectiveStart && key <= config.effectiveEnd;
}

function getIntervalsForDate(date, config) {
  if (!inEffectiveWindow(date, config)) {
    return [];
  }

  const day = date.getDay();
  const key = dateKey(date);

  if (day === 0 || isHoliday(date, config)) {
    return [];
  }

  let intervals = config.regularHours?.[String(day)] || [];

  if (day === 6) {
    const isSpecialSaturday = (config.saturdayOpenDates || []).includes(key);
    intervals = isSpecialSaturday ? (config.saturdayHours || []) : [];
  }

  if (isLastWednesday(date) && intervals.length > 0 && config.lastWednesdayCloseTime) {
    intervals = intervals.map((interval) => ({
      open: interval.open,
      close: config.lastWednesdayCloseTime
    }));
  }

  return intervals.map((interval) => ({
    open: toDateWithTime(date, interval.open),
    close: toDateWithTime(date, interval.close)
  }));
}

function isOpenNow(now, config) {
  return getIntervalsForDate(now, config).some((interval) => now >= interval.open && now < interval.close);
}

function formatIntervals(intervals) {
  if (intervals.length === 0) {
    return "Encerrada.";
  }

  return intervals.map((interval) => `${formatHour(interval.open)}–${formatHour(interval.close)}`).join(" · ");
}

function getStatusReason(now, config) {
  const day = now.getDay();
  const key = dateKey(now);

  if (!inEffectiveWindow(now, config)) {
    return "Fora do período de horário publicado.";
  }

  if (day === 0) {
    return "Encerra ao domingo.";
  }

  if (isHoliday(now, config)) {
    return "Encerra em feriados nacionais.";
  }

  if (day === 6 && !(config.saturdayOpenDates || []).includes(key)) {
    return "Ao sábado abre apenas nas datas publicadas.";
  }

  if (isLastWednesday(now)) {
    return "Na última quarta-feira de cada mês encerra às 14:00.";
  }

  const intervals = getIntervalsForDate(now, config);
  if (intervals.length === 0) {
    return "Sem horário disponível para hoje.";
  }

  const first = intervals[0];
  const last = intervals[intervals.length - 1];

  if (now < first.open) {
    return `Abre hoje às ${formatHour(first.open)}.`;
  }

  if (now >= last.close) {
    return `O horário de hoje terminou às ${formatHour(last.close)}.`;
  }

  return "Dentro do horário de funcionamento.";
}

function minutesUntil(fromDate, toDate) {
  return Math.max(0, Math.round((toDate - fromDate) / 60000));
}

function getSoonMessage(now, config) {
  const intervals = getIntervalsForDate(now, config);
  if (intervals.length === 0) {
    return "";
  }

  for (const interval of intervals) {
    if (now >= interval.open && now < interval.close) {
      const minsToClose = minutesUntil(now, interval.close);
      if (minsToClose <= 60) {
        return `⚠️ Fecha em breve: encerra em ${minsToClose} minuto${minsToClose === 1 ? "" : "s"}.`;
      }

      return `Fecha em ${minsToClose} minuto${minsToClose === 1 ? "" : "s"}.`;
    }

    if (now < interval.open) {
      const minsToOpen = minutesUntil(now, interval.open);
      if (minsToOpen <= 60) {
        return `🕒 Abre em breve: abre em ${minsToOpen} minuto${minsToOpen === 1 ? "" : "s"}.`;
      }

      return `Abre em ${minsToOpen} minuto${minsToOpen === 1 ? "" : "s"}.`;
    }
  }

  return "Já não volta a abrir hoje.";
}

function getNextChange(now, config) {
  const todayIntervals = getIntervalsForDate(now, config);

  for (const interval of todayIntervals) {
    if (now >= interval.open && now < interval.close) {
      return `Fecha hoje às ${formatHour(interval.close)}.`;
    }

    if (now < interval.open) {
      return `Abre hoje às ${formatHour(interval.open)}.`;
    }
  }

  for (let offset = 1; offset <= 370; offset += 1) {
    const candidate = addDays(now, offset);
    candidate.setHours(0, 0, 0, 0);

    const intervals = getIntervalsForDate(candidate, config);
    if (intervals.length > 0) {
      return `Próxima abertura: ${formatDate(intervals[0].open)}, ${formatHour(intervals[0].open)}.`;
    }
  }

  return "Sem próxima abertura definida no calendário.";
}

function renderSelectedDaySection(selectedDate, config) {
  const previousDay = addDays(selectedDate, -1);
  const nextDay = addDays(selectedDate, 1);

  const selectedIntervals = getIntervalsForDate(selectedDate, config);
  const previousIntervals = getIntervalsForDate(previousDay, config);
  const nextIntervals = getIntervalsForDate(nextDay, config);

  ids.selectedDayHours.textContent = `${formatDate(selectedDate)} · ${formatIntervals(selectedIntervals)}`;
  ids.previousDayTitle.textContent = `Dia anterior (${formatDate(previousDay)})`;
  ids.previousDayHours.textContent = formatIntervals(previousIntervals);
  ids.nextDayTitle.textContent = `Próximo dia (${formatDate(nextDay)})`;
  ids.nextDayHours.textContent = formatIntervals(nextIntervals);
  ids.selectedDateInput.value = dateKey(selectedDate);
}

function renderStatus(now, config) {
  const open = isOpenNow(now, config);

  ids.card.classList.toggle("is-open", open);
  ids.card.classList.toggle("is-closed", !open);

  ids.badge.textContent = open ? "ABERTA" : "FECHADA";
  ids.main.textContent = open
    ? `${config.libraryName || DEFAULT_CONFIG.libraryName} está aberta agora.`
    : `${config.libraryName || DEFAULT_CONFIG.libraryName} está fechada agora.`;

  ids.detail.textContent = getStatusReason(now, config);
  ids.soon.textContent = getSoonMessage(now, config);
  ids.nextChange.textContent = getNextChange(now, config);
  renderSelectedDaySection(appState.selectedDate, config);
}

function bindEvents() {
  ids.prevDayButton.addEventListener("click", () => {
    appState.selectedDate = addDays(appState.selectedDate, -1);
    renderSelectedDaySection(appState.selectedDate, appState.config);
  });

  ids.nextDayButton.addEventListener("click", () => {
    appState.selectedDate = addDays(appState.selectedDate, 1);
    renderSelectedDaySection(appState.selectedDate, appState.config);
  });

  ids.selectedDateInput.addEventListener("change", (event) => {
    if (!event.target.value) {
      return;
    }

    appState.selectedDate = parseDateKey(event.target.value);
    renderSelectedDaySection(appState.selectedDate, appState.config);
  });
}

async function loadScheduleConfig() {
  const response = await fetch("schedule.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar schedule.json (${response.status})`);
  }

  return response.json();
}

async function init() {
  try {
    const config = await loadScheduleConfig();
    const now = new Date();

    appState = {
      config,
      selectedDate: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    };

    ids.mapsLink.href = config.mapsUrl || DEFAULT_CONFIG.mapsUrl;

    bindEvents();
    renderStatus(now, config);
  } catch (error) {
    ids.card.classList.add("is-closed");
    ids.badge.textContent = "ERRO";
    ids.main.textContent = "Não foi possível carregar o horário.";
    ids.detail.textContent = error.message;
    ids.soon.textContent = "";
    ids.nextChange.textContent = "—";
    ids.selectedDayHours.textContent = "—";
    ids.previousDayHours.textContent = "—";
    ids.nextDayHours.textContent = "—";
  }
}

init();
