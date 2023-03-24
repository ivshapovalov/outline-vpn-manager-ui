<?php

namespace OutlineServerManager\classes\mock;

interface MockDb
{
    public function getKeys(): string;

    public function addKey(): string;

    public function removeKey(int $id): void;

    public function setKeyProperty(int $id, string $property, string $value): void;

    public function removeKeyProperty(int $id, string $property): void;

    public function getServerProperties(): string;

    public function setServerProperty(string $property, string $value): void;

    public function removeServerProperty(string $property): void;
}