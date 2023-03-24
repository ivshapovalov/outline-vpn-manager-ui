<?php

namespace OutlineServerManager\classes\mock;

use JsonException;
use JsonSerializable;
use Logger;
use OutlineServerManager\classes\Utils;
use RuntimeException;

class JsonMockDb implements JsonSerializable, MockDb
{
    private Logger $log;
    private ServerProperties $serverProperties;
    private Keys $keys;
    private string $username;

    public function __construct(string $requestUuid, string $username)
    {
        $this->log = Logger::getLogger('jsonManagerLogger_' . $requestUuid);
        $this->username = $username;
        $this->build();
    }

    private function build(): void
    {
        $mockDbFolderPath = ROOT_DIR . MOCK_DB_PATH;
        if (!file_exists($mockDbFolderPath)) {
            Utils::createSecuredFolder($mockDbFolderPath);
        }
        $mockDbFilePath = $mockDbFolderPath . '/' . $this->username . '.json';
        if (!file_exists($mockDbFilePath)) {
            $this->initializeNewDb();
            $this->save();
        }
        $this->readDb();
    }

    private function initializeNewDb(): void
    {
        $log = $this->log;
        $log->debug("Started 'initializeNewDb' for user <" . $this->username . '>');
        $this->serverProperties = ServerProperties::default($this->username);
        $this->keys = Keys::default();
        $log->debug("Finished 'initializeNewDb'");
    }

    private function save(): void
    {
        $path = ROOT_DIR . MOCK_DB_PATH . '/' . $this->username . '.json';
        try {
            file_put_contents($path, json_encode($this, JSON_THROW_ON_ERROR));
        } catch (JsonException $e) {
            throw new RuntimeException("Error. Save file <" . $path . "> failed");
        }
    }

    private function readDb(): void
    {
        $path = ROOT_DIR . MOCK_DB_PATH . '/' . $this->username . '.json';
        try {
            $db = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            $this->serverProperties = new ServerProperties ($db['server']);
            $this->keys = new Keys($db['keys'], $db['maxKeyId']);
        } catch (JsonException $e) {
            throw new RuntimeException("Error. Read file <" . $path . "> failed");
        }
    }

    final public function addKey(): string
    {
        $port = $this->serverProperties->getPort();
        if ($this->serverProperties->hasLimit()) {
            $limit = $this->serverProperties->getLimit();
        }
        $newKey = $this->keys->addKey($port, $limit);
        $this->save();
        return $newKey;
    }

    final public function removeKey(int $id): void
    {
        $this->keys->removeKey($id);
        $this->save();
    }

    final public function setKeyProperty(int $id, string $property, string $value): void
    {
        $this->keys->setKeyProperty($id, $property, $value);
        $this->save();
    }

    final public function getKeys(): string
    {
        try {
            $keys = json_decode(json_encode($this->keys), true);
            foreach ($keys as &$key) {
                if (array_key_exists('limit', $key)) {
                    $key['limitCustom'] = $key['limit'];
                    unset($key['limit']);
                }
            }
            return json_encode($keys, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException("Error. Convert 'keys' to JSON failed");
        }
    }

    final public function getServerProperties(): string
    {
        try {
            $totalTransfer = 0;
            foreach ($this->keys->getKeys() as $key) {
                $totalTransfer += $key->getTransfer();
            }
            $serverProperties = json_decode(json_encode($this->serverProperties), true);
            $serverProperties['transfer'] = $totalTransfer;
            return json_encode($serverProperties, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException("Error. Convert 'serverProperties' to JSON failed");
        }
    }

    final public function setServerProperty(string $property, string $value): void
    {
        $this->serverProperties->setProperty($property, $value);
        $this->save();
    }

    final public function jsonSerialize(): array
    {
        $result = [];
        $result['server'] = $this->serverProperties;
        $result['keys'] = $this->keys;
        $result['maxKeyId'] = $this->keys->getMaxKeyId();
        return $result;
    }

    final public function removeKeyProperty(int $id, string $property): void
    {
        $this->keys->removeKeyProperty($id, $property);
        $this->save();
    }

    final public function removeServerProperty(string $property): void
    {
        $this->serverProperties->removeProperty($property);
        $this->save();
    }
}
