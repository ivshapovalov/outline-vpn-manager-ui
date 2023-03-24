<?php

namespace OutlineServerManager;

use Exception;
use JsonException;
use Logger;
use OutlineServerManager\classes\exception\ConcurrentModificationException;
use OutlineServerManager\classes\exception\InvalidServerUuidException;
use OutlineServerManager\classes\exception\InvalidUrlException;
use OutlineServerManager\classes\OutlineManager;
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
    $actionsWithoutServerUuid = [
        CONTROLLER_ACTION_UPDATE_TOKEN,
        CONTROLLER_ACTION_SERVERS_GET,
        CONTROLLER_ACTION_SERVERS_REMOVE,
        CONTROLLER_ACTION_SERVER_UPDATE
    ];

    $serverUuid = 0;
    if (isset($_GET[CONTROLLER_SERVER_UUID_PARAMETER])) {
        $serverUuid = trim($_GET[CONTROLLER_SERVER_UUID_PARAMETER]);
    } else if (!in_array($action, $actionsWithoutServerUuid)) {
        throw new InvalidServerUuidException("Server uuid is empty");
    }
    $manager = new OutlineManager(REQUEST_UUID, $username);

    switch ($action) {
        case CONTROLLER_ACTION_UPDATE_TOKEN:
            $credentials = Utils::createCredentials($username);
            echo $credentials;
            break;
        case CONTROLLER_ACTION_SERVERS_GET:
            echo $manager->getServers();
            break;
        case CONTROLLER_ACTION_SERVERS_REMOVE:
            $manager->removeServers();
            break;
        case CONTROLLER_ACTION_SERVER_GET_DATA:
            echo $manager->getServerData($serverUuid);
            break;
        case CONTROLLER_ACTION_SERVER_REMOVE:
            $manager->removeServer($serverUuid);
            break;
        case CONTROLLER_ACTION_SERVER_UPDATE:
            $mandatoryParameters = ["props"];
            Utils::checkPostParameters($mandatoryParameters, $requestBody);
            if ($serverUuid === 0) {
                echo $manager->addServer($requestBody['props']);
            } else {
                echo $manager->updateServer($serverUuid, $requestBody['props']);
            }
            break;
        case CONTROLLER_ACTION_SERVER_SET_SELECTED:
            $manager->setServerSelected($serverUuid);
            break;
        case CONTROLLER_ACTION_SERVER_SET_PROPERTY:
            $mandatoryParameters = ["property", "value"];
            Utils::checkPostParameters($mandatoryParameters, $requestBody);
            $manager->setServerProperty($serverUuid, $requestBody['property'], $requestBody['value']);
            break;
        case CONTROLLER_ACTION_SERVER_REMOVE_PROPERTY:
            $mandatoryParameters = ["property"];
            Utils::checkPostParameters($mandatoryParameters, $requestBody);
            $manager->removeServerProperty($serverUuid, $requestBody['property']);
            break;
        case CONTROLLER_ACTION_KEY_ADD:
            $amount = 1;
            if (array_key_exists("amount", $requestBody)) {
                $amount = $requestBody['amount'];
            }
            echo $manager->addKey($serverUuid, $amount);
            break;
        case CONTROLLER_ACTION_KEY_REMOVE:
            $mandatoryParameters = ["id"];
            Utils::checkPostParameters($mandatoryParameters, $requestBody);
            $manager->removeKey($serverUuid, $requestBody['id']);
            break;
        case CONTROLLER_ACTION_KEY_SET_PROPERTY:
            $mandatoryParameters = ["id", "property", "value"];
            Utils::checkPostParameters($mandatoryParameters, $requestBody);
            $manager->setKeyProperty($serverUuid, $requestBody['id'], $requestBody['property'], $requestBody['value']);
            break;
        case CONTROLLER_ACTION_KEY_REMOVE_PROPERTY:
            $mandatoryParameters = ["id", "property"];
            Utils::checkPostParameters($mandatoryParameters, $requestBody);
            $manager->removeKeyProperty($serverUuid, $requestBody['id'], $requestBody['property']);
            break;
        case CONTROLLER_ACTION_KEYS_REMOVE_CUSTOM_LIMITS:
            $manager->removeKeysCustomLimits($serverUuid);
            break;
        case CONTROLLER_ACTION_KEYS_REMOVE:
            $manager->removeKeys($serverUuid);
            break;
    }
    return;
} catch (ConcurrentModificationException|InvalidUrlException|InvalidServerUuidException $e) {
    Utils::logError($e);
    $log->error("Action " . $action . " failed!");
    Utils::sendErrorResponse($e->getMessage());
} catch (Throwable $e) {
    Utils::logError($e);
    $log->error("Action " . $action . " failed!");
    Utils::sendErrorResponse(MESSAGE_SERVER_ERROR);
}

