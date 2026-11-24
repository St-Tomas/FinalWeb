<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/models/AuthModel.php';
require_once __DIR__ . '/models/DispositivoModel.php';
require_once __DIR__ . '/models/CotizacionModel.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/DispositivoController.php';
require_once __DIR__ . '/controllers/CotizacionController.php';

function responderJson(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function leerInput(): array {
    $raw = file_get_contents('php://input');
    if ($raw !== '' && $raw !== false) {
        $json = json_decode($raw, true);
        if (is_array($json)) {
            return $json;
        }
    }
    return $_POST;
}

$action = $_GET['action'] ?? '';

$authCtrl        = new AuthController();
$dispositivoCtrl = new DispositivoController();
$cotizacionCtrl  = new CotizacionController();

switch ($action) {
    case 'session':
        $authCtrl->estadoSesion();
        break;
    case 'login':
        $authCtrl->login();
        break;
    case 'logout':
        $authCtrl->logout();
        break;

    case 'destacados':
        $dispositivoCtrl->destacados();
        break;
    case 'catalogo':
        $dispositivoCtrl->catalogo();
        break;
    case 'detalle':
        $dispositivoCtrl->detalle();
        break;
    case 'dispositivos_admin':
        $dispositivoCtrl->listarTodosAdmin();
        break;
    case 'dispositivo_guardar':
        $dispositivoCtrl->guardar();
        break;
    case 'dispositivo_eliminar':
        $dispositivoCtrl->eliminar();
        break;
    case 'carrusel_guardar':
        $dispositivoCtrl->guardarCarrusel();
        break;

    case 'cotizacion_crear':
        $cotizacionCtrl->crear();
        break;
    case 'cotizaciones_listar':
        $cotizacionCtrl->listar();
        break;
    case 'cotizacion_estado':
        $cotizacionCtrl->cambiarEstado();
        break;
    case 'cotizacion_eliminar':
        $cotizacionCtrl->eliminar();
        break;

    default:
        responderJson(['ok' => false, 'error' => 'Acción no válida.'], 404);
}