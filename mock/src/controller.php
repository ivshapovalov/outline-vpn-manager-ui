<?php

namespace OutlineServerManager;

use Exception;
use InvalidArgumentException;
use JsonException;
use Logger;
use OutlineServerManager\classes\MockManager;
use OutlineServerManager\classes\Utils;
use Throwable;

require_once(__DIR__ . '/bootstrap.php');

$log = Logger::getLogger('controllerLogger_' . REQUEST_UUID);
$log->info('New Request started');

$phpInput = file_get_contents('php://input');
if ($phpInput) {
    try {
        $requestBody = json_decode($phpInput, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        $log->error("Error: phpInput parse");
    }
}
$log->debug('Check credentials');

try {
    $jwt = Utils::getBearerToken();
    if ($jwt) {
        $isCredentialsValid = Utils::isCredentialsValid($jwt);
        if (!$isCredentialsValid) {
            $log->debug("JWT invalid. Redirect to login page");
            header('HTTP/1.1 401 Unauthorized');
            exit();
        }
        $log->debug("JWT is valid. Handle action!");
    } else {
        $log->debug('HTTP HEADER do not contain Autorization Bearer. Redirect to login page');
        header('HTTP/1.1 401 Unauthorized');
        exit();
    }
} catch (Exception $e) {
    Utils::logError($e);
    Utils::sendErrorResponse(MESSAGE_SERVER_ERROR);
    exit();
}

$action = '';
if (isset($_GET[CONTROLLER_ACTION_PARAMETER])) {
    $action = trim($_GET[CONTROLLER_ACTION_PARAMETER]);
}
$log->info("Action is <$action>. Start handling");
try {
    $username = Utils::getTokenUserName($jwt);

    $manager = new MockManager($username, REQUEST_UUID);

    switch ($action) {
        case CONTROLLER_ACTION_UPDATE_TOKEN:
            $credentials = Utils::createCredentials($username);
            echo $credentials;
            break;
        case CONTROLLER_ACTION_KEY_LIST:
            echo $manager->getKeys();
            break;
        case CONTROLLER_ACTION_SERVER_GET_PROPERTIES:
            echo $manager->getServerProperties();
            break;
        case CONTROLLER_ACTION_KEYS_REMOVE_CUSTOM_LIMITS:
            $manager->removeKeysCustomLimits();
            break;
        case CONTROLLER_ACTION_KEY_ADD:
            echo $manager->addKey();
            break;
        case CONTROLLER_ACTION_KEY_REMOVE:
            if ((isset($requestBody) && !empty($requestBody) && array_key_exists('id', $requestBody))) {
                $manager->removeKey($requestBody['id']);
            } else {
                throw new InvalidArgumentException('$requestBodyError: parameter "id" do not exists');
            }
            break;
        case CONTROLLER_ACTION_KEY_SET_PROPERTY:
            if ((isset($requestBody) && !empty($requestBody)
                && (array_key_exists('id', $requestBody)
                    && array_key_exists('property', $requestBody) && array_key_exists('value', $requestBody)))) {
                $manager->setKeyProperty($requestBody['id'], $requestBody['property'], $requestBody['value']);
            } else {
                throw new InvalidArgumentException('$requestBodyError: parameter "id"|"property"|"value" do not exists');
            }
            break;
        case CONTROLLER_ACTION_SERVER_SET_PROPERTY:
            if ((isset($requestBody) && !empty($requestBody) && (array_key_exists('property', $requestBody) && array_key_exists('value', $requestBody)))) {
                $manager->setServerProperty($requestBody['property'], $requestBody['value']);
            } else {
                throw new InvalidArgumentException('$requestBodyError: parameter "property"|"value" do not exists');
            }
            break;
        case CONTROLLER_ACTION_SERVER_REMOVE_PROPERTY:
            if ((isset($requestBody) && !empty($requestBody) && (array_key_exists('property', $requestBody)))) {
                $manager->removeServerProperty($requestBody['property']);
            } else {
                throw new InvalidArgumentException('$requestBodyError: parameter "property" do not exists');
            }
            break;
        case CONTROLLER_ACTION_KEY_REMOVE_PROPERTY:
            if ((isset($requestBody) && !empty($requestBody) && array_key_exists('id', $requestBody) && array_key_exists('property', $requestBody))) {
                $manager->removeKeyProperty($requestBody['id'], $requestBody['property']);
            } else {
                throw new InvalidArgumentException('$requestBodyError: parameter "id"|"property" do not exists');
            }
            break;
    }
    return;
} catch (Throwable $e) {
    Utils::logError($e);
    $log->error("Action " . $action . " failed!");
    Utils::sendErrorResponse(MESSAGE_SERVER_ERROR);
}

