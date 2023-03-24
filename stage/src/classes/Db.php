<?php

namespace OutlineServerManager\classes\outline;

use JsonException;
use JsonSerializable;
use OutlineServerManager\classes\Utils;
use RuntimeException;

require_once(__DIR__ . './../bootstrap.php');

class Db implements JsonSerializable
{
    private ServerList $servers;
    private string $dbFolder = ROOT_DIR . REAL_DB_PATH;
    private string $dbFilePath;

    public function __construct()
    {
        $this->dbFilePath = $this->dbFolder . "/servers.json";
        $this->init();
    }

    private function init(): void
    {
        if (!file_exists($this->dbFolder)) {
            Utils::createSecuredFolder($this->dbFolder);
        }
        if (!file_exists($this->dbFilePath)) {
            $this->servers = ServerList::defaultServerList();
            $this->save();
        }

        $db = $this->read();
        if (!empty($db)) {
            $this->servers = new ServerList($db);
        } else {
            $this->servers = ServerList::defaultServerList();
            $this->save();
        }
    }

    final public function save(): void
    {
        try {
            file_put_contents($this->dbFilePath, json_encode($this, JSON_THROW_ON_ERROR));
        } catch (JsonException $e) {
            throw new RuntimeException("Error. Save file <" . $this->dbFolder . "> failed");
        }
    }

    final public function read(): array
    {
        if (file_exists($this->dbFilePath)) {
            try {
                return json_decode(file_get_contents($this->dbFilePath), true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException $e) {
                throw new RuntimeException("Error. Read file <" . $this->dbFolder . "> failed");
            }
        }
        return array();
    }

    final public function jsonSerialize(): array
    {
        $result = [];
        $result['servers'] = $this->servers->getServers();
        $result['maxServerUuid'] = $this->servers->getMaxServerUuid();
        $result['selectedServerUuid'] = $this->servers->getSelectedServerUuid();
        return $result;
    }

    final public function setSelectedServerUuid(int $serverUuid): void
    {
        $this->servers->setSelectedServerUuid($serverUuid);
        $this->save();
    }

    final public function findServerByUuid(int $serverUuid): ServerItem
    {
        return $this->servers->findServerByUuid($serverUuid);
    }

    final public function removeServers(): void
    {
        $this->servers = ServerList::defaultServerList();
        $this->save();
    }

    final public function removeServerByUuid(int $serverUuid): void
    {
        $this->servers->removeServerByUuid($serverUuid);
        $this->save();
    }

    /**
     * @throws JsonException
     */
    final public function addServer(array $props): string
    {
        $result = $this->servers->addServer($props);
        $this->save();
        return $result;
    }

    /**
     * @throws JsonException
     */
    final public function updateServer(int $serverUuid, array $props): string
    {
        $result = $this->servers->updateServer($serverUuid, $props);
        $this->save();
        return $result;
    }

    final public function updateServerChecked(int $serverUuid): void
    {
        $this->servers->updateServerChecked($serverUuid);
        $this->save();
    }
}