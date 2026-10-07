function getWeatherIcon(type) {
    switch(type) {
        case 'sunny': return 'bi-sun-fill text-warning';
        case 'cloudy': return 'bi-cloud-fill text-secondary';
        case 'rainy': return 'bi-cloud-rain-fill text-primary';
        default: return 'bi-cloud-fill text-secondary';
    }
}

function loadWeather(isLoggedIn) {
    const forecastContainer = document.getElementById('forecast-container');

    const weatherData = [
        { day: "Today", min: 12, max: 18, type: "cloudy", precip: 10, wind: 18, windDir: "NW", hum: 65, pres: 1013, uv: 5 },
        { day: "Tue", min: 14, max: 21, type: "sunny", precip: 0, wind: 12, windDir: "W", hum: 50, pres: 1015, uv: 7 },
        { day: "Wed", min: 13, max: 19, type: "rainy", precip: 80, wind: 25, windDir: "SW", hum: 85, pres: 1008, uv: 2 },
        { day: "Thu", min: 10, max: 16, type: "rainy", precip: 60, wind: 30, windDir: "S", hum: 80, pres: 1005, uv: 3 },
        { day: "Fri", min: 11, max: 17, type: "cloudy", precip: 20, wind: 15, windDir: "NE", hum: 70, pres: 1010, uv: 4 },
        { day: "Sat", min: 15, max: 22, type: "sunny", precip: 0, wind: 8, windDir: "E", hum: 45, pres: 1018, uv: 8 },
        { day: "Sun", min: 14, max: 20, type: "cloudy", precip: 15, wind: 10, windDir: "N", hum: 55, pres: 1012, uv: 6 }
    ];

    weatherData.forEach((data, index) => {
        const col = document.createElement('div');
        col.className = 'col';


        const card = document.createElement('div');
        card.className = 'card h-100 bg-body border-secondary-subtle text-center compact-card';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex flex-column align-items-center justify-content-center';

        const title = document.createElement('h6');
        title.className = 'card-title text-body fw-bold mb-1';
        title.style.fontSize = '0.85rem';
        title.textContent = data.day;

        const icon = document.createElement('i');
        icon.className = `bi ${getWeatherIcon(data.type)} fs-3 mb-1`;

        const temps = document.createElement('div');
        temps.className = 'mb-1';
        temps.innerHTML = `
            <span class="text-danger fw-bold" style="font-size: 0.9rem">${data.max}°</span>
            <span class="text-body-secondary mx-1" style="font-size: 0.7rem">/</span>
            <span class="text-primary fw-bold" style="font-size: 0.9rem">${data.min}°</span>
        `;

        const precip = document.createElement('small');
        precip.className = 'text-body-secondary d-block';
        precip.style.fontSize = '0.7rem';
        precip.innerHTML = `<i class="bi bi-droplet-fill text-info"></i> ${data.precip}%`;

        cardBody.appendChild(title);
        cardBody.appendChild(icon);
        cardBody.appendChild(temps);
        cardBody.appendChild(precip);
        card.appendChild(cardBody);

        if (data.day !== 'Today' && isLoggedIn == true) {
            card.setAttribute('tabindex', '0');
            card.setAttribute('data-bs-toggle', 'popover');
            card.setAttribute('data-bs-trigger', 'hover focus');
            card.setAttribute('data-bs-placement', 'bottom');
            card.setAttribute('data-bs-html', 'true');
            card.setAttribute('data-bs-title', `<strong>${data.day}'s Detailed Forecast</strong>`);
            
            card.setAttribute('data-bs-content', `
                <div class="text-body">
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-wind"></i> Wind</span> <strong>${data.wind} km/h ${data.windDir}</strong></div>
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-droplet-half"></i> Humidity</span> <strong>${data.hum}%</strong></div>
                    <div class="d-flex justify-content-between mb-1"><span><i class="bi bi-speedometer2"></i> Pressure</span> <strong>${data.pres} hPa</strong></div>
                    <div class="d-flex justify-content-between"><span><i class="bi bi-sun"></i> UV Index</span> <strong>${data.uv}</strong></div>
                </div>
            `);
        } else {
            card.classList.add('border-primary', 'border-2');
        }

        col.appendChild(card);
        forecastContainer.appendChild(col);
    });
    
    if (isLoggedIn) {
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl, {
            sanitize: false
        }));
        renderWeatherCalendar(weatherData);
    }
}

function renderWeatherCalendar(results) {
    var calendarEl = document.getElementById('calendar');

    colorScheme = localStorage.getItem('SCThemeIsDark') || 'light';

    /*
    let myEvents = results.map((results => {
        return {
            title: results.step_count + ' steps',
            start: results.date,
        }
    }));
    */

    var calendar = new FullCalendar.Calendar(calendarEl, {
        colorScheme: 'dark',
        initialDate: new Date(),
        initialView: 'dayGridMonth',
        nowIndicator: true,
        headerToolbar: {
            left: 'prevYear,prev,next,nextYear today',
            center: 'title',
            right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        navLinks: true, // can click day/week names to navigate views
        editable: false,
        selectable: false,
        selectMirror: true,
        dayMaxEvents: true, // allow "more" link when too many events
        events: [
        {
          title: 'All Day Event',
          start: '2023-01-01',
        },
        {
          title: 'Long Event',
          start: '2023-01-07',
          end: '2023-01-10'
        },
        {
          groupId: 999,
          title: 'Repeating Event',
          start: '2023-01-09T16:00:00'
        },
        {
          groupId: 999,
          title: 'Repeating Event',
          start: '2023-01-16T16:00:00'
        },
        {
          title: 'Conference',
          start: '2023-01-11',
          end: '2023-01-13'
        },
        {
          title: 'Meeting',
          start: '2023-01-12T10:30:00',
          end: '2023-01-12T12:30:00'
        },
        {
          title: 'Lunch',
          start: '2023-01-12T12:00:00'
        },
        {
          title: 'Meeting',
          start: '2023-01-12T14:30:00'
        },
        {
          title: 'Happy Hour',
          start: '2023-01-12T17:30:00'
        },
        {
          title: 'Dinner',
          start: '2023-01-12T20:00:00'
        },
        {
          title: 'Birthday Party',
          start: '2023-01-13T07:00:00'
        },
        {
          title: 'Click for Google',
          url: 'http://google.com/',
          start: '2023-01-28'
        }
      ],
    });

    calendar.render();
}