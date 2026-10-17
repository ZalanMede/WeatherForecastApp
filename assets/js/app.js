var html = document.documentElement;
let main = document.querySelector("main");

async function navigate(page, viewType, sleepTime = 0) {
  if (sleepTime > 0) {
    await new Promise((e) => setTimeout(e, sleepTime));
  }

  main.innerHTML = await (await fetch(`views/${viewType}/${page}.html`)).text();
  console.log(`Navigating to... ${viewType}/${page}`);
  switch (page) {
    case "home":
      loadHomeElements();
      break;
    case "weather":
      loadWeather();
      break;
    case "forecasts":
      initAdminForecasts();
      break;
    case "users":
      getAllUsers();
      break;
    default:
      console.log("NOT RUN");
      break;
  }
}

function toggleTheme() {
  let isDarkTheme = html.getAttribute("data-bs-theme") === "dark" ? true : false;
  html.setAttribute("data-bs-theme", isDarkTheme == true ? "light" : "dark");
  localStorage.setItem("SCThemeIsDark", isDarkTheme == true ? "light" : "dark");

  const icon = document.querySelector("#themeToggleBtn i");
  icon.className = isDarkTheme ? "bi bi-moon-fill" : "bi bi-sun-fill";
}

function loadTheme() {
  let isDark = localStorage.getItem("SCThemeIsDark");
  if (localStorage.getItem("SCThemeIsDark") != undefined) {
    if (isDark == "dark") {
      toggleTheme();
    }
  }
}

/* Message showing */
function showMsg(type, msg) {
  const toastMsgEl = document.getElementById("toastMsg");
  const toastEl = document.getElementById("toast");
  toastMsgEl.textContent = msg;

  toastEl.style.background = `var(--bs-${type})`

  new bootstrap.Toast(toastEl, {
    delay: 2000,
  }).show();
}

// -- Main --

loadTheme();

loginCheck()