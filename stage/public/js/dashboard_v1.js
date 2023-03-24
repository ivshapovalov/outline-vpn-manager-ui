'use strict';
import {
    ACTION_KEY_ADD,
    ACTION_KEY_REMOVE,
    ACTION_KEY_REMOVE_PROPERTY,
    ACTION_KEY_SET_PROPERTY,
    ACTION_KEYS_REMOVE,
    ACTION_KEYS_REMOVE_CUSTOM_LIMITS,
    ACTION_SERVER_GET_DATA,
    ACTION_SERVER_REMOVE,
    ACTION_SERVER_REMOVE_PROPERTY,
    ACTION_SERVER_SET_PROPERTY,
    ACTION_SERVER_SET_SELECTED,
    ACTION_SERVER_UPDATE,
    ACTION_SERVERS_GET,
    ACTION_SERVERS_REMOVE,
    ACTION_UPDATE_TOKEN,
    BYTE_RANGES,
    DESKTOP_PAGINATION_WIDTH,
    ERROR_COLOR,
    MANAGER_URL,
    MAX_DATA_LIMIT,
    MAX_PORT_NUMBER,
    MESSAGE_KEY_ADD_FAILED,
    MESSAGE_KEY_ADD_STARTED,
    MESSAGE_KEY_ADD_SUCCESS,
    MESSAGE_KEY_REMOVE_FAILED,
    MESSAGE_KEY_REMOVE_STARTED,
    MESSAGE_KEY_REMOVE_SUCCESS,
    MESSAGE_KEY_SET_PROPERTY_FAILED,
    MESSAGE_KEY_SET_PROPERTY_STARTED,
    MESSAGE_KEY_SET_PROPERTY_SUCCESS,
    MESSAGE_KEY_URL_COPIED_TO_CLIPBOARD,
    MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_FAILED,
    MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_STARTED,
    MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_SUCCESS,
    MESSAGE_KEYS_REMOVE_FAILED,
    MESSAGE_KEYS_REMOVE_STARTED,
    MESSAGE_KEYS_REMOVE_SUCCESS,
    MESSAGE_NUMBER_VALUE_INVALID,
    MESSAGE_SERVER_GET_FAILED,
    MESSAGE_SERVER_LIST_FAILED,
    MESSAGE_SERVER_REMOVE_FAILED,
    MESSAGE_SERVER_REMOVE_STARTED,
    MESSAGE_SERVER_REMOVE_SUCCESS,
    MESSAGE_SERVER_SET_PROPERTY_FAILED,
    MESSAGE_SERVER_SET_PROPERTY_STARTED,
    MESSAGE_SERVER_SET_PROPERTY_SUCCESS,
    MESSAGE_SERVER_SET_SELECTED_FAILED,
    MESSAGE_SERVER_SET_SELECTED_SUCCESS,
    MESSAGE_SERVER_UPDATE_FAILED,
    MESSAGE_SERVER_UPDATE_STARTED,
    MESSAGE_SERVER_UPDATE_SUCCESS,
    MESSAGE_SERVERS_REMOVE_FAILED,
    MESSAGE_SERVERS_REMOVE_STARTED,
    MESSAGE_SERVERS_REMOVE_SUCCESS,
    MESSAGE_TOKEN_UPDATE_FAILED,
    MOBILE_PAGINATION_WIDTH,
    NEW_KEYS_MAX_NUMBER,
    ORDER,
    PAGE_ROW_LIMITS,
    PAGE_SORTABLE_COLUMNS,
    PRIMARY_COLOR,
    ROOT_RELATIVE_REDIRECT_URL,
    TOAST_MESSAGE_DELAY_SEC,
    VIEW_TYPE
} from './config_v1.js';
import {
    blockUI,
    calculateTotalBytes,
    DataByte,
    displayElement,
    getKeyIdFromElementId,
    getKeyPropertyFromElementId,
    getServerPropertyFromElementId,
    getServerUuidFromElementId,
    isElementUndisplayed,
    postForm,
    secondsToHuman,
    showToastError,
    showToastMessage,
    unblockUI,
    undisplayElement
} from "./utils_v1.js";

let keys = [];
let servers = [];
let currentServerUuid;

let keysFiltered = [];
let serverProperties = {};

let currentFilter;
let sort = {"order": ORDER.ASC, "column": "id"};
let currentRowLimit = PAGE_ROW_LIMITS[1];
let currentPage = 1;
let paginationWidth = DESKTOP_PAGINATION_WIDTH;

let currentModal;

let updateTokenTime = setInterval(() => renewExpirationTime(), 1000);

function createFilter() {
    clearCurrentFilter();

    const clearFilterField = function (event) {
        const inputId = event.currentTarget.id.substring(0, event.currentTarget.id.indexOf('_btn_remove'));
        document.getElementById(inputId).value = '';
        undisplayElement(event.currentTarget);
    }
    const displayRemoveButton = function (event) {
        const btnRemove = document.getElementById(event.currentTarget.id + '_btn_remove');
        event.currentTarget.value === '' ? undisplayElement(btnRemove) : displayElement(btnRemove);
    }

    const filterWrapper = document.getElementById('filter_wrapper');
    filterWrapper.innerText = '';
    const filterFragment = document.createDocumentFragment();
    for (const property of Object.keys(FILTER_KEY_PROPERTIES)) {
        let row = document.createElement('div');
        row.classList.add('d-flex')
        if (FILTER_KEY_PROPERTIES[property].start) {
            let col = document.createElement('div');
            col.classList.add('input-group', 'input-group-filter-start');
            const inputIdStart = 'filter_' + property + '_start';
            const labelStart = document.createElement('label');
            labelStart.classList.add('input-group-text', 'input-group-label-start');
            labelStart.innerText = FILTER_KEY_PROPERTIES[property].name + ' from';
            labelStart.htmlFor = inputIdStart;
            col.appendChild(labelStart);

            const inputStart = document.createElement('input');
            inputStart.classList.add('form-control');
            inputStart.id = inputIdStart;
            inputStart.type = FILTER_KEY_PROPERTIES[property].type;
            inputStart.title = FILTER_KEY_PROPERTIES[property].title + ' start value';
            inputStart.addEventListener('input', (event) => displayRemoveButton(event))
            col.appendChild(inputStart);

            if (FILTER_KEY_PROPERTIES[property].isBytes) {
                inputStart.min = 0 + '';
                inputStart.max = MAX_DATA_LIMIT + '';
                inputStart.addEventListener('input', (event) => handleFilterInputBytes(event))
                const byteSelector = createByteSelector(inputIdStart, 'Mb');
                col.appendChild(byteSelector);
            }

            const functions = {
                remove: {function: clearFilterField, display: false}
            };
            col = appendButtons.call(col, inputIdStart, functions)
            row.appendChild(col)
            if (FILTER_KEY_PROPERTIES[property].isBytes && window.viewType === VIEW_TYPE.MOBILE) {
                col.classList.remove('input-group-filter-start');
                filterFragment.appendChild(row);
                row = document.createElement('div');
                row.classList.add('d-flex')
            }
        }
        if (FILTER_KEY_PROPERTIES[property].end) {
            let col = document.createElement('div');
            col.classList.add('input-group', 'input-group-filter-end');
            const inputIdEnd = 'filter_' + property + '_end';
            const labelEnd = document.createElement('label');
            labelEnd.classList.add('input-group-text', 'input-group-label-end');
            labelEnd.innerText = 'to';
            labelEnd.htmlFor = inputIdEnd;
            col.appendChild(labelEnd);

            const inputEnd = document.createElement('input');
            inputEnd.classList.add('form-control');
            inputEnd.id = inputIdEnd;
            inputEnd.type = FILTER_KEY_PROPERTIES[property].type;
            inputEnd.title = FILTER_KEY_PROPERTIES[property].title + ' end value';
            inputEnd.addEventListener('input', (event) => displayRemoveButton(event))
            col.appendChild(inputEnd);
            if (FILTER_KEY_PROPERTIES[property].isBytes) {
                inputEnd.min = 0 + '';
                inputEnd.max = MAX_DATA_LIMIT + '';
                inputEnd.addEventListener('input', (event) => handleFilterInputBytes(event))

                const byteSelector = createByteSelector(inputIdEnd, 'Mb');
                col.appendChild(byteSelector);
                if (window.viewType === VIEW_TYPE.MOBILE) {
                    col.classList.remove('input-group-filter-end');
                    labelEnd.classList.remove('input-group-label-end');
                    labelEnd.classList.add('input-group-label-start');
                    labelEnd.innerText = FILTER_KEY_PROPERTIES[property].name + ' to';
                }
            }
            const functions = {
                remove: {function: clearFilterField, display: false}
            };
            col = appendButtons.call(col, inputIdEnd, functions)
            row.appendChild(col)
        }
        if (FILTER_KEY_PROPERTIES[property].contains) {

            let col = document.createElement('div');
            col.classList.add('input-group');
            const inputIdContains = 'filter_' + property;
            const labelContains = document.createElement('label');
            labelContains.classList.add('input-group-text', 'input-group-label-start');
            labelContains.innerText = FILTER_KEY_PROPERTIES[property].name + ' contains';
            labelContains.htmlFor = inputIdContains;
            col.appendChild(labelContains);

            const inputContains = document.createElement('input');
            inputContains.classList.add('form-control');
            inputContains.id = inputIdContains;
            inputContains.type = FILTER_KEY_PROPERTIES[property].type;
            inputContains.title = FILTER_KEY_PROPERTIES[property].title + ' contains';
            inputContains.addEventListener('input', (event) => displayRemoveButton(event))
            col.appendChild(inputContains);

            const functions = {
                remove: {function: clearFilterField, display: false}
            };
            col = appendButtons.call(col, inputIdContains, functions)
            row.appendChild(col)
        }
        filterFragment.appendChild(row);
    }

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'filter-button-wrapper';
    const buttons =
        [
            {name: 'Save', onclick: saveFilterAndCloseWindow},
            {name: 'Clear', onclick: clearFilterWindow}
        ]
    buttons.forEach((btn) => {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-primary');
        button.addEventListener('click', (event) => btn.onclick(event))
        button.innerText = btn.name;
        buttonsWrapper.appendChild(button);
    })
    filterFragment.appendChild(buttonsWrapper);

    filterWrapper.appendChild(filterFragment)
}

createScrollButtons().then(() => {
    window.addEventListener("scroll", () => {
        displayScrollButtons();
    });
});

Number.prototype.pad = function (size) {
    let s = String(this);
    while (s.length < (size || 2)) {
        s = "0" + s;
    }
    return s;
}

export async function DOMContentLoaded() {
    document.getElementById('user').innerText = window.credentials.username;
    renewExpirationTime();

    let modalFilterWindow = document.getElementById('modal_filter_window')
    modalFilterWindow.addEventListener('hidden.bs.modal', closeFilterWindow)

    const keysTab = document.getElementById('pills_keys_tab');
    keysTab.addEventListener('hidden.bs.tab', () => {
        displayScrollButtons();
        undisplayElement(document.getElementById('header_keys_nav'))
        undisplayElement(document.getElementById('sticky_pagination_header'))
    })
    keysTab.addEventListener('shown.bs.tab', () => {
        displayScrollButtons();
        if (currentServerUuid) {
            displayElement(document.getElementById('header_keys_nav'))
            if (keys.length > 0 ? 1 : 0) {
                displayElement(document.getElementById('sticky_pagination_header'))
            }
        }
    })

    await getServers()
        .then(() => {
            undisplayElement(document.getElementById('spinner_wrapper'));
            displayElement(document.getElementById('main_container'));
        });
}

export function load() {
    defineViewType();
    updateAppearance();
    setTimeout(() => {
        displayScrollButtons();
    }, 3000)

    bootstrap.Toast.prototype.showHtmlMessage = function (message) {
        document.querySelector("#" + this._element.id + " * div[id^='message-toast-text']").innerHTML = message;
        this.show();
    }

}

function renewExpirationTime() {
    if (window.credentials) {
        const seconds = Math.max(0, (new Date(window.credentials.expired * 1000) - new Date()) / 1000);
        if (seconds === 0) {
            clearInterval(updateTokenTime);
            const form = postForm(ROOT_RELATIVE_REDIRECT_URL, {message: 'Session expired. Please login again!'});
            form.submit();
        } else {
            document.getElementById('token_expired').innerText = secondsToHuman(seconds);
        }
    }
}

