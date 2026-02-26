const DEFAULT_CONFIG = {
  timezone: "Europe/Lisbon",
  libraryName: "Biblioteca Orlando Ribeiro"
};

const ids = {
  card: document.getElementById("status-card"),
  badge: document.getElementById("status-badge"),
  main: document.getElementById("status-main"),
  detail: document.getElementById("status-detail"),
  nextChange: document.getElementById("next-change"),
  todayHours: document.getElementById("today-hours")
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

  const plusSeven = new Date(date);
  plusSeven.setDate(date.getDate() + 7);
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

function getStatusReason(now, config) {
  const day = now.getDay();
  const key = dateKey(now);

  if (!inEffectiveWindow(now, config)) {
    return "Fora do período de horário publicado (jan-jul 2026).";
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

  if (isLastWednesday(now) && now.getHours() >= 14) {
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
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(0, 0, 0, 0);

    const intervals = getIntervalsForDate(candidate, config);
    if (intervals.length > 0) {
      return `Próxima abertura: ${formatDate(intervals[0].open)}, ${formatHour(intervals[0].open)}.`;
    }
  }

  return "Sem próxima abertura definida no calendário.";
}

function getTodayHours(now, config) {
  const intervals = getIntervalsForDate(now, config);
  if (intervals.length === 0) {
    return "Encerrada hoje.";
  }

  return intervals.map((interval) => `${formatHour(interval.open)}–${formatHour(interval.close)}`).join(" · ");
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
  ids.nextChange.textContent = getNextChange(now, config);
  ids.todayHours.textContent = getTodayHours(now, config);
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
    renderStatus(now, config);
  } catch (error) {
    ids.card.classList.add("is-closed");
    ids.badge.textContent = "ERRO";
    ids.main.textContent = "Não foi possível carregar o horário.";
    ids.detail.textContent = error.message;
    ids.nextChange.textContent = "—";
    ids.todayHours.textContent = "—";
  }
}

init();
