function getWeatherIcon(type) {
  const weatherType = String(type ?? "").toLowerCase();
  if (weatherType.includes("rain") || weatherType.includes("shower"))
    return "bi-cloud-rain-fill text-primary";
  if (weatherType.includes("sun") || weatherType.includes("clear"))
    return "bi-sun-fill text-warning";
  return "bi-cloud-fill text-secondary";
}

function normalizeWeatherError(error) {
  return {
    error: error?.error ?? error?.message ?? String(error),
  };
}

function forecastValue(value) {
  return value == null || value === "" ? "--" : escapeHtml(value);
}

function forecastDay(data, index, startDate) {
  const dateValue = data.date ?? data.datetime;
  if (dateValue) {
    const date = moment(dateValue);
    if (date.isValid()) {
      return date.isSame(moment(), "day") ? "Today" : date.format("ddd");
    }
  }
  if (typeof data.day === "string" && data.day.trim()) return data.day;
  const forecastDate = moment(startDate).add(index, "days");
  return forecastDate.isSame(moment(), "day")
    ? "Today"
    : forecastDate.format("ddd");
}

async function setLocationStr() {
  const locationStr = document.getElementById("enteredLocation").value.trim();
  document.getElementById("locationStr").textContent = locationStr;
  await loadWeather();
}

function openLoginModal() {
  bootstrap.Modal.getOrCreateInstance(document.getElementById("logModal")).show();
}

function updateCurrentWeather(forecast) {
  document.getElementById("windSpeedValue").textContent =
    forecast?.wind_speed ?? "--";
  document.getElementById("windDirectionValue").textContent =
    forecast?.wind_direction ?? "--";
  document.getElementById("humidityValue").textContent =
    forecast?.humidity ?? "--";
  document.getElementById("pressureValue").textContent =
    forecast?.pressure ?? "--";
  document.getElementById("uvValue").textContent =
    forecast?.uv_index ?? "--";
}