function updateSortOrder(sortColumn) {
    let newOrder = ORDER.ASC;
    if (sort.column === sortColumn) {
        newOrder = -1 * sort.order;
    }
    sort = {"order": newOrder, "column": sortColumn};
}

function createSortableElements() {
    if (window.viewType === VIEW_TYPE.DESKTOP) {
        const sortableCaptions = document.querySelectorAll('.sortable')
        sortableCaptions.forEach(column => {
            column.classList.remove('sortable-asc');
            column.classList.remove('sortable-desc');
            const currentColumn = getKeyPropertyFromElementId(column);
            if (sort.column === currentColumn) {
                if (sort.order === ORDER.ASC) {
                    column.classList.add('sortable-asc');
                } else {
                    column.classList.add('sortable-desc');
                }
            }
        })
    }
    const paginationSortOptions = document.querySelectorAll('.pagination-sort > option');
    paginationSortOptions.forEach((option) => {
        if (option.value === sort.column) {
            option.selected = true;
            option.innerHTML = (sort.order === ORDER.ASC ? '&#9650;' : '&#9660;') + sort.column;
        }
    })
}

export function defineViewType() {
    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    window.viewType = urlParams.get('view_type');
    const actualMinWidth = [window.innerWidth, screen.width, document.documentElement.clientWidth]
        .reduce((a, b) => a < b ? a : b)
    const mobileWidth = 600;
    if (!window.viewType) {
        if (actualMinWidth < mobileWidth) {
            window.viewType = VIEW_TYPE.MOBILE;
        } else {
            window.viewType = VIEW_TYPE.DESKTOP;
        }
    }
}

export function changeViewType(element) {
    window.viewType = element.id.substring(element.id.lastIndexOf('_') + 1);
    const updatedUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?view_type=' + window.viewType;
    window.history.replaceState({}, '', updatedUrl)
    updateAppearance();
    displayScrollButtons();
}

function updateAppearance() {
    if (window.viewType) {
        const buttons = document.querySelectorAll("div.link-symbol-wrapper > a[id^='header']");
        buttons.forEach(button => {
            if (button.id.substring(7) === window.viewType) {
                button.style.borderColor = ERROR_COLOR;
            } else {
                button.style.borderColor = PRIMARY_COLOR;
            }
        })
    }

    updateKeysPage();
    if (window.viewType === VIEW_TYPE.DESKTOP) {
        undisplayElement(document.getElementById('keys_mobile_wrapper'))
        displayElement(document.getElementById('keys_desktop_wrapper'));
        document.getElementById('sticky_header').classList.add('sticky-header');
        document.getElementById('sticky_notifications').classList.add('sticky-notifications');
        document.getElementById('sticky_pagination_header').classList.remove('sticky-pagination-mobile');

        document.getElementById('sticky_pagination_header').style.top =
            parseInt(getComputedStyle(document.getElementById('sticky_notifications')).height)
            + parseInt(getComputedStyle(document.getElementById('sticky_header')).height) + 'px';
    } else {
        undisplayElement(document.getElementById('keys_desktop_wrapper'));
        displayElement(document.getElementById('keys_mobile_wrapper'))
        document.getElementById('sticky_header').classList.remove('sticky-header');
        document.getElementById('sticky_notifications').classList.add('sticky-notifications');
        document.getElementById('sticky_pagination_header').classList.add('sticky-pagination-mobile');
        document.getElementById('sticky_pagination_header').style.top = null;
    }

    createFilter();
}

function isTotalBytesValid(inputId) {
    const totalBytes = calculateTotalBytes(inputId);
    const maxDataLimit = new DataByte(MAX_DATA_LIMIT);
    const currentLimit = new DataByte(totalBytes);
    if (totalBytes < 0 || totalBytes > MAX_DATA_LIMIT) {
        showToastError('Data limit range is [0, ' + maxDataLimit.number + maxDataLimit.range + ']!\n ' +
            'You select ' + currentLimit.number + currentLimit.range) + '!';
        return false;
    }
    return true;
}

function formatNumber(value) {
    return value.replace(/\D/g, '');
}

function handleServerPropertiesInputLimit(event) {
    const input = event.currentTarget;
    const inputId = input.id;
    const buttonSave = document.getElementById(inputId + '_btn_save');
    const buttonCancel = document.getElementById(inputId + '_btn_cancel');
    const property = getServerPropertyFromElementId(input);
    input.value = formatNumber(input.value);
    const totalBytes = calculateTotalBytes(inputId);
    const bytes = new DataByte(totalBytes);
    input.value = bytes.number;
    if (bytes.number !== 0) {
        const select = document.getElementById(inputId + "_select");
        select.selectedIndex = BYTE_RANGES.findIndex((el) => el.value === bytes.range);
    }
    if ((serverProperties[property] === undefined && totalBytes === 0) || serverProperties[property] === totalBytes) {
        [buttonSave, buttonCancel].forEach((button) => undisplayElement(button))
    } else {
        if (isTotalBytesValid(inputId)) {
            [buttonSave, buttonCancel].forEach(button => displayElement(button))
        } else {
            undisplayElement(buttonSave);
            displayElement(buttonCancel);
        }
    }
}

function handleFilterInputBytes(event) {
    let input = event.currentTarget;
    let inputId = input.id;
    input.value = formatNumber(input.value);

    let totalBytes = calculateTotalBytes(inputId);
    if (totalBytes < 0) {
        input.value = 0 + '';
        showToastError(MESSAGE_NUMBER_VALUE_INVALID + ' greater than or equals to 0', 2)
        return;
    }

    let bytesMax = new DataByte(MAX_DATA_LIMIT);
    let select = document.getElementById(inputId + "_select");
    if (totalBytes > MAX_DATA_LIMIT) {
        input.value = bytesMax.number + '';
        select.selectedIndex = BYTE_RANGES.findIndex((el) => el.value === bytesMax.range);
        showToastError(MESSAGE_NUMBER_VALUE_INVALID + ' less than or equals to ' + bytesMax.toString(), 2)
        return;
    }
    let bytes = new DataByte(totalBytes);
    input.value = bytes.number;
    if (bytes.number !== 0) {
        select.selectedIndex = BYTE_RANGES.findIndex((el) => el.value === bytes.range);
    }
}

function handleKeyInputLimit(event) {
    let input = event.currentTarget;
    let inputId = input.id;
    input.value = formatNumber(input.value);

    let totalBytes = calculateTotalBytes(inputId);
    let bytes = new DataByte(totalBytes);
    input.value = bytes.number;
    if (bytes.number !== 0) {
        let select = document.getElementById(inputId + "_select");
        select.selectedIndex = BYTE_RANGES.findIndex((el) => el.value === bytes.range);
    }

    let buttonSave = document.getElementById(inputId + '_btn_save');
    let buttonCancel = document.getElementById(inputId + '_btn_cancel');
    let keyId = getKeyIdFromElementId(input);
    let keyProperty = getKeyPropertyFromElementId(input);
    if (new DataByte(keysFiltered.find((el) => el.id === keyId)[keyProperty + "Custom"]).equals(new DataByte(totalBytes))) {
        [buttonSave, buttonCancel].forEach((button) => undisplayElement(button))
    } else {
        if (isTotalBytesValid(inputId)) {
            [buttonSave, buttonCancel].forEach(button => displayElement(button))
        } else {
            undisplayElement(buttonSave);
            displayElement(buttonCancel);
        }
    }
}

function handleDesktopKeyInput(event) {
    {
        let keyId = getKeyIdFromElementId(event.currentTarget);
        let keyProperty = getKeyPropertyFromElementId(event.currentTarget);
        let buttons = document.querySelectorAll("[id*='" + event.currentTarget.id + "_btn_save'],[id*='" + event.currentTarget.id + "_btn_cancel']");
        if (keysFiltered.find((el) => el.id === keyId)[keyProperty] === event.currentTarget.value) {
            event.currentTarget.classList.add('w-100');
            event.currentTarget.classList.remove('row-key-changeable');
            buttons.forEach(button => {
                undisplayElement(button)
            })
        } else {
            event.currentTarget.classList.remove('w-100');
            event.currentTarget.classList.add('row-key-changeable');
            buttons.forEach(button => {
                displayElement(button)
            })
        }
    }
}

function createServerProperties() {
    let serverWrapper = document.getElementById('server_props');
    serverWrapper.innerText = '';
    let fragmentServer = document.createDocumentFragment();
    for (let property of Object.keys(SERVER_PROPERTIES)) {
        if (!serverProperties.hasOwnProperty(property)) continue;
        let fieldId = 'server_' + property;
        let group = document.createElement('div');
        group.className = 'input-group ';

        let label = document.createElement('label');
        label.classList.add('input-group-text', 'input-group-label-server');
        label.id = fieldId + '_label';
        label.htmlFor = fieldId;
        label.innerText = SERVER_PROPERTIES[property].name;
        group.appendChild(label);

        let bytes;
        if (SERVER_PROPERTIES[property].isBytes) {
            bytes = new DataByte(serverProperties[property], SERVER_PROPERTIES[property].decimals);
        }

        if (SERVER_PROPERTIES[property].type === 'checkbox') {
            let inputWrapper = document.createElement('div');
            inputWrapper.classList.add('input-group-text', 'form-check-metrics');
            inputWrapper.addEventListener('click', (event) => {
                let metrics = document.getElementById('server_metrics')
                metrics.checked = !metrics.checked;
                metrics.dispatchEvent(new Event('click'))
            });
            let checkbox = document.createElement('input');
            checkbox.classList.add('form-check-input', 'mt-0');
            checkbox.id = 'server_metrics';
            checkbox.type = 'checkbox';
            checkbox.title = SERVER_PROPERTIES[property].title;
            checkbox.checked = serverProperties[property];
            checkbox.addEventListener('click', (event) => SERVER_PROPERTIES[property].onSave('metrics', event.currentTarget.checked));
            inputWrapper.appendChild(checkbox);
            group.appendChild(inputWrapper);
        } else {
            let input = document.createElement('input');
            input.type = SERVER_PROPERTIES[property].type;
            input.title = SERVER_PROPERTIES[property].title;
            input.classList.add('form-control', 'input-group-value-server');
            if (SERVER_PROPERTIES[property].required) {
                input.classList.add('required');
            }
            input.id = fieldId;
            input.min = SERVER_PROPERTIES[property].min ? SERVER_PROPERTIES[property].min : '';
            input.max = SERVER_PROPERTIES[property].max ? SERVER_PROPERTIES[property].max : '';
            input.disabled = SERVER_PROPERTIES[property].disabled;
            input.ariaDescribedBy = fieldId + '_label';
            if (SERVER_PROPERTIES[property].isBytes) {
                if (SERVER_PROPERTIES[property].changeable) {
                    input.value = bytes.number === undefined ? '' : bytes.number;
                    let byteSelector = createByteSelector(fieldId, bytes.range)
                    group.appendChild(byteSelector);
                } else {
                    input.value = bytes.toString();
                    input.disabled = true;
                }
            } else {
                input.value = serverProperties[property];
            }
            group.appendChild(input);

            if (SERVER_PROPERTIES[property].changeable) {
                if (SERVER_PROPERTIES[property].onInput) {
                    input.addEventListener('input', (event) => SERVER_PROPERTIES[property].onInput(event))
                } else {
                    input.addEventListener('input', (event) => {
                            let buttonSave = document.getElementById(event.currentTarget.id + '_btn_save');
                            let buttonCancel = document.getElementById(event.currentTarget.id + '_btn_cancel');
                            let property = getServerPropertyFromElementId(event.currentTarget);
                            if (event.currentTarget.value !== '' && (event.currentTarget.min || event.currentTarget.max) && !validNumberBoundaries(event.currentTarget)) {
                                return;
                            }

                            if (serverProperties[property].toString() === event.currentTarget.value) {
                                event.currentTarget.classList.remove('highlighted');
                                [buttonSave, buttonCancel].forEach(button => undisplayElement(button))
                            } else {
                                if (event.currentTarget.classList.contains("required") && !event.currentTarget.value) {
                                    event.currentTarget.classList.add('highlighted')
                                    undisplayElement(buttonSave);
                                    displayElement(buttonCancel);
                                } else {
                                    event.currentTarget.classList.remove('highlighted');
                                    [buttonSave, buttonCancel].forEach(button => displayElement(button))
                                }
                            }
                        }
                    )
                }

                let save = (event) => {
                    let property = getServerPropertyFromElementId(event.currentTarget);
                    let newValue = document.getElementById('server_' + property).value;
                    if (SERVER_PROPERTIES[property].isBytes) {
                        newValue = calculateTotalBytes('server_' + property)
                    }
                    SERVER_PROPERTIES[property].onSave(property, newValue);
                    displayElement(document.getElementById('server_' + property + '_btn_remove'));
                };

                let cancel = (event) => {
                    let property = getServerPropertyFromElementId(event.currentTarget);
                    let input = document.getElementById('server_' + property);
                    let value = serverProperties[property];
                    if (SERVER_PROPERTIES[property].isBytes) {
                        let bytes = new DataByte(serverProperties[property])
                        value = bytes.number;
                        let select = document.getElementById('server_' + property + "_select");
                        select.selectedIndex = BYTE_RANGES.findIndex((el) => el.value === bytes.range);
                    }
                    input.value = value;
                    input.dispatchEvent(new Event('input'));
                };
                let functions = {save: {function: save, display: false}, cancel: {function: cancel, display: false}};
                if (SERVER_PROPERTIES[property].onRemove) {
                    functions.remove = {
                        function: (event) => {
                            let property = getServerPropertyFromElementId(event.currentTarget);
                            SERVER_PROPERTIES[property].onRemove(property);
                            undisplayElement(event.currentTarget)
                        },
                        display: serverProperties[property] !== undefined
                    }
                }
                group = appendButtons.call(group, fieldId, functions)
            }
        }
        fragmentServer.appendChild(group);

    }
    serverWrapper.appendChild(fragmentServer);
}

