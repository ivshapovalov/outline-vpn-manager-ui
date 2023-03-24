<?php

namespace OutlineServerManager\classes;

use DateTimeImmutable;
use Exception;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use InvalidArgumentException;
use Logger;
use RuntimeException;
use Throwable;

require_once(__DIR__ . '/../bootstrap.php');
Utils::$log = Logger::getLogger('utilsLogger_' . REQUEST_UUID);

class Utils
{
    public static Logger $log;

    public static function sendErrorResponse(string $message): void
    {
        ob_clean();
        http_response_code(500);
        die($message);
    }

    public static function isCredentialsValid(?string $jwt, ?string $server = null): bool
    {
        $log = self::$log;
        if (!isset($server)) {
            $urlParts = parse_url($_SERVER["HTTP_HOST"]);
//            [$protocol,$domain,$url] = explode(':', $_SERVER['HTTP_REFERER']);
            $log->debug("Validate jwt for domain <" . $urlParts['host'] . ">");
            $server = $urlParts['host'];
        }
        if (!(isset($jwt))) {
            $log->debug("Domain name or JWT is empty");
            return false;
        }

        $keyPath = ROOT_DIR . SECRET_KEY_FILE;
        if (!file_exists($keyPath)) {
            throw new RuntimeException('Error. Secret key file not exists');
        }
        try {
            $secretKey = file_get_contents($keyPath);
            $token = JWT::decode($jwt, new Key($secretKey, 'HS512'));
        } catch (Exception $e) {
            $log->debug('Token decoding failed');
            self::logError($e);
            return false;
        }
        $now = new DateTimeImmutable();

        if ($token->iss !== $server ||
            $token->nbf > $now->getTimestamp() ||
            $token->exp < $now->getTimestamp()) {
            $log->debug('Token properties invalid');
            return false;
        }

        $log->debug("Check if token user has admin permissions");
        if (!array_key_exists($token->username, ADMINS)) {
            $log->debug("Token user not an admin");
            return false;
        }
        $log->debug("Token user is an admin");
        return true;
    }

    public static function logError(Throwable $e): void
    {
        $log = self::$log;
        $log->error($e->getMessage());
        $log->error($e->getCode());
        $log->error($e->getFile());
        $log->error($e->getLine());
    }

    public static function getTokenUserName(string $jwt): ?string
    {
        $log = self::$log;
        $log->debug('Start check JWT username');
        $keyPath = ROOT_DIR . SECRET_KEY_FILE;
        if (!file_exists($keyPath)) {
            throw new RuntimeException('Error. Secret key file not exists');
        }
        try {
            $secretKey = file_get_contents($keyPath);
            $token = JWT::decode($jwt, new Key($secretKey, 'HS512'));
        } catch (Exception $e) {
            $log->debug('Token decoding failed');
            self::logError($e);
            throw new RuntimeException('JWT decoding failed');
        }
        $log->info('Token username is <' . $token->username . '>');
        return $token->username;
    }

    public static function createCredentials(string $username, ?string $server = null): string
    {
        $log = self::$log;
        if (!isset($server)) {
            $urlParts = parse_url($_SERVER["HTTP_HOST"]);
            $server = $urlParts['host'];
        }
        $log->debug('Start creating jwt for domain <' . $server . '> and user <' . $username . '>');
        $keyPath = ROOT_DIR . SECRET_KEY_FILE;
        if (!file_exists($keyPath)) {
            throw new RuntimeException('Error. Secret key file not exists');
        }
        try {
            $secretKey = file_get_contents($keyPath);
            $issuedAt = new DateTimeImmutable();
            $expire = $issuedAt->modify('+' . TOKEN_EXPIRATION_PERIOD_MIN . ' minutes')->getTimestamp();

            $data = [
                'iat' => $issuedAt->getTimestamp(),
                'iss' => $server,
                'nbf' => $issuedAt->getTimestamp(),
                'exp' => $expire,
                'username' => $username
            ];
            $log->debug('Token data is:');
            $log->debug($data);

            $jwt = JWT::encode(
                $data,
                $secretKey,
                'HS512'
            );

            $credentials = [];
            $credentials['jwt'] = $jwt;
            $credentials['expired'] = $expire;
            $credentials['username'] = $username;
            $log->debug('Return credentials:');
            $log->debug($credentials);
            $result = json_encode($credentials, JSON_THROW_ON_ERROR);
        } catch (Exception $e) {
            $log->debug('Token encoding failed');
            self::logError($e);
            throw new RuntimeException('JWT encoding failed');
        }
        return $result;
    }

    public static function getBearerToken(): ?string
    {
        $headers = self::getAuthorizationHeader();
        if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public static function getAuthorizationHeader(): ?string
    {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        return $headers;
    }

    public static function createSecuredFolder(string $path): void
    {
        if (!mkdir($path, 0750, true) && !is_dir($path)) {
            throw new RuntimeException(sprintf('Directory "%s" was not created', $path));
        }
        $f = fopen($path . "/.htaccess", 'ab+');
        fwrite($f, " Order deny,allow" . CHR(10) . " Deny from all ");
        fclose($f);
    }

    public static function isValidUserName(string $username): bool
    {
        if (preg_match(USERNAME_PATTERN, $username)) {
            return true;
        }
        return false;
    }

    public static function isValidPassword(string $password): bool
    {
        if (preg_match(PASSWORD_PATTERN, $password)) {
            return true;
        }
        return false;
    }

    public static function bytesToHuman(int $bytes): string
    {
        $units = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb'];
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public static function guidv4(string $data = null): string
    {
        // Generate 16 bytes (128 bits) of random data or use the data passed into the function.
        $data = $data ?? random_bytes(16);
        assert(strlen($data) == 16);

        // Set version to 0100
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        // Set bits 6-7 to 10
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        // Output the 36 character UUID.
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }


    public static function checkPostParameters(array $mandatoryParameters, $requestBody): void
    {
        if (!(isset($requestBody) || empty($requestBody))) {
            throw new InvalidArgumentException('POST error: parameters are empty');
        }
        $invalidParameters = "";
        foreach ($mandatoryParameters as $parameter) {
            if (!array_key_exists($parameter, $requestBody)) {
                $invalidParameters = $invalidParameters . $parameter . ", ";
            }
        }
        $invalidParameters = substr($invalidParameters, 0, -2);
        if (!empty($invalidParameters)) {
            throw new InvalidArgumentException('POST error: parameters [' . $invalidParameters . '] do not exists');
        }
    }
}