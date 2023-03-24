<?php
namespace OutlineServerManager;

use Exception;
use Logger;
use OutlineServerManager\classes\Utils;

require_once(__DIR__ . '/src/bootstrap.php');

$log = Logger::getLogger('dashboardLogger_' . REQUEST_UUID);

ob_start();
if (!isset($_SESSION)) {
    $log->debug('Validate SESSION');
    session_start();
}

if (isset($_SESSION['credentials'])) {
    try {
        $jwt = json_decode($_SESSION['credentials'], true, 512, JSON_THROW_ON_ERROR)['jwt'];
        $isCredentialsValid = Utils::isCredentialsValid($jwt);
        if (!$isCredentialsValid) {
            $log->debug("JWT invalid. Redirect to login page");
            header('Location: index.php');
            exit();
        }
    } catch (Exception $e) {
        Utils::logError($e);
        header('Location: index.php');
        exit();
    }
} else {
    $log->debug('c. Redirect to login page');
    header('Location: index.php');
    exit();
}

if (isset($_POST['logout'])) {
    $username = Utils::getTokenUserName($jwt);
    $log->debug('Logout user <' . $username . '>');
    session_start();
    session_destroy();
    header('Location: index.php');
    exit();
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <script>
        function isIE() {
            var ua = navigator.userAgent.toUpperCase()
            return ua.indexOf('MSIE') !== -1 || ua.indexOf('TRIDENT') !== -1 || ua.indexOf('EDGE') !== -1
                || document.documentMode;
        }

        if (isIE()) window.location = './public/html/ie.html';
    </script>
    <meta name="viewport" content="width=device-width,user-scalable=yes,shrink-to-fit=no">
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <title>Outline Manager</title>
    <link rel="icon" href="./favicon.svg" type="image/x-icon"/>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
          integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
            crossorigin="anonymous"></script>
    <link id="index_css" rel="stylesheet" type="text/css" href="./public/css/dashboard_v1.css"/>

    <script type="module">
        import * as app from './public/js/dashboard_v1.js';

        window.app = app;
        window.credentials = JSON.parse(<?php echo "'" . $_SESSION['credentials'] . "'";?>);
        window.addEventListener('DOMContentLoaded', () => {
            app.DOMContentLoaded();
        });
        window.addEventListener('load', () => {
            app.load();
        });
    </script>
</head>
<body>
<div class="container-lg undisplayed" id="main_container">
    <div class="sticky-notifications" id="sticky_notifications">
        <div class="row header-notifications">
            <div class="col-12">
                <label>
                    <span class="header-notification notification-user" id="user"></span>
                    <span class="header-notification" id="token_expired"></span>
                    <span class="badge bg-primary header-notification"
                          onclick="app.updateToken()">Extend session</span>
                    <span class="badge bg-primary header-notification" onclick="app.logout()">Logout</span>
                </label>
            </div>
        </div>
    </div>
    <div class="sticky-header" id="sticky_header">
        <div class="row header-title">
            <div class="col-12">
                <h1>MOCK Outline Manager</h1>
            </div>
        </div>
        <div class="row header-nav">
            <ul class="nav nav-pills" id="memo_tab" role="tablist">
                <li class="nav-item dropdown header-nav">
                    <div class="link-symbol-wrapper">
                        <a class="nav-link link-symbol" onclick="app.changeViewType(this)" role="button"
                           title="Версия сайта для компьютера" href="javascript:void(0)"
                           aria-expanded="false" id="header_desktop"><span>&#x1f4bb;</span></a>
                        <a class="nav-link link-symbol" onclick="app.changeViewType(this)" role="button"
                           title="Мобильная версия сайта" href="javascript:void(0)"
                           aria-expanded="false" id="header_mobile"><span>&#128241;</span></a>
                    </div>
                </li>
                <li class="nav-item header-menu" role="presentation">
                    <button class="nav-link active" id="pills_keys_tab" data-bs-toggle="pill"
                            data-bs-target="#pills_keys" type="button" role="tab"
                            aria-controls="pills_keys" aria-selected="true">
                        <span class="nav-button">KEYS</span>
                    </button>
                </li>
                <li class="nav-item header-menu" role="presentation">
                    <button class="nav-link" id="pills_server_tab" data-bs-toggle="pill"
                            data-bs-target="#pills_server" type="button" role="tab"
                            aria-controls="pills_server" aria-selected="false">
                        <span class="nav-button">SERVER</span>
                    </button>
                </li>
            </ul>
        </div>
        <div class="row header-keys-nav" id="header_keys_nav">
            <div class="row header-keys-buttons">
                <div class="col-12">
                    <button type="button" class="btn btn-primary keys-header-button" id="btn_add_key"
                            onclick="app.addKey();">
                        ADD NEW KEY
                    </button>
                    <button type="button" class="btn btn-primary keys-header-button" id="btn_reload_keys"
                            onclick="app.reloadKeys();">
                        RELOAD KEYS
                    </button>
                    <button type="button" class="btn btn-primary keys-header-button keys-header-button-filter"
                            id="btn_show_filter" onclick="app.showFilterWindow()">
                        SHOW FILTER
                    </button>
                </div>
            </div>

        </div>
    </div>
    <div class="sticky-pagination" id="sticky_pagination_header">
        <div class="row gx-0 pagination-navigation-wrapper pagination-header">
        </div>
    </div>

    <div>
        <div class="tab-content">
            <div class="tab-pane fade show active" id="pills_keys" role="tabpanel" aria-labelledby="pills_keys_tab">
                <div class="w-100 p-0">
                    <div id="keys_desktop_wrapper" class="keys-desktop-wrapper">
                        <div class="row" id="keys_desktop_body">
                        </div>
                    </div>
                    <div id="keys_mobile_wrapper" class="keys-mobile-wrapper">
                        <div id="keys_mobile_body">
                        </div>
                    </div>
                    <div class="col col-12 keys-empty" id="keys_empty">
                        <span>List is empty</span>
                    </div>
                    <div class="row gx-0 pagination-navigation-wrapper pagination-footer">
                    </div>
                </div>
            </div>
            <div class="tab-pane text-center fade" id="pills_server" role="tabpanel"
                 aria-labelledby="pills_server_tab">
                <div class="col-12 col-lg-9 p-0 d-inline-block">
                    <div class="header-server">
                        <H3>SERVER PROPERTIES</H3>
                    </div>
                    <div id="server_properties">
                    </div>
                    <div class="server-buttons">
                        <button type="button" class="btn btn-primary" onclick="app.getServerProperties()"
                                title="Reload Server parameters">RELOAD SERVER PROPERTIES
                        </button>
                        <button type="button" class="btn btn-danger" onclick="app.removeKeysCustomLimits()"
                                title="Remove All custom limits">REMOVE CUSTOM LIMITS
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="toast-wrapper position-fixed top-50 start-50 translate-middle-x toast-hide">
            <div id="message-toast" class="toast hide toast-download align-items-center" role="status"
                 aria-live="polite"
                 aria-atomic="true">
                <div class="d-flex toast-">
                    <div class="toast-body" id="message-toast-text">
                        Page updating!
                    </div>
                    <button type="button" class="btn-close me-1 m-auto" data-bs-dismiss="toast"
                            aria-label="Close"></button>
                </div>
            </div>
        </div>
    </div>

</div>
<div id="spinner_wrapper" class="spinner-wrapper-row d-flex justify-content-center">
    <div class="d-flex spinner-wrapper-col">
        <span>Loading...</span>
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
</div>
<div class="modal fade" id="modal_limit_window" tabindex="-1">
    <div class="modal-dialog" id="modal_limit_dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">SET CUSTOM LIMIT</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body">
                <div class="input-group">
                    <label class="input-group-text input-group-label-limit">Access key ID</label>
                    <label class="form-control disabled" id="modal_limit_key_id"></label>
                </div>
                <div class="input-group">
                    <label class="input-group-text input-group-label-limit">Access key name</label>
                    <label class="form-control disabled" id="modal_limit_key_name"></label>
                </div>
                <div class="input-group">
                    <label class="input-group-text input-group-label-limit">Transfer</label>
                    <label class="form-control disabled" id="modal_limit_key_transfer"></label>
                </div>
                <div class="input-group">
                    <label class="input-group-text input-group-label-limit">Default limit</label>
                    <label class="form-control disabled" id="modal_limit_default_limit"></label>
                </div>
                <div id="modal_limit_wrapper">

                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="modal_filter_window" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered" id="modal_limit_dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">SET ACCESS KEYS FILTER</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div id="filter_wrapper" class="modal-body">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>

</div>

</body>
</html>

