<?php
declare(strict_types=1);

/**
 * Conector de Base de Datos MySQL / MariaDB (XAMPP) con PDO
 * Proyecto: Aplicación de Hábitos Saludables
 * 
 * Cumple con:
 * - Consultas preparadas obligatorias contra Inyección SQL (ATTR_EMULATE_PREPARES => false)
 * - Manejo estricto de excepciones (ATTR_ERRMODE => ERRMODE_EXCEPTION)
 * - Credenciales desacopladas mediante variables de entorno (.env)
 * - Soporte UTF-8 mb4 completo
 */

namespace HabitosSaludables\Database;

use PDO;
use PDOException;
use RuntimeException;

class Database
{
    private static ?PDO $instance = null;

    /**
     * Carga variables de entorno desde un archivo .env si existen
     */
    public static function loadEnv(string $envFilePath): void
    {
        if (!file_exists($envFilePath) || !is_readable($envFilePath)) {
            return;
        }

        $lines = file($envFilePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }

            [$key, $value] = array_pad(explode('=', $trimmed, 2), 2, null);
            if ($key !== null && $value !== null) {
                $key = trim($key);
                $value = trim($value, " \t\n\r\0\x0B\"'");
                if (getenv($key) === false) {
                    putenv("{$key}={$value}");
                    $_ENV[$key] = $value;
                    $_SERVER[$key] = $value;
                }
            }
        }
    }

    /**
     * Obtiene una instancia singleton de PDO configurada de forma segura
     */
    public static function getConnection(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        // Cargar .env ubicado en la raíz del proyecto
        $rootDir = dirname(__DIR__, 2);
        self::loadEnv($rootDir . DIRECTORY_SEPARATOR . '.env');

        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = getenv('DB_PORT') ?: '3306';
        $dbName = getenv('DB_NAME') ?: 'aplicacion_habitos_saludables';
        $user = getenv('DB_USER') ?: 'habitos_user';
        $pass = getenv('DB_PASS') ?: 'Habitos_Sec2026!Pass';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        try {
            self::$instance = new PDO($dsn, $user, $pass, $options);
            return self::$instance;
        } catch (PDOException $e) {
            throw new RuntimeException("Error de conexión a la base de datos MySQL en XAMPP: " . $e->getMessage(), (int)$e->getCode());
        }
    }
}