async function loadWeather() {
  const forecastContainer = document.getElementById("forecast-container");
  const calendarEl = document.getElementById("calendar");
  const location = document.getElementById("locationStr")?.textContent ?? "";
  const isLoggedIn = Boolean(loadUser());
  updateCurrentWeather(null);

  forecastContainer.innerHTML =
    '<div class="col-12"><div class="text-body-secondary">Loading forecast&hellip;</div></div>';

  try {
    const datetime = moment().format("YYYY-MM-DD");
    const startDate = moment(datetime);
    let calendarData;
    let forecastData;
    if (isLoggedIn) {
      [calendarData, forecastData] = await Promise.all([
        getUserForecastCalendar(location),
        getUserForecast(location, moment().format(DATETIME_FORMAT)),
      ]);
    } else {
      [calendarData, forecastData] = await Promise.all([
        getGuestForecastCalendar(location),
        getGuestForecast(location, datetime),
      ]);
    }
    if (!Array.isArray(calendarData) || !Array.isArray(forecastData)) {
      throw new TypeError("Forecast responses must be arrays.");
    }

    const todayForecast =
      forecastData.find(
        (forecast) =>
          (forecast.date ?? forecast.datetime) &&
          moment(forecast.date ?? forecast.datetime).isSame(moment(), "day"),
      ) ?? forecastData[0];
    updateCurrentWeather(todayForecast);

    forecastContainer.replaceChildren();

    forecastData.slice(0, 7).forEach((data, index) => {
      const day = forecastDay(data, index, startDate);
      const col = document.createElement("div");
      col.className = "col";

      const card = document.createElement("div");
      card.className =
        "card h-100 bg-body border-secondary-subtle text-center compact-card";

      const cardBody = document.createElement("div");
      cardBody.className =
        "card-body d-flex flex-column align-items-center justify-content-center";

      const title = document.createElement("h6");
      title.className = "card-title text-body fw-bold mb-1";
      title.style.fontSize = "0.85rem";
      title.textContent = day;

      const icon = document.createElement("i");
      icon.className = `bi ${getWeatherIcon(data.weather_type)} fs-3 mb-1`;

      const temps = document.createElement("div");
      temps.className = "mb-1";
      temps.innerHTML = `
            <span class="text-danger fw-bold" style="font-size: 0.9rem">${forecastValue(data.temp_max)}°</span>
            <span class="text-body-secondary mx-1" style="font-size: 0.7rem">/</span>
            <span class="text-primary fw-bold" style="font-size: 0.9rem">${forecastValue(data.temp_min)}°</span>
        `;

      const precip = document.createElement("small");
      precip.className = "text-body-secondary d-block";
      precip.style.fontSize = "0.7rem";
      const precipitation = isLoggedIn
        ? data.precipitation_prob
        : data.precipitation;
      const precipitationUnit = isLoggedIn ? "%" : " mm";
      precip.innerHTML = `<i class="bi bi-droplet-fill text-info"></i> ${forecastValue(precipitation)}${precipitationUnit}`;

      cardBody.appendChild(title);
      cardBody.appendChild(icon);
      cardBody.appendChild(temps);
      cardBody.appendChild(precip);
      card.appendChild(cardBody);

      if (isLoggedIn && day !== "Today") {
        card.setAttribute("tabindex", "0");
        card.setAttribute("data-bs-toggle", "popover");
        card.setAttribute("data-bs-trigger", "hover focus");
        card.setAttribute("data-bs-placement", "bottom");
        card.setAttribute("data-bs-html", "true");
        card.setAttribute(
          "data-bs-title",
          `<strong>${escapeHtml(day)}'s Detailed Forecast</strong>`,
        );

        card.setAttribute(
          "data-bs-content",
          `
                <div class="text-body">
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-wind"></i> Wind</span> <strong>${forecastValue(data.wind_speed)} km/h ${forecastValue(data.wind_direction)}</strong></div>
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-droplet-half"></i> Humidity</span> <strong>${forecastValue(data.humidity)}%</strong></div>
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-speedometer2"></i> Pressure</span> <strong>${forecastValue(data.pressure)} hPa</strong></div>
                    <div class="d-flex justify-content-between"><span><i class="bi bi-sun"></i> UV Index</span> <strong>${forecastValue(data.uv_index)}</strong></div>
                </div>
            `,
        );
      } else if (day === "Today") {
        card.classList.add("border-primary", "border-2");
      }

      if (!isLoggedIn) {
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `${day} forecast. Sign in to see more.`);
        card.style.cursor = "pointer";
        card.addEventListener("click", openLoginModal);
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLoginModal();
          }
        });
      }

      col.appendChild(card);
      forecastContainer.appendChild(col);
    });

    renderWeatherCalendar(calendarData, isLoggedIn);

    if (isLoggedIn) {
      const popoverTriggerList = document.querySelectorAll(
        '[data-bs-toggle="popover"]',
      );
      const popoverList = [...popoverTriggerList].map(
        (popoverTriggerEl) =>
          new bootstrap.Popover(popoverTriggerEl, {
            sanitize: false,
          }),
      );
    }
  } catch (error) {
    const err = normalizeWeatherError(error);
    updateCurrentWeather(null);
    forecastContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger mb-0">${escapeHtml(err.error)}</div></div>`;
    if (calendarEl) {
      calendarEl.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(err.error)}</div>`;
    }
    showMsg("danger", err.error);
  }
}

let weatherCalendar = null;

function renderWeatherCalendar(weatherData, isLoggedIn) {
  const colorScheme = localStorage.getItem("SCThemeIsDark") || "light";

  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  if (!window.FullCalendar) {
    const message =
      "FullCalendar could not be loaded. Please check the CDN links / your internet connection.";
    calendarEl.innerHTML =
      `<div class="alert alert-warning mb-0">${message}</div>`;
    showMsg("warning", message);
    return;
  }

  if (weatherCalendar) weatherCalendar.destroy();

  const popoverList = new Map();
  const invalidForecasts = [];
  const events = weatherData.flatMap((forecast, index) => {
    if (!forecast || typeof forecast !== "object" || Array.isArray(forecast)) {
      invalidForecasts.push({ index, forecast });
      return [];
    }

    const dateValue = forecast.date ?? forecast.start;
    const date = moment(dateValue);
    if (!date.isValid()) {
      invalidForecasts.push({ index, forecast });
      return [];
    }

    const title = [
      forecast.location,
      forecast.weather_type,
      forecast.temp_min == null ? null : `${forecast.temp_min}\u00B0`,
      forecast.temp_max == null ? null : `${forecast.temp_max}\u00B0`,
    ]
      .filter((value) => value != null && value !== "")
      .join(" \u00B7 ");

    return [{
      ...(forecast.ID == null ? {} : { id: String(forecast.ID) }),
      title: title || "Forecast",
      start: date.format("YYYY-MM-DD"),
      backgroundColor: weatherStyle(forecast.weather_type).hex,
      borderColor: weatherStyle(forecast.weather_type).hex,
      textColor: weatherStyle(forecast.weather_type).txt,
      extendedProps: { forecast },
    }];
  });

  weatherCalendar = new FullCalendar.Calendar(calendarEl, {
    colorScheme: colorScheme,
    initialView: "dayGridMonth",
    initialDate: events.length
      ? events[0].start
      : moment().format("YYYY-MM-DD"),
    timeZone: "local",
    firstDay: 1,
    fixedWeekCount: false,
    dayMaxEvents: false,
    displayEventTime: false,
    height: "auto",
    headerToolbar: { left: "prev,next today", center: "title", right: "" },
    editable: false,
    selectable: false,
    eventStartEditable: false,
    eventDurationEditable: false,
    events,
    eventClick: (info) => {
      info.jsEvent.preventDefault();
      if (!isLoggedIn) openLoginModal();
    },
    eventDidMount: (info) => {
      if (!isLoggedIn) return;
      const forecast = info.event.extendedProps.forecast;
      const content = `<div class="text-body">${Object.entries(forecast)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
          const displayValue =
            value === null
              ? "\u2014"
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value);
          return `<div class="d-flex justify-content-between gap-3 mb-1"><span>${escapeHtml(key)}</span><strong>${escapeHtml(displayValue)}</strong></div>`;
        })
        .join("")}</div>`;
      const popover = new bootstrap.Popover(info.el, {
        title: info.event.title,
        content,
        container: "body",
        trigger: "hover",
        placement: "auto",
        html: true,
        sanitize: false,
      });
      popoverList.set(info.el, popover);
    },
    eventWillUnmount: (info) => {
      popoverList.get(info.el)?.dispose();
      popoverList.delete(info.el);
    },
  });

  weatherCalendar.render();

  if (invalidForecasts.length) {
    const message = `${invalidForecasts.length} calendar forecast(s) could not be placed because they have no valid date.`;
    const warning = document.createElement("div");
    warning.className = "alert alert-warning mt-3 mb-0";
    warning.textContent = message;
    const details = document.createElement("ul");
    details.className = "mb-0 mt-2";
    invalidForecasts.forEach(({ index, forecast }) => {
      const item = document.createElement("li");
      item.textContent = `Record ${index + 1}: ${JSON.stringify(forecast)}`;
      details.appendChild(item);
    });
    warning.appendChild(details);
    calendarEl.appendChild(warning);
    showMsg("warning", message);
  }
}

const DATETIME_FORMAT = "YYYY-MM-DD";

// Fast stuff cuz I'm lazy
const $ = (id) => document.getElementById(id);
const to1 = (n) => Number(n).toFixed(1);
const int10 = (n) => Math.round(Number(n));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (obj) => JSON.parse(JSON.stringify(obj));

function escapeHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

const ICON_EDIT = '<i class="bi bi-pencil"></i>';
const ICON_TRASH = '<i class="bi bi-trash3"></i>';
// Coloring weather for big table
const WEATHER_STYLES = [
  ["thunderstorm", "#6610f2", "#ffffff"],
  ["partly cloudy", "#7cb7e8", "#212529"],
  ["snow", "#ced4da", "#212529"],
  ["sleet", "#adb5bd", "#212529"],
  ["fog", "#868e96", "#ffffff"],
  ["shower", "#1f7ae0", "#ffffff"],
  ["drizzle", "#4d94f0", "#ffffff"],
  ["rain", "#0d6efd", "#ffffff"],
  ["wind", "#0ca678", "#ffffff"],
  ["overcast", "#6c757d", "#ffffff"],
  ["cloud", "#9aa5b1", "#212529"],
  ["sun", "#f0b429", "#212529"],
  ["clear", "#f0b429", "#212529"],
];
function weatherStyle(type) {
  const t = String(type || "").toLowerCase();
  const hit = WEATHER_STYLES.find(([key]) => t.includes(key));
  return hit
    ? { hex: hit[1], txt: hit[2] }
    : { hex: "#5b6b79", txt: "#ffffff" };
}

// Mapping and converting data
function payloadToRow(dta) {
  return {
    date: dta.date,
    location: dta.loc,
    temp_min: dta.tMin,
    temp_max: dta.tMax,
    weather_type: dta.weaType,
    precipitation: dta.prec,
    precipitation_prob: dta.precProb,
    wind_speed: dta.windSpeed,
    wind_direction: dta.windDir,
    humidity: dta.humid,
    pressure: dta.press,
    uv_index: dta.uv,
  };
}

function rowToPayload(r) {
  return {
    date: moment(r.date).format(DATETIME_FORMAT),
    loc: r.location ?? "",
    tMin: Number(r.temp_min),
    tMax: Number(r.temp_max),
    weaType: r.weather_type ?? "",
    prec: Number(r.precipitation),
    precProb: Math.round(Number(r.precipitation_prob)),
    windSpeed: Number(r.wind_speed),
    windDir: r.wind_direction ?? "N",
    humid: Math.round(Number(r.humidity)),
    press: Number(r.pressure),
    uv: Number(r.uv_index),
  };
}

function normalizeRows(rows) {
  return rows.map((r) => ({
    ID: Number(r.ID),
    date: r.date,
    location: r.location ?? "",
    temp_min: Number(r.temp_min),
    temp_max: Number(r.temp_max),
    weather_type: r.weather_type ?? "",
    precipitation: Number(r.precipitation),
    precipitation_prob: Number(r.precipitation_prob),
    wind_speed: Number(r.wind_speed),
    wind_direction: r.wind_direction ?? "",
    humidity: Number(r.humidity),
    pressure: Number(r.pressure),
    uv_index: Number(r.uv_index),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

function initAdminForecasts() {
  // I hate this
  const searchInput = document.getElementById("searchInput");
  const newBtn = document.getElementById("newBtn");
  const countBadge = document.getElementById("countBadge");
  const tbody = document.getElementById("forecastTableBody");
  const pagination = document.querySelector("#forecastPagination .pagination");
  const paginationNav = document.getElementById("forecastPagination");
  const calendarEl = document.getElementById("calendar");
  const modalEl = document.getElementById("forecastModal");
  const form = document.getElementById("forecastForm");
  const modalTitle = document.getElementById("forecastModalTitle");
  const fId = document.getElementById("fId");
  const fDate = document.getElementById("fDate");
  const fLoc = document.getElementById("fLoc");
  const fTMin = document.getElementById("fTMin");
  const fTMax = document.getElementById("fTMax");
  const fWeaType = document.getElementById("fWeaType");
  const fPrec = document.getElementById("fPrec");
  const fPrecProb = document.getElementById("fPrecProb");
  const fWindSpeed = document.getElementById("fWindSpeed");
  const fWindDir = document.getElementById("fWindDir");
  const fHumid = document.getElementById("fHumid");
  const fPress = document.getElementById("fPress");
  const fUv = document.getElementById("fUv");
  const sameDayHint = document.getElementById("sameDayHint");
  const deleteBtn = document.getElementById("deleteBtn");
  const saveBtn = document.getElementById("saveBtn");

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  let forecasts = [];
  let calendar = null;
  let currentPage = 1;
  const pageSize = 10;
  let armedBtn = null;
  let armedTimer = null;

  function armConfirm(btn, action) {
    if (btn === armedBtn) {
      disarmConfirm();
      action();
      return;
    }
    disarmConfirm();
    armedBtn = btn;
    btn.dataset.origHtml = btn.innerHTML;
    btn.classList.replace("btn-outline-danger", "btn-danger");
    btn.innerHTML = "Confirm delete?";
    armedTimer = setTimeout(disarmConfirm, 3500);
  }

  function disarmConfirm() {
    if (armedTimer) {
      clearTimeout(armedTimer);
      armedTimer = null;
    }
    if (armedBtn) {
      armedBtn.innerHTML = armedBtn.dataset.origHtml || "Delete";
      armedBtn.classList.replace("btn-danger", "btn-outline-danger");
      delete armedBtn.dataset.origHtml;
      armedBtn = null;
    }
  }

  function renderAll() {
    renderTable();
    syncCalendar();
  }

  function dateCellHtml(r) {
    const m = moment(r.date);
    const main = m.format("MMM D, YYYY");
    const sub = m.format("HH:mm");
    const tip =
      r.created_at && r.updated_at
        ? ` title="Created: ${escapeHtml(moment(r.created_at).format("MMM D, YYYY HH:mm"))} &#10;Updated: ${escapeHtml(moment(r.updated_at).format("MMM D, YYYY HH:mm"))}"`
        : "";
    return `<td${tip}><div class="fw-semibold">${main}</div></td>`;
  }

  function rowHtml(r) {
    const w = weatherStyle(r.weather_type);
    return `<tr>
      ${dateCellHtml(r)}
      <td class="fw-semibold">${escapeHtml(r.location)}</td>
      <td><span class="badge rounded-pill wx-chip" style="background-color:${w.hex};color:${w.txt}">${escapeHtml(r.weather_type || "-")}</span></td>
      <td class="text-nowrap">${to1(r.temp_min)} &deg;C</td>
      <td class="text-nowrap">${to1(r.temp_max)} &deg;C</td>
      <td class="text-nowrap">${to1(r.precipitation)} mm</td>
      <td>${int10(r.precipitation_prob)}&nbsp;%</td>
      <td class="text-nowrap">${to1(r.wind_speed)} km/h ${escapeHtml(r.wind_direction)}</td>
      <td>${int10(r.humidity)}&nbsp;%</td>
      <td class="text-nowrap">${to1(r.pressure)} hPa</td>
      <td>${to1(r.uv_index)}</td>
      <td class="text-end text-nowrap">
        <button type="button" class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${r.ID}" title="Edit forecast">${ICON_EDIT}<span class="d-none d-md-inline ms-1">Edit</span></button>
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${r.ID}" title="Delete forecast">${ICON_TRASH}<span class="d-none d-md-inline ms-1">Delete</span></button>
      </td>
    </tr>`;
  }

  function infoRowHtml(message, btnHtml) {
    return `<tr><td colspan="12" class="text-center py-5">
      <p class="text-body-secondary mb-2">${message}</p>${btnHtml || ""}
    </td></tr>`;
  }

  function renderTable() {
    const q = searchInput.value.trim().toLowerCase();
    const sorted = [...forecasts].sort(
      (a, b) =>
        moment(b.date).valueOf() - moment(a.date).valueOf() ||
        String(b.location).localeCompare(String(a.location)),
    );
    const rows = q
      ? sorted.filter(
          (r) =>
            r.location.toLowerCase().includes(q) ||
            r.weather_type.toLowerCase().includes(q),
        )
      : sorted;

    countBadge.textContent = String(rows.length);

    if (rows.length) {
      const pageCount = Math.ceil(rows.length / pageSize);
      currentPage = Math.min(currentPage, pageCount);
      const start = (currentPage - 1) * pageSize;
      tbody.innerHTML = rows
        .slice(start, start + pageSize)
        .map(rowHtml)
        .join("");
      paginationNav.classList.toggle("d-none", pageCount <= 1);
      pagination.innerHTML = Array.from({ length: pageCount }, (_, index) => {
        const page = index + 1;
        const active = page === currentPage;
        return `<li class="page-item${active ? " active" : ""}">
          <button type="button" class="page-link" data-page="${page}"${active ? ' aria-current="page"' : ""}>${page}</button>
        </li>`;
      }).join("");
    } else if (forecasts.length) {
      tbody.innerHTML = infoRowHtml("No forecasts match your search.", "");
      paginationNav.classList.add("d-none");
    } else {
      tbody.innerHTML = infoRowHtml(
        "No forecasts yet.",
        '<button type="button" class="btn btn-sm btn-outline-primary" data-action="create">Create your first forecast</button>',
      );
      paginationNav.classList.add("d-none");
    }
  }

  function onPaginationClick(e) {
    const button = e.target.closest("[data-page]");
    if (!button) return;
    currentPage = Number(button.dataset.page);
    renderTable();
  }

  function initCalendar() {
    colorScheme = localStorage.getItem("SCThemeIsDark") || "light";
    if (!window.FullCalendar) {
      const message =
        "FullCalendar could not be loaded. Please check the CDN links / your internet connection.";
      calendarEl.innerHTML =
        `<div class="alert alert-warning mb-0">${message}</div>`;
      showMsg("warning", message);
      return;
    }
    calendar = new FullCalendar.Calendar(calendarEl, {
      colorScheme: colorScheme,
      initialView: "dayGridMonth",
      timeZone: "local",
      firstDay: 1,
      fixedWeekCount: false,
      dayMaxEvents: true,
      displayEventTime: false,
      height: "auto",
      headerToolbar: { left: "prev,next today", center: "title", right: "" },
      dateClick: (info) => openCreate(`${info.dateStr}T00:00`),
      eventClick: (info) => {
        info.jsEvent.preventDefault();
        const row = forecasts.find((f) => f.ID === Number(info.event.id));
        if (row) openEdit(row);
      },
      eventMouseEnter: (info) => {
        const r = forecasts.find((f) => f.ID === Number(info.event.id));
        if (r)
          info.el.title = `${r.location} \u00B7 ${r.weather_type} \u00B7 Min ${to1(r.temp_min)}\u00B0 / Max ${to1(r.temp_max)}\u00B0 \u00B7 ${int10(r.precipitation_prob)} % precipitation chance`;
      },
    });
    calendar.render();
  }

  function syncCalendar() {
    if (!calendar) return;
    calendar.setOption(
      "events",
      forecasts.map((r) => {
        const st = weatherStyle(r.weather_type);
        return {
          id: String(r.ID),
          title: `${r.location} \u00B7 ${to1(r.temp_min)}\u00B0 / ${to1(r.temp_max)}\u00B0`,
          start: moment(r.date).format("YYYY-MM-DD"),
          backgroundColor: st.hex,
          borderColor: st.hex,
          textColor: st.txt,
        };
      }),
    );
  }

  function upsertLocal(row) {
    const i = forecasts.findIndex((r) => r.ID === row.ID);
    if (i >= 0) forecasts[i] = { ...forecasts[i], ...row };
    else forecasts.push(row);
    renderAll();
  }

  function removeLocal(id) {
    forecasts = forecasts.filter((r) => r.ID !== id);
    renderAll();
  }

  async function loadForecasts() {
    tbody.innerHTML = infoRowHtml(
      '<span class="spinner-border spinner-border-sm me-2"></span>Loading forecasts&hellip;',
      "",
    );
    try {
      const raw = await fetchForecasts();
      const list = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
          ? raw.data
          : [];
      forecasts = normalizeRows(list);
      renderAll();
    } catch (error) {
      const err = normalizeWeatherError(error);
      forecasts = [];
      renderAll();
      tbody.innerHTML = infoRowHtml(
        `<span class="text-danger-emphasis">${escapeHtml(err.error)}</span>`,
        '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="retry">Try again</button>',
      );
      showMsg("danger", err.error);
    }
  }

  function setSaving(state) {
    saveBtn.disabled = state;
    if (deleteBtn) deleteBtn.disabled = state;
    saveBtn.innerHTML = state
      ? '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Saving&hellip;'
      : saveBtn.dataset.label || "Save";
  }

  function crossValidateTemps() {
    const mn = fTMin.valueAsNumber;
    const mx = fTMax.valueAsNumber;
    if (!Number.isNaN(mn) && !Number.isNaN(mx) && mx < mn) {
      fTMax.setCustomValidity(
        "Max temperature must be greater than or equal to the minimum.",
      );
    } else {
      fTMax.setCustomValidity("");
    }
  }

  function updateSameDayHint() {
    const val = fDate.value;
    if (!val) {
      sameDayHint.classList.add("d-none");
      sameDayHint.innerHTML = "";
      return;
    }
    const day = val.slice(0, 10);
    const others = forecasts.filter(
      (r) =>
        moment(r.date).format("YYYY-MM-DD") === day &&
        String(r.ID) !== fId.value,
    );
    if (!others.length) {
      sameDayHint.classList.add("d-none");
      sameDayHint.innerHTML = "";
      return;
    }
    sameDayHint.innerHTML =
      '<div class="text-body-secondary mb-1">Already planned for this day:</div>' +
      others
        .map((r) => {
          const w = weatherStyle(r.weather_type);
          return (
            `<button type="button" class="btn btn-outline-secondary me-1 mb-1" data-goto-id="${r.ID}"` +
            ` title="${escapeHtml(r.weather_type)}">` +
            `<span class="badge rounded-pill me-1" style="background-color:${w.hex};color:${w.txt}">&nbsp;</span>` +
            `${escapeHtml(r.location)} \u00B7 ${to1(r.temp_min)}\u00B0/${to1(r.temp_max)}\u00B0` +
            `</button>`
          );
        })
        .join("");
    sameDayHint.classList.remove("d-none");
  }

  function openCreate(prefillDate) {
    form.reset();
    form.classList.remove("was-validated");
    fTMax.setCustomValidity("");
    fId.value = "";
    fDate.value = prefillDate || moment().format("YYYY-MM-DDTHH:mm");
    fWindDir.value = "N";
    fPrec.value = "0";
    fPrecProb.value = "0";
    fWindSpeed.value = "0";
    modalTitle.textContent = "New forecast";
    if (deleteBtn) deleteBtn.classList.add("d-none");
    saveBtn.dataset.label = "Create forecast";
    setSaving(false);
    updateSameDayHint();
    modal.show();
  }

  function openEdit(row) {
    form.reset();
    form.classList.remove("was-validated");
    fTMax.setCustomValidity("");
    const p = rowToPayload(row);
    fId.value = row.ID;
    fDate.value = moment(p.date).format("YYYY-MM-DD");
    fLoc.value = p.loc;
    fTMin.value = p.tMin;
    fTMax.value = p.tMax;
    fWeaType.value = p.weaType;
    fPrec.value = p.prec;
    fPrecProb.value = p.precProb;
    fWindSpeed.value = p.windSpeed;
    fWindDir.value = p.windDir;
    fHumid.value = p.humid;
    fPress.value = p.press;
    fUv.value = p.uv;
    modalTitle.textContent = `Edit forecast #${row.ID}`;
    if (deleteBtn) deleteBtn.classList.remove("d-none");
    saveBtn.dataset.label = "Save changes";
    setSaving(false);
    updateSameDayHint();
    modal.show();
  }

  function collectPayload() {
    return {
      date: moment(fDate.value).format(DATETIME_FORMAT),
      loc: fLoc.value.trim(),
      tMin: parseFloat(fTMin.value),
      tMax: parseFloat(fTMax.value),
      weaType: fWeaType.value.trim(),
      prec: parseFloat(fPrec.value),
      precProb: parseInt(fPrecProb.value, 10),
      windSpeed: parseFloat(fWindSpeed.value),
      windDir: fWindDir.value,
      humid: parseInt(fHumid.value, 10),
      press: parseFloat(fPress.value),
      uv: parseFloat(fUv.value),
    };
  }

  function onTableClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "edit") {
      const row = forecasts.find((f) => f.ID === Number(btn.dataset.id));
      if (row) openEdit(row);
    } else if (action === "delete") {
      const id = Number(btn.dataset.id);
      armConfirm(btn, async () => {
        try {
          const response = await deleteForecast(id);
          removeLocal(id);
          showMsg("success", response.message);
        } catch (error) {
          const err = normalizeWeatherError(error);
          showMsg("danger", err.error);
        }
      });
    } else if (action === "create") {
      openCreate();
    } else if (action === "retry") {
      loadForecasts();
    }
  }

  async function onFormSubmit(e) {
    e.preventDefault();
    crossValidateTemps();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const id = fId.value ? Number(fId.value) : null;
    const payload = collectPayload();
    setSaving(true);
    try {
      const response = id
        ? await updateForecast(id, payload)
        : await createForecast(payload);
      upsertLocal(normalizeRows([response])[0]);
      modal.hide();
      showMsg("success", response.message);
      loadForecasts();
      renderAll();
    } catch (error) {
      const err = normalizeWeatherError(error);
      showMsg("danger", err.error);
    } finally {
      setSaving(false);
      form.classList.remove("was-validated");
    }
  }

  function onDeleteFromModal() {
    const id = Number(fId.value);
    if (!id) return;
    armConfirm(deleteBtn, async () => {
      setSaving(true);
      try {
        const response = await deleteForecast(id);
        modal.hide();
        removeLocal(id);
        showMsg("success", response.message);
      } catch (error) {
        const err = normalizeWeatherError(error);
        showMsg("danger", err.error);
      } finally {
        setSaving(false);
      }
    });
  }

  function initAllComponents() {
    initCalendar();

    newBtn.addEventListener("click", () => openCreate());
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      renderTable();
    });
    pagination.addEventListener("click", onPaginationClick);
    tbody.addEventListener("click", onTableClick);

    form.addEventListener("submit", onFormSubmit);
    if (deleteBtn) deleteBtn.addEventListener("click", onDeleteFromModal);
    fDate.addEventListener("change", updateSameDayHint);
    fTMin.addEventListener("input", crossValidateTemps);
    fTMax.addEventListener("input", crossValidateTemps);

    sameDayHint.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-goto-id]");
      if (!chip) return;
      const row = forecasts.find((f) => f.ID === Number(chip.dataset.gotoId));
      if (row) openEdit(row);
    });

    modalEl.addEventListener("hidden.bs.modal", disarmConfirm);
    modalEl.addEventListener("shown.bs.modal", () => fLoc.focus());

    loadForecasts();
  }

  initAllComponents();
}