export async function setServerSelected() {
    if (!currentServerUuid) return;
    blockUI();
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`

    };
    let options = {method: "POST", headers: headers};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVER_SET_SELECTED + "&serverUuid=" + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        showToastMessage(MESSAGE_SERVER_SET_SELECTED_SUCCESS + ' ' + currentServerUuid, TOAST_MESSAGE_DELAY_SEC);
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVER_SET_SELECTED_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function getServer() {
    if (!currentServerUuid) return;
    clearServerElements();
    blockUI();
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`

    };
    let options = {method: "GET", headers: headers,};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVER_GET_DATA + "&serverUuid=" + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        return response.json().then(function (server) {
                            const properties = server.properties;
                            serverProperties = {};
                            for (let property of Object.keys(SERVER_PROPERTIES)) {
                                let value = properties[property];
                                if (property === "created") {
                                    value = new Date(value).toLocaleDateString() + " " + new Date(value).toLocaleTimeString();
                                }
                                serverProperties[property] = value;
                                // updateServerProperty(property, value)
                            }
                            createServerProperties();
                            displayElement(document.getElementById('server_buttons'));

                            const keys = server.keys;
                            updateKeys(keys);
                            updateCurrentPageNumber();
                            updateKeysPage()
                            displayElement(document.getElementById('server_wrapper'))
                            if (!isElementUndisplayed(document.getElementById('pills_keys'))) {
                                displayElement(document.getElementById('header_keys_nav'))
                            }
                        });
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVER_GET_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

function clearServerElements() {
    serverProperties = {};
    updateKeys([])
    undisplayElement(document.getElementById('server_wrapper'))
    undisplayElement(document.getElementById('header_keys_nav'))

    clearKeysElements();
}

function clearKeysElements() {
    displayElement(document.querySelector('#keys_empty'))

    document.getElementById('keys_desktop_body').innerHTML = "";
    document.getElementById('keys_mobile_body').innerHTML = "";
    document.querySelectorAll('.pagination-navigation-wrapper').forEach((el) => {
        undisplayElement(el);
    })
}

function updateKeys(newKeys) {
    if (newKeys) {
        keys = newKeys
    }
    updateKeysLimits();
    filterKeys();
}

function updateServers(newServers) {
    if (newServers) {
        servers = newServers
    }
    createServerList();
}

