<?php

namespace OutlineServerManager;

use Exception;
use Logger;
use OutlineServerManager\classes\Utils;

require_once(__DIR__ . '/src/bootstrap.php');

$log = Logger::getLogger('indexLogger_' . REQUEST_UUID);

ob_start();
if (!isset($_SESSION)) {
    session_start();
    session_unset();
}

$message = $_POST['message'] ?? "";

function redirectToDashboard(Logger $log, string $username): void
{
    session_regenerate_id();
    $_SESSION['credentials'] = Utils::createCredentials($username);
    $log->debug("Redirect to dashboard.php");
    header('Location: dashboard.php');
}

if (isset($_POST['username']) && isset($_POST['password'])) {

    $username = stripcslashes($_POST['username']);
    $password = stripcslashes($_POST['password']);

    if (Utils::isValidUserName($username) && Utils::isValidPassword($password)) {
        try {
            $log->debug('Check permissions of <' . $username . '>');
            if (array_key_exists($username, ADMINS) && ADMINS[$username] === $password) {
                $log->debug('Access granted for <' . $username . '>');
                redirectToDashboard($log, $username);
            } else {
                $message = "Sorry - you need valid credentials to access!";
                $log->debug('Access denied for <' . $username . '> and password <' . $password . '> ');
            }
        } catch (Exception $e) {
            $message = MESSAGE_SERVER_ERROR;
            Utils::logError($e);
        }
    } else {
        $message = "Sorry - username or password is incorrect!";
        $log->debug('Login failed. Incorrect login or password');
    }
}
?>

<!doctype html>
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
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
          integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
            crossorigin="anonymous"></script>
    <link rel="stylesheet" href="./public/css/index_v1.css">
    <title>Outline Manager</title>
    <link rel="icon" href="./favicon.svg" type="image/x-icon"/>
    <script type="module">
        import * as app from './public/js/index_v1.js';

        window.app = app;
        app.setUsernamePattern(<?php echo USERNAME_PATTERN; ?>);
        app.setPasswordPattern(<?php echo PASSWORD_PATTERN; ?>);
        window.addEventListener('DOMContentLoaded', () => {
            app.DOMContentLoaded();
        });
    </script>
</head>
<body>
<div class="container">
    <div class="row justify-content-center">
        <div class="col-12 col-md-12 col-lg-9 col-xl-6 inner-block">
            <form action="" method="post">
                <h3>Outline Manager</h3>
                <div class="input-group">
                    <label class="input-group-text input-group-text-from"
                           for="username">User</label>
                    <input type="text" class="form-control" name="username"
                           id="username" <?php echo isset($_POST['username']) ? 'value="' . $_POST['username'] . '"' : ''; ?>
                           placeholder="Login"/>
                </div>
                <p class="center" id="username_message">Length from 1 to 25 characters. Starts from lower or upper
                                                        letter.
                                                        Contains lower and upper letters, and digits</p>
                <div>
                    <div class="input-group">
                        <label class="input-group-text input-group-text-from"
                               for="password">Password</label>
                        <input type="password" class="form-control" name="password" id="password"
                            <?php echo isset($_POST['password']) ? 'value="' . $_POST['password'] . '"' : ''; ?>/>
                        <div class="input-group-text">
                            <input class="form-check-input mt-0" type="checkbox" value=""
                                   aria-label="Show password" title="Show password" onclick="app.showPassword()">
                        </div>
                    </div>
                    <p class="center" id="password_message">Length from 8 to 15 characters which contain at least one
                                                            lowercase
                                                            letter,
                                                            one uppercase letter, one numeric digit, and one special
                                                            character</p>
                </div>
                <div class="row-button">
                    <button type="submit" name="login" id="login"
                            class="btn btn-outline-primary btn-lg btn-block">Login
                    </button>
                </div>
                <div class="row-message">
                    <span id="message" class="message"><?php echo $message; ?></span>
                </div>
            </form>
        </div>
    </div>
</div>
</body>
</html>

