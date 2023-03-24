'use strict';

let usernamePattern;
let passwordPattern;

function checkUserNameAndPassword(event) {
    if (!isUserNameValid() || !isPasswordValid()) {
        event.preventDefault();
        document.getElementById('message').innerText = "Incorrect username or password";
        document.getElementById('login').disabled = true;
    } else {
        document.getElementById('login').disabled = false;
    }
}

export function setUsernamePattern(pattern) {
    usernamePattern = pattern;
}

export function setPasswordPattern(pattern) {
    passwordPattern = pattern;
}

export function showPassword() {
    let password = document.getElementById("password");
    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
}

function isPasswordValid() {
    document.getElementById('message').innerText = ""
    //8 to 15 characters which contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character
    let password = document.getElementById('password').value;
    if (!passwordPattern.test(password)) {
        document.getElementById('password_message').style.color = "red"
        return false;
    } else {
        document.getElementById('password_message').style.color = "unset"
        return true;
    }

}

function isUserNameValid() {
    document.getElementById('message').innerText = ""
    //Must contain only lowercase, uppercase letters and digits, and starts from upper or lower letter
    let username = document.getElementById('username').value;
    if (!usernamePattern.test(username)) {
        document.getElementById('username_message').style.color = "red";
        return false;
    } else {
        document.getElementById('username_message').style.color = "unset"
        return true;
    }
}

export function DOMContentLoaded() {
    let form = document.querySelector('form');
    form.addEventListener("submit", checkUserNameAndPassword);
    document.getElementById('username').addEventListener("input", checkUserNameAndPassword);
    document.getElementById('password').addEventListener("input", checkUserNameAndPassword);
}