function appendServerItemButtons(parent, serverId) {
    let buttonsWrapper = document.createElement('div');
    buttonsWrapper.classList.add('input-group-btn-wrapper');
    let btnEdit = document.createElement('button');
    btnEdit.id = serverId + "_btn_edit";
    btnEdit.classList.add('input-group-btn', 'input-group-btn-edit');
    btnEdit.title = "Edit";
    btnEdit.addEventListener('click', (event) => editServer(event));
    btnEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">\n' +
        '  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>\n' +
        '  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>\n' +
        '</svg>';

    buttonsWrapper.append(btnEdit);

    let btnRemove = document.createElement('button');
    btnRemove.id = serverId + "_btn_remove";
    btnRemove.classList.add('input-group-btn', 'input-group-btn-remove');
    btnRemove.title = "Remove";
    btnRemove.addEventListener('click', (event) => {
        const serverUuid = getServerUuidFromElementId(event.currentTarget);
        removeServer(serverUuid)
    });
    btnRemove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem"
                                 fill="currentColor" class="bi bi-trash"
                                 viewBox="0 0 16 16">
                                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                      <path fill-rule="evenodd"
                                            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>`;
    buttonsWrapper.append(btnRemove);

    parent.appendChild(buttonsWrapper)
}

export async function saveServer(props) {
    blockUI();
    showToastMessage(MESSAGE_SERVER_UPDATE_STARTED, TOAST_MESSAGE_DELAY_SEC);
    const headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    const data = JSON.stringify({props: props});
    const options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVER_UPDATE
            + ((props['uuid']) ? "&serverUuid=" + props['uuid'] : ''), options)
            .then(function (response) {
                    if (response.ok) {
                        return response.json().then(async function (updatedServer) {
                            showToastMessage(MESSAGE_SERVER_UPDATE_SUCCESS, TOAST_MESSAGE_DELAY_SEC)
                            const oldServer = servers.find(server => server.uuid === updatedServer.uuid)
                            if (oldServer) {
                                const index = servers.indexOf(oldServer)
                                servers[index] = updatedServer;
                            } else {
                                servers.push(updatedServer)
                            }
                            if (servers.length === 1) {
                                currentServerUuid = updatedServer.uuid;
                                setServerSelected().then(() => {
                                    getServer()
                                })
                            }
                            updateServers();
                        });
                    } else {
                        return response.text().then(function (text) {
                            console.debug(text);
                            showToastError(text);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVER_UPDATE_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

function createServerList() {
    if (servers.length > 0) {
        undisplayElement(document.querySelector('#servers_empty'))
    } else {
        displayElement(document.querySelector('#servers_empty'))
    }
    let serverList = document.getElementById('server_list');
    serverList.innerText = '';
    let fragment = document.createDocumentFragment();
    servers.forEach((server) => {
        const serverId = 'server_' + server.uuid;
        const divGroup = document.createElement('div')
        divGroup.className = 'input-group'
        let div = document.createElement('div')
        div.className = 'input-group-text form-check-server';
        div.addEventListener('click', (event) => {
            const selectedServer = document.getElementById(serverId)
            selectedServer.checked = true
            selectedServer.dispatchEvent(new Event('change'))
        });
        const input = document.createElement('input')
        input.classList.add('form-check-input', 'mt-0')
        input.type = 'radio'
        input.name = 'server'
        input.id = serverId;
        input.value = server.uuid;
        input.checked = (currentServerUuid) ? (server.uuid === currentServerUuid) : (servers.indexOf(server) === 0);
        input.addEventListener('change', async (event) => {
            currentServerUuid = parseInt(event.currentTarget.value);
            servers.forEach(server => server.selected = (server.uuid === currentServerUuid))
            await setServerSelected().then(async () => {
                await getServer()
            })
        })
        div.appendChild(input)
        divGroup.appendChild(div)
        const labelName = document.createElement('input')
        labelName.type = 'text'
        labelName.className = 'form-control'
        labelName.value = server.title;
        labelName.disabled = true;
        divGroup.appendChild(labelName)
        const labelUrl = document.createElement('input')
        labelUrl.type = 'text'
        labelUrl.className = 'form-control'
        labelUrl.value = server.url;
        labelUrl.disabled = true;
        divGroup.appendChild(labelUrl)

        appendServerItemButtons(divGroup, serverId)

        fragment.appendChild(divGroup)
    })
    const addNewServerButton = document.createElement('button')
    addNewServerButton.className = 'btn btn-primary servers-action-button '
    addNewServerButton.innerText = 'ADD SERVER'
    addNewServerButton.addEventListener('click', (event) => {
        editServer(event);
    })
    fragment.appendChild(addNewServerButton)

    const reloadServersButton = document.createElement('button')
    reloadServersButton.className = 'btn btn-primary servers-action-button'
    reloadServersButton.innerText = 'RELOAD SERVERS'
    reloadServersButton.addEventListener('click', () => {
        getServers();
    })
    fragment.appendChild(reloadServersButton)

    const removeAllServersButton = document.createElement('button')
    removeAllServersButton.className = 'btn btn-danger servers-action-button '
    removeAllServersButton.innerText = 'REMOVE SERVERS'
    removeAllServersButton.addEventListener('click', async () => {
        await removeServers();
    })
    fragment.appendChild(removeAllServersButton)

    undisplayElement(document.getElementById('server_wrapper'))
    undisplayElement(document.getElementById('header_keys_nav'))

    serverList.appendChild(fragment)

    if (servers.length === 0) {
        currentServerUuid = undefined;
        updateKeys([])
        updateKeysPage();
    }
}

export async function getServers() {
    document.getElementById('server_list').innerText = '';
    document.getElementById('server_props').innerText = '';
    undisplayElement(document.getElementById('server_buttons'));
    blockUI();
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "GET", headers: headers};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVERS_GET, options)
            .then(function (response) {
                    if (response.ok) {
                        return response.json().then(async function (responseBody) {
                            const selectedServerUuid = responseBody.selectedServerUuid;
                            if (selectedServerUuid) currentServerUuid = selectedServerUuid;
                            updateServers(responseBody.servers);
                            await getServer();
                            // updateKeys(keys);
                            // updateCurrentPageNumber();
                            // updateKeysPage()
                        });
                    } else if (response.status === 401) {
                        let form = postForm(ROOT_RELATIVE_REDIRECT_URL, {message: 'Session expired. Please login again!'});
                        form.submit();
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVER_LIST_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function updateToken() {
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "GET", headers: headers};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_UPDATE_TOKEN, options)
            .then(function (response) {
                    if (response.ok) {
                        return response.json().then(function (json) {
                            window.credentials = json;
                            renewExpirationTime();
                        });
                    } else if (response.status === 401) {
                        let form = postForm(ROOT_RELATIVE_REDIRECT_URL, {message: 'Session expired. Please login again!'});
                        form.submit();
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_TOKEN_UPDATE_FAILED);
        } else {
            showToastError(error);
        }
    }
}

function updateCurrentPageNumber(selectedPage = currentPage) {
    let maxPageNumber = Math.max(Math.ceil(keysFiltered.length / currentRowLimit), 1);
    currentPage = Math.min(selectedPage, maxPageNumber);
}

function createByteSelector(fieldId, currentRange) {
    let byteSelector = document.createElement('select');
    byteSelector.id = fieldId + '_select';
    byteSelector.classList.add('form-select', 'selector-bytes');
    byteSelector.ariaLabel = "Byte range";
    let isSelected = false;
    BYTE_RANGES.forEach(range => {
        let option = document.createElement('option');
        option.value = '' + range.value;
        option.innerHTML = ' ' + range.value;
        if (range.value === currentRange) {
            option.selected = true;
            isSelected = true;
        }
        byteSelector.appendChild(option);
    })
    if (!isSelected) {
        byteSelector.selectedIndex = -1
    }
    byteSelector.addEventListener('change', (event) => {
        let inputId = event.currentTarget.id.substring(0, event.currentTarget.id.indexOf('_select'));
        let input = document.getElementById(inputId);
        input.dispatchEvent(new Event('input'))
    })
    return byteSelector;
}

function setKeyLimit(event) {
    const keyId = getKeyIdFromElementId(event.currentTarget);
    const currentKey = keys.find((key) => key.id === keyId)

    let limitDialog = document.getElementById('modal_limit_dialog')
    if (window.viewType === VIEW_TYPE.MOBILE) {
        limitDialog.classList.add('modal-lg', 'modal-dialog-max-w-80');
    } else {
        limitDialog.classList.remove('modal-lg', 'modal-dialog-max-w-80');
    }
    let limitWrapper = document.getElementById('modal_limit_wrapper')
    limitWrapper.innerText = '';
    let limitFragment = document.createDocumentFragment();
    let fieldId = 'key_' + keyId + '_limit';
    let group = document.createElement('div');
    group.className = 'input-group';

    let label = document.createElement('label');
    label.classList.add('input-group-text', 'input-group-label-limit');
    label.htmlFor = fieldId;
    label.innerText = 'Custom limit';
    group.appendChild(label);

    let input = document.createElement('input');
    input.type = 'text';
    input.classList.add('form-control');
    input.id = fieldId;
    input.title = "Custom limit";
    input.min = 0;
    input.max = MAX_DATA_LIMIT;
    input.addEventListener('input', (event) => handleKeyInputLimit(event))

    group.appendChild(input);
    let bytes = new DataByte(currentKey.limitCustom);
    input.value = bytes.number === undefined ? '' : bytes.number + '';

    let byteSelector = createByteSelector(fieldId, bytes.range);
    group.appendChild(byteSelector);

    let functions = {
        save: {function: handleKeyPropertySave, display: false},
        cancel: {function: handleKeyPropertyCancel, display: false},
        remove: {function: handleKeyPropertyRemove, display: false}
    }
    if (currentKey.limitCustom !== undefined) {
        functions.remove.display = true;
    }

    group = appendButtons.call(group, fieldId, functions)

    limitFragment.appendChild(group);
    limitWrapper.appendChild(limitFragment);

    document.getElementById('modal_limit_key_id').innerText = currentKey.id;
    document.getElementById('modal_limit_key_name').innerText = currentKey.name;

    let transferBytes = new DataByte(currentKey.transfer);
    const transferElement = document.getElementById('modal_limit_key_transfer')
    transferElement.innerText = currentKey.transfer === undefined ? '' : transferBytes.toString();
    if (currentKey.transfer >= currentKey.limit) {
        transferElement.classList.add('limit-exceeded');
    } else {
        transferElement.classList.remove('limit-exceeded');
    }

    let serverDefaultLimitBytes = new DataByte(serverProperties.limit);
    document.getElementById('modal_limit_default_limit').innerText =
        serverProperties.limit === undefined ? '' : serverDefaultLimitBytes.toString();

    let modalLimitWindow = document.getElementById('modal_limit_window')
    currentModal = new bootstrap.Modal(modalLimitWindow, {
        backdrop: false,
        keyboard: true
    })
    currentModal.show();
    let hide = function (button) {
        return function () {
            button.focus();
            modalLimitWindow.removeEventListener('hidden.bs.modal', hide)
        }
    }
    modalLimitWindow.addEventListener('hidden.bs.modal', hide(event.currentTarget))
    return undefined;
}

function createDesktopKeys() {
    let columns = {
        id: {name: 'ID', title: 'Access key ID', sortable: true, size: 1},
        port: {name: 'Port', title: 'Access key port', sortable: true, size: 1},
        name: {name: 'Name', title: 'Access key name', sortable: true, size: 4},
        transfer: {name: 'Transfer', title: 'Access key data Transfer', sortable: true, size: 1},
        limit: {name: 'Limit', title: 'Access key data Limit', sortable: true, size: 1},
        url: {name: 'URL', title: 'Access key URL', size: 1},
        actions: {name: 'Actions', title: 'Actions with key', size: 2}
    }
    let keysWrapper = document.querySelector('#keys_desktop_body');
    let min = currentRowLimit * (currentPage - 1) + 1;
    let max = Math.min(currentRowLimit * (currentPage), keysFiltered.length);
    let fragment = document.createDocumentFragment();

    let table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'table-primary', 'table-striped', 'table-hover', 'border-primary');
    let thead = document.createElement('thead');
    thead.classList.add('table-warning', 'border-primary');
    let tr = document.createElement('tr');
    Object.keys(columns).forEach((columnName) => {
        let th = document.createElement('th');
        th.id = 'key_title_' + columnName;
        th.classList.add('col-' + columns[columnName].size, 'text-center');
        if (columns[columnName].sortable) {
            th.classList.add('sortable');
            th.addEventListener('click', (event => {
                    let sortColumn = getKeyPropertyFromElementId(event.currentTarget);
                    updateSortOrder(sortColumn);
                    updateKeysPage();
                })
            )
        }
        let span = document.createElement('span')
        span.innerText = columns[columnName].name;
        span.title = columns[columnName].title;

        th.appendChild(span);

        tr.appendChild(th);
    })
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement('tbody');

    for (let i = min; i <= max; i++) {
        let currentKey = keysFiltered[i - 1];
        let row = document.createElement('tr');

        let colId = document.createElement('td');
        colId.classList.add('align-middle', 'col-' + columns['id'].size);
        colId.innerText = currentKey['id'];
        colId.title = columns.id.title;
        row.appendChild(colId);

        let colPort = document.createElement('td');
        colPort.classList.add('align-middle', 'col-' + columns['port'].size);
        colPort.innerText = currentKey['port'] ? currentKey['port'] : '';
        colPort.title = columns.port.title;
        row.appendChild(colPort);

        let colName = document.createElement('td');
        colName.classList.add('align-middle', 'col-' + columns['name'].size);
        colName.title = columns.name.title
        let fieldId = 'key_' + currentKey.id + '_name';

        let divName = document.createElement('div');
        divName.classList.add('input-group');
        let inputName = document.createElement('input');
        inputName.classList.add('form-control', 'row-key-changeable', 'w-100', 'align-middle');
        inputName.type = 'text';
        inputName.autocomplete = 'off';
        inputName.value = currentKey.name;
        inputName.id = fieldId;
        inputName.addEventListener('input', (event) => handleDesktopKeyInput(event))
        divName.appendChild(inputName);

        let functionsName = {
            save: {function: handleKeyPropertySave, display: false},
            cancel: {function: handleKeyPropertyCancel, display: false}
        };
        divName = appendButtons.call(divName, fieldId, functionsName)
        colName.appendChild(divName);

        row.appendChild(colName);

        let colTransfer = document.createElement('td');
        colTransfer.classList.add('align-middle', 'col-' + columns['transfer'].size);

        let bytesTransfer = new DataByte(currentKey.transfer === undefined ? 0 : currentKey.transfer);
        let divTransfer = document.createElement('div')
        divTransfer.classList.add('input-group')
        let spanTransfer = document.createElement('span')
        spanTransfer.id = 'key_' + currentKey.id + '_transfer'
        spanTransfer.classList.add('form-control', 'text-center', 'key-transfer')
        if (currentKey.transfer >= currentKey.limit) {
            spanTransfer.classList.add('limit-exceeded');
        }
        spanTransfer.innerText = (bytesTransfer.bytes !== undefined ? bytesTransfer.toString() : '');
        divTransfer.appendChild(spanTransfer);
        colTransfer.appendChild(divTransfer);

        row.appendChild(colTransfer);

        let colLimit = document.createElement('td');
        colLimit.classList.add('align-middle', 'col-' + columns['limit'].size);

        let limit = undefined;
        if (currentKey.limitCustom !== undefined) {
            limit = currentKey.limitCustom;
        } else if (serverProperties.limit !== undefined) {
            limit = serverProperties.limit;
        }

        let bytesLimit = new DataByte(limit);
        let divLimit = document.createElement('div')
        divLimit.classList.add('input-group')
        let spanLimit = document.createElement('span')
        spanLimit.id = 'key_' + currentKey.id + '_limit_custom'
        spanLimit.classList.add('form-control', 'text-center', 'key-transfer')
        if (currentKey.limitCustom !== undefined) {
            spanLimit.classList.add('limit-custom');
        }
        spanLimit.innerText = (bytesLimit.bytes !== undefined ? bytesLimit.toString() : '');
        divLimit.appendChild(spanLimit);
        colLimit.appendChild(divLimit);

        row.appendChild(colLimit);

        let colUrl = document.createElement('td');
        colUrl.classList.add('align-middle', 'text-center', 'col-' + columns['url'].size);

        colUrl.title = "Access url for Outline client";
        let url = document.createElement('button');
        url.classList.add('row-key-btn');
        url.id = "key_" + currentKey.id + "_btn_url";
        url.dataset.url = currentKey.accessUrl;
        url.addEventListener('click', (event) => copyUrlToClipboard(event));
        url.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share" viewBox="0 0 16 16">
                          <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                        </svg>`
        colUrl.appendChild(url);
        row.appendChild(colUrl);

        let colActions = document.createElement('td');
        colActions.classList.add('align-middle', 'text-center', 'col-' + columns['actions'].size);
        colActions.title = "Actions";

        let actionCustomLimit = document.createElement('button');
        actionCustomLimit.classList.add('row-key-btn');
        actionCustomLimit.title = "Set Custom Data Limit"
        actionCustomLimit.id = "key_" + currentKey.id + "_btn_limit";
        actionCustomLimit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
                                  <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
                                </svg>`;

        actionCustomLimit.addEventListener('click', (event) => setKeyLimit(event));
        colActions.appendChild(actionCustomLimit)

        let actionRemoveKey = document.createElement('button');
        actionRemoveKey.classList.add('row-key-btn', 'row-key-btn-remove');
        actionRemoveKey.title = "Remove key"
        actionRemoveKey.id = "key_" + currentKey.id + "_btn_remove";
        actionRemoveKey.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                 fill="currentColor" class="bi bi-trash"
                                 viewBox="0 0 16 16">
                                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                      <path fill-rule="evenodd"
                                            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>`;

        actionRemoveKey.addEventListener('click', (event) => removeKey(event));
        colActions.appendChild(actionRemoveKey)

        row.appendChild(colActions);
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    fragment.appendChild(table);
    keysWrapper.appendChild(fragment);

    let items = document.querySelectorAll(
        "input[id^='key_'][id$='_name']," +
        "button[id^='key_'][id*='_btn_url']," +
        "button[id^='key_'][id*='_btn_remove']," +
        "button[id^='key_'][id*='_btn_limit']")
    ;
    items.forEach((element) => {
            element.addEventListener("keydown", function (event) {
                const keyId = getKeyIdFromElementId(event.currentTarget);
                const min = currentRowLimit * (currentPage - 1) + 1;
                const max = Math.min(currentRowLimit * (currentPage), keysFiltered.length);
                const currentKey = keysFiltered.find((key) => key.id === keyId);
                const currentKeyIndex = keysFiltered.indexOf(currentKey)
                if (currentKeyIndex >= 0) {
                    switch (event.key) {
                        case 'ArrowDown':
                            let belowElementId;
                            let belowElement;
                            if (currentKeyIndex === max - 1) {
                                let firstNotDisabledPaginationHeaderButton = document.querySelector(".pagination .page-item-footer:not(.disabled) .page-link");
                                if (firstNotDisabledPaginationHeaderButton) {
                                    belowElement = firstNotDisabledPaginationHeaderButton;
                                } else {
                                    belowElementId = event.currentTarget.id.replace('key_' + keyId, 'key_' + keysFiltered[min - 1].id);
                                    belowElement = document.getElementById(belowElementId);
                                }
                            } else {
                                belowElementId = event.currentTarget.id.replace('key_' + keyId, 'key_' + keysFiltered[currentKeyIndex + 1].id);
                                belowElement = document.getElementById(belowElementId);
                            }

                            if (belowElement) {
                                setTimeout(function () {
                                    belowElement.focus({preventScroll: false});
                                }, 0);
                            }
                            break;
                        case 'ArrowUp':
                            let aboveElementId;
                            let aboveElement;

                            if (currentKeyIndex === min - 1) {
                                const paginationHeaderButtons = document.querySelectorAll(".pagination .page-item-header .page-link");
                                let lastNotDisabledPaginationHeaderButton;
                                for (let i = paginationHeaderButtons.length - 1; i >= 0; i--) {
                                    let curButton = paginationHeaderButtons[i];
                                    if (!curButton.parentElement.classList.contains('disabled')) {
                                        lastNotDisabledPaginationHeaderButton = curButton;
                                        break;
                                    }
                                }
                                if (lastNotDisabledPaginationHeaderButton) {
                                    aboveElement = lastNotDisabledPaginationHeaderButton;
                                } else {
                                    aboveElementId = event.currentTarget.id.replace('key_' + keyId, 'key_' + keysFiltered[max - 1].id);
                                    aboveElement = document.getElementById(aboveElementId);
                                }
                            } else {
                                aboveElementId = event.currentTarget.id.replace('key_' + keyId, 'key_' + keysFiltered[currentKeyIndex - 1].id);
                                aboveElement = document.getElementById(aboveElementId);
                            }
                            if (aboveElement) {
                                setTimeout(function () {
                                    aboveElement.focus({preventScroll: false});
                                }, 0);
                            }
                            break;
                    }
                }
            });
        }
    )

    const keysActionButtons = Array.from(document.querySelectorAll(
        "button[id^='key_'][id*='_btn_url']," +
        "button[id^='key_'][id*='_btn_remove']," +
        "button[id^='key_'][id*='_btn_limit']"));
    keysActionButtons.forEach((btn) => {
            btn.addEventListener("keydown", function (event) {
                const currentElementIndex = keysActionButtons.indexOf(btn)
                if (currentElementIndex >= 0) {
                    switch (event.key) {
                        case 'ArrowRight':
                            if (currentElementIndex >= 0) {
                                let nextElement;
                                if (currentElementIndex === keysActionButtons.length - 1) {
                                    nextElement = keysActionButtons[0];
                                } else {
                                    nextElement = keysActionButtons[currentElementIndex + 1];
                                }
                                if (nextElement) {
                                    setTimeout(function () {
                                        nextElement.focus({preventScroll: false});
                                    }, 0);
                                }
                            }
                            break;
                        case 'ArrowLeft':
                            if (currentElementIndex >= 0) {
                                let prevElement;
                                if (currentElementIndex === 0) {
                                    prevElement = keysActionButtons[keysActionButtons.length - 1];
                                } else {
                                    prevElement = keysActionButtons[currentElementIndex - 1];
                                }
                                if (prevElement) {
                                    setTimeout(function () {
                                        prevElement.focus({preventScroll: false});
                                    }, 0);
                                }
                            }
                            break;
                    }
                }
            });
        }
    )
}

