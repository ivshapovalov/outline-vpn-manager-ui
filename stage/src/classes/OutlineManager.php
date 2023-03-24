<?php

namespace OutlineServerManager\classes;

use Exception;
use JsonException;
use Logger;
use OutlineServerManager\classes\exception\InvalidUrlException;
use OutlineServerManager\classes\outline\Db;
use RuntimeException;

class OutlineManager
{
    private Logger $log;
    private array $fieldsMapping;
    private Db $Db;
    private string $currentUserName;

    /**
     * @throws JsonException
     */
    public function __construct(string $requestUuid, string $userName)
    {
        $this->log = Logger::getLogger('outlineManagerLogger_' . $requestUuid);
        $this->fieldsMapping = $this->getFieldsMapping();
        $this->Db = new Db();
        $this->currentUserName = $userName;
    }

    /**
     * @throws JsonException
     */
    private function getFieldsMapping(): array
    {
        return json_decode('{
            "serverId": "id",
            "name": "name",
            "createdTimestampMs": "created",
            "version": "version",
            "portForNewAccessKeys": "port",
            "hostnameForAccessKeys": "hostname",
            "metricsEnabled":"metrics",
            "accessKeyDataLimit":"limit"
            }',
            true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * @throws JsonException
     */
    final public function getServers(): string
    {
        $this->log->info("Started 'getData'");
        $json = json_encode($this->Db, JSON_THROW_ON_ERROR);
        $this->log->info("Finished 'getData'");
        return $json;
    }

    final public function removeServers(): void
    {
        $this->log->info("Started 'removeServers'");
        $this->Db->removeServers();
        $this->log->info("Finished 'removeServers'");
    }

    final public function getServerData(int $serverUuid): string
    {
        $this->log->info("Started 'getServerData' for server '$serverUuid'");
        try {
            $result = [];
            $this->Db->updateServerChecked($serverUuid);
            $result['properties'] = $this->getServerProperties($serverUuid);
            $result['keys'] = $this->getKeys($serverUuid);
            $this->log->info("Finished 'getServerData' for server '$serverUuid'");
            return json_encode($result, JSON_THROW_ON_ERROR);
        } catch (Exception $e) {
            throw new InvalidUrlException("Invalid Server URL");
        }
    }

    /**
     * @throws JsonException
     */
    private function getServerProperties(int $serverUuid): array
    {
        $this->log->info("Started 'getServerProperties' for server '$serverUuid'");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $result = [];
        $serverProperties = json_decode($this->curlRequest($managementUrl . '/server/'),
            true, 512, JSON_THROW_ON_ERROR);
        $resultMetrics = json_decode($this->curlRequest($managementUrl . '/metrics/transfer'), true, 512, JSON_THROW_ON_ERROR);
        foreach ($this->fieldsMapping as $outlineProperty => $property) {
            if (array_key_exists($outlineProperty, $serverProperties)) {
                $value = $serverProperties[$outlineProperty];
                if ($property === 'limit') {
                    $result['limit'] = (int)$value['bytes'];
                } else {
                    $result[$property] = $value;
                }
            }
        }
        $totalTransfer = 0;
        foreach ($resultMetrics['bytesTransferredByUserId'] as $id => $transfer) {
            $totalTransfer += $transfer;
        }
        $result['transfer'] = $totalTransfer;
        $this->log->info("Finished 'getServerProperties' for server '$serverUuid'");
        return $result;
    }

    private function getServerManagementUrl(int $serverUuid): string
    {
        return $this->Db->findServerByUuid($serverUuid)->getUrl();
    }

    private function curlRequest(string $url, string $method = "GET", array $data = NULL): ?string
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_ENCODING, 'identity');

