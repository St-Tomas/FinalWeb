<?php

class CotizacionModel {
    private static string $archivo = __DIR__ . '/../data/cotizaciones.json';

    private static function datosIniciales(): array {
        return [
            [
                'id' => 1,
                'fecha' => '03/11/2026 14:20',
                'telefono_contacto' => '2926-510011',
                'marca' => 'Samsung',
                'modelo_equipo' => 'Galaxy A15',
                'estado_equipo' => 'Pantalla o vidrio roto (enciende)',
                'detalles' => 'Módulo original astillado, táctil funciona.',
                'estado_gestion' => 'pendiente',
            ],
            [
                'id' => 2,
                'fecha' => '02/11/2026 18:45',
                'telefono_contacto' => '2926-520022',
                'marca' => 'Motorola',
                'modelo_equipo' => 'Moto G52',
                'estado_equipo' => 'No enciende / Para repuestos',
                'detalles' => 'Cayó al agua. No carga.',
                'estado_gestion' => 'leida',
            ],
        ];
    }

    private static function cargarRaw(): array {
        $dir = dirname(self::$archivo);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        if (!file_exists(self::$archivo)) {
            $iniciales = self::datosIniciales();
            self::guardarRaw($iniciales);
            return $iniciales;
        }
        $data = json_decode(file_get_contents(self::$archivo), true);
        return is_array($data) ? $data : [];
    }

    private static function guardarRaw(array $items): void {
        $dir = dirname(self::$archivo);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        file_put_contents(
            self::$archivo,
            json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            LOCK_EX
        );
    }

    public static function listarTodas(): array {
        $lista = self::cargarRaw();
        $prioridad = ['pendiente' => 1, 'leida' => 2, 'contactada' => 3];

        usort($lista, function ($a, $b) use ($prioridad) {
            $pa = $prioridad[$a['estado_gestion'] ?? 'pendiente'] ?? 4;
            $pb = $prioridad[$b['estado_gestion'] ?? 'pendiente'] ?? 4;
            if ($pa !== $pb) {
                return $pa <=> $pb;
            }
            return (int)$b['id'] <=> (int)$a['id'];
        });

        return $lista;
    }

    public static function contarPendientes(): int {
        $contador = 0;
        foreach (self::cargarRaw() as $c) {
            if (($c['estado_gestion'] ?? 'pendiente') === 'pendiente') {
                $contador++;
            }
        }
        return $contador;
    }

    public static function crear(array $datos): array {
        $lista = self::cargarRaw();
        $maxId = 0;
        foreach ($lista as $c) {
            $maxId = max($maxId, (int)$c['id']);
        }

        $nueva = [
            'id'                => $maxId + 1,
            'fecha'             => date('d/m/Y H:i'),
            'telefono_contacto' => trim($datos['telefono_contacto']),
            'marca'             => trim($datos['marca']),
            'modelo_equipo'     => trim($datos['modelo_equipo']),
            'estado_equipo'     => trim($datos['estado']),
            'detalles'          => trim($datos['detalles']),
            'estado_gestion'    => 'pendiente',
        ];

        $lista[] = $nueva;
        self::guardarRaw($lista);
        return $nueva;
    }

    public static function cambiarEstado(int $id, string $estado): bool {
        $permitidos = ['pendiente', 'leida', 'contactada'];
        if (!in_array($estado, $permitidos, true)) {
            return false;
        }
        $lista = self::cargarRaw();
        $modificado = false;
        foreach ($lista as &$c) {
            if ((int)$c['id'] === $id) {
                $c['estado_gestion'] = $estado;
                $modificado = true;
                break;
            }
        }
        unset($c);
        if ($modificado) {
            self::guardarRaw($lista);
        }
        return $modificado;
    }

    public static function eliminar(int $id): bool {
        $lista = self::cargarRaw();
        $nueva = array_values(array_filter($lista, fn($c) => (int)$c['id'] !== $id));
        if (count($nueva) === count($lista)) {
            return false;
        }
        self::guardarRaw($nueva);
        return true;
    }
}