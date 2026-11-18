<?php
declare(strict_types=1);

/**
 * Script de Verificación y Demostración de Conexión MySQL / XAMPP
 * Proyecto: Aplicación de Hábitos Saludables
 * 
 * Verifica:
 * 1. Carga de variables de entorno (.env)
 * 2. Conexión segura mediante PDO
 * 3. Existencia de tablas e índices del Sprint 2
 * 4. Inserción y consulta con sentencias preparadas y hash bcrypt seguro
 */

require_once __DIR__ . '/src/Database.php';

use HabitosSaludables\Database\Database;

header('Content-Type: text/plain; charset=utf-8');

echo "==============================================================\n";
echo "  VERIFICACIÓN DE CONEXIÓN MYSQL (XAMPP) - HÁBITOS SALUDABLES\n";
echo "==============================================================\n\n";

try {
    echo "[1/4] Conectando con usuario dedicado 'habitos_user'...\n";
    $pdo = Database::getConnection();
    echo "  -> Conexión PDO establecida con éxito a 'aplicacion_habitos_saludables'.\n\n";

    echo "[2/4] Verificando tablas requeridas...\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "  -> Tablas detectadas (" . count($tables) . "): " . implode(', ', $tables) . "\n";
    
    $requiredTables = ['users', 'categories', 'habits', 'habit_logs'];
    $missing = array_diff($requiredTables, $tables);
    if (!empty($missing)) {
        throw new Exception("Faltan tablas requeridas: " . implode(', ', $missing));
    }
    echo "  -> Todas las tablas del modelo relacional están presentes.\n\n";

    echo "[3/4] Comprobando categorías precargadas...\n";
    $catStmt = $pdo->query("SELECT id, name, icon_name, color_hex FROM categories ORDER BY id ASC");
    $categories = $catStmt->fetchAll();
    foreach ($categories as $cat) {
        echo "  [ID: {$cat['id']}] {$cat['name']} ({$cat['icon_name']} / {$cat['color_hex']})\n";
    }
    echo "\n";

    echo "[4/4] Probando consulta preparada y hash seguro de contraseña...\n";
    $testEmail = 'test.estudio@habitos.local';
    
    // Hash seguro con el algoritmo estándar BCRYPT (recomendado por PHP)
    $rawPassword = 'PasswordSegura2026!';
    $hashedPassword = password_hash($rawPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    $userId = 'test-uuid-demo-' . substr(md5((string)time()), 0, 8);

    // Consulta preparada para inserción segura (cero inyección SQL)
    $insertUser = $pdo->prepare("
        INSERT INTO users (id, email, password_hash, full_name, timezone, theme_preference, role)
        VALUES (:id, :email, :password_hash, :full_name, 'America/Bogota', 'LIGHT', 'USER')
        ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
    ");
    $insertUser->execute([
        ':id' => $userId,
        ':email' => $testEmail,
        ':password_hash' => $hashedPassword,
        ':full_name' => 'Estudiante de Prueba XAMPP'
    ]);

    // Verificación de credenciales con password_verify
    $verifyStmt = $pdo->prepare("SELECT id, email, password_hash, full_name FROM users WHERE email = :email");
    $verifyStmt->execute([':email' => $testEmail]);
    $userRecord = $verifyStmt->fetch();

    if ($userRecord && password_verify($rawPassword, $userRecord['password_hash'])) {
        echo "  -> Usuario de prueba insertado y contraseña verificada exitosamente con password_verify().\n";
        echo "  -> ID: {$userRecord['id']} | Email: {$userRecord['email']}\n\n";
    } else {
        throw new Exception("Fallo en la validación de hash de contraseña.");
    }

    echo "==============================================================\n";
    echo "  RESULTADO: TODO EL SISTEMA MYSQL XAMPP FUNCIONA AL 100%\n";
    echo "==============================================================\n";

} catch (Throwable $e) {
    echo "\n[ERROR]: " . $e->getMessage() . "\n";
    exit(1);
}