function appendButtons(fieldId, functions) {

    let buttonsWrapper = document.createElement('div');
    buttonsWrapper.classList.add('input-group-btn-wrapper');
    if (functions.save) {
        let btnSave = document.createElement('button');
        btnSave.id = fieldId + "_btn_save";
        btnSave.classList.add('input-group-btn', 'input-group-btn-save');
        functions.save.display ? displayElement(btnSave) : undisplayElement(btnSave);
        btnSave.title = "Save";
        btnSave.addEventListener('click', (event) => functions.save.function(event));
        btnSave.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" fill="currentColor" class="bi bi-check-square" viewBox="0 0 16 16" style="/* width: 5rem; */">\n' +
            '  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"></path>\n' +
            '  <path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022z"></path>\n' +
            '</svg>';

        buttonsWrapper.append(btnSave);
    }

    if (functions.cancel) {
        let btnCancel = document.createElement('button');
        btnCancel.id = fieldId + "_btn_cancel";
        btnCancel.classList.add('input-group-btn', 'input-group-btn-cancel');
        functions.cancel.display ? displayElement(btnCancel) : undisplayElement(btnCancel);
        btnCancel.title = "Discard";
        btnCancel.addEventListener('click', (event) => functions.cancel.function(event));
        btnCancel.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" fill="currentColor" class="bi bi-dash-square" viewBox="0 0 16 16">\n' +
            '  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>\n' +
            '  <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>\n' +
            '</svg>';
        buttonsWrapper.append(btnCancel);
    }
    if (functions.remove) {
        let btnRemove = document.createElement('button');
        btnRemove.id = fieldId + "_btn_remove";
        btnRemove.classList.add('input-group-btn', 'input-group-btn-remove');
        functions.remove.display ? displayElement(btnRemove) : undisplayElement(btnRemove);
        btnRemove.title = "Remove";
        btnRemove.addEventListener('click', (event) => functions.remove.function(event));
        btnRemove.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">\n' +
            '  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>\n' +
            '  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>\n' +
            '</svg>';
        buttonsWrapper.append(btnRemove);
    }
    this.append(buttonsWrapper);
    return this;
}

function createMobileKeys() {
    let columns = {
        id: {
            title: 'Access key ID',
            name: 'ID',
            type: 'text',
            disabled: true
        },
        name: {
            title: 'Key name',
            name: 'Name',
            type: 'text',
            changeable: true,
            onSave: setKeyProperty
        },
        port: {
            title: 'Key port',
            name: "Port",
            type: 'text',
            disabled: true
        },
        transfer: {
            title: 'Data transfer (last 30 days)',
            name: 'Transfer',
            type: 'text',
            isBytes: true,
            disabled: true
        },
        limit: {
            title: 'Key limit (0-8.2Pb) per last 30days',
            name: 'Limit',
            type: 'text',
            disabled: true,
            isBytes: true,
            custom: true
        }
    }

    let keysWrapper = document.getElementById('keys_mobile_body');
    let min = currentRowLimit * (currentPage - 1) + 1;
    let max = Math.min(currentRowLimit * (currentPage), keysFiltered.length);
    let fragmentRows = document.createDocumentFragment();
    for (let counter = min; counter <= max; counter++) {
        let currentKey = keysFiltered[counter - 1];
        let id = currentKey.id;
        let accessKeyWrapper = document.createElement('div');
        accessKeyWrapper.className = "key-mobile";
        accessKeyWrapper.id = 'key_' + id + '_mobile';

        for (let keyProperty of Object.keys(columns)) {
            if (!columns.hasOwnProperty(keyProperty)) continue;
            let fieldId = 'key_' + id + '_' + keyProperty + (columns[keyProperty].custom ? "_custom" : "");

            let group = document.createElement('div');
            group.className = 'input-group';
            let label = document.createElement('label');
            label.classList.add('input-group-text', 'input-group-label-mobile');
            if (keyProperty === 'id') {
                label.classList.add('label-id-mobile');
            }
            label.htmlFor = fieldId;
            label.innerText = columns[keyProperty].name;
            group.appendChild(label);

            let input = document.createElement('input');
            input.type = columns[keyProperty].type;
            input.classList.add('form-control', 'input-group-value-mobile');
            if (keyProperty === 'id') {
                input.classList.add('value-id-mobile');
            }
            input.id = fieldId;
            input.disabled = columns[keyProperty].disabled;
            input.title = columns[keyProperty].title;
            input.value = currentKey[keyProperty];
            input.min = columns[keyProperty].min ? columns[keyProperty].min : '';
            input.max = columns[keyProperty].max ? columns[keyProperty].max : '';

            group.appendChild(input);

            if (keyProperty === 'port') {
                let btnCopyUrl = document.createElement('button');
                btnCopyUrl.type = 'button';
                btnCopyUrl.classList.add('btn', 'btn-primary', 'input-group-btn-mobile');
                btnCopyUrl.id = 'key_' + id + '_btn_url';
                btnCopyUrl.title = 'Copy Access Key URL';
                btnCopyUrl.dataset.url = currentKey.accessUrl;
                btnCopyUrl.innerText = 'COPY URL';
                btnCopyUrl.addEventListener('click', (event) => copyUrlToClipboard(event))
                group.appendChild(btnCopyUrl);
            } else if (keyProperty === 'transfer') {
                let btnRemove = document.createElement('button');
                btnRemove.type = 'button';
                btnRemove.classList.add('btn', 'btn-danger', 'input-group-btn-mobile');
                btnRemove.id = 'key_' + id + '_btn_remove';
                btnRemove.title = 'Remove Key';
                btnRemove.innerText = 'REMOVE KEY';
                btnRemove.addEventListener('click', (event) => removeKey(event))
                group.appendChild(btnRemove);
            }

            if (columns[keyProperty].isBytes) {
                let bytes = new DataByte(currentKey[keyProperty]);
                input.value = (bytes.bytes !== undefined ? bytes.toString() : '');
                input.disabled = true;
                if (keyProperty === 'limit' && currentKey.limitCustom !== undefined) {
                    input.classList.add('limit-custom');
                } else if (keyProperty === 'transfer' && currentKey.transfer >= currentKey.limit) {
                    input.classList.add('limit-exceeded');
                }
            }

            if (columns[keyProperty].changeable) {
                let functionsName = {
                    save: {function: handleKeyPropertySave, display: false},
                    cancel: {function: handleKeyPropertyCancel, display: false}
                };
                group = appendButtons.call(group, fieldId, functionsName)

                input.addEventListener('input', (event) => {
                        let buttons = document.querySelectorAll("[id*='" + event.currentTarget.id + "_btn_save']," +
                            "[id*='" + event.currentTarget.id + "_btn_cancel']");
                        let keyId = getKeyIdFromElementId(event.currentTarget);
                        let keyProperty = getKeyPropertyFromElementId(event.currentTarget);
                        let currentKey = keysFiltered.find((key) => key.id === keyId);
                        if ((event.currentTarget.min || event.currentTarget.max) && !validNumberBoundaries(event.currentTarget)) {
                            return;
                        }
                        if (currentKey[keyProperty].toString() === event.currentTarget.value) {
                            buttons.forEach(button => {
                                undisplayElement(button)
                            })
                        } else {
                            buttons.forEach(button => {
                                displayElement(button)
                            })
                        }
                    }
                )
            }
            if (columns[keyProperty].isBytes && columns[keyProperty].custom) {
                let actionSetCustomLimit = document.createElement('button');
                actionSetCustomLimit.classList.add('btn', 'btn-primary', 'input-group-btn-mobile');
                actionSetCustomLimit.title = "Set Custom Data Limit"
                actionSetCustomLimit.id = "row_" + currentKey.id + "_btn_limit";
                actionSetCustomLimit.innerText = 'LIMIT';
                actionSetCustomLimit.addEventListener('click', (event) => setKeyLimit(event));
                group.appendChild(actionSetCustomLimit)
            }
            accessKeyWrapper.appendChild(group);
        }
        fragmentRows.appendChild(accessKeyWrapper);
    }
    keysWrapper.appendChild(fragmentRows);
}

function handleKeyPropertySave(event) {
    const keyId = getKeyIdFromElementId(event.currentTarget);
    const keyProperty = getKeyPropertyFromElementId(event.currentTarget);
    const inputId = 'key_' + keyId + '_' + keyProperty;
    let value = document.getElementById(inputId).value;
    if (['limit', 'transfer'].includes(keyProperty)) {
        value = calculateTotalBytes(inputId);
    }
    document.getElementById('key_' + keyId + '_name').focus();
    setKeyProperty(keyId, keyProperty, value);
}

function handleKeyPropertyRemove(event) {
    const keyId = getKeyIdFromElementId(event.currentTarget);
    const keyProperty = getKeyPropertyFromElementId(event.currentTarget);
    removeKeyProperty(keyId, keyProperty);
}

function handleKeyPropertyCancel(event) {
    const inputId = event.currentTarget.id.substring(0, event.currentTarget.id.indexOf('_btn'))
    const keyId = getKeyIdFromElementId(event.currentTarget);
    const keyProperty = getKeyPropertyFromElementId(event.currentTarget);
    let input = document.getElementById(inputId);
    let value = keysFiltered.find((el) => el.id === keyId)[keyProperty];
    if (keyProperty === 'limit') {
        value = keysFiltered.find((el) => el.id === keyId)['limitCustom'];
        let bytesLimit = new DataByte(value)
        value = bytesLimit.number;
        let select = document.getElementById(inputId + "_select");
        select.selectedIndex = BYTE_RANGES.findIndex((el) => el.value === bytesLimit.range);
    }
    input.value = value;
    let buttonSave = document.getElementById(inputId + '_btn_save');
    let buttonCancel = document.getElementById(inputId + '_btn_cancel');
    document.getElementById('key_' + keyId + '_name').focus();
    [buttonSave, buttonCancel].forEach(button => undisplayElement(button))
}

