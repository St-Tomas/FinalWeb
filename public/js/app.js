const API_URL = '../api.php';
const FALLBACK_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
        '<rect width="400" height="400" rx="24" fill="#ECE4D5"/>' +
        '<rect x="130" y="70" width="140" height="260" rx="22" fill="#FCF9F4" stroke="#82B3A2" stroke-width="6"/>' +
        '<rect x="145" y="100" width="110" height="190" rx="8" fill="#E0EFE9"/>' +
        '<circle cx="200" cy="310" r="10" fill="#D4938D"/>' +
        '<text x="200" y="202" font-family="monospace" font-size="24" font-weight="bold" fill="#2B2E2D" text-anchor="middle">RT</text>' +
        '</svg>'
    );

let estadoAdmin = { logueado: false, usuario: null, pendientes: 0 };

document.addEventListener('DOMContentLoaded', async () => {
    await sincronizarSesion();
    conectarLogout();

    const pagina = obtenerPaginaActual();

    // Protección de rutas y redirecciones según sesión
    if ((pagina === 'admin.html' || pagina === 'dispositivo_form.html') && !estadoAdmin.logueado) {
        window.location.href = 'login.html';
        return;
    }
    if (pagina === 'login.html' && estadoAdmin.logueado) {
        window.location.href = 'inicio.html';
        return;
    }
    if (pagina === 'cotizar.html' && estadoAdmin.logueado) {
        window.location.href = 'admin.html';
        return;
    }

    if (pagina === 'inicio.html') await iniciarPaginaInicio();
    if (pagina === 'catalogo.html') await iniciarPaginaCatalogo();
    if (pagina === 'detalle.html') await iniciarPaginaDetalle();
    if (pagina === 'cotizar.html') iniciarPaginaCotizar();
    if (pagina === 'login.html') iniciarPaginaLogin();
    if (pagina === 'admin.html') await iniciarPaginaAdmin();
    if (pagina === 'dispositivo_form.html') await iniciarPaginaDispositivoForm();
});

/* ---------------- Helpers generales ---------------- */

function obtenerPaginaActual() {
    const partes = window.location.pathname.split('/');
    return (partes[partes.length - 1] || 'inicio.html').toLowerCase();
}

function escapeHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatoPrecio(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

async function apiFetch(action, opciones = {}) {
    const res = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
        credentials: 'same-origin',
        ...opciones,
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Ocurrió un error en el servidor.');
    }
    return data;
}

function aplicarFallbackImagenes(contenedor = document) {
    contenedor.querySelectorAll('img').forEach((img) => {
        img.addEventListener('error', () => {
            if (img.dataset.fallbackAplicado) return;
            img.dataset.fallbackAplicado = '1';
            img.src = FALLBACK_SVG;
        });
    });
}

/* ---------------- Sesión y Logout ---------------- */

async function sincronizarSesion() {
    try {
        const data = await apiFetch('session');
        estadoAdmin = {
            logueado: Boolean(data.logueado),
            usuario: data.usuario,
            pendientes: Number(data.pendientes || 0),
        };
    } catch {
        estadoAdmin = { logueado: false, usuario: null, pendientes: 0 };
    }

    document.body.classList.toggle('modo-admin', estadoAdmin.logueado);
    actualizarBadgePendientes(estadoAdmin.pendientes);
}

function actualizarBadgePendientes(cantidad) {
    document.querySelectorAll('#badgePendientes').forEach((badge) => {
        badge.textContent = cantidad;
        badge.classList.toggle('d-none', cantidad <= 0);
    });
}

function conectarLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (!btnLogout) return;

    btnLogout.addEventListener('click', async () => {
        try {
            await apiFetch('logout', { method: 'POST' });
        } finally {
            window.location.href = 'inicio.html';
        }
    });
}

/* ---------------- INICIO + CARRUSEL ---------------- */

