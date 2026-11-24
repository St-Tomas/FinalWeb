<?php

class AuthModel {
    private static array $usuarios = [
        'admin' => '36678181',
    ];

    public static function intentarLogin(string $usuario, string $password): bool {
        $u = trim($usuario);
        if (isset(self::$usuarios[$u]) && hash_equals(self::$usuarios[$u], $password)) {
            session_regenerate_id(true);
            $_SESSION['admin_logueado'] = true;
            $_SESSION['admin_usuario']  = $u;
            return true;
        }
        return false;
    }

    public static function logout(): void {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        session_destroy();
    }

    public static function isLoggedIn(): bool {
        return !empty($_SESSION['admin_logueado']);
    }

    public static function usuarioActual(): ?string {
        return self::isLoggedIn() ? ($_SESSION['admin_usuario'] ?? 'admin') : null;
    }

    public static function requireAdmin(): void {
        if (!self::isLoggedIn()) {
            responderJson(['ok' => false, 'error' => 'Acceso denegado. Iniciá sesión como técnico.'], 401);
        }
    }
}