export function updateKeysPage() {
    clearKeysElements();

    if (!keysFiltered || keysFiltered.length <= 0) {
        return;
    }
    keysFiltered =
        keysFiltered
            .filter(el => el[sort.column] !== undefined)
            .sort((el1, el2) => {
                let val1 = el1[sort.column];
                let val2 = el2[sort.column];
                if (typeof val1 === 'string' || typeof val2 === 'string') {
                    return sort.order * val1.localeCompare(val2);
                } else if (typeof val1 === 'number' || typeof val2 === 'number') {
                    if (val1 === val2) {
                        return sort.order * (el1.id - el2.id);
                    } else {
                        return sort.order * (val1 - val2);
                    }
                }
            }).concat(
            keysFiltered
                .filter(el => el[sort.column] === undefined)
        )

    let root = document.querySelector(':root');
    if (window.viewType === VIEW_TYPE.DESKTOP) {
        root.style.setProperty('--default-font-size', 'var(--desktop-font-size)');
        paginationWidth = DESKTOP_PAGINATION_WIDTH;
        createDesktopKeys();
    } else {
        paginationWidth = MOBILE_PAGINATION_WIDTH;
        root.style.setProperty('--default-font-size', 'var(--mobile-font-size)');
        createMobileKeys();
    }
    createKeysPagination()
    createSortableElements();

    undisplayElement(document.querySelector('#keys_empty'));
    document.querySelectorAll('.pagination-navigation-wrapper').forEach((el) => {
        displayElement(el)
    })

    displayScrollButtons();

    const activePage = document.getElementById('page_' + currentPage + '_header');
    activePage && activePage.focus();
}

export function createKeysPagination() {

    let paginations = document.querySelectorAll('.pagination-navigation-wrapper');
    if (paginations) {
        paginations.forEach((pagination) => {
                const pageItemClasses = ['page-item'];
                if (pagination.classList.contains('pagination-header')) {
                    pageItemClasses.push('page-item-header');
                } else if (pagination.classList.contains('pagination-footer')) {
                    pageItemClasses.push('page-item-footer');
                }
                pagination.innerHTML = '';
                let nav = document.createElement('nav');
                let divRowLimit = document.createElement('div');
                divRowLimit.className = 'pagination-row-limit-wrapper';
                divRowLimit.title = 'Keys amount on one page';
                let selectRowLimit = document.createElement('select');
                selectRowLimit.classList.add("form-select", "pagination-row-limit");
                selectRowLimit.ariaLabel = "Row limit on page";
                PAGE_ROW_LIMITS.forEach(value => {
                    let option = document.createElement('option');
                    option.value = '' + value;
                    option.innerHTML = '' + value;
                    if (value === currentRowLimit) {
                        option.selected = true;
                    }
                    selectRowLimit.appendChild(option);
                })
                selectRowLimit.addEventListener('change', (event) => {
                    let firstRowIndex = (currentPage - 1) * currentRowLimit + 1;
                    currentRowLimit = parseInt(selectRowLimit[selectRowLimit.selectedIndex].value);
                    let selectedPage = Math.ceil(firstRowIndex / currentRowLimit);
                    let pageRowLimits = document.querySelectorAll('.page-row-limit');
                    pageRowLimits.forEach((el) => {
                        el.selectedIndex = event.currentTarget.selectedIndex;
                    })
                    updateCurrentPageNumber(selectedPage);
                    updateKeysPage();
                })
                divRowLimit.appendChild(selectRowLimit);
                nav.appendChild(divRowLimit);

                let divKeysCounter = document.createElement('div');
                divKeysCounter.className = 'pagination-keys-counter';
                divKeysCounter.title = "Filtered keys / All keys"
                let spanCounter = document.createElement('span');
                let minKeyNumber = currentRowLimit * (currentPage - 1) + 1;
                let maxKeyNumber = Math.min(currentRowLimit * (currentPage), keysFiltered.length);
                spanCounter.innerText = '[' + minKeyNumber + '-' + maxKeyNumber + ']/' + keysFiltered.length;
                divKeysCounter.appendChild(spanCounter);
                nav.appendChild(divKeysCounter);

                let divPagination = document.createElement('div');
                divPagination.className = 'pagination-navigation';
                let ul = document.createElement('ul');
                ul.classList.add("pagination", "justify-content-center");
                let liFirst = document.createElement('li');
                liFirst.classList.add(...pageItemClasses);
                currentPage === 1 ? liFirst.classList.add("disabled") : undefined;
                liFirst.title = "Go to first page";
                let pageFirst = document.createElement('button');
                pageFirst.className = "page-link";
                currentPage === 1 ? pageFirst.tabIndex = -1 : undefined;
                pageFirst.innerText = "<<"
                pageFirst.addEventListener('click', () => {
                    updateCurrentPageNumber(1);
                    updateKeysPage()
                });
                liFirst.appendChild(pageFirst);
                ul.appendChild(liFirst);

                let liPrev = document.createElement('li');
                liPrev.classList.add(...pageItemClasses);
                liPrev.title = "Go to previous page";
                currentPage === 1 ? liPrev.classList.add("disabled") : undefined;

                let pagePrev = document.createElement('button');
                pagePrev.classList.add('page-link');
                currentPage === 1 ? pagePrev.tabIndex = -1 : undefined;
                pagePrev.innerText = "<"
                pagePrev.addEventListener('click', () => {
                    updateCurrentPageNumber(currentPage - 1);
                    updateKeysPage();
                });
                liPrev.appendChild(pagePrev);
                ul.appendChild(liPrev);

                let pagesAmount = Math.ceil(keysFiltered.length / currentRowLimit);
                let maxPageNumber = Math.min(Math.max(currentPage + paginationWidth, paginationWidth * 2 + 1), pagesAmount);
                let minPageNumber = Math.max(Math.min(currentPage - paginationWidth, pagesAmount - paginationWidth * 2), 1);
                for (let i = minPageNumber; i <= maxPageNumber; i++) {
                    let liNum = document.createElement('li');
                    liNum.classList.add(...pageItemClasses);
                    liNum.title = "Go to " + i + " page";
                    currentPage === i ? liNum.classList.add("active") : ''
                    let pageNum = document.createElement('button');
                    pageNum.className = "page-link";
                    pageNum.innerText = i + "";
                    pageNum.id = 'page_' + i + '_header';
                    pageNum.addEventListener('click', () => {
                        updateCurrentPageNumber(i);
                        updateKeysPage()
                    });
                    liNum.appendChild(pageNum);
                    ul.appendChild(liNum);
                }

                let liNext = document.createElement('li');
                liNext.classList.add(...pageItemClasses);
                liNext.title = "Go to next page";
                currentPage === Math.ceil(keysFiltered.length / currentRowLimit) ? liNext.classList.add("disabled") : undefined;

                let pageNext = document.createElement('button');
                pageNext.classList.add("page-link");
                currentPage === Math.ceil(keysFiltered.length / currentRowLimit) ? pageNext.tabIndex = -1 : undefined;
                pageNext.innerText = ">"
                pageNext.addEventListener('click', () => {
                    updateCurrentPageNumber(currentPage + 1);
                    updateKeysPage()
                });
                liNext.appendChild(pageNext);
                ul.appendChild(liNext);
                let liLast = document.createElement('li');
                liLast.classList.add(...pageItemClasses);
                liLast.title = "Go to last page";
                currentPage === Math.ceil(keysFiltered.length / currentRowLimit) ? liLast.classList.add("disabled") : undefined;
                let pageLast = document.createElement('button');
                pageLast.classList.add("page-link");
                currentPage === Math.ceil(keysFiltered.length / currentRowLimit) ? pageLast.tabIndex = -1 : undefined;
                pageLast.innerText = ">>"
                pageLast.addEventListener('click', () => {
                        updateCurrentPageNumber(Math.ceil(keysFiltered.length / currentRowLimit));
                        updateKeysPage()
                    }
                );

                liLast.appendChild(pageLast);
                ul.appendChild(liLast);

                divPagination.appendChild(ul);
                nav.appendChild(divPagination);

                let divSort = document.createElement('div');
                divSort.className = 'pagination-sort-wrapper';
                divSort.title = 'Sort order and column';
                let selectSort = document.createElement('select');
                selectSort.classList.add("form-select", "pagination-sort");
                selectSort.ariaLabel = "Sort order";
                PAGE_SORTABLE_COLUMNS.forEach(value => {
                    let option = document.createElement('option');
                    option.value = '' + value;
                    option.innerHTML = ' ' + value;
                    if (value === sort.column) {
                        option.selected = true;
                        option.innerHTML = (sort.order === ORDER.ASC ? '&#9650;' : '&#9660;') + sort.column;
                    }
                    selectSort.appendChild(option);
                })
                selectSort.addEventListener('click', (event) => {
                    if (event.currentTarget.selectedIndex === -1) {
                        createSortableElements();
                    } else {
                        let sortColumn = event.currentTarget[event.currentTarget.selectedIndex].value
                        updateSortOrder(sortColumn);
                        updateKeysPage();
                    }
                })
                selectSort.addEventListener("focus", function (event) {
                    event.currentTarget.selectedIndex = -1;
                });
                selectSort.addEventListener("blur", function (event) {
                    if (event.currentTarget.selectedIndex === -1) {
                        createSortableElements();
                    }
                });
                divSort.appendChild(selectSort);
                nav.appendChild(divSort);

                pagination.appendChild(nav);
            }
        )
    }
    let pageItems = document.querySelectorAll('.page-item');
    pageItems.forEach((btn) => {
        btn.addEventListener("keydown", function (event) {
            switch (event.key) {
                case 'ArrowLeft':
                    event.currentTarget.previousSibling
                    && event.currentTarget.previousSibling.classList.contains('page-item')
                    && !event.currentTarget.previousSibling.classList.contains('disabled')
                    && event.currentTarget.previousSibling.childNodes[0]
                    && event.currentTarget.previousSibling.childNodes[0].focus();
                    break;
                case 'ArrowRight':
                    event.currentTarget.nextSibling
                    && event.currentTarget.nextSibling.classList.contains('page-item')
                    && !event.currentTarget.nextSibling.classList.contains('disabled')
                    && event.currentTarget.nextSibling.childNodes[0]
                    && event.currentTarget.nextSibling.childNodes[0].focus();
                    break;
                case 'ArrowDown':
                    if (btn.classList.contains('page-item-header')) {
                        let names = document.querySelectorAll("input[id^='key_'][id$='_name']");
                        if (names.length > 0) {
                            names[0].focus();
                        }
                    }
                    break;
                case 'ArrowUp':
                    if (btn.classList.contains('page-item-footer')) {
                        let names = document.querySelectorAll("input[id^='key_'][id$='_name']");
                        if (names.length > 0) {
                            names[names.length - 1].focus();
                        }
                    }
                    break;
            }

        });
    })
}

