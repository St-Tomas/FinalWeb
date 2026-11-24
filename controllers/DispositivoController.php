<?php

class DispositivoController {
    public function destacados(): void {
        responderJson([
            'ok'    => true,
            'items' => DispositivoModel::listarDestacados(),
        ]);
    }

    public function catalogo(): void {
        $filtros = [
            'busqueda'   => $_GET['busqueda'] ?? '',
            'marca'      => $_GET['marca'] ?? [],
            'storage'    => $_GET['storage'] ?? [],
            'precio_min' => $_GET['precio_min'] ?? '',
            'precio_max' => $_GET['precio_max'] ?? '',
        ];
        $pagina = max(1, (int)($_GET['p'] ?? 1));

        $resultado = DispositivoModel::buscarConFiltros($filtros, $pagina, 6);
        responderJson(array_merge(['ok' => true], $resultado));
    }

    public function detalle(): void {
        $id = (int)($_GET['id'] ?? 0);
        $equipo = DispositivoModel::obtenerPorId($id);
        if (!$equipo) {
            responderJson(['ok' => false, 'error' => 'Dispositivo no encontrado.'], 404);
        }
        responderJson(['ok' => true, 'item' => $equipo]);
    }

    public function listarTodosAdmin(): void {
        AuthModel::requireAdmin();
        responderJson([
            'ok'    => true,
            'items' => DispositivoModel::listarTodos(),
        ]);
    }

    public function guardar(): void {
        AuthModel::requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
        }

        $input = leerInput();
        $marca  = trim((string)($input['marca'] ?? ''));
        $modelo = trim((string)($input['modelo'] ?? ''));
        $alm    = (int)($input['almacenamiento'] ?? 0);
        $ram    = (int)($input['ram'] ?? 0);
        $bat    = trim((string)($input['condicion_bateria'] ?? ''));
        $det    = trim((string)($input['detalle'] ?? ''));
        $precio = (float)($input['precio'] ?? 0);

        if ($marca === '' || $modelo === '' || $alm <= 0 || $ram <= 0 || $bat === '' || $det === '' || $precio <= 0) {
            responderJson(['ok' => false, 'error' => 'Completá todos los campos obligatorios con valores válidos.'], 400);
        }

        $guardado = DispositivoModel::guardar($input);
        responderJson(['ok' => true, 'item' => $guardado]);
    }

    public function eliminar(): void {
        AuthModel::requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
        }

        $input = leerInput();
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0 || !DispositivoModel::eliminar($id)) {
            responderJson(['ok' => false, 'error' => 'No se pudo eliminar el dispositivo.'], 404);
        }
        responderJson(['ok' => true]);
    }

    public function guardarCarrusel(): void {
        AuthModel::requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
        }

        $input = leerInput();
        $destacados = is_array($input['destacados'] ?? null) ? $input['destacados'] : [];
        $ordenes    = is_array($input['ordenes'] ?? null) ? $input['ordenes'] : [];

        DispositivoModel::actualizarCarrusel($destacados, $ordenes);
        responderJson(['ok' => true, 'mensaje' => 'Carrusel actualizado correctamente.']);
    }
}