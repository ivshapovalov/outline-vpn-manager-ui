<?php

namespace OutlineServerManager\classes;

use Exception;
use Logger;
use OutlineServerManager\classes\mock\JsonMockDb;
use OutlineServerManager\classes\mock\MockDb;
use RuntimeException;

require_once(__DIR__ . '/../bootstrap.php');

class MockManager
{
    private Logger $log;
    private MockDb $Db;

    public function __construct(string $username, string $requestUuid)
    {
        $this->Db = new JsonMockDb($requestUuid, $username);
        $this->log = Logger::getLogger('mockManagerLogger_' . $requestUuid);
    }

    final public function setServerProperty(string $property, string $newValue): void
    {
        $log = $this->log;
        $log->debug("Started 'setServerProperty'");
        $this->Db->setServerProperty($property, $newValue);
        $log->debug("Finished 'setServerProperty'");
    }

    final public function removeKey(int $id): void
    {
        $log = $this->log;
        $log->info("Started 'removeKey'");
        $this->Db->removeKey($id);
        $log->info("Finished 'removeKey'");
    }

    final public function addKey(): string
    {
        $log = $this->log;
        $log->info("Started 'addKey'");
        $json = $this->Db->addKey();
        $log->info("Finished 'addKey'");
        return $json;
    }

    final public function getServerProperties(): string
    {
        $log = $this->log;
        $log->info("Started 'getServerProperties'");
        $json = $this->Db->getServerProperties();
        $log->info("Finished 'getServerProperties'");
        return $json;
    }

    final public function setKeyProperty(int $id, string $property, string $value): void
    {
        $log = $this->log;
        $log->debug("Started 'setKeyProperty'");
        $this->Db->setKeyProperty($id, $property, $value);
        $log->debug("Finished 'setKeyProperty'");
    }

    final public function removeServerProperty(string $property): void
    {
        $log = $this->log;
        $log->debug("Started 'removeServerProperty'");
        $this->Db->removeServerProperty($property);
        $log->debug("Finished 'removeServerProperty'");
    }

    final public function removeKeysCustomLimits(): void
    {
        $log = $this->log;
        try {
            $log->info("Started 'removeKeysCustomLimits'");
            $keys = json_decode($this->getKeys(), true, 512, JSON_THROW_ON_ERROR);
            foreach ($keys as $key) {
                if (array_key_exists('limitCustom', $key)) {
                    $log->info("Remove custom limit from key $key");
                    $this->removeKeyProperty($key["id"], 'limit');
                }
            }

            $log->info("Finished 'removeKeysCustomLimits'");
        } catch (Exception $e) {
            Utils::logError($e);
            throw new RuntimeException(MESSAGE_SERVER_ERROR);
        }
    }

    final public function getKeys(): string
    {
        $log = $this->log;
        $log->info("Started 'getKeys'");
        $json = $this->Db->getKeys();
        $log->info("Finished 'getKeys'");
        return $json;
    }

    final public function removeKeyProperty(int $id, string $property): void
    {
        $log = $this->log;
        $log->debug("Started 'removeKeyProperty'");
        $this->Db->removeKeyProperty($id, $property);
        $log->debug("Finished 'removeKeyProperty'");
    }

}


