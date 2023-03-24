import {BYTE_RANGES, ERROR_COLOR, PRIMARY_COLOR, UNDISPLAYED_CLASS, VIEW_TYPE} from './config_v1.js';

export function showToastError(html, delay = 0) {
    showToast(html, ERROR_COLOR, delay);
}

function showToast(html, color, delay) {
    let toastText = document.querySelector("#message-toast-text");
    toastText.style.color = color;
    toastText.style.overflowY = 'unset';
    toastText.style.height = 'unset';
    toastText.style.width = document.getElementById('main_container').offsetWidth - 50 + 'px';

    let options = {
        animation: true,
        autohide: delay !== 0,
        delay: delay * 1000
    };
    let toast = new bootstrap.Toast(document.querySelector("#message-toast"), options);
    toast.showHtmlMessage(html);
    let oneLineHeight = window.viewType === VIEW_TYPE.DESKTOP ? 90 : 135;
    if (toastText.offsetHeight > oneLineHeight) {
        toastText.style.overflowY = 'scroll';
        toastText.style.height = '200px';
    }
}

export function showToastMessage(html, delay = 0) {
    showToast(html, PRIMARY_COLOR, delay);
}

export class DataByte {
    bytes
    number
    range
    decimals

    constructor(bytes, decimals = 0) {
        let units = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb'];
        this.bytes = bytes;
        this.decimals = decimals;
        this.number = bytes === undefined ? '' : 0;
        this.range = units[2]

        if (!bytes) return this;
        bytes = Number(bytes.toLocaleString('fullwide', {useGrouping: false}));
        let i = 0
        for (i; bytes >= 1000 && i < units.length - 1; i++) {
            bytes /= 1000;
        }
        this.number = Number(parseFloat(bytes.toFixed(decimals)));
        this.range = units[i];
        return this;
    }

    toString() {
        return this.number === undefined ? '' : this.number + this.range;
    }

    equals(other) {
        return other.number === this.number && other.range === this.range;
    }
}

export function calculateTotalBytes(inputId) {
    let rangeElement = document.getElementById(inputId + '_select');
    let numberElement = document.getElementById(inputId);
    let foundRange = BYTE_RANGES.find((el) => el.value === rangeElement.value);
    return foundRange ? foundRange.multi * numberElement.value : 0;
}

export function secondsToHuman(seconds) {
    let hours = Math.floor(seconds / 3600).pad(2);
    let min = Math.floor((seconds / 60) % 60).pad(2);
    let sec = Math.floor(seconds % 60).pad(2);
    return hours + ":" + min + ":" + sec;
}

function URIInfo(s) {
    s = s.match(/^(([^/]*?:)\/*((?:([^:]+):([^@]+)@)?([^/:]{2,}|\[[\w:]+])(:\d*)?(?=\/|$))?)?((.*?\/)?(([^/]*?)(\.[^/.]+?)?))(\?.*?)?(#.*)?$/);
    return {
        origin: s[1],
        protocol: s[2],
        host: s[3],
        username: s[4],
        password: s[5],
        hostname: s[6],
        port: s[7],
        path: s[8],
        folders: s[9],
        file: s[10],
        filename: s[11],
        fileext: s[12],
        search: s[13],
        hash: s[14]
    };
}

export function postForm(path, params) {

    let urlParts = URIInfo(window.location.href);
    let url = urlParts.origin + urlParts.folders + path;

    let form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', url);

    for (let key in params) {
        if (params.hasOwnProperty(key)) {
            let hiddenField = document.createElement('input');
            hiddenField.setAttribute('type', 'hidden');
            hiddenField.setAttribute('name', key);
            hiddenField.setAttribute('value', params[key]);
            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    return form;
}

export function undisplayElement(element) {
    if (element) {
        element.classList.add(UNDISPLAYED_CLASS);
    }
}

export function displayElement(element) {
    if (element) {
        element.classList.remove(UNDISPLAYED_CLASS);
    }
}

export function isElementUndisplayed(element) {
    if (element) {
        return getComputedStyle(element).display === 'none';
    }
}

export function blockUI() {
    document.querySelector('html').classList.add('loading');
}

export function unblockUI() {
    document.querySelector('html').classList.remove('loading');
}

export function getKeyIdFromElementId(element) {
    const parts = element.id.split('_');
    return Number(parts[1].trim());
}

export function getServerUuidFromElementId(element) {
    const parts = element.id.split('_');
    return Number(parts[1].trim());
}

export function getKeyPropertyFromElementId(element) {
    const parts = element.id.split('_');
    return parts[2].trim();
}

export function getServerPropertyFromElementId(element) {
    const parts = element.id.split('_');
    return parts[1].trim();
}