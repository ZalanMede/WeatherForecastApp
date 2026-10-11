async function registration() {
  let name = document.querySelector("#regName").value;
  let email = document.querySelector("#regEmail").value;
  let password = document.querySelector("#regPass").value;
  let confirm = document.querySelector("#regConf").value;

  const response = await fetch("http://localhost:3000/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
      confirm,
    }),
  });

  const res = await response.json();

  if (response.status != 201) {
    showMsg("danger", res.error);
    return false;
  } else {
    showMsg("success", res.message);
    return true;
  }
}

async function login() {
  let email = document.querySelector("#logEmail").value;
  let password = document.querySelector("#logPass").value;

  const response = await fetch("http://localhost:3000/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const res = await response.json();

  if (response.status != 200) {
    showMsg("danger", res.error);
    return false;
  } else {
    showMsg("success", res.message);
    storeUser(res.loggedUser);
    loginCheck();
    return true;
  }
}

async function updateProfile() {
  let username = document.querySelector("#name").value;
  let email = document.querySelector("#email").value;
  let user = loadUser();

  const response = await fetch(`http://localhost:3000/users/${user.ID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      luid: user.ID,
    }),
  });

  const res = await response.json();

  if (response.status != 200) {
    showMsg("danger", res.error);
  } else {
    showMsg("success", res.message);
    logOut();
  }
}

async function updatePass() {
  let oldpass = document.querySelector("#oldpass").value;
  let newpass = document.querySelector("#newpass").value;
  let confirm = document.querySelector("#confirm").value;
  let user = loadUser();

  const response = await fetch(
    `http://localhost:3000/users/${user.ID}/changepass`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldpass,
        newpass,
        confirm,
        luid: user.ID,
      }),
    },
  );

  const res = await response.json();

  if (response.status != 200) {
    showMsg("danger", res.error);
  } else {
    showMsg("success", res.message);
    logOut();
  }
}

async function deleteAccount() {
  let userID = loadUser() ? loadUser().ID : 0;
  let loadedUserID = loadUser() ? loadUser().ID : 0;
    
    const response = await fetch(`http://localhost:3000/users/${userID}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            luid: loadedUserID,
        }),
    });

    if (response.status != 200) {
        const res = await response.json();
        showMsg("danger", res.error);
    } else {
        const msg = await response.json();
        showMsg("success", msg.message);
        logOut();
    }
}

function storeUser(user) {
  sessionStorage.setItem("SCU", JSON.stringify(user));
}

function loadUser() {
  let user = JSON.parse(sessionStorage.getItem("SCU"));
  return user;
}

function loginCheck() {
  if (loadUser()) {
    if (loadUser().role == "admin") {
      console.log("logged in as ADMIN");
      navigate("forecasts", "admin");
      setMenuItems("admin");
    } else {
      console.log("logged in as user");
      navigate("weather", "user");
      setMenuItems("user");
    }
  } else {
    console.log("not logged in");
    navigate("home", "guest");
    setMenuItems("guest");
  }
}

function setMenuItems(param){
    let baseMenu = document.querySelector("#baseMenu");
    let adminMenu = document.querySelector("#adminMenu");
    let userMenu = document.querySelector("#userMenu");
    let loginOn = document.querySelector("#loggedInUserCtrlEl");
    let loginOff = document.querySelector("#guestUserCtrlEl");
    let loggedInUserName = document.querySelector("#loggedInUserName");

    switch(param){
        case 'admin': {
          baseMenu.classList.add("hide");
          adminMenu.classList.remove("hide");
          userMenu.classList.remove("hide");

          loginOn.classList.remove("hide");
          loginOff.classList.add("hide");
          loggedInUserName.innerHTML = loadUser().name;
          break;
        }
        case 'user': {
          baseMenu.classList.add("hide");
          adminMenu.classList.add("hide");
          userMenu.classList.remove("hide");
          
          loginOn.classList.remove("hide");
          loginOff.classList.add("hide");
          loggedInUserName.innerHTML = loadUser().name;
          break;
        }
        default: {
          baseMenu.classList.remove("hide");
          userMenu.classList.add("hide");
          adminMenu.classList.add("hide");
          loginOn.classList.add("hide");
          loginOff.classList.remove("hide");
          loggedInUserName.innerHTML = "";
          break;
        }
    }
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var isValidLogin = await login();
  if (isValidLogin) {
    this.reset();
    bootstrap.Modal.getInstance(document.getElementById("logModal")).hide();
  }
});

document.getElementById("regForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var isValidReg = await registration();
  if (isValidReg) {
    this.reset();
    bootstrap.Modal.getInstance(document.getElementById("regModal")).hide();
  }
});

function logOut(){
    sessionStorage.clear("SCU");
    loginCheck();
}