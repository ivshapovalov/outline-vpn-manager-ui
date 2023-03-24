<?php

namespace OutlineServerManager\classes\mock;

use JsonSerializable;

class Key implements JsonSerializable
{
    private int $id;
    private string $name;
    private int $port;
    private int $transfer;
    private int $limit;
    private string $accessUrl;

    public function __construct(array $keyProperties)
    {
        foreach ($keyProperties as $key => $value) {
            $this->$key = $value;
        }
    }

    final public function jsonSerialize(): array
    {
        $result = [];
        foreach ($this as $key => $value) {
            $result[$key] = $value;
        }
        return $result;
    }

    final public function getId(): int
    {
        return $this->id;
    }

    final public function setProperty(string $property, string $value): void
    {
        $this->$property = $value;
    }

    final public function removeProperty(string $property): void
    {
        unset($this->$property);
    }

    final public function getTransfer(): int
    {
        return $this->transfer;
    }
}