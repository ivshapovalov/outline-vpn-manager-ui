<?php

use OutlineServerManager\classes\LogConfig;

if (!defined("ROOT_DIR")) {
    define('ROOT_DIR', dirname(__DIR__));
}
if (!defined("REQUEST_UUID")) {
    define('REQUEST_UUID', md5(uniqid(mt_rand(), true)) . time());
}

require_once(__DIR__ . '/../vendor/autoload.php');

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 1);
ini_set("error_log", ROOT_DIR . '/logs/manager_error.log');
ini_set("max_execution_time", 36000);
ini_set("default_socket_timeout", 6000);

$log_config = LogConfig::getLogConfig(ROOT_DIR . '/logs', "manager");
Logger::configure($log_config);

$config = parse_ini_file(ROOT_DIR . '/config/manager_config.ini');
foreach ($config as $key => $value) {
    if (!defined($key)) {
        define($key, $value);
    }
}
date_default_timezone_set(DEFAULT_TIMEZONE);