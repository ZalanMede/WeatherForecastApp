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

async function getAllUsers(){
    let userID = loadUser() ? loadUser().ID : 0;
    document.querySelector("tbody").innerHTML = "";

    const response = await fetch("http://localhost:3000/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({luid: userID}),
    });

    if (response.status != 200) {
        const res = await response.json();
        showMsg("danger", "Error!", res.error);
    } else {
        const users = await response.json(); 
        users.forEach(element => addUserRowToTableBody(element));
    }
}

async function changeActiveStatus(el){
    const userID = el.currentTarget.parentElement.parentElement.parentElement.children[0].innerHTML;
    let loadedUserID = loadUser() ? loadUser().ID : 0;
    
    const response = await fetch("http://localhost:3000/admin/status", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            uid: userID,
            luid: loadedUserID,
        }),
    });

    if (response.status != 200) {
        const res = await response.json();
        showMsg("danger", "Error!", res.error);
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

// -- Row generation functions --
// User row generation
function addUserRowToTableBody(element){
    // Holder
    const newDataRow = document.createElement("tr");

    // ID
    const rowId = document.createElement("th");
    rowId.scope = "row";
    rowId.innerHTML = element.ID;

    newDataRow.appendChild(rowId);

    // Name
    const rowName = document.createElement("td");
    rowName.innerHTML = element.name;

    newDataRow.appendChild(rowName);

    // Email
    const rowEmail = document.createElement("td");
    rowEmail.innerHTML = element.email;

    newDataRow.appendChild(rowEmail);

    // Role
    const rowBadge = document.createElement("td");

    const rowBadgeSpan = document.createElement("span");
    rowBadgeSpan.classList.add("badge", "rounded-pill");
    switch (element.role) {
        case "user":
            rowBadgeSpan.classList.add("text-bg-success");
            break;
        case "admin":
            rowBadgeSpan.classList.add("text-bg-primary");
            break;
        default:
            break;
    }
    rowBadgeSpan.innerHTML = element.role;
    rowBadge.appendChild(rowBadgeSpan);

    newDataRow.appendChild(rowBadge);

    // Updated at
    const rowLastEdit = document.createElement("td");
    rowLastEdit.innerHTML = element.updated_at ? moment(element.updated_at).fromNow() : never;

    newDataRow.appendChild(rowLastEdit);

    // Created at
    const rowCreated = document.createElement("td");
    rowCreated.innerHTML = moment(element.created_at).format("YYYY.MM.DD - H:m");

    newDataRow.appendChild(rowCreated);

    // Active Switch
    const rowActive = document.createElement("td");
    
    const activeSwitchDiv = document.createElement("div");
    activeSwitchDiv.classList.add("form-check", "form-switch");

    const activeSwitchInput = document.createElement("input");
    activeSwitchInput.classList.add("form-check-input");
    activeSwitchInput.type = "checkbox";
    activeSwitchInput.role = "switch";
    activeSwitchInput.checked = element.is_active == 1 ? true : false;
    if (element.ID == loadUser().ID) {
        activeSwitchInput.disabled = true;
    } else {
    activeSwitchInput.addEventListener('change', (el) => {changeActiveStatus(el);});
    }

    activeSwitchDiv.appendChild(activeSwitchInput);
    rowActive.appendChild(activeSwitchDiv);

    newDataRow.appendChild(rowActive);

    // Buttons
    const rowOperations = document.createElement("td");

    const operationsHolder = document.createElement("div");
    operationsHolder.classList.add("row", "hasHoverOnChildBtn");
    let isDisabled = element.ID == loadUser().ID ? "disabled" : "";
    operationsHolder.innerHTML = `<button type="button" class="btn btn-primary col-3 mx-2" ${isDisabled} data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="setModalUserData(this, \'info\')" title="Show sensitive information"><i class="bi bi-info-circle"></i></button> <button type="button" class="btn btn-warning col-3 mx-2" data-bs-toggle="modal" data-bs-target="#exampleModal" ${isDisabled} onclick="setModalUserData(this, \'edit\')"><i class="bi bi-pencil-fill"></i></button> <button type="button" class="btn btn-danger col-3 mx-2" data-bs-toggle="modal" data-bs-target="#exampleModal" ${isDisabled} onclick="setModalUserData(this, \'delete\')"><i class="bi bi-trash3-fill"></i></button>`
    rowOperations.appendChild(operationsHolder);

    newDataRow.appendChild(rowOperations);

    // -- Add to tbody --
    document.querySelector("tbody").appendChild(newDataRow);
}

// Modal


async function deleteUser(el) {
    const userID = el.currentTarget.parentElement.parentElement.parentElement.children[0].innerHTML;
    let loadedUserID = loadUser() ? loadUser().ID : 0;
    
    const response = await fetch("http://localhost:3000/admin/users", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            uid: userID,
            luid: loadedUserID,
        }),
    });

    if (response.status != 200) {
        const res = await response.json();
        showMsg("danger", "Error!", res.error);
    } else {
        const msg = await response.json();
        showMsg("success", "User deleted successfully!", msg.message);
    }
}