        switch (strtoupper($method)) {
            case "DELETE":
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
                break;
            case "POST":
                curl_setopt($ch, CURLOPT_POST, 1);
                break;
            case "PUT":
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
                curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                        'Content-Type: application/json')
                );
                if (!empty($data)) {
                    try {
                        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
                    } catch (JsonException $e) {
                        Utils::logError($e);
                        throw new RuntimeException(MESSAGE_SERVER_ERROR);
                    }
                }
                break;
            default:
        }

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            trigger_error('Curl Error:' . curl_error($ch));
            throw new RuntimeException(MESSAGE_SERVER_ERROR);
        }

        switch (strtoupper($method)) {
            case "GET":
                if (curl_getinfo($ch, CURLINFO_HTTP_CODE) !== 200) {
                    throw new RuntimeException(MESSAGE_SERVER_ERROR);
                }
                break;
            case "POST":
                if (curl_getinfo($ch, CURLINFO_HTTP_CODE) !== 201) {
                    throw new RuntimeException(MESSAGE_SERVER_ERROR);
                }
                break;
            case "PUT";
            case "DELETE":
                if (curl_getinfo($ch, CURLINFO_HTTP_CODE) !== 204) {
                    throw new RuntimeException(MESSAGE_SERVER_ERROR);
                }
                break;
        }
        curl_close($ch);
        return $response;
    }

    /**
     * @throws JsonException
     */
    private function getKeys(int $serverUuid): array
    {
        $this->log->info("Started 'getKeys' for server '$serverUuid'");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $resultKeys = json_decode($this->curlRequest($managementUrl . '/access-keys/'), true, 512, JSON_THROW_ON_ERROR);
        $resultMetrics = json_decode($this->curlRequest($managementUrl . '/metrics/transfer'), true, 512, JSON_THROW_ON_ERROR);
//            $resultServerProperties = json_decode($this->getServerProperties(), true, 512, JSON_THROW_ON_ERROR);

        $keys = $resultKeys['accessKeys'];
        foreach ($keys as &$key) {
            $key['transfer'] = 0;
            if (array_key_exists($key['id'], $resultMetrics['bytesTransferredByUserId'])) {
                $key['transfer'] = $resultMetrics['bytesTransferredByUserId'][$key['id']];
            } else {
                $key['transfer'] = 0;
            }
            $key['id'] = (int)$key['id'];
            if (array_key_exists('dataLimit', $key)) {
                $key['limitCustom'] = (int)$key['dataLimit']['bytes'];
                unset($key['dataLimit']);
            }
            unset($key['password'], $key['method']);
        }
        $this->log->info("Finished 'getKeys' for server '$serverUuid'");
        return $keys;
    }

    final public function removeServer(int $serverUuid): void
    {
        $this->log->info("Started 'removeServer' for server '$serverUuid'");
        $this->Db->removeServerByUuid($serverUuid);
        $this->log->info("Finished 'removeServer' for server '$serverUuid'");
    }

    /**
     * @throws JsonException
     */
    final public function addServer(array $props): string
    {
        $this->log->info("Started 'addServer' with props '" . print_r($props, true) . "'");
        $result = $this->Db->addServer($props);
        $this->log->info("Finished 'addServer'");
        return $result;
    }

    /**
     * @throws JsonException
     */
    final public function updateServer(int $serverUuid, array $props): string
    {
        $this->log->info("Started 'updateServer' with props '" . print_r($props, true) . "'");
        $result = $this->Db->updateServer($serverUuid, $props);
        $this->log->info("Finished 'updateServer'");
        return $result;
    }

    final public function setServerSelected(int $serverUuid): void
    {
        $this->log->info("Started 'setServerSelected' for server '$serverUuid' and user '$this->currentUserName'");
        $this->Db->setSelectedServerUuid($serverUuid);
        $this->log->info("Finished 'setServerSelected' for server '$serverUuid' and user '$this->currentUserName'");
    }

    final public function setServerProperty(int $serverUuid, string $property, string $newValue): void
    {
        $this->log->info("Started 'setServerProperty' for server '$serverUuid'");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $data = array();
        $url = '';
        $method = 'PUT';
        switch ($property) {
            case 'name':
                $url = '/name/';
                $data = array($property => $newValue);
                break;
            case 'host':
                $url = '/server/hostname-for-access-keys';
                $data = array("hostname" => $newValue);
                break;
            case 'port':
                $url = '/server/port-for-new-access-keys';
                $data = array($property => (int)$newValue);
                break;
            case 'limit':
                $data = array('limit' => array('bytes' => (int)$newValue));
                $url = '/server/access-key-data-limit';
                break;
            case 'metrics':
                $data = array('metricsEnabled' => filter_var($newValue, FILTER_VALIDATE_BOOLEAN));
                $url = '/metrics/enabled';
                break;
        }
        $this->curlRequest($managementUrl . $url, $method, $data);
        $this->Db->updateServerChecked($serverUuid);
        $this->log->info("Started 'finishedServerProperty' for server '$serverUuid'");
    }

    final public function removeServerProperty(int $serverUuid, string $property): void
    {
        $this->log->info("Started 'removeServerProperty' for server '$serverUuid");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $additionalUrl = '';
        $method = 'DELETE';
        switch ($property) {
            case 'limit':
                $additionalUrl = '/server/access-key-data-limit';
                break;
        }
        $this->curlRequest($managementUrl . $additionalUrl, $method, array());
        $this->Db->updateServerChecked($serverUuid);
        $this->log->info("Finished 'removeServerProperty' for server '$serverUuid'");
    }

    /**
     * @throws JsonException
     */
    final public function addKey(int $serverUuid, int $amount = 1): string
    {
        $this->log->info("Started 'addKey' for server '$serverUuid'");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $results = [];
        for ($i = 1; $i <= $amount; $i++) {
            $result = json_decode($this->curlRequest($managementUrl . '/access-keys', "POST"),
                true, 512, JSON_THROW_ON_ERROR);
            $result['id'] = (int)$result['id'];
            $result['transfer'] = 0;
            unset($result['password'], $result['method']);
            $results[] = $result;
        }
        $this->Db->updateServerChecked($serverUuid);
        $this->log->info("Finished 'addKey' for server '$serverUuid'");
        return json_encode($results, JSON_THROW_ON_ERROR);
    }

    final public function setKeyProperty(int $serverUuid, int $keyId, string $property, string $value): void
    {
        $this->log->info("Started 'setKeyProperty' for server '$serverUuid'");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $data = array();
        $additionalUrl = '';
        $method = 'PUT';
        switch ($property) {
            case 'name':
                $data = array("name" => $value);
                $additionalUrl = "/access-keys/$keyId/name";
                break;
            case 'limit':
                $data = array('limit' => array('bytes' => (int)$value));
                $additionalUrl = "/access-keys/$keyId/data-limit";
                break;

        }
        $this->curlRequest($managementUrl . $additionalUrl, $method, $data);
        $this->Db->updateServerChecked($serverUuid);
        $this->log->info("Finished 'setKeyProperty' for server '$serverUuid'");
    }

    /**
     * @throws JsonException
     */
    final public function removeKeys(int $serverUuid): void
    {
        $log = $this->log;
        $log->info("Started 'removeKeys' for server '$serverUuid'");
        $keys = $this->getKeys();
        foreach ($keys as $key) {
            $this->removeKey($key["id"]);
        }
        $log->info("Finished 'removeKeys' for server '$serverUuid'");
    }

    final public function removeKey(int $serverUuid, int $keyId): void
    {
        $this->log->info("Started 'removeKey' for server '$serverUuid'");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $this->curlRequest($managementUrl . '/access-keys/' . $keyId, "DELETE");
        $this->Db->updateServerChecked($serverUuid);
        $this->log->info("Finished 'removeKey' for server '$serverUuid'");
    }

    /**
     * @throws JsonException
     */
    final public function removeKeysCustomLimits(int $serverUuid): void
    {
        $this->log->info("Started 'removeKeysCustomLimits' for server '$serverUuid'");
        $keys = $this->getKeys($serverUuid);
        foreach ($keys as $key) {
            if (array_key_exists('limitCustom', $key)) {
                $this->log->info("Remove custom limit from key $key");
                $this->removeKeyProperty($key["id"], 'limit');
            }
        }

        $this->log->info("Finished 'removeKeysCustomLimits' for server '$serverUuid'");
    }

    final public function removeKeyProperty(int $serverUuid, int $keyId, string $property): void
    {
        $this->log->info("Started 'removeKeyProperty' for server '$serverUuid'");
        $managementUrl = $this->getServerManagementUrl($serverUuid);
        $additionalUrl = '';
        $method = 'DELETE';
        switch ($property) {
            case 'limit':
                $additionalUrl = "/access-keys/$keyId/data-limit";
                break;
        }
        $this->curlRequest($managementUrl . $additionalUrl, $method, array());
        $this->log->info("Finished 'removeKeyProperty' for server '$serverUuid'");
    }

}