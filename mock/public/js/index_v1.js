'use strict';

let usernamePattern;
let passwordPattern;

function checkUserNameAndPassword(event) {
    if (!isUserNameValid()) {
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
    document.getElementById('username').addEventListener("input", checkUserNameAndPassword);
}
