<?php

namespace OutlineServerManager\classes\outline;

use InvalidArgumentException;
use JsonException;
use OutlineServerManager\classes\exception\ConcurrentModificationException;

class ServerList
{
    protected array $servers = array();
    protected int $maxServerUuid;
    protected int $selectedServerUuid;

    public function __construct(array $db)
    {
        foreach ($db['servers'] as $serverProperties) {
            $newServer = new ServerItem($serverProperties);
            $this->servers[$newServer->getUuid()] = $newServer;
        }
        $this->maxServerUuid = $db['maxServerUuid'];
        $this->selectedServerUuid = $db['selectedServerUuid'];
    }

    public static function defaultServerList(): ServerList
    {
        $db = array();
        $db['servers'] = array();
        $db['maxServerUuid'] = 0;
        $db['selectedServerUuid'] = 0;
        return new ServerList($db);
    }

    final public function getServers(): array
    {
        return array_values($this->servers);
    }

    final public function getMaxServerUuid(): int
    {
        return $this->maxServerUuid;
    }

    final public function getSelectedServerUuid(): int
    {
        return $this->selectedServerUuid;
    }

    final public function setSelectedServerUuid(int $selectedServerUuid): void
    {
        $this->selectedServerUuid = $selectedServerUuid;
    }

    final public function findServerByUuid(int $serverUuid): ServerItem
    {
        if (array_key_exists($serverUuid, $this->servers)) {
            return $this->servers[$serverUuid];
        }
        throw new InvalidArgumentException("Error. Find server by uuid failed. ServerItem with uuid '$serverUuid' not found");
    }

    final public function removeServerByUuid(int $serverUuid): void
    {
        if (array_key_exists($serverUuid, $this->servers)) {
            unset($this->servers[$serverUuid]);
            if ($this->selectedServerUuid === $serverUuid) {
                if (count($this->servers) === 0) {
                    $this->selectedServerUuid = 0;
                } else {
                    $item = array_slice($this->servers, 0, 1, true);
                    $this->selectedServerUuid = key($item);
                    $a = 10;
                }
            }
        } else {
            throw new InvalidArgumentException("Error. Remove server by uuid failed. ServerItem with uuid '$serverUuid' not found");
        }
    }

    /**
     * @throws JsonException
     */
    final public function addServer(array $props): string
    {
        $this->maxServerUuid++;
        $props["uuid"] = $this->maxServerUuid;
        $props['changed'] = time();
        $newServer = new ServerItem($props);
        $this->servers[$this->maxServerUuid] = $newServer;
        return json_encode($newServer, JSON_THROW_ON_ERROR);
    }

    /**
     * @throws JsonException
     */
    final public function updateServer(int $serverUuid, array $props): string
    {
        $oldServer = $this->servers[$serverUuid];
        if (array_key_exists('changed', $props) && $oldServer->getChanged() !== $props['changed']) {
            throw new ConcurrentModificationException("Error. Concurrent modification. Reload data and try again!");
        }
        $props['changed'] = time();
        $newServer = new ServerItem($props);
        $this->servers[$serverUuid] = $newServer;
        return json_encode($newServer, JSON_THROW_ON_ERROR);
    }

    final public function updateServerChecked(int $serverUuid): void
    {
        $this->servers[$serverUuid]->setChecked(time());
    }
}