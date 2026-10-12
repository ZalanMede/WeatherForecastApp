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
        showMsg("danger", res.error);
    } else {
        const users = await response.json();
        // -- Create table rows from response and add them to the tbody -- 
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
        showMsg("danger", res.error);
    }
}

async function deleteUser(el){
    const userID = el.userToChangeId;
    let loadedUserID = loadUser() ? loadUser().ID : 0;
    
    const response = await fetch(`http://localhost:3000/admin/users`, {
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
        showMsg("danger", res.error);
    } else {
        const msg = await response.json();
        showMsg("success", msg.message);
        getAllUsers();
    }
}

async function setModalUserData(el, requestType) {
    const userToEditID = el.parentElement.parentElement.parentElement.children[0].innerHTML;
    const modalBody = document.querySelector("#modalInnerBody");
    const modalConfirmBtn = document.querySelector("#modalConfirmButton");
    const modalLabel = document.querySelector("#exampleModalLabel");

    switch (requestType){
        case "info":
            modalLabel.innerHTML = "User information";
            modalConfirmBtn.classList.add("hide");

            const response = await fetch(`http://localhost:3000/admin/${userToEditID}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            
            if (response.status != 200) {
                const res = await response.json();
                showMsg("danger", res.error)
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
        case "delete":
            modalLabel.innerHTML = "Delete user";
            
            modalBody.innerHTML = "Are you sure you with to delete this user?";
            modalConfirmBtn.userToChangeId = userToEditID;
            modalConfirmBtn.classList.remove("hide");
        default:
            break;
    }
}

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
    operationsHolder.innerHTML = `<button type="button" class="btn btn-primary col-3 mx-2" ${isDisabled} data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="setModalUserData(this, \'info\')" title="Show sensitive information"><i class="bi bi-info-circle"></i></button> <button type="button" class="btn btn-danger col-3 mx-2" data-bs-toggle="modal" data-bs-target="#exampleModal" ${isDisabled} onclick="setModalUserData(this, \'delete\')"><i class="bi bi-trash3-fill"></i></button>`
    rowOperations.appendChild(operationsHolder);

    newDataRow.appendChild(rowOperations);

    // -- Add to tbody --
    document.querySelector("tbody").appendChild(newDataRow);
}