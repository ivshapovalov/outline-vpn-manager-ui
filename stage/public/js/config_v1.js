//backend

export const MANAGER_URL = './src/controller.php';
export const ROOT_RELATIVE_REDIRECT_URL = 'index.php';

export const ACTION_SERVERS_GET = 'servers_get';
export const ACTION_SERVERS_REMOVE = 'servers_remove';
export const ACTION_SERVER_GET_DATA = 'server_get_data';
export const ACTION_SERVER_UPDATE = 'server_update';
export const ACTION_SERVER_REMOVE = 'server_remove';
export const ACTION_SERVER_SET_SELECTED = 'server_set_selected';

export const ACTION_SERVER_SET_PROPERTY = 'server_set_property';
export const ACTION_SERVER_REMOVE_PROPERTY = 'server_remove_property';
export const ACTION_KEYS_REMOVE = 'keys_remove';
export const ACTION_KEYS_REMOVE_CUSTOM_LIMITS = 'keys_remove_custom_limits';
export const ACTION_KEY_ADD = 'key_add';
export const ACTION_KEY_SET_PROPERTY = 'key_set_property';
export const ACTION_KEY_REMOVE_PROPERTY = 'key_remove_property';
export const ACTION_KEY_REMOVE = 'key_remove';
export const ACTION_UPDATE_TOKEN = 'update_token';

//ui
export const NEW_KEYS_MAX_NUMBER = 20;
export const PRIMARY_COLOR = '#4169e1';
export const ERROR_COLOR = '#ff0000';
export const DESKTOP_PAGINATION_WIDTH = 2;
export const MOBILE_PAGINATION_WIDTH = 0;
export const ORDER = {ASC: 1, DESC: -1};
export const VIEW_TYPE = {DESKTOP: 'desktop', MOBILE: 'mobile'};
export const PAGE_ROW_LIMITS = [5, 10, 25, 50, 100, 200]
export const PAGE_SORTABLE_COLUMNS = ['id', 'port', 'name', 'limit', 'transfer']
export const TOAST_MESSAGE_DELAY_SEC = 3;
export const UNDISPLAYED_CLASS = 'undisplayed'
export const MAX_DATA_LIMIT = 9223372036000000000;
export const MAX_PORT_NUMBER = 65535;
export const BYTE_RANGES = [
    {value: 'Mb', multi: 1000 * 1000},
    {value: 'Gb', multi: 1000 * 1000 * 1000},
    {value: 'Tb', multi: 1000 * 1000 * 1000 * 1000},
    {value: 'Pb', multi: 1000 * 1000 * 1000 * 1000 * 1000}]

//messages
export const MESSAGE_TOKEN_UPDATE_FAILED = 'Token update failed!';
export const MESSAGE_SERVER_LIST_FAILED = 'Server list obtain failed!';
export const MESSAGE_SERVERS_REMOVE_STARTED = 'All Server removing started!';
export const MESSAGE_SERVERS_REMOVE_SUCCESS = 'All Server removing finished!';
export const MESSAGE_SERVERS_REMOVE_FAILED = 'All Server removing failed!';
export const MESSAGE_SERVER_REMOVE_STARTED = 'Server removing started!';
export const MESSAGE_SERVER_REMOVE_SUCCESS = 'Server removed!';
export const MESSAGE_SERVER_REMOVE_FAILED = 'Server remove failed!';
export const MESSAGE_SERVER_UPDATE_STARTED = 'Server update started!';
export const MESSAGE_SERVER_UPDATE_SUCCESS = 'Server updated!';
export const MESSAGE_SERVER_UPDATE_FAILED = 'Server update failed!';
export const MESSAGE_SERVER_SET_SELECTED_SUCCESS = 'Server selected ';
export const MESSAGE_SERVER_SET_SELECTED_FAILED = 'Server selection failed!';

export const MESSAGE_KEY_ADD_STARTED = 'Key add started!';
export const MESSAGE_KEY_ADD_FAILED = 'Key add failed!';
export const MESSAGE_KEY_ADD_SUCCESS = 'Added key';
export const MESSAGE_KEYS_REMOVE_STARTED = 'Remove all keys started!';
export const MESSAGE_KEYS_REMOVE_SUCCESS = 'Remove all keys finished!';
export const MESSAGE_KEYS_REMOVE_FAILED = 'Remove all keys finished!';
export const MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_STARTED = 'Remove keys custom limits started!';
export const MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_SUCCESS = 'Remove keys custom limits finished!';
export const MESSAGE_KEYS_REMOVE_CUSTOM_LIMITS_FAILED = 'Remove keys custom limits finished!';
export const MESSAGE_KEY_SET_PROPERTY_STARTED = 'Key set property started!';
export const MESSAGE_KEY_SET_PROPERTY_FAILED = 'Key set property failed!';
export const MESSAGE_KEY_SET_PROPERTY_SUCCESS = 'Key Property set ';
export const MESSAGE_KEY_REMOVE_STARTED = 'Key remove started';
export const MESSAGE_KEY_REMOVE_FAILED = 'Key remove failed!';
export const MESSAGE_KEY_URL_COPIED_TO_CLIPBOARD = 'Access key url copied to clipboard';

export const MESSAGE_KEY_REMOVE_SUCCESS = 'Removed key';
export const MESSAGE_SERVER_SET_PROPERTY_STARTED = 'Server set parameter started!';
export const MESSAGE_SERVER_SET_PROPERTY_FAILED = 'Set parameter failed with';
export const MESSAGE_SERVER_SET_PROPERTY_SUCCESS = 'Parameter set ';

export const MESSAGE_SERVER_GET_FAILED = 'Server get info failed!';
export const MESSAGE_NUMBER_VALUE_INVALID = 'The property must be a number ';


/*
****************************************USERNAME AND PASSWORD PATTERNS**********************************************
Must contain only lowercase and uppercase letters
/^[a-zA-Z\-]+$/;

Must contain only lowercase, uppercase letters and digits, and starts from upper or lower letter
/^[a-zA-Z][a-zA-Z0-9]*$/;

Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters
 let checker1 = '(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}';

6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter
 let checker2 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

7 to 15 characters which contain at least one numeric digit and a special character
 let checker3 = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/;

8 to 15 characters which contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character
 let passChecker = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
 */