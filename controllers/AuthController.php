<?php

class AuthController {
    public function estadoSesion(): void {
        $logueado = AuthModel::isLoggedIn();
        responderJson([
            'ok'         => true,
            'logueado'   => $logueado,
            'usuario'    => AuthModel::usuarioActual(),
            'pendientes' => $logueado ? CotizacionModel::contarPendientes() : 0,
        ]);
    }

    public function login(): void {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
        }

        $input = leerInput();
        $usuario  = (string)($input['usuario'] ?? '');
        $password = (string)($input['password'] ?? '');

        if (AuthModel::intentarLogin($usuario, $password)) {
            responderJson([
                'ok'      => true,
                'usuario' => AuthModel::usuarioActual(),
                'mensaje' => 'Sesión iniciada correctamente.',
            ]);
        }

        responderJson(['ok' => false, 'error' => 'Usuario o contraseña incorrectos.'], 401);
    }

    public function logout(): void {
        AuthModel::logout();
        responderJson(['ok' => true, 'mensaje' => 'Sesión cerrada.']);
    }
}