<?php

namespace OutlineServerManager\classes\mock;

use JsonSerializable;
use OutlineServerManager\classes\Utils;
use RuntimeException;

class ServerProperties implements JsonSerializable
{
    private string $name;
    private string $id;
    private int $created;
    private bool $metrics;
    private string $version;
    private int $port;
    private int $limit;
    private string $hostname;

    public function __construct(array $properties)
    {
        foreach ($properties as $key => $value) {
            $this->$key = $value;
        }
    }

    final public static function default(string $username): ServerProperties
    {
        $properties = [
            'name' => "$username Outline Server",
            'id' => Utils::guidv4(),
            'created' => time() * 1000,
            'metrics' => false,
            'version' => '1.6.1',
            'port' => 1,
            'hostname' => '127.0.0.1'
        ];
        return new ServerProperties($properties);
    }

    final public function jsonSerialize(): array
    {
        $result = [];
        foreach ($this as $key => $value) {
            $result[$key] = $value;
        }
        return $result;
    }

    final public function getPort(): int
    {
        return $this->port;
    }

    final public function getLimit(): int
    {
        if ($this->hasLimit()) {
            return $this->limit;
        } else {
            throw new RuntimeException('Limit is not defined');
        }
    }

    final public function hasLimit(): bool
    {
        return isset($this->limit);
    }

    final public function setProperty(string $property, string $value): void
    {
        $this->$property = $value;
    }

    final public function removeProperty(string $property): void
    {
        unset($this->$property);
    }
}