// REQUESTS -----------

// Get all forecasts -------------------------------------------------
async function fetchForecasts() {
  const response = await fetch(`http://localhost:3000/forecast/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      luid: loadUser().ID,
    }),
  });
  return await getForecastResponse(response);
}

// Create a forecast --------------------------------------------
async function createForecast(data) {
  console.log(data);
  const response = await fetch(`http://localhost:3000/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      luid: loadUser().ID,
      data,
    }),
  });
  return await getForecastResponse(response);
}

// Update a forecast ---------------------------------------------
async function updateForecast(id, data) {
  console.log(id);
  const response = await fetch(`http://localhost:3000/forecast`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      luid: loadUser().ID,
      forecastID: id,
      data,
    }),
  });
  return await getForecastResponse(response);
}

// Delete forecast ---------------------------------------------------
async function deleteForecast(id) {
  const response = await fetch(`http://localhost:3000/forecast`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      luid: loadUser().ID,
      forecastID: id,
    }),
  });
  return await getForecastResponse(response);
}

// Get forecast calendar for user ---------------------------------------------------
async function getUserForecastCalendar(location) {
  const response = await fetch(`http://localhost:3000/forecast/user/calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      luid: loadUser().ID,
      location
    }),
  });
  return await getForecastResponse(response);
}

// Get forecast for user ---------------------------------------------------
async function getUserForecast(location, datetime) {
  const response = await fetch(`http://localhost:3000/forecast/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      luid: loadUser().ID,
      datetime,
      location
    }),
  });
  return await getForecastResponse(response);
}

async function getGuestForecast(location, datetime) {
  const response = await fetch(`http://localhost:3000/forecast/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ datetime, location }),
  });
  return await getForecastResponse(response);
}

async function getGuestForecastCalendar(location) {
  const response = await fetch(`http://localhost:3000/forecast/guest/calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ location }),
  });
  return await getForecastResponse(response);
}

async function getForecastResponse(response) {
  const result = await response.json();
  if (response.status !== 200) throw result;
  return result;
}