function editModalUser(){
    showMsg("warning", "NOPE!", "I AM NOT WILLING TO DO THIS RIGHT NOW :D");
}

async function deleteModalUser(el){
    const userID = el.currentTarget.userToChangeId;
    
    const response = await fetch(`http://localhost:3000/users/${userID}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            luid: userID,
        }),
    });

    if (response.status != 200) {
        const res = await response.json();
        showMsg("danger", "Error!", res.error);
    } else {
        const msg = await response.json();
        showMsg("success", "Deletion complete", msg.message);
        getAllUsers();
    }
}

// Set data for modal
async function setModalUserData(el, requestType) {
    const userToEditID = el.parentElement.parentElement.parentElement.children[0].innerHTML;
    const modalBody = document.querySelector("#modalInnerBody");
    const modalConfirmBtn = document.querySelector("#modalConfirmButton");
    const modalLabel = document.querySelector("#exampleModalLabel");

    try {
        modalConfirmBtn.removeEventListener("click", editModalUser);
        modalConfirmBtn.removeEventListener("click", deleteModalUser);
    } catch (error) {
        // Nothing :D
    }

    switch (requestType){
        case "info":
            modalLabel.innerHTML = "User information";
            modalConfirmBtn.innerHTML = "Close";
            modalConfirmBtn.classList.remove("btn-warning");
            modalConfirmBtn.classList.remove("btn-danger");
            modalConfirmBtn.classList.add("btn-secondary");

            const response = await fetch(`http://localhost:3000/admin/${userToEditID}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            
            if (response.status != 200) {
                const res = await response.json();
                showMsg("danger", "ERROR!", res.error)
            } else {
                const userData = await response.json();
                modalBody.innerHTML = `
                <p>ID:\t${userData.results.ID}</p>
                <p>Name:\t${userData.results.name}</p>
                <p>E-mail:\t${userData.results.email}</p>
                <p>Password:\t************************</p>
                <p>Role:\t${userData.results.role}</p>
                <p>Created at:\t${userData.results.created_at}</p>
                <p>Last information updated:\t${userData.results.updated_at}</p>
                <p>Last login:\t${userData.results.last_login}</p>
                <p>Login count:\t${userData.results.login_count}</p>
                <p>Is the user active?:\t${(userData.results.is_active == 1 ? '<i class="bi bi-check-lg"></i>' : '<i class="bi bi-ban"></i>')}</p>
                `;
            }
            break;
        case "edit":
            modalLabel.innerHTML = "Edit user information";
            modalConfirmBtn.innerHTML = "Confirm edit";
            modalConfirmBtn.classList.remove("btn-secondary");
            modalConfirmBtn.classList.remove("btn-danger");
            modalConfirmBtn.classList.add("btn-warning");

            const response1 = await fetch(`http://localhost:3000/admin/${userToEditID}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            
            if (response1.status != 200) {
                const res = await response1.json();
                showMsg("danger", "ERROR!", res.error)
            } else {
                const userData = await response1.json();
                modalBody.innerHTML = `
                <p>ID:\t${userData.results.ID}</p>
                <p>Name:\t${userData.results.name}</p>
                <p>E-mail:\t${userData.results.email}</p>
                <p>Password:\t************************</p>
                <p>Role:\t${userData.results.role}</p>
                <p>Created at:\t${userData.results.created_at}</p>
                <p>Last information updated:\t${userData.results.updated_at}</p>
                <p>Last login:\t${userData.results.last_login}</p>
                <p>Login count:\t${userData.results.login_count}</p>
                <p>Is the user active?:\t${(userData.results.is_active == 1 ? '<i class="bi bi-check-lg"></i>' : '<i class="bi bi-ban"></i>')}</p>
                `;

                modalConfirmBtn.addEventListener("click", editModalUser);
            }
            break;
        case "delete":
            modalLabel.innerHTML = "Delete user";
            modalConfirmBtn.innerHTML = "Confirm deletion";
            modalConfirmBtn.classList.remove("btn-warning");
            modalConfirmBtn.classList.remove("btn-secondary");
            modalConfirmBtn.classList.add("btn-danger");
            
            modalBody.innerHTML = "Are you sure you with to delete this user?";
            modalConfirmBtn.userToChangeId = userToEditID;
            modalConfirmBtn.addEventListener("click", deleteModalUser);
        default:
            break;
    }
}