export async function removeKey(event) {
    const keyId = getKeyIdFromElementId(event.currentTarget);
    if (!confirm('Are you sure want to remove key \'' + keyId + '\'?')) {
        console.log('Remove cancelled');
        return;
    }
    blockUI();
    showToastMessage(MESSAGE_KEY_REMOVE_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let data = JSON.stringify({id: keyId});
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_KEY_REMOVE + '&serverUuid=' + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        const currentKey = keysFiltered.find((key) => key.id === keyId);
                        const currentKeyIndex = keysFiltered.indexOf(currentKey)
                        for (let i = keys.length - 1; i >= 0; i--) {
                            if (keys[i].id === keyId) {
                                keys.splice(i, 1);
                            }
                        }
                        showToastMessage(MESSAGE_KEY_REMOVE_SUCCESS + ' ' + keyId, TOAST_MESSAGE_DELAY_SEC);
                        updateKeys();
                        updateCurrentPageNumber();
                        updateKeysPage();
                        const max = Math.min(currentRowLimit * (currentPage), keysFiltered.length);
                        if (max > 0) {
                            let nextKeyId;
                            if (currentKeyIndex >= max - 1) {
                                nextKeyId = keysFiltered[max - 1].id;
                            } else {
                                nextKeyId = keysFiltered[currentKeyIndex].id;
                            }
                            let nextElement = document.getElementById('key_' + nextKeyId + '_btn_remove');
                            if (nextElement) {
                                setTimeout(function () {
                                    nextElement.focus({preventScroll: false});
                                }, 0);
                            }
                        }
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_KEY_REMOVE_FAILED);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_KEY_REMOVE_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function editServer(event) {

    let serverDialog = document.getElementById('modal_server_dialog')
    if (window.viewType === VIEW_TYPE.MOBILE) {
        serverDialog.classList.add('modal-lg', 'modal-dialog-max-w-80');
    } else {
        serverDialog.classList.remove('modal-lg', 'modal-dialog-max-w-80');
    }

    const modalServerHeader = document.getElementById('modal_server_header')
    const modalServerSaveButton = document.getElementById('modal_server_save')
    modalServerHeader.innerText = 'ADD SERVER'
    let editedServer = {};

    const modalServerTitle = document.getElementById('modal_server_title')
    const modalServerUrl = document.getElementById('modal_server_url')
    modalServerTitle.value = '';
    modalServerUrl.value = ''
    let changed = '';
    if (event.currentTarget.id) {
        modalServerHeader.innerText = 'EDIT SERVER'
        const uuid = getServerUuidFromElementId(event.currentTarget);
        editedServer = servers.find((server) => server.uuid === uuid)
        modalServerTitle.value = editedServer.title;
        modalServerUrl.value = editedServer.url;
        changed = editedServer.changed;
    }

    modalServerSaveButton.onclick = () => {
        editedServer.title = modalServerTitle.value;
        editedServer.url = modalServerUrl.value;
        editedServer.changed = changed
        saveServer(editedServer);
        currentModal.hide();
    };
    const modalServerWindow = document.getElementById('modal_server_window')
    currentModal = new bootstrap.Modal(modalServerWindow, {
        backdrop: false,
        keyboard: true
    })
    currentModal.show();

    return undefined;
}

async function removeServer(serverUuid) {
    const selectedServer = servers.find((server) => server.uuid === serverUuid)
    if (!selectedServer) {
        showToastMessage(`Server with uuid ${serverUuid} not exists`, TOAST_MESSAGE_DELAY_SEC);
        return;
    }
    if (!confirm('Are you sure want to remove server \'' + selectedServer.title + '\'?')) {
        console.log('Remove canceled');
        return;
    }
    blockUI();
    showToastMessage(MESSAGE_SERVER_REMOVE_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVER_REMOVE + '&serverUuid=' + serverUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        const newServers = servers.filter(el => el.uuid !== serverUuid)
                        if (currentServerUuid === serverUuid && newServers.length !== 0) {
                            currentServerUuid = newServers[0].uuid;
                            getServer();
                        }
                        updateServers(newServers);
                        showToastMessage(MESSAGE_SERVER_REMOVE_SUCCESS + ' ' + serverUuid, TOAST_MESSAGE_DELAY_SEC);
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_SERVER_REMOVE_FAILED);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVER_REMOVE_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

async function removeServers() {
    if (!confirm('Are you sure want to remove all servers ?')) {
        console.log('Remove all servers canceled');
        return;
    }
    blockUI();
    showToastMessage(MESSAGE_SERVERS_REMOVE_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVERS_REMOVE, options)
            .then(function (response) {
                    if (response.ok) {
                        updateServers([]);
                        showToastMessage(MESSAGE_SERVERS_REMOVE_SUCCESS, TOAST_MESSAGE_DELAY_SEC);
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_SERVERS_REMOVE_FAILED);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVERS_REMOVE_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function setKeyProperty(id, property, newValue) {
    blockUI();
    let newValueText = newValue;
    if (property === 'limit') {
        newValueText = new DataByte(newValue).toString();
    }
    showToastMessage(MESSAGE_KEY_SET_PROPERTY_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let data = JSON.stringify({id: id, property: property, value: newValue});
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_KEY_SET_PROPERTY + "&serverUuid=" + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        let currentKey = keys.find((el) => el.id === Number(id));
                        let inputId = 'key_' + id + '_' + property;
                        currentKey[property] = newValue;
                        if (property === 'limit') {
                            currentKey.limitCustom = newValue;
                            currentModal.hide();
                            // let bytesLimit = new DataByte(newValue);
                            // let limitCustomElement = document.getElementById(inputId + '_custom');
                            // let transferElement = document.getElementById('key_' + id + '_transfer');
                            // if (limitCustomElement.tagName.toLowerCase() === 'input') {
                            //     limitCustomElement.value = (bytesLimit.bytes !== undefined ? bytesLimit.toString() : '');
                            // } else {
                            //     limitCustomElement.innerText = (bytesLimit.bytes !== undefined ? bytesLimit.toString() : '');
                            // }
                            // limitCustomElement.classList.add('limit-custom');
                            // if (currentKey.transfer >= currentKey.limit) {
                            //     transferElement.classList.add('limit-exceeded');
                            // } else {
                            //     transferElement.classList.remove('limit-exceeded');
                            // }
                            // let buttonRemove = document.getElementById(inputId + '_btn_remove');
                            // displayElement(buttonRemove);
                        }
                        updateKeys()
                        // let input = document.getElementById(inputId);
                        // input.dispatchEvent(new Event('input'));
                        showToastMessage(MESSAGE_KEY_SET_PROPERTY_SUCCESS + " '" + property + "':'" + newValueText + "'", TOAST_MESSAGE_DELAY_SEC);
                        updateKeysPage()

                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_KEY_SET_PROPERTY_FAILED);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_KEY_SET_PROPERTY_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function removeKeyProperty(id, property) {
    blockUI();
    showToastMessage(MESSAGE_KEY_SET_PROPERTY_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let data = JSON.stringify({id: id, property: property});
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_KEY_REMOVE_PROPERTY + "&serverUuid=" + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        let currentKey = keys.find((el) => el.id === Number(id));
                        let inputId = 'key_' + id + '_' + property;
                        if (property === 'limit') {
                            delete currentKey.limitCustom;
                            currentKey.limit = serverProperties.limit !== undefined ? serverProperties.limit : undefined;
                            currentModal.hide();
                            // let btnRemove = document.getElementById(inputId + '_btn_remove');
                            // undisplayElement(btnRemove);

                            // let bytesLimit = new DataByte(currentKey.limit)
                            // let spanLimitCustom = document.getElementById(inputId + '_custom');
                            // let transferElement = document.getElementById('key_' + id + '_transfer');
                            // if (spanLimitCustom.tagName.toLowerCase() === 'input') {
                            //     spanLimitCustom.value = (bytesLimit.bytes !== undefined ? bytesLimit.toString() : '');
                            // } else {
                            //     spanLimitCustom.innerText = (bytesLimit.bytes !== undefined ? bytesLimit.toString() : '');
                            // }
                            // spanLimitCustom.classList.remove('limit-custom');
                            // if (currentKey.transfer >= currentKey.limit) {
                            //     transferElement.classList.add('limit-exceeded');
                            // } else {
                            //     transferElement.classList.remove('limit-exceeded');
                            // }
                        }
                        updateKeys()
                        // let btnCancel = document.getElementById(inputId + '_btn_cancel');
                        // btnCancel.dispatchEvent(new Event('click'));
                        showToastMessage(MESSAGE_KEY_SET_PROPERTY_SUCCESS + " '" + property + "':'disabled'", TOAST_MESSAGE_DELAY_SEC);
                        updateKeysPage()
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_KEY_SET_PROPERTY_FAILED);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_KEY_SET_PROPERTY_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function removeKeysCustomLimits() {
    if (!confirm('Are you sure want to remove all custom limits ?')) {
        console.log('Remove cancelled');
        return;
    }

    blockUI();
    showToastMessage(MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let data = '';
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_KEYS_REMOVE_CUSTOM_LIMITS + "&serverUuid=" + currentServerUuid, options)
            .then(async function (response) {
                    if (response.ok) {
                        keys.forEach((currentKey) => {
                            delete currentKey.limitCustom;
                        })
                        await updateServerProperty('limit', serverProperties.limit)
                            .then(() => {
                                showToastMessage(MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_SUCCESS, TOAST_MESSAGE_DELAY_SEC);
                            })
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_FAILED);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function removeKeys() {
    if (!confirm('Are you sure want to remove all keys ?')) {
        console.log('Remove cancelled');
        return;
    }
    blockUI();
    showToastMessage(MESSAGE_KEYS_REMOVE_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let data = '';
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_KEYS_REMOVE + "&serverUuid=" + currentServerUuid, options)
            .then(async function (response) {
                    if (response.ok) {
                        updateKeys([]);
                        updateKeysPage();
                        showToastMessage(MESSAGE_KEYS_REMOVE_SUCCESS);
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_KEYS_REMOVE_FAILED);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_KEYS_REMOVE_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function addKeys() {
    let input = prompt("How many keys you want to add", '5');
    if (input === null) return;
    const amount = parseInt(input);
    if (isNaN(amount) || amount < 1 || amount > NEW_KEYS_MAX_NUMBER) {
        showToastMessage(`Failed. Please input correct number between 1 and ${NEW_KEYS_MAX_NUMBER}`, TOAST_MESSAGE_DELAY_SEC);
        return;
    }
    await addKey(amount);
}

export async function addKey(amount) {
    blockUI();
    showToastMessage(MESSAGE_KEY_ADD_STARTED, TOAST_MESSAGE_DELAY_SEC);
    const data = JSON.stringify({amount: amount})
    const headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_KEY_ADD + "&serverUuid=" + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        return response.json().then(function (arr) {
                            showToastMessage(MESSAGE_KEY_ADD_SUCCESS + " [" + arr.map(el => el.id).join(',') + ']', TOAST_MESSAGE_DELAY_SEC)
                            updateKeys(keys.concat(arr))
                            updateCurrentPageNumber();
                            updateKeysPage();
                        });
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_KEY_ADD_FAILED);
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

function updateKeysLimits() {
    keys.forEach((key) => {
        if (key.limitCustom !== undefined) {
            key.limit = key.limitCustom;
        } else if (serverProperties.limit !== undefined) {
            key.limit = serverProperties.limit;
        } else {
            key.limit = undefined;
        }
    })
}

async function updateServerProperty(property, value) {
    serverProperties[property] = value;
    if (property === 'limit') {
        updateKeysLimits();
        updateKeys();
        updateKeysPage();
    }
}

export async function setServerProperty(property, newValue) {

    blockUI();
    let newValueText = newValue;
    if (property === 'limit') {
        newValueText = new DataByte(newValue).toString();
    }
    showToastMessage(MESSAGE_SERVER_SET_PROPERTY_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let data = JSON.stringify({property: property, value: newValue + ''});
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVER_SET_PROPERTY + "&serverUuid=" + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        updateServerProperty(property, newValue);
                        let input = document.getElementById('server_' + property);
                        input.dispatchEvent(new Event('input'));
                        showToastMessage(MESSAGE_SERVER_SET_PROPERTY_SUCCESS + " '" + property + "':'" + newValueText + "'", TOAST_MESSAGE_DELAY_SEC);
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_SERVER_SET_PROPERTY_FAILED + " '" + property + "':'" + newValueText + "'");
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVER_SET_PROPERTY_FAILED + " '" + property + "':'" + newValueText + "'");
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export async function removeServerProperty(property) {
    blockUI();
    showToastMessage(MESSAGE_SERVER_SET_PROPERTY_STARTED, TOAST_MESSAGE_DELAY_SEC);
    let data = JSON.stringify({property: property});
    let headers = {
        "Content-type": "application/json",
        'Authorization': `Bearer ${window.credentials.jwt}`
    };
    let options = {method: "POST", headers: headers, body: data};
    try {
        await fetch(MANAGER_URL + "/?action=" + ACTION_SERVER_REMOVE_PROPERTY + "&serverUuid=" + currentServerUuid, options)
            .then(function (response) {
                    if (response.ok) {
                        updateServerProperty(property, undefined);
                        let input = document.getElementById('server_' + property);
                        input.value = '';
                        if (property === 'limit') {
                            let selector = document.getElementById('server_' + property + '_select');
                            selector.selectedIndex = 0;
                        }
                        showToastMessage(MESSAGE_SERVER_SET_PROPERTY_SUCCESS + " '" + property + "':'disabled'", TOAST_MESSAGE_DELAY_SEC);
                    } else {
                        return response.text().then(function (text) {
                            console.error(text);
                            showToastError(MESSAGE_SERVER_SET_PROPERTY_FAILED + " '" + property + "':'disabled'");
                        });
                    }
                }
            )
    } catch (error) {
        console.error(error);
        if (error.stack) {
            showToastError(MESSAGE_SERVER_SET_PROPERTY_FAILED + " '" + property + "':'disabled'");
        } else {
            showToastError(error);
        }
    } finally {
        unblockUI();
    }
}

export function logout() {
    let form = postForm(ROOT_RELATIVE_REDIRECT_URL, {message: 'You logout. See you later!'});
    form.submit();
}

export function copyUrlToClipboard(event) {
    navigator.clipboard.writeText(event.currentTarget.dataset.url);
    showToastMessage(MESSAGE_KEY_URL_COPIED_TO_CLIPBOARD, TOAST_MESSAGE_DELAY_SEC);
}

export function showFilterWindow() {

    let modalFilterWindow = document.getElementById('modal_filter_window')
    currentModal = new bootstrap.Modal(modalFilterWindow, {
        backdrop: false,
        keyboard: true
    })
    for (let property of Object.keys(FILTER_KEY_PROPERTIES)) {
        if (typeof currentFilter[property] === 'object') {
            Object.getOwnPropertyNames(currentFilter[property]).forEach((postfix) => {
                let input = document.getElementById('filter_' + property + '_' + postfix)
                let btnRemove = document.getElementById('filter_' + property + '_' + postfix + '_btn_remove')
                if (FILTER_KEY_PROPERTIES[property].isBytes) {
                    let bytes = new DataByte(currentFilter[property][postfix]);
                    input.value = bytes.number;
                    if (bytes.number !== 0) {
                        let select = document.getElementById(input.id + "_select");
                        select.selectedIndex = BYTE_RANGES.findIndex((el) => el.value === bytes.range);
                    }
                } else {
                    input.value = currentFilter[property][postfix];
                }
                currentFilter[property][postfix] === undefined ? undisplayElement(btnRemove) : displayElement(btnRemove);

            })
        } else if (typeof currentFilter[property] === 'string') {
            let input = document.getElementById('filter_' + property)
            let btnRemove = document.getElementById('filter_' + property + '_btn_remove')
            input.value = currentFilter[property];
            currentFilter[property] === undefined ? undisplayElement(btnRemove) : displayElement(btnRemove);
        }
    }
    currentModal.show();

}

export function closeFilterWindow() {
    currentModal.hide();

    let filterButton = document.getElementById('btn_show_filter');

    let filterSelectedFieldsCounter = countFilterFields();
    if (filterSelectedFieldsCounter) {
        filterButton.dataset.counter = filterSelectedFieldsCounter + '';
        filterButton.dataset.filtered = '' + keysFiltered.length + '/' + keys.length;
        filterButton.classList.add('keys-header-button-filter-selected');
    } else {
        filterButton.classList.remove('keys-header-button-filter-selected');
    }
}

function countFilterFields() {
    let filterSelectedFieldsCounter = 0;
    for (let field in currentFilter) {
        if (typeof currentFilter[field] === 'object') {
            for (let property in currentFilter[field]) {
                filterSelectedFieldsCounter++;
            }
        } else {
            filterSelectedFieldsCounter++;
        }
    }
    return filterSelectedFieldsCounter;
}

export function clearFilterWindow() {
    let fields = document.querySelectorAll("input[id^='filter_']");
    fields.forEach((field) => {
        field.value = '';
    })
    let removeButtons = document.querySelectorAll("[id^='filter_'][id$='_btn_remove']");
    removeButtons.forEach((button) => {
        undisplayElement(button);
    })
    let selectors = document.querySelectorAll("select[id^='filter_'][id$='select']");
    selectors.forEach((select) => {
        select.selectedIndex = 0;
    })
}

function filterKeys() {
    keysFiltered = keys.filter((key) => {
        try {
            Object.getOwnPropertyNames(currentFilter).forEach((property) => {
                if (Object.getOwnPropertyNames(currentFilter[property]).length === 0) {
                } else {
                    if (typeof currentFilter[property] === 'object') {
                        if (currentFilter[property].hasOwnProperty('start')) {
                            if (key[property] === undefined || key[property] < currentFilter[property]['start']) {
                                throw 'Filter fault';
                            }
                        }
                        if (currentFilter[property].hasOwnProperty('end')) {
                            if (key[property] === undefined || key[property] > currentFilter[property]['end']) {
                                throw 'Filter fault';
                            }
                        }
                    } else if (typeof currentFilter[property] === 'string') {
                        if (key[property] === undefined || key[property].toLowerCase().indexOf(currentFilter[property].toLowerCase()) === -1) {
                            throw 'Filter fault';
                        }
                    }
                }
            })
            return true;
        } catch (e) {
            return false;
        }

    })
}

function clearCurrentFilter() {
    currentFilter = {id: {}, port: {}, transfer: {}, limit: {}, name: {}};
}

export function saveFilterAndCloseWindow() {
    clearCurrentFilter();
    for (let property of Object.keys(FILTER_KEY_PROPERTIES)) {
        if (FILTER_KEY_PROPERTIES[property].start) {
            let inputIdStart = 'filter_' + property + '_start';
            let input = document.getElementById(inputIdStart);
            if (FILTER_KEY_PROPERTIES[property].isBytes) {
                if (input.value !== '') {
                    currentFilter[property].start = calculateTotalBytes(inputIdStart);
                }
            } else {
                if (input.value) {
                    currentFilter[property].start = input.value;
                }
            }
        }
        if (FILTER_KEY_PROPERTIES[property].end) {
            let inputIdEnd = 'filter_' + property + '_end';
            let input = document.getElementById(inputIdEnd);
            if (FILTER_KEY_PROPERTIES[property].isBytes) {
                if (input.value !== '') {
                    currentFilter[property].end = calculateTotalBytes(inputIdEnd);
                }
            } else {
                if (input.value) {
                    currentFilter[property].end = input.value;
                }
            }
        } else {
            let inputIdContains = 'filter_' + property;
            let input = document.getElementById(inputIdContains);
            if (input.value) {
                currentFilter[property] = input.value;
            }
        }
    }

    filterKeys();
    updateCurrentPageNumber();
    updateKeysPage();
    closeFilterWindow()
}


async function createScrollButtons() {
    const scrollTopButton = document.createElement("img");
    scrollTopButton.classList.add('scroll-btn', 'scroll-btn-top');
    scrollTopButton.src = './public/img/up.png'
    undisplayElement(scrollTopButton);
    scrollTopButton.id = "scroll_btn_top";
    const scrollWindowUp = function (durationMs) {
        if (document.scrollingElement.scrollTop === 0) return;

        const totalScrollDistance = document.scrollingElement.scrollTop;
        let scrollY = totalScrollDistance, oldTimestamp = null;

        function step(newTimestamp) {
            if (oldTimestamp !== null) {
                let stepScroll = totalScrollDistance * (newTimestamp - oldTimestamp) / durationMs;
                scrollY = scrollY - stepScroll;
                if (scrollY <= 0) return document.scrollingElement.scrollTop = 0;
                document.scrollingElement.scrollTop = scrollY;
            }
            oldTimestamp = newTimestamp;
            window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
        displayScrollButtons();
    };
    scrollTopButton.addEventListener("click", () => scrollWindowUp(1000));
    document.body.appendChild(scrollTopButton);

    const scrollBottomButton = document.createElement("img");
    scrollBottomButton.classList.add('scroll-btn', 'scroll-btn-bottom');
    scrollBottomButton.src = './public/img/down.png'
    undisplayElement(scrollBottomButton);
    scrollBottomButton.id = "scroll_btn_bottom";
    const scrollWindowDown = function (durationMs) {
        if (document.scrollingElement.scrollTop === document.body.scrollHeight) return;

        const totalScrollDistance = document.body.scrollHeight;
        let scrollY = 0, oldTimestamp = null;

        function step(newTimestamp) {
            if (oldTimestamp !== null) {
                let stepScroll = totalScrollDistance * (newTimestamp - oldTimestamp) / durationMs;
                scrollY = scrollY + stepScroll;
                if (scrollY >= document.body.scrollHeight) return document.scrollingElement.scrollTop = document.body.scrollHeight;
                document.scrollingElement.scrollTop = scrollY;
            }
            oldTimestamp = newTimestamp;
            window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
        displayScrollButtons();
    };
    scrollBottomButton.addEventListener("click", () => scrollWindowDown(1000));
    document.body.appendChild(scrollBottomButton);
}

export function displayScrollButtons() {
    let scrollTopButton = document.getElementById('scroll_btn_top')
    let scrollBottomButton = document.getElementById('scroll_btn_bottom')
    if (!isElementUndisplayed(document.getElementById('main_container')) && !isElementUndisplayed(document.getElementById('pills_keys'))) {
        window.scrollY > 0
            ? displayElement(scrollTopButton)
            : undisplayElement(scrollTopButton);
        window.scrollY + window.innerHeight < document.body.scrollHeight
            ? displayElement(scrollBottomButton)
            : undisplayElement(scrollBottomButton);
    } else {
        undisplayElement(scrollBottomButton);
        undisplayElement(scrollTopButton)
    }
}


function validNumberBoundaries(element) {
    return validMinBoundary(element) && validMaxBoundary(element);
}

function validMinBoundary(element) {
    if (element.min) {
        element.value = formatNumber(element.value);
        if (Number(element.value) < Number(element.min)) {
            element.value = element.min;
            showToastError(MESSAGE_NUMBER_VALUE_INVALID + ' greater than or equals to '
                + element.min, 2)
            return false;
        }
    }
    return true
}

function validMaxBoundary(element) {
    if (element.max) {
        element.value = formatNumber(element.value);
        if (Number(element.value) > Number(element.max)) {
            element.value = element.max;
            showToastError(MESSAGE_NUMBER_VALUE_INVALID + ' less than or equals to '
                + element.max, 2)
            return false;
        }
    }
    return true;
}

const SERVER_PROPERTIES = {
    id: {name: 'ID', title: ' ServerItem ID', type: 'text', disabled: true, required: false},
    name: {
        name: 'Name',
        title: 'ServerItem name',
        type: 'text',
        required: true,
        changeable: true,
        onSave: setServerProperty
    },
    created: {name: 'Created', title: 'Date created', type: 'text', disabled: true},
    version: {name: 'Version', title: 'ServerItem version', type: 'text', disabled: true},
    port: {
        name: 'Port',
        title: 'Port for new keys [0-' + MAX_PORT_NUMBER + ']',
        type: 'text',
        min: 1,
        max: MAX_PORT_NUMBER,
        step: 1,
        changeable: true,
        required: true,
        onSave: setServerProperty
    },
    hostname: {
        name: 'Hostname',
        title: 'Hostname for new keys (IP address or url)',
        type: 'text',
        required: true,
        changeable: true,
        onSave: setServerProperty
    },
    metrics: {name: 'Metrics', title: 'Metrics on/off', type: 'checkbox', onSave: setServerProperty},
    transfer: {
        name: 'Transfer',
        title: 'Total transfer per last 30 days',
        type: 'text',
        isBytes: true,
        decimals: 2
    },
    limit: {
        name: 'Limit per Key',
        title: 'Default key limit (0-8.2Pb) per last 30 days',
        type: 'text',
        changeable: true,
        min: 0,
        max: MAX_DATA_LIMIT,
        isBytes: true,
        onSave: setServerProperty,
        onRemove: removeServerProperty,
        onInput: handleServerPropertiesInputLimit
    }
}
const FILTER_KEY_PROPERTIES = {
    id: {
        name: "ID",
        title: "Key ID",
        type: 'number',
        start: true,
        end: true,
    },
    port: {
        name: "Port",
        title: "Key port",
        type: 'number',
        start: true,
        end: true
    },
    name: {
        name: "Name",
        title: "Key name",
        type: 'text',
        contains: 'Name contains'
    },
    limit: {
        name: "Limit",
        title: "Key limit per last 30 days",
        type: 'text',
        start: true,
        end: true,
        isBytes: true
    },
    transfer: {
        name: "Transfer",
        title: "Key transfer per last 30 days",
        type: 'text',
        start: true,
        end: true,
        isBytes: true
    },

}
