<?php

class CotizacionController {
    public function crear(): void {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
        }

        $input = leerInput();
        $tel     = trim((string)($input['telefono_contacto'] ?? ''));
        $marca   = trim((string)($input['marca'] ?? ''));
        $modelo  = trim((string)($input['modelo_equipo'] ?? ''));
        $estado  = trim((string)($input['estado'] ?? ''));
        $detalle = trim((string)($input['detalles'] ?? ''));

        $soloDigitos = preg_replace('/\D+/', '', $tel);
        if (strlen($soloDigitos) < 8) {
            responderJson(['ok' => false, 'error' => 'Ingresá un número de WhatsApp válido (mínimo 8 dígitos).'], 400);
        }
        if (mb_strlen($modelo, 'UTF-8') < 2) {
            responderJson(['ok' => false, 'error' => 'Indicá el modelo exacto del equipo.'], 400);
        }
        if (mb_strlen($detalle, 'UTF-8') < 10) {
            responderJson(['ok' => false, 'error' => 'Contanos un poco más en detalles (mínimo 10 caracteres).'], 400);
        }

        $creada = CotizacionModel::crear([
            'telefono_contacto' => $tel,
            'marca'             => $marca !== '' ? $marca : 'Otra',
            'modelo_equipo'     => $modelo,
            'estado'            => $estado !== '' ? $estado : 'Sin especificar',
            'detalles'          => $detalle,
        ]);

        responderJson([
            'ok'      => true,
            'item'    => $creada,
            'mensaje' => '¡Cotización enviada! Te escribimos por WhatsApp a la brevedad.',
        ]);
    }

    public function listar(): void {
        AuthModel::requireAdmin();
        responderJson([
            'ok'         => true,
            'items'      => CotizacionModel::listarTodas(),
            'pendientes' => CotizacionModel::contarPendientes(),
        ]);
    }

    public function cambiarEstado(): void {
        AuthModel::requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
        }

        $input = leerInput();
        $id     = (int)($input['id'] ?? 0);
        $estado = (string)($input['estado'] ?? '');

        if ($id <= 0 || !CotizacionModel::cambiarEstado($id, $estado)) {
            responderJson(['ok' => false, 'error' => 'No se pudo actualizar el estado.'], 400);
        }
        responderJson([
            'ok'         => true,
            'pendientes' => CotizacionModel::contarPendientes(),
        ]);
    }

    public function eliminar(): void {
        AuthModel::requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responderJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
        }

        $input = leerInput();
        $id = (int)($input['id'] ?? 0);

        if ($id <= 0 || !CotizacionModel::eliminar($id)) {
            responderJson(['ok' => false, 'error' => 'No se pudo eliminar la cotización.'], 404);
        }
        responderJson([
            'ok'         => true,
            'pendientes' => CotizacionModel::contarPendientes(),
        ]);
    }
}