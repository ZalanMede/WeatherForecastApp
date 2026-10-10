function generate7DayForecasts() {
  var icons = [
    "bi-sun-fill",
    "bi-cloud-sun-fill",
    "bi-cloud-fill",
    "bi-cloud-rain-fill",
    "bi-cloud-sun-fill",
    "bi-sun-fill",
    "bi-cloud-fill",
  ];
  var highs = [24, 22, 20, 18, 21, 25, 23];
  var lows = [14, 13, 12, 10, 11, 15, 13];
  var strip = document.getElementById("forecastStrip");
  var now = new Date();
  for (var i = 0; i < 7; i++) {
    var d = new Date(now);
    d.setDate(d.getDate() + i);
    var label =
      i === 0 ? "Today" : d.toLocaleDateString("en", { weekday: "short" });
    var el = document.createElement("div");
    el.className = "fc-day" + (i === 0 ? " today" : "");
    el.innerHTML =
      '<div class="dn">' +
      label +
      '</div><div style="font-size:1.15rem;margin:3px 0;color:' +
      (i === 0 ? "var(--bs-warning)" : "var(--bs-secondary-color)") +
      '"><i class="bi ' +
      icons[i] +
      '"></i></div><div class="dt">' +
      highs[i] +
      '°</div><div class="dr">' +
      lows[i] +
      "°</div>";
    strip.appendChild(el);
  }
}

function generateDummyCalendar() {
  /* The fullcalendar one is too big, does actual things, this one just needs to be there for show */
  var grid = document.getElementById("calGrid");
  var now = new Date();
  var year = now.getFullYear(),
    month = now.getMonth(),
    today = now.getDate();
  var first = new Date(year, month, 1).getDay();
  var total = new Date(year, month + 1, 0).getDate();
  var hdrs = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  hdrs.forEach(function (h) {
    var s = document.createElement("span");
    s.className = "ch";
    s.textContent = h;
    grid.appendChild(s);
  });
  for (var i = 0; i < first; i++) {
    var s = document.createElement("span");
    s.className = "cd empty";
    s.textContent = "·";
    grid.appendChild(s);
  }
  for (var d = 1; d <= total; d++) {
    var s = document.createElement("span");
    s.className = "cd";
    if (d === today) s.classList.add("act");
    else if (d < today && Math.random() > 0.25) s.classList.add("past");
    s.textContent = d;
    grid.appendChild(s);
  }
}

function loadHomeElements() {
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.15 },
  );

  document
    .querySelectorAll(".feat-card,.chart-card,.guest-card")
    .forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity .5s ease,transform .5s ease";
      observer.observe(el);
    });

  generate7DayForecasts();
  generateDummyCalendar();
}