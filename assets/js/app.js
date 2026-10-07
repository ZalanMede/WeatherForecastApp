var html = document.documentElement;
let main = document.querySelector('main');

async function navigate(page, viewType, sleepTime=0) {
    if (sleepTime > 0) {
        await new Promise(e => setTimeout(e, sleepTime));
    }

    main.innerHTML = await (await fetch(`views/${viewType}/${page}.html`)).text();
    console.log(`Navigating to... ${viewType}/${page}`);
    switch (page) {
        case "weather":
            loadWeather(viewType == "user" ? true : false);
            break;
        default:
            console.log("NOT RUN");
            break;
    }
}

function toggleTheme() {
    let isDarkTheme = (html.getAttribute('data-bs-theme') === 'dark' ? true : false);
    html.setAttribute('data-bs-theme', (isDarkTheme == true ? 'light' : 'dark'));
    localStorage.setItem('SCThemeIsDark', (isDarkTheme == true ? 'dark' : 'light'));

    const icon = document.querySelector('#themeToggleBtn i');
    icon.className = isDarkTheme ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
}

function loadTheme() {
    let isDark = localStorage.getItem('SCThemeIsDark');
    if (localStorage.getItem('SCThemeIsDark') != undefined) {
        if (isDark == 'light') {
            toggleTheme();
        }
    }
}

function logOut() {
    console.log("LOGGING OUT");
}

// -- Main --

loadTheme();

navigate('home', "guest");