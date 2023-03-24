<?php

namespace OutlineServerManager\classes\outline;

use JsonSerializable;

class ServerItem implements JsonSerializable
{
    protected int $uuid;
    protected string $url;
    protected string $name;
    protected int $changed;
    protected int $checked;

    public function __construct(array $properties)
    {
        foreach ($properties as $key => $value) {
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

    final public function getUuid(): int
    {
        return $this->uuid;
    }

    final public function getUrl(): string
    {
        return $this->url;
    }

    final public function getChanged(): int
    {
        return $this->changed;
    }

    final public function getChecked(): int
    {
        return $this->checked;
    }

    final public function setChecked(int $checked): void
    {
        $this->checked = $checked;
    }
}