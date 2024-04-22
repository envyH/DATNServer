"use strict"
/**
 * Enum for common colors.
 * @readonly
 * @enum {{name: string, hex: string}}
 */
const TYPE_LOGIN = Object.freeze({
    ADMIN: { value: 0, role: "admin" },
    EMPLOYEE: { value: 1, role: "employee" }
});

const checkTypeLogin = (value) => {
    for (let key in TYPE_LOGIN) {
        if (TYPE_LOGIN[key].value === value) {
            return true;
        }
    }
    return false;
}

document.addEventListener("DOMContentLoaded", function () {
    const dataUserLogged = getCookie("dataUserLogged");
    if (dataUserLogged != null) {
        const { avatar, email, full_name, phone_number } = JSON.parse(dataUserLogged);
        window.location.assign("/home");
    }

    const adminBtn = document.getElementById("withAdmin");
    const employeeBtn = document.getElementById("withEmployee");



    let typeLogin = getCookie("typeLogin");
    if (typeLogin === null) {
        adminBtn.addEventListener("click", () => {
            setCookie("typeLogin", TYPE_LOGIN.ADMIN.value.toString(), 1);
            window.location.assign("/login");
        });

        employeeBtn.addEventListener("click", () => {
            setCookie("typeLogin", TYPE_LOGIN.EMPLOYEE.value.toString(), 1);
            window.location.assign("/login");
        });
    }
    else {
        let flag = checkTypeLogin(parseInt(typeLogin));
        if (!flag) {
            console.log(`${typeLogin} not valid`);
            return
        }
        document.getElementById('btnBack').addEventListener('click', () => {
            eraseCookie("typeLogin");
            window.location.assign("/login");
        });

        document.getElementById('loginButton').addEventListener('click', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (username.length === 0 || password.length === 0) {
                return
            }
            doLogin(username, password, typeLogin);
        })
    }



});

const doLogin = (username, password, type) => {
    let xhr = new XMLHttpRequest();
    let endPoint = `/do-login`;
    xhr.open('POST', endPoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ username, password }));

    xhr.onload = function () {
        const myDataResponse = JSON.parse(xhr.response);
        const { message, statusCode, code, timestamp } = myDataResponse;
        switch (code) {
            case "auth/login-admin-failed":
                alert(message);
                break;
            case "auth/login-admin-success":
                const { metadata } = myDataResponse;
                const { avatar, email, full_name, phone_number } = metadata;
                setCookie("dataUserLogged", JSON.stringify(metadata), 2);
                window.location.assign("/home");
                break;

            default:
                alert(message);
                break;
        }
    };

}


function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

function updateCookie(name, value, days) {
    setCookie(name, value, days);
}
