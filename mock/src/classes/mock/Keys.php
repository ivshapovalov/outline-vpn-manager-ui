<?php

namespace OutlineServerManager\classes\mock;

use Exception;
use InvalidArgumentException;
use JsonSerializable;
use RuntimeException;

class Keys implements JsonSerializable
{
    private int $maxKeyId;
    private array $keys = array();

    public function __construct(array $keys, int $maxId)
    {
        foreach ($keys as $keyProperties) {
            $newKey = new Key($keyProperties);
            $this->keys[$newKey->getId()] = $newKey;
        }
        $this->maxKeyId = $maxId;
    }

    public static function default(): Keys
    {
        return new Keys(array(), 0);
    }

    final public function addKey(int $port, ?int $limit): string
    {
        try {
            $newId = ++$this->maxKeyId;
            $properties = [
                "id" => $newId,
                "name" => "",
                "port" => $port,
                "transfer" => random_int(0, 1000000000),
                "accessUrl" => "ss://access-url-" . $newId
            ];
            $newKey = new Key($properties);
            $this->keys[$newId] = $newKey;
            return json_encode($newKey, JSON_THROW_ON_ERROR);
        } catch (Exception $e) {
            throw new RuntimeException("Error. Add new key failed");
        }
    }

    final public function removeKey(int $id): void
    {
        if (array_key_exists($id, $this->keys)) {
            unset($this->keys[$id]);
        } else {
            throw new InvalidArgumentException("Error. Remove key failed. Key with Id " . $id . " not found");
        }
    }

    final public function setKeyProperty(int $id, string $property, string $value): void
    {
        if (array_key_exists($id, $this->keys)) {
            $key = $this->keys[$id];
            $key->setProperty($property, $value);
        } else {
            throw new InvalidArgumentException("Error. Set Key property failed. Key with id <" . $id . "> not found");
        }
    }

    final public function removeKeyProperty(int $id, string $property): void
    {
        if (array_key_exists($id, $this->keys)) {
            $key = $this->keys[$id];
            $key->removeProperty($property);
        } else {
            throw new InvalidArgumentException("Error. Remove key property failed. Key with id <" . $id . "> not found");
        }
    }

    final public function jsonSerialize(): array
    {
        return $this->getKeys();
    }

    final public function getKeys(): array
    {
        return array_values($this->keys);
    }

    final public function getMaxKeyId(): int
    {
        return $this->maxKeyId;
    }
}