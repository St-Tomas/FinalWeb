<?php

class DispositivoModel {
    private static string $archivo = __DIR__ . '/../data/dispositivos.json';

    private static function datosIniciales(): array {
        return [
            [
                'id' => 1,
                'marca' => 'Samsung',
                'modelo' => 'Galaxy A15 4G',
                'almacenamiento' => 128,
                'ram' => 4,
                'condicion_bateria' => '100% (Original)',
                'detalle' => 'Módulo original de fábrica, sin rayones. Limpieza en puerto de carga realizada. Funciona perfecto.',
                'precio' => 250000,
                'imagen' => 'A15.avif',
                'imagenes' => ['A15.avif'],
                'colores' => [],
                'destacado' => true,
                'orden_carrusel' => 1,
            ],
            [
                'id' => 2,
                'marca' => 'Motorola',
                'modelo' => 'Moto G52',
                'almacenamiento' => 128,
                'ram' => 6,
                'condicion_bateria' => '92% (Excelente)',
                'detalle' => 'Pin de carga nuevo recién instalado. Pantalla pOLED impecable y sensores verificados.',
                'precio' => 180000,
                'imagen' => 'default.avif',
                'imagenes' => ['default.avif'],
                'colores' => [],
                'destacado' => true,
                'orden_carrusel' => 2,
            ],
            [
                'id' => 3,
                'marca' => 'Apple',
                'modelo' => 'iPhone SE 2020',
                'almacenamiento' => 64,
                'ram' => 3,
                'condicion_bateria' => '85% (Original)',
                'detalle' => 'Touch ID y True Tone operativos. Mínimas marcas de uso en marco, vidrio templado colocado.',
                'precio' => 200000,
                'imagen' => 'default.avif',
                'imagenes' => ['default.avif'],
                'colores' => [],
                'destacado' => true,
                'orden_carrusel' => 3,
            ],
            [
                'id' => 4,
                'marca' => 'Samsung',
                'modelo' => 'Galaxy S8',
                'almacenamiento' => 64,
                'ram' => 4,
                'condicion_bateria' => '82% (Buena)',
                'detalle' => 'Pantalla OLED sin manchas ni líneas. Ideal como equipo secundario o uso diario liviano.',
                'precio' => 90000,
                'imagen' => 'default.avif',
                'imagenes' => ['default.avif'],
                'colores' => [],
                'destacado' => true,
                'orden_carrusel' => 4,
            ],
            [
                'id' => 5,
                'marca' => 'Motorola',
                'modelo' => 'Edge 30',
                'almacenamiento' => 256,
                'ram' => 8,
                'condicion_bateria' => '95% (Original)',
                'detalle' => 'Estado impecable, pantalla 144Hz. Incluye limpieza interna preventiva y prueba completa.',
                'precio' => 320000,
                'imagen' => 'default.avif',
                'imagenes' => ['default.avif'],
                'colores' => [],
                'destacado' => true,
                'orden_carrusel' => 5,
            ],
            [
                'id' => 6,
                'marca' => 'Apple',
                'modelo' => 'iPhone 11',
                'almacenamiento' => 128,
                'ram' => 4,
                'condicion_bateria' => '79% (Original)',
                'detalle' => 'Face ID andando al 100%, cámaras limpias y sin abrir. Listo para usar con cualquier empresa.',
                'precio' => 380000,
                'imagen' => 'default.avif',
                'imagenes' => ['default.avif'],
                'colores' => [],
                'destacado' => true,
                'orden_carrusel' => 6,
            ],
        ];
    }

    private static function cargarTodosRaw(): array {
        $dir = dirname(self::$archivo);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        if (!file_exists(self::$archivo)) {
            $iniciales = self::datosIniciales();
            self::guardarTodosRaw($iniciales);
            return $iniciales;
        }
        $contenido = file_get_contents(self::$archivo);
        $data = json_decode($contenido, true);
        return is_array($data) ? $data : [];
    }

    private static function guardarTodosRaw(array $dispositivos): void {
        $dir = dirname(self::$archivo);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        file_put_contents(
            self::$archivo,
            json_encode(array_values($dispositivos), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            LOCK_EX
        );
    }

    public static function resolverImagenUrl(?string $nombre): string {
        $dirImg = __DIR__ . '/../public/images/';
        $limpio = basename(trim((string)$nombre));

        if ($limpio !== '' && file_exists($dirImg . $limpio)) {
            return '../public/images/' . rawurlencode($limpio);
        }
        if (file_exists($dirImg . 'default.avif')) {
            return '../public/images/default.avif';
        }
        if (file_exists($dirImg . 'default.png')) {
            return '../public/images/default.png';
        }
        return '../public/images/default.avif';
    }

    private static function sanitizarImagenes($rawImagenes, string $fallback = 'default.avif'): array {
        $lista = [];
        if (is_array($rawImagenes)) {
            foreach ($rawImagenes as $img) {
                $limpio = basename(trim((string)$img));
                if ($limpio !== '') {
                    $lista[] = $limpio;
                }
                if (count($lista) >= 5) {
                    break;
                }
            }
        } elseif (is_string($rawImagenes)) {
            $limpio = basename(trim($rawImagenes));
            if ($limpio !== '') {
                $lista[] = $limpio;
            }
        }

        if (empty($lista)) {
            $fb = basename(trim($fallback));
            $lista[] = $fb !== '' ? $fb : 'default.avif';
        }
        return $lista;
    }

    private static function sanitizarColores($rawColores): array {
        if (!is_array($rawColores)) {
            return [];
        }
        $resultado = [];
        foreach ($rawColores as $c) {
            if (!is_array($c)) {
                continue;
            }
            $nombre = trim((string)($c['nombre'] ?? ''));
            $hex    = trim((string)($c['hex'] ?? '#333333'));
            if (!preg_match('/^#[0-9a-fA-F]{6}$/', $hex)) {
                $hex = '#333333';
            }

            $rawImgs = $c['imagenes'] ?? (isset($c['imagen']) ? [$c['imagen']] : []);
            $imagenes = self::sanitizarImagenes($rawImgs, 'default.avif');

            if ($nombre === '' && $imagenes === ['default.avif']) {
                continue;
            }

            $resultado[] = [
                'nombre'   => $nombre !== '' ? $nombre : 'Variante',
                'hex'      => $hex,
                'imagenes' => $imagenes,
            ];
        }
        return $resultado;
    }

    private static function enriquecer(array $d): array {
        $imgs = self::sanitizarImagenes($d['imagenes'] ?? ($d['imagen'] ?? 'default.avif'));
        $d['imagenes']     = $imgs;
        $d['imagen']       = $imgs[0];
        $d['imagen_url']   = self::resolverImagenUrl($imgs[0]);
        $d['imagenes_url'] = array_map([self::class, 'resolverImagenUrl'], $imgs);

        $colores = is_array($d['colores'] ?? null) ? $d['colores'] : [];
        $d['colores'] = array_map(function ($c) {
            $cImgs = self::sanitizarImagenes($c['imagenes'] ?? ($c['imagen'] ?? 'default.avif'));
            $c['imagenes']     = $cImgs;
            $c['imagenes_url'] = array_map([self::class, 'resolverImagenUrl'], $cImgs);
            return $c;
        }, $colores);

        return $d;
    }

    public static function listarTodos(): array {
        $lista = self::cargarTodosRaw();
        return array_map([self::class, 'enriquecer'], $lista);
    }

    public static function listarDestacados(): array {
        $lista = array_filter(self::cargarTodosRaw(), fn($d) => !empty($d['destacado']));
        usort($lista, function ($a, $b) {
            $oa = (int)($a['orden_carrusel'] ?? 99);
            $ob = (int)($b['orden_carrusel'] ?? 99);
            return $oa === $ob ? ((int)$a['id'] <=> (int)$b['id']) : ($oa <=> $ob);
        });
        return array_values(array_map([self::class, 'enriquecer'], $lista));
    }

    public static function buscarConFiltros(array $filtros, int $pagina = 1, int $porPagina = 6): array {
        $todos = self::cargarTodosRaw();

        $busqueda  = mb_strtolower(trim((string)($filtros['busqueda'] ?? '')), 'UTF-8');
        $marcas    = array_map(fn($m) => mb_strtolower(trim((string)$m), 'UTF-8'), (array)($filtros['marca'] ?? []));
        $storages  = array_map('intval', (array)($filtros['storage'] ?? []));
        $precioMin = ($filtros['precio_min'] ?? '') !== '' ? (float)$filtros['precio_min'] : null;
        $precioMax = ($filtros['precio_max'] ?? '') !== '' ? (float)$filtros['precio_max'] : null;

        $filtrados = array_filter($todos, function ($d) use ($busqueda, $marcas, $storages, $precioMin, $precioMax) {
            if ($busqueda !== '') {
                $texto = mb_strtolower($d['marca'] . ' ' . $d['modelo'] . ' ' . $d['detalle'], 'UTF-8');
                if (mb_strpos($texto, $busqueda) === false) {
                    return false;
                }
            }
            if (!empty($marcas)) {
                if (!in_array(mb_strtolower($d['marca'], 'UTF-8'), $marcas, true)) {
                    return false;
                }
            }
            if (!empty($storages)) {
                if (!in_array((int)$d['almacenamiento'], $storages, true)) {
                    return false;
                }
            }
            if ($precioMin !== null && (float)$d['precio'] < $precioMin) {
                return false;
            }
            if ($precioMax !== null && (float)$d['precio'] > $precioMax) {
                return false;
            }
            return true;
        });

        $filtrados = array_values($filtrados);
        usort($filtrados, function ($a, $b) {
            $da = !empty($a['destacado']) ? 1 : 0;
            $db = !empty($b['destacado']) ? 1 : 0;
            if ($da !== $db) {
                return $db <=> $da;
            }
            return (int)$b['id'] <=> (int)$a['id'];
        });

        $total = count($filtrados);
        $totalPaginas = max(1, (int)ceil($total / $porPagina));
        $pagina = max(1, min($pagina, $totalPaginas));
        $offset = ($pagina - 1) * $porPagina;

        $paginaItems = array_slice($filtrados, $offset, $porPagina);

        return [
            'items'         => array_map([self::class, 'enriquecer'], $paginaItems),
            'total'         => $total,
            'pagina'        => $pagina,
            'total_paginas' => $totalPaginas,
        ];
    }

    public static function obtenerPorId(int $id): ?array {
        foreach (self::cargarTodosRaw() as $d) {
            if ((int)$d['id'] === $id) {
                return self::enriquecer($d);
            }
        }
        return null;
    }

    public static function guardar(array $datos): array {
        $todos = self::cargarTodosRaw();
        $id = (int)($datos['id'] ?? 0);

        $imagenesLimpias = self::sanitizarImagenes(
            $datos['imagenes'] ?? ($datos['imagen'] ?? 'default.avif'),
            'default.avif'
        );
        $coloresLimpios = self::sanitizarColores($datos['colores'] ?? []);

        if ($id > 0) {
            foreach ($todos as &$d) {
                if ((int)$d['id'] === $id) {
                    $d['marca']             = trim($datos['marca']);
                    $d['modelo']            = trim($datos['modelo']);
                    $d['almacenamiento']    = (int)$datos['almacenamiento'];
                    $d['ram']               = (int)$datos['ram'];
                    $d['condicion_bateria'] = trim($datos['condicion_bateria']);
                    $d['detalle']           = trim($datos['detalle']);
                    $d['precio']            = (float)$datos['precio'];
                    $d['imagen']            = $imagenesLimpias[0];
                    $d['imagenes']          = $imagenesLimpias;
                    $d['colores']           = $coloresLimpios;
                    $d['destacado']         = !empty($datos['destacado']);
                    if ($d['destacado'] && empty($d['orden_carrusel'])) {
                        $d['orden_carrusel'] = 99;
                    }
                    self::guardarTodosRaw($todos);
                    return self::enriquecer($d);
                }
            }
            unset($d);
        }

        $maxId = 0;
        foreach ($todos as $d) {
            $maxId = max($maxId, (int)$d['id']);
        }

        $nuevo = [
            'id'                => $maxId + 1,
            'marca'             => trim($datos['marca']),
            'modelo'            => trim($datos['modelo']),
            'almacenamiento'    => (int)$datos['almacenamiento'],
            'ram'               => (int)$datos['ram'],
            'condicion_bateria' => trim($datos['condicion_bateria']),
            'detalle'           => trim($datos['detalle']),
            'precio'            => (float)$datos['precio'],
            'imagen'            => $imagenesLimpias[0],
            'imagenes'          => $imagenesLimpias,
            'colores'           => $coloresLimpios,
            'destacado'         => !empty($datos['destacado']),
            'orden_carrusel'    => !empty($datos['destacado']) ? ($maxId + 1) : 0,
        ];

        $todos[] = $nuevo;
        self::guardarTodosRaw($todos);
        return self::enriquecer($nuevo);
    }

    public static function eliminar(int $id): bool {
        $todos = self::cargarTodosRaw();
        $nuevos = array_values(array_filter($todos, fn($d) => (int)$d['id'] !== $id));
        if (count($nuevos) === count($todos)) {
            return false;
        }
        self::guardarTodosRaw($nuevos);
        return true;
    }

    public static function actualizarCarrusel(array $idsDestacados, array $ordenes): void {
        $idsInt = array_map('intval', $idsDestacados);
        $todos = self::cargarTodosRaw();

        foreach ($todos as &$d) {
            $id = (int)$d['id'];
            if (in_array($id, $idsInt, true)) {
                $d['destacado'] = true;
                $orden = isset($ordenes[$id]) ? (int)$ordenes[$id] : 99;
                $d['orden_carrusel'] = $orden > 0 ? $orden : 99;
            } else {
                $d['destacado'] = false;
                $d['orden_carrusel'] = 0;
            }
        }
        unset($d);

        self::guardarTodosRaw($todos);
    }
}