async function iniciarPaginaInicio() {
    const track = document.getElementById('carruselTrack');
    if (!track) return;

    try {
        const data = await apiFetch('destacados');
        const items = data.items || [];

        if (items.length === 0) {
            track.innerHTML = `
                <div class="panel-soft text-center p-4 w-100">
                    <p class="mb-2 text-muted-mac">Todavía no hay equipos marcados como destacados.</p>
                    <a href="admin.html#carrusel" class="btn btn-mac-dark btn-sm px-3 solo-admin">Elegir destacados</a>
                </div>`;
        } else {
            track.innerHTML = items.map((eq) => `
                <article class="card card-retro carrusel-item-card">
                    <div class="card-img-container">
                        <span class="badge-destacado font-mono">DESTACADO</span>
                        <img src="${escapeHtml(eq.imagen_url)}" alt="${escapeHtml(eq.marca + ' ' + eq.modelo)}" loading="lazy">
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <span class="font-mono small text-muted-mac">${escapeHtml(eq.marca)}</span>
                        <h3 class="h5 fw-bold mb-2">${escapeHtml(eq.modelo)}</h3>
                        <div class="d-flex flex-wrap gap-1 mb-3">
                            <span class="spec-chip">${Number(eq.almacenamiento)}GB</span>
                            <span class="spec-chip">${Number(eq.ram)}GB RAM</span>
                            <span class="spec-chip spec-chip-sage">Bat. ${escapeHtml(eq.condicion_bateria)}</span>
                        </div>
                        <p class="precio fw-bold mt-auto mb-3">${formatoPrecio(eq.precio)}</p>
                        <div class="d-flex gap-2">
                            <a href="detalle.html?id=${Number(eq.id)}" class="btn btn-mac-dark flex-grow-1">Ver detalle</a>
                            <a href="dispositivo_form.html?id=${Number(eq.id)}" class="btn btn-mac-soft px-3 solo-admin">Editar</a>
                        </div>
                    </div>
                </article>
            `).join('');
            aplicarFallbackImagenes(track);
        }
    } catch (err) {
        track.innerHTML = `<div class="alert alert-warning w-100">${escapeHtml(err.message)}</div>`;
    }

    iniciarCarrusel();
}

function iniciarCarrusel() {
    const track = document.getElementById('carruselTrack');
    const btnPrev = document.getElementById('carruselPrev');
    const btnNext = document.getElementById('carruselNext');
    if (!track) return;

    const INTERVALO_MS = 3500;
    let autoTimer = null;

    function obtenerPaso() {
        const card = track.querySelector('.carrusel-item-card');
        if (!card) return 315;
        const gap = parseFloat(window.getComputedStyle(track).gap) || 20;
        return card.offsetWidth + gap;
    }

    function moverDerecha() {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxScroll <= 0) return;
        if (track.scrollLeft >= maxScroll - 5) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            track.scrollBy({ left: obtenerPaso(), behavior: 'smooth' });
        }
    }

    function moverIzquierda() {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxScroll <= 0) return;
        if (track.scrollLeft <= 5) {
            track.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
            track.scrollBy({ left: -obtenerPaso(), behavior: 'smooth' });
        }
    }

    function iniciarAuto() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        detenerAuto();
        autoTimer = setInterval(moverDerecha, INTERVALO_MS);
    }

    function detenerAuto() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    btnNext?.addEventListener('click', () => { moverDerecha(); iniciarAuto(); });
    btnPrev?.addEventListener('click', () => { moverIzquierda(); iniciarAuto(); });
    track.addEventListener('mouseenter', detenerAuto);
    track.addEventListener('mouseleave', iniciarAuto);
    track.addEventListener('focusin', detenerAuto);
    track.addEventListener('focusout', iniciarAuto);

    iniciarAuto();
}

/* ---------------- CATÁLOGO (6 por página + filtros al aplicar) ---------------- */

async function iniciarPaginaCatalogo() {
    const form = document.getElementById('formFiltros');
    const grilla = document.getElementById('grillaCatalogo');
    const paginacion = document.getElementById('paginacionCatalogo');
    const contador = document.getElementById('contadorResultados');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');
    if (!form || !grilla) return;

    let paginaActual = 1;
    let paramsActuales = new URLSearchParams();

    async function cargarCatalogo(pagina = 1) {
        paginaActual = pagina;
        const query = new URLSearchParams(paramsActuales.toString());
        query.set('p', String(pagina));

        try {
            const res = await fetch(`${API_URL}?action=catalogo&${query.toString()}`, {
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error cargando catálogo.');

            const items = data.items || [];
            if (contador) {
                contador.textContent = `${data.total} ${data.total === 1 ? 'equipo' : 'equipos'}`;
            }

            if (items.length === 0) {
                grilla.innerHTML = `
                    <div class="col-12">
                        <div class="panel-soft text-center py-5 px-3">
                            <h3 class="h5 fw-bold mb-2">Sin resultados</h3>
                            <p class="text-muted-mac mb-0">No encontramos equipos con esos filtros.</p>
                        </div>
                    </div>`;
            } else {
                grilla.innerHTML = items.map((eq) => `
                    <div class="col">
                        <article class="card h-100 card-retro">
                            <div class="card-img-container">
                                ${eq.destacado ? '<span class="badge-destacado font-mono">★ DESTACADO</span>' : ''}
                                <img src="${escapeHtml(eq.imagen_url)}" alt="${escapeHtml(eq.marca + ' ' + eq.modelo)}" loading="lazy">
                            </div>
                            <div class="card-body d-flex flex-column p-4">
                                <span class="font-mono small text-muted-mac">${escapeHtml(eq.marca)}</span>
                                <h3 class="h5 fw-bold mb-2">${escapeHtml(eq.modelo)}</h3>
                                <div class="d-flex flex-wrap gap-1 mb-2">
                                    <span class="spec-chip">${Number(eq.almacenamiento)}GB</span>
                                    <span class="spec-chip">${Number(eq.ram)}GB RAM</span>
                                </div>
                                <p class="small text-muted-mac mb-3">Batería: ${escapeHtml(eq.condicion_bateria)}</p>
                                <p class="precio fw-bold mt-auto mb-3">${formatoPrecio(eq.precio)}</p>
                                <a href="detalle.html?id=${Number(eq.id)}" class="btn btn-outline-retro w-100">Ver detalle</a>
                                <div class="d-flex gap-2 mt-2 pt-2 border-top border-mac solo-admin">
                                    <a href="dispositivo_form.html?id=${Number(eq.id)}" class="btn btn-mac-soft btn-sm flex-grow-1">Editar</a>
                                    <button type="button" class="btn btn-mac-danger btn-sm flex-grow-1" data-eliminar-id="${Number(eq.id)}" data-eliminar-nombre="${escapeHtml(eq.marca + ' ' + eq.modelo)}">Eliminar</button>
                                </div>
                            </div>
                        </article>
                    </div>
                `).join('');
                aplicarFallbackImagenes(grilla);
            }

            renderizarPaginacion(paginacion, data.pagina, data.total_paginas, (p) => {
                cargarCatalogo(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        } catch (err) {
            grilla.innerHTML = `<div class="col-12"><div class="alert alert-danger">${escapeHtml(err.message)}</div></div>`;
        }
    }

    // Solo aplica los filtros al apretar "Aplicar Filtros"
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        paramsActuales = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
            if (String(v).trim() !== '') {
                paramsActuales.append(k, String(v).trim());
            }
        }
        cargarCatalogo(1);
    });

    btnLimpiar?.addEventListener('click', () => {
        form.reset();
        paramsActuales = new URLSearchParams();
        cargarCatalogo(1);
    });

    // Eliminar dispositivo desde la grilla (admin)
    grilla.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-eliminar-id]');
        if (!btn) return;
        const id = Number(btn.dataset.eliminarId);
        const nombre = btn.dataset.eliminarNombre || 'este dispositivo';
        if (!confirm(`¿Seguro que querés eliminar "${nombre}" del catálogo?`)) return;

        try {
            await apiFetch('dispositivo_eliminar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            cargarCatalogo(paginaActual);
        } catch (err) {
            alert(err.message);
        }
    });

    await cargarCatalogo(1);
}

function renderizarPaginacion(contenedor, pagina, totalPaginas, onCambiar) {
    if (!contenedor) return;
    if (totalPaginas <= 1) {
        contenedor.innerHTML = '';
        return;
    }

    let html = `
        <li class="page-item ${pagina <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-pagina="${pagina - 1}">« Anterior</a>
        </li>`;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <li class="page-item ${i === pagina ? 'active' : ''}">
                <a class="page-link" href="#" data-pagina="${i}">${i}</a>
            </li>`;
    }

    html += `
        <li class="page-item ${pagina >= totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" data-pagina="${pagina + 1}">Siguiente »</a>
        </li>`;

    contenedor.innerHTML = html;
    contenedor.querySelectorAll('a[data-pagina]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const destino = Number(link.dataset.pagina);
            if (destino >= 1 && destino <= totalPaginas && destino !== pagina) {
                onCambiar(destino);
            }
        });
    });
}

/* ---------------- DETALLE ---------------- */

async function iniciarPaginaDetalle() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id') || 1);

    try {
        const data = await apiFetch(`detalle&id=${id}`);
        const eq = data.item;

        document.title = `${eq.marca} ${eq.modelo} - RescaTix`;
        const img = document.getElementById('detalleImagen');
        if (img) {
            img.src = eq.imagen_url;
            img.alt = `Foto de ${eq.marca} ${eq.modelo}`;
            aplicarFallbackImagenes(img.parentElement);
        }

        const badgeDest = document.getElementById('detalleDestacado');
        if (badgeDest) badgeDest.classList.toggle('d-none', !eq.destacado);

        document.getElementById('detalleMarca').textContent = eq.marca;
        document.getElementById('detalleModelo').textContent = eq.modelo;
        document.getElementById('detallePrecio').textContent = formatoPrecio(eq.precio);
        document.getElementById('detalleAlmacenamiento').textContent = `${eq.almacenamiento} GB`;
        document.getElementById('detalleRam').textContent = `${eq.ram} GB`;
        document.getElementById('detalleBateria').textContent = eq.condicion_bateria;
        document.getElementById('detalleDescripcion').textContent = eq.detalle;

        const btnWa = document.getElementById('btnWhatsappComprar');
        if (btnWa) {
            const msg = `Hola RescaTix! Me interesa el ${eq.marca} ${eq.modelo} (${eq.almacenamiento}GB / ${eq.ram}GB RAM) publicado a ${formatoPrecio(eq.precio)}.`;
            btnWa.href = `https://wa.me/5492926516982?text=${encodeURIComponent(msg)}`;
        }

        const btnEditar = document.getElementById('btnEditarDetalle');
        if (btnEditar) btnEditar.href = `dispositivo_form.html?id=${eq.id}`;

        const btnEliminar = document.getElementById('btnEliminarDetalle');
        btnEliminar?.addEventListener('click', async () => {
            if (!confirm(`¿Eliminar ${eq.marca} ${eq.modelo} del catálogo?`)) return;
            try {
                await apiFetch('dispositivo_eliminar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: eq.id }),
                });
                window.location.href = 'catalogo.html';
            } catch (err) {
                alert(err.message);
            }
        });
    } catch (err) {
        const cont = document.getElementById('detalleEquipo');
        if (cont) {
            cont.innerHTML = `
                <div class="text-center py-5">
                    <h2 class="h4 fw-bold mb-2">Equipo no encontrado</h2>
                    <p class="text-muted-mac mb-3">${escapeHtml(err.message)}</p>
                    <a href="catalogo.html" class="btn btn-mac-dark px-4">Volver al catálogo</a>
                </div>`;
        }
    }
}

/* ---------------- COTIZAR (Validación JS + POST PHP) ---------------- */

function iniciarPaginaCotizar() {
    const form = document.getElementById('formCotizar');
    const feedback = document.getElementById('cotizarFeedback');
    const txtDetalles = document.getElementById('detalles');
    const contador = document.getElementById('contadorDetalles');
    if (!form) return;

    txtDetalles?.addEventListener('input', () => {
        if (contador) contador.textContent = `${txtDetalles.value.trim().length} caracteres`;
    });

    const ultima = Number(localStorage.getItem('rescatix_ultima_cotizacion') || 0);
    if (ultima && Date.now() - ultima < 24 * 60 * 60 * 1000) {
        mostrarAlerta(feedback, 'info', 'Ya enviaste una consulta en las últimas 24hs. Si necesitás cotizar otro equipo igual podés continuar.');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const telInput = document.getElementById('telefono_contacto');
        const modInput = document.getElementById('modelo_equipo');
        const detInput = document.getElementById('detalles');

        const telValido = telInput.value.replace(/\D+/g, '').length >= 8;
        const modValido = modInput.value.trim().length >= 2;
        const detValido = detInput.value.trim().length >= 10;

        telInput.classList.toggle('is-invalid', !telValido);
        modInput.classList.toggle('is-invalid', !modValido);
        detInput.classList.toggle('is-invalid', !detValido);

        if (!telValido || !modValido || !detValido) return;

        const payload = {
            telefono_contacto: telInput.value.trim(),
            marca: document.getElementById('marca_equipo').value,
            modelo_equipo: modInput.value.trim(),
            estado: document.getElementById('estado').value,
            detalles: detInput.value.trim(),
        };

        try {
            const data = await apiFetch('cotizacion_crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            localStorage.setItem('rescatix_ultima_cotizacion', String(Date.now()));
            form.reset();
            if (contador) contador.textContent = '0 caracteres';
            mostrarAlerta(feedback, 'success', data.mensaje);
        } catch (err) {
            mostrarAlerta(feedback, 'danger', err.message);
        }
    });
}

/* ---------------- LOGIN ---------------- */

function iniciarPaginaLogin() {
    const form = document.getElementById('formLogin');
    const errorBox = document.getElementById('loginError');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = document.getElementById('usuario');
        const passInput = document.getElementById('password');

        const userOk = userInput.value.trim() !== '';
        const passOk = passInput.value !== '';
        userInput.classList.toggle('is-invalid', !userOk);
        passInput.classList.toggle('is-invalid', !passOk);
        if (!userOk || !passOk) return;

        errorBox?.classList.add('d-none');

        try {
            await apiFetch('login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario: userInput.value.trim(),
                    password: passInput.value,
                }),
            });
            // Al loguearse como admin redirige a la página de inicio
            window.location.href = 'inicio.html';
        } catch (err) {
            if (errorBox) {
                errorBox.textContent = err.message;
                errorBox.classList.remove('d-none');
            }
        }
    });
}

/* ---------------- ADMIN (Cotizaciones + Carrusel) ---------------- */

async function iniciarPaginaAdmin() {
    const feedback = document.getElementById('adminFeedback');

    // Abrir la pestaña correspondiente si vino con #carrusel
    if (window.location.hash === '#carrusel') {
        const tabBtn = document.getElementById('tab-carrusel-btn');
        if (tabBtn && window.bootstrap) {
            new bootstrap.Tab(tabBtn).show();
        }
    }

    await Promise.all([
        cargarCotizacionesAdmin(feedback),
        cargarCarruselAdmin(feedback),
    ]);
}

async function cargarCotizacionesAdmin(feedback) {
    const tbody = document.getElementById('tablaCotizaciones');
    if (!tbody) return;

    try {
        const data = await apiFetch('cotizaciones_listar');
        const items = data.items || [];
        actualizarBadgePendientes(Number(data.pendientes || 0));

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted-mac">No hay cotizaciones registradas todavía.</td></tr>`;
            return;
        }

        const etiquetaEstado = {
            pendiente: '<span class="badge rounded-pill badge-estado-pendiente">Pendiente</span>',
            leida: '<span class="badge rounded-pill badge-estado-leida">Leída</span>',
            contactada: '<span class="badge rounded-pill badge-estado-contactada">Contactada</span>',
        };

        tbody.innerHTML = items.map((c) => {
            const est = c.estado_gestion || 'pendiente';
            const telLimpio = String(c.telefono_contacto).replace(/\D+/g, '');
            return `
                <tr>
                    <td class="font-mono small text-nowrap">${escapeHtml(c.fecha)}</td>
                    <td class="fw-semibold text-nowrap">
                        <a href="https://wa.me/549${escapeHtml(telLimpio)}" target="_blank" rel="noopener" class="link-mac">${escapeHtml(c.telefono_contacto)}</a>
                    </td>
                    <td><strong>${escapeHtml(c.marca)}</strong> ${escapeHtml(c.modelo_equipo)}</td>
                    <td class="small">${escapeHtml(c.estado_equipo)}</td>
                    <td class="small text-muted-mac">${escapeHtml(c.detalles)}</td>
                    <td>${etiquetaEstado[est] || etiquetaEstado.pendiente}</td>
                    <td class="text-end text-nowrap">
                        <div class="d-inline-flex flex-wrap justify-content-end gap-1">
                            ${est !== 'leida' ? `<button type="button" class="btn btn-mac-soft btn-xs" data-cot-estado="leida" data-cot-id="${Number(c.id)}">Leída</button>` : ''}
                            ${est !== 'contactada' ? `<button type="button" class="btn btn-mac-sage btn-xs" data-cot-estado="contactada" data-cot-id="${Number(c.id)}">Contactada</button>` : ''}
                            <button type="button" class="btn btn-mac-danger btn-xs" data-cot-eliminar="${Number(c.id)}">Eliminar</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        tbody.onclick = async (e) => {
            const btnEstado = e.target.closest('[data-cot-estado]');
            if (btnEstado) {
                try {
                    await apiFetch('cotizacion_estado', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: Number(btnEstado.dataset.cotId),
                            estado: btnEstado.dataset.cotEstado,
                        }),
                    });
                    mostrarAlerta(feedback, 'success', 'Estado de la cotización actualizado.');
                    await cargarCotizacionesAdmin(feedback);
                } catch (err) {
                    mostrarAlerta(feedback, 'danger', err.message);
                }
                return;
            }

            const btnEliminar = e.target.closest('[data-cot-eliminar]');
            if (btnEliminar) {
                if (!confirm('¿Eliminar esta cotización?')) return;
                try {
                    await apiFetch('cotizacion_eliminar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: Number(btnEliminar.dataset.cotEliminar) }),
                    });
                    mostrarAlerta(feedback, 'info', 'Cotización eliminada.');
                    await cargarCotizacionesAdmin(feedback);
                } catch (err) {
                    mostrarAlerta(feedback, 'danger', err.message);
                }
            }
        };
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-danger py-3">${escapeHtml(err.message)}</td></tr>`;
    }
}

async function cargarCarruselAdmin(feedback) {
    const tbody = document.getElementById('tablaCarrusel');
    const form = document.getElementById('formCarrusel');
    if (!tbody || !form) return;

    try {
        const data = await apiFetch('dispositivos_admin');
        const items = data.items || [];

        tbody.innerHTML = items.map((eq) => `
            <tr>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" name="destacados[]" value="${Number(eq.id)}" ${eq.destacado ? 'checked' : ''}>
                    </div>
                </td>
                <td style="width: 95px;">
                    <input type="number" class="form-control form-control-sm input-mac" data-orden-id="${Number(eq.id)}" value="${Number(eq.orden_carrusel || 0)}" min="0">
                </td>
                <td><strong>${escapeHtml(eq.marca)}</strong> ${escapeHtml(eq.modelo)}</td>
                <td class="small text-muted-mac">${Number(eq.almacenamiento)}GB / ${Number(eq.ram)}GB RAM</td>
                <td class="font-mono fw-semibold">${formatoPrecio(eq.precio)}</td>
                <td class="text-end">
                    <a href="dispositivo_form.html?id=${Number(eq.id)}" class="btn btn-mac-soft btn-xs">Editar ficha</a>
                </td>
            </tr>
        `).join('');

        form.onsubmit = async (e) => {
            e.preventDefault();
            const destacados = [];
            const ordenes = {};

            form.querySelectorAll('input[name="destacados[]"]:checked').forEach((chk) => {
                destacados.push(Number(chk.value));
            });
            form.querySelectorAll('input[data-orden-id]').forEach((inp) => {
                ordenes[inp.dataset.ordenId] = Number(inp.value || 0);
            });

            try {
                const res = await apiFetch('carrusel_guardar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destacados, ordenes }),
                });
                mostrarAlerta(feedback, 'success', res.mensaje);
            } catch (err) {
                mostrarAlerta(feedback, 'danger', err.message);
            }
        };
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-danger py-3">${escapeHtml(err.message)}</td></tr>`;
    }
}

/* ---------------- FORMULARIO ALTA / EDICIÓN DISPOSITIVO ---------------- */

async function iniciarPaginaDispositivoForm() {
    const form = document.getElementById('formDispositivo');
    const feedback = document.getElementById('formDispositivoFeedback');
    const titulo = document.getElementById('tituloFormDispositivo');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const idEditar = Number(params.get('id') || 0);

    if (idEditar > 0) {
        if (titulo) titulo.textContent = 'Editar Dispositivo';
        try {
            const data = await apiFetch(`detalle&id=${idEditar}`);
            const eq = data.item;
            document.getElementById('dispositivoId').value = eq.id;
            document.getElementById('marca').value = eq.marca;
            document.getElementById('modelo').value = eq.modelo;
            document.getElementById('almacenamiento').value = eq.almacenamiento;
            document.getElementById('ram').value = eq.ram;
            document.getElementById('precio').value = eq.precio;
            document.getElementById('condicion_bateria').value = eq.condicion_bateria;
            document.getElementById('imagen').value = eq.imagen || '';
            document.getElementById('detalle').value = eq.detalle;
            document.getElementById('destacado').checked = Boolean(eq.destacado);
        } catch (err) {
            mostrarAlerta(feedback, 'danger', err.message);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const camposObligatorios = ['marca', 'modelo', 'almacenamiento', 'ram', 'precio', 'condicion_bateria', 'detalle'];
        let todoValido = true;
        camposObligatorios.forEach((idCampo) => {
            const el = document.getElementById(idCampo);
            const ok = el && el.value.trim() !== '' && (el.type !== 'number' || Number(el.value) > 0);
            el?.classList.toggle('is-invalid', !ok);
            if (!ok) todoValido = false;
        });
        if (!todoValido) return;

        const payload = {
            id: Number(document.getElementById('dispositivoId').value || 0),
            marca: document.getElementById('marca').value.trim(),
            modelo: document.getElementById('modelo').value.trim(),
            almacenamiento: Number(document.getElementById('almacenamiento').value),
            ram: Number(document.getElementById('ram').value),
            precio: Number(document.getElementById('precio').value),
            condicion_bateria: document.getElementById('condicion_bateria').value.trim(),
            imagen: document.getElementById('imagen').value.trim(),
            detalle: document.getElementById('detalle').value.trim(),
            destacado: document.getElementById('destacado').checked,
        };

        try {
            const res = await apiFetch('dispositivo_guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            window.location.href = `detalle.html?id=${res.item.id}`;
        } catch (err) {
            mostrarAlerta(feedback, 'danger', err.message);
        }
    });
}

function mostrarAlerta(elemento, tipo, mensaje) {
    if (!elemento) return;
    elemento.className = `alert alert-${tipo} mb-4`;
    elemento.textContent = mensaje;
}