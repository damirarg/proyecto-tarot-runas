import { mazo, imagenesRiderWaite, catalogoTiradas, mezclarMazo } from './tarot-data.js';
import { mazoRunas, catalogoTiradasRunas, mezclarRunas } from './runas-data.js';

let ultimaPregunta = "";
let ultimasCartas = [];
let modoActual = "tarot"; 
let intervaloNieve = null;
const nombresRunas = mazoRunas.map(runa => runa.nombre).join('|');
const regexArticuloRuna = new RegExp(`\\b(el|la)\\s+(${nombresRunas})\\b`, 'gi');
const regexContraccionRuna = new RegExp(`\\b(del|de la|al|a la)\\s+(${nombresRunas})\\b`, 'gi');

function normalizarArticulosRunas(texto) {
    return texto
        .replace(regexContraccionRuna, (_, articulo, runa) => {
            const base = articulo.toLowerCase().startsWith('a') ? 'a' : 'de';
            return `${base} ${runa}`;
        })
        .replace(regexArticuloRuna, (_, __, runa) => runa);
}

// --- FUNCIÓN PARA CONVERTIR MARKDOWN EN HTML DORADO ---
function formatearTextoMarkdown(texto) {
    if (!texto) return "";
    const textoLimpio = normalizarArticulosRunas(texto)
        .replace(/^\s{0,3}#{1,4}\s+(.+)$/gm, '### $1')
        .replace(/^\s*[-*]\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n');

    return textoLimpio
        .replace(/^###\s*(.*?)$/gm, '<h4 style="color: #f3d06c; font-family: \'Playfair Display\', serif; margin-top: 15px; margin-bottom: 5px;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f3d06c; font-family: \'Playfair Display\', serif; font-size: 1.1em;">$1</strong>')
        .replace(/\n/g, '<br>');
}

// --- GESTIÓN DE AUDIO DINÁMICA ---
const audioTarot = document.getElementById('audioFondo');
const audioRunas = document.getElementById('audioRunas');
const btnAudio = document.getElementById('btnAudio');

function manejarAudioPorReino() {
    if (!btnAudio) return;
    btnAudio.style.display = "block"; 
    if (btnAudio.textContent.includes("Activar")) return; 
    
    if (modoActual === "tarot") {
        if (audioRunas) audioRunas.pause();
        if (audioTarot) audioTarot.play().catch(()=>{});
    } else {
        if (audioTarot) audioTarot.pause();
        if (audioRunas) audioRunas.play().catch(()=>{});
    }
}

function detenerTodoElAudio() {
    if (audioTarot) audioTarot.pause();
    if (audioRunas) audioRunas.pause();
    if (btnAudio) btnAudio.style.display = "none"; 
}

if (btnAudio) {
    btnAudio.addEventListener('click', () => {
        let audioActivo = modoActual === "tarot" ? audioTarot : audioRunas;
        if (audioActivo && audioActivo.paused) {
            audioActivo.play().then(() => {
                btnAudio.textContent = "🔇 Silenciar Sonido";
            }).catch(() => {
                alert("El navegador requiere interacción previa para reproducir sonido.");
            });
        } else if (audioActivo) {
            audioActivo.pause();
            btnAudio.textContent = "🎵 Activar Sonido";
        }
    });
}

// --- EFECTO DE NIEVE (SOLO PARA RUNAS) ---
function iniciarNieve() {
    const contenedorNieve = document.getElementById('contenedor-nieve');
    if (!contenedorNieve) return;
    contenedorNieve.style.display = 'block';
    
    intervaloNieve = setInterval(() => {
        const copo = document.createElement('div');
        copo.classList.add('copo-nieve');
        copo.style.left = Math.random() * 100 + 'vw';
        copo.style.animationDuration = Math.random() * 3 + 2 + 's'; 
        const size = Math.random() * 5 + 2; 
        copo.style.width = size + 'px';
        copo.style.height = size + 'px';
        
        contenedorNieve.appendChild(copo);
        setTimeout(() => { copo.remove(); }, 5000);
    }, 150);
}

function detenerNieve() {
    if (intervaloNieve) clearInterval(intervaloNieve);
    const contenedorNieve = document.getElementById('contenedor-nieve');
    if (contenedorNieve) {
        contenedorNieve.innerHTML = '';
        contenedorNieve.style.display = 'none';
    }
}

// --- NAVEGACIÓN Y PORTALES CON ANIMACIÓN 3D ---
const pantallaPortales = document.getElementById('pantalla-portales');
const pantallaBienvenida = document.getElementById('pantalla-bienvenida');
const pantallaTiradas = document.getElementById('pantalla-tiradas');
const pantallaRecomendacion = document.getElementById('pantalla-recomendacion');
const pantallaLectura = document.getElementById('pantalla-lectura');
const contenedorPrincipal = document.getElementById('contenedor-principal');
const modalInformativo = document.getElementById('modalInformativo');
const modalEtiqueta = document.getElementById('modalEtiqueta');
const modalTitulo = document.getElementById('modalTitulo');
const modalContenido = document.getElementById('modalContenido');

const contenidosInformativos = {
    "como-funciona": {
        etiqueta: "Guía rápida",
        titulo: "Cómo funciona",
        contenido: `
            <div class="modal-grid">
                <article>
                    <span class="paso-modal">1</span>
                    <h3>Elegí tu oráculo</h3>
                    <p>Podés consultar el Tarot Rider-Waite o las runas del Futhark antiguo. Cada camino tiene su propia energía, música y estilo de lectura.</p>
                </article>
                <article>
                    <span class="paso-modal">2</span>
                    <h3>Escribí tu inquietud</h3>
                    <p>Formulá una pregunta clara. No hace falta que sea perfecta: alcanza con que represente aquello que querés mirar con más atención.</p>
                </article>
                <article>
                    <span class="paso-modal">3</span>
                    <h3>Seleccioná una tirada</h3>
                    <p>La app baraja cartas o runas al azar y usa el método elegido para ordenar la interpretación según posiciones simbólicas.</p>
                </article>
                <article>
                    <span class="paso-modal">4</span>
                    <h3>Recibí una lectura</h3>
                    <p>La interpretación se genera con IA a partir de tu pregunta, los símbolos extraídos y la estructura de la tirada.</p>
                </article>
            </div>
        `
    },
    ayuda: {
        etiqueta: "Soporte",
        titulo: "Preguntas frecuentes y ayuda",
        contenido: `
            <div class="faq-lista">
                <details open>
                    <summary>¿Las lecturas predicen el futuro?</summary>
                    <p>No. Están pensadas para entretenimiento, introspección y reflexión simbólica. No reemplazan decisiones personales ni asesoramiento profesional.</p>
                </details>
                <details>
                    <summary>¿Qué tipo de preguntas conviene hacer?</summary>
                    <p>Funcionan mejor las preguntas abiertas: "Qué debería tener en cuenta", "Cómo puedo abordar esta situación" o "Qué energía rodea este vínculo".</p>
                </details>
                <details>
                    <summary>¿Puedo consultar sobre salud, dinero o temas legales?</summary>
                    <p>Podés reflexionar sobre cómo te sentís frente a esos temas, pero la app no brinda consejos médicos, financieros ni jurídicos. Para asuntos importantes, consultá a una persona profesional calificada.</p>
                </details>
                <details>
                    <summary>¿Por qué a veces tarda en responder?</summary>
                    <p>La lectura depende de un servicio de IA. Si el servidor está despertando o hay mucha carga, puede demorar unos segundos más.</p>
                </details>
                <details>
                    <summary>¿Qué hago si aparece un error?</summary>
                    <p>Probá recargar la página y repetir la consulta. Si el problema sigue, puede haber una interrupción temporal del servicio de IA.</p>
                </details>
            </div>
        `
    },
    contacto: {
        etiqueta: "Contacto",
        titulo: "Contáctanos",
        contenido: `
            <div class="contacto-modal">
                <p>Si querés reportar un error, sugerir una tirada o compartir una mejora para la experiencia, podés escribirnos con el mayor detalle posible.</p>
                <div class="contacto-card">
                    <strong>Información útil para incluir</strong>
                    <ul>
                        <li>Qué estabas intentando hacer.</li>
                        <li>Si estabas en Tarot o Runas.</li>
                        <li>Qué tirada elegiste.</li>
                        <li>Una captura o descripción del error, si corresponde.</li>
                    </ul>
                </div>
                <p class="nota-contacto">Por ahora esta sección no envía mensajes desde la app. En la próxima etapa podemos conectarla a email, WhatsApp o un formulario real.</p>
            </div>
        `
    }
};

function activarModoLectura(activo) {
    if (!contenedorPrincipal) return;
    contenedorPrincipal.classList.toggle('modo-lectura', activo);
    document.body.classList.toggle('modo-lectura', activo);
}

function abrirModalInformativo(tipo) {
    const info = contenidosInformativos[tipo];
    if (!info || !modalInformativo || !modalEtiqueta || !modalTitulo || !modalContenido) return;
    modalEtiqueta.textContent = info.etiqueta;
    modalTitulo.textContent = info.titulo;
    modalContenido.innerHTML = info.contenido;
    modalInformativo.classList.add('visible');
    modalInformativo.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-abierto');
}

function cerrarModalInformativo() {
    if (!modalInformativo) return;
    modalInformativo.classList.remove('visible');
    modalInformativo.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-abierto');
}

document.querySelectorAll('[data-info-modal]').forEach(btn => {
    btn.addEventListener('click', () => abrirModalInformativo(btn.dataset.infoModal));
});

document.querySelectorAll('[data-cerrar-modal]').forEach(btn => {
    btn.addEventListener('click', cerrarModalInformativo);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarModalInformativo();
});

document.getElementById('btnPortalTarot')?.addEventListener('click', function() {
    this.classList.add('abierta');
    
    setTimeout(() => {
        modoActual = "tarot";
        document.body.className = 'bg-tarot'; 
        if (contenedorPrincipal) contenedorPrincipal.classList.add('modo-reino');
        detenerNieve();
        manejarAudioPorReino();
        
        document.querySelectorAll('.btn-salir-reino').forEach(btn => {
            btn.textContent = "🚪 Salir del Reino";
        });
        
        if (pantallaPortales) pantallaPortales.style.display = "none";
        if (pantallaBienvenida) pantallaBienvenida.style.display = "flex";
        
        const titulo = document.getElementById('tituloSeccionTirada');
        if (titulo) titulo.textContent = "Oráculo del Tarot";
        
        const cartaDecorativa = document.getElementById('cartaDecorativa');
        if (cartaDecorativa) cartaDecorativa.src = "imagenes/RWS_Tarot_00_Fool.jpg";
        
        const textoRitualDia = document.getElementById('textoRitualDia');
        if (textoRitualDia) textoRitualDia.textContent = "Carta del Día";

        this.classList.remove('abierta');
    }, 1000); 
});

document.getElementById('btnPortalRunas')?.addEventListener('click', function() {
    this.classList.add('abierta');
    
    setTimeout(() => {
        modoActual = "runas";
        document.body.className = 'bg-runas'; 
        if (contenedorPrincipal) contenedorPrincipal.classList.add('modo-reino');
        iniciarNieve();
        manejarAudioPorReino();
        
        document.querySelectorAll('.btn-salir-reino').forEach(btn => {
            btn.textContent = "🪖 Salir del Reino";
        });
        
        if (pantallaPortales) pantallaPortales.style.display = "none";
        if (pantallaBienvenida) pantallaBienvenida.style.display = "flex";
        
        const titulo = document.getElementById('tituloSeccionTirada');
        if (titulo) titulo.textContent = "Sabiduría de las Runas";

        const cartaDecorativa = document.getElementById('cartaDecorativa');
        if (cartaDecorativa) cartaDecorativa.src = "runas_imagenes/fehu.png"; 

        const textoRitualDia = document.getElementById('textoRitualDia');
        if (textoRitualDia) textoRitualDia.textContent = "Runa del Día";

        this.classList.remove('abierta');
    }, 1000);
});

// Botones "Salir del Reino"
document.querySelectorAll('.btn-salir-reino').forEach(btn => {
    btn.addEventListener('click', () => {
        document.body.className = 'bg-general'; 
        if (contenedorPrincipal) contenedorPrincipal.classList.remove('modo-reino');
        activarModoLectura(false);
        detenerNieve();
        detenerTodoElAudio();
        
        if (pantallaPortales) pantallaPortales.style.display = "flex";
        if (pantallaBienvenida) pantallaBienvenida.style.display = "none";
        if (pantallaTiradas) pantallaTiradas.style.display = "none";
        if (pantallaRecomendacion) pantallaRecomendacion.style.display = "none";
        if (pantallaLectura) pantallaLectura.style.display = "none";
        
        const inputPregunta = document.getElementById('preguntaUsuario');
        if (inputPregunta) inputPregunta.value = "";
    });
});

// Botones "Volver al Menú"
document.querySelectorAll('.btn-volver-menu').forEach(btn => {
    btn.addEventListener('click', () => {
        if (pantallaPortales) pantallaPortales.style.display = "none";
        if (pantallaBienvenida) pantallaBienvenida.style.display = "flex";
        if (pantallaTiradas) pantallaTiradas.style.display = "none";
        if (pantallaRecomendacion) pantallaRecomendacion.style.display = "none";
        if (pantallaLectura) pantallaLectura.style.display = "none";
        activarModoLectura(false);
        
        const inputPregunta = document.getElementById('preguntaUsuario');
        if (inputPregunta) inputPregunta.value = "";
    });
});

// Botones de sub-menú (Solapas)
document.getElementById('btnIrTiradas')?.addEventListener('click', () => {
    if (pantallaBienvenida) pantallaBienvenida.style.display = "none";
    if (pantallaTiradas) pantallaTiradas.style.display = "flex";
});

// Botón Hacer Otra Consulta
const botonesOtraConsulta = document.querySelectorAll('#btnCambiarPregunta, #btnHacerOtraConsulta');
botonesOtraConsulta.forEach(btn => {
    btn.addEventListener('click', () => {
        if (pantallaBienvenida) pantallaBienvenida.style.display = "none";
        if (pantallaTiradas) pantallaTiradas.style.display = "flex";
        if (pantallaRecomendacion) pantallaRecomendacion.style.display = "none";
        if (pantallaLectura) pantallaLectura.style.display = "none";
        activarModoLectura(false);
        
        const inputPregunta = document.getElementById('preguntaUsuario');
        if (inputPregunta) inputPregunta.value = "";
    });
});

// --- GENERACIÓN DEL CARRUSEL ---
document.getElementById('btnMostrarOpciones')?.addEventListener('click', () => {
    const pregunta = document.getElementById('preguntaUsuario');
    if (pregunta && !pregunta.value.trim()) {
        alert("Por favor, escribí tu consulta antes de continuar.");
        return;
    }

    if (pantallaTiradas) pantallaTiradas.style.display = "none";
    if (pantallaRecomendacion) pantallaRecomendacion.style.display = "flex";

    const carrusel = document.getElementById('carruselTiradas');
    if (!carrusel) return;
    carrusel.innerHTML = ""; 

    const catalogoActivo = (modoActual === "tarot") ? catalogoTiradas : catalogoTiradasRunas;

    catalogoActivo.forEach(info => {
        const tarjeta = document.createElement('button');
        tarjeta.className = 'tarjeta-carrusel';
        
        const titulo = document.createElement('strong');
        titulo.textContent = (modoActual === "tarot") ? `🔮 ${info.nombre}` : `ᛟ ${info.nombre}`;
        
        const desc = document.createElement('small');
        desc.textContent = info.desc;

        tarjeta.appendChild(titulo);
        tarjeta.appendChild(desc);

        tarjeta.addEventListener('click', () => ejecutarTiradaElegida(info.id));
        carrusel.appendChild(tarjeta);
    });
});

document.getElementById('btnFlechaIzq')?.addEventListener('click', () => {
    document.getElementById('carruselTiradas')?.scrollBy({ left: -260, behavior: 'smooth' });
});
document.getElementById('btnFlechaDer')?.addEventListener('click', () => {
    document.getElementById('carruselTiradas')?.scrollBy({ left: 260, behavior: 'smooth' });
});

function ejecutarTiradaElegida(idTirada) {
    if (modoActual === "tarot") {
        let cantidad = 3;
        if (idTirada === "1") cantidad = 1;
        else if (idTirada.startsWith("4")) cantidad = 4;
        else if (idTirada.startsWith("5")) cantidad = 5;
        else if (idTirada === "7") cantidad = 7;
        else if (idTirada === "10") cantidad = 10;
        else if (idTirada === "12") cantidad = 12;

        realizarConsultaTarot(cantidad, idTirada);
    } else {
        let cantidadRunas = 1;
        if (idTirada === "runa_odin") cantidadRunas = 1;
        else if (idTirada === "nornas") cantidadRunas = 3;
        else if (idTirada === "cruz_runica") cantidadRunas = 4;
        else if (idTirada === "tirada_5") cantidadRunas = 5;
        else if (idTirada === "cruz_celta") cantidadRunas = 6;
        else if (idTirada === "martillo_thor") cantidadRunas = 6;
        else if (idTirada === "tirada_7") cantidadRunas = 7;
        else if (idTirada === "yggdrasil") cantidadRunas = 9;

        realizarConsultaRunas(cantidadRunas, idTirada);
    }
}

// --- RITUAL INTERACTIVO DE LA CARTA DEL DÍA ---
document.getElementById('btnRitualDia')?.addEventListener('click', () => {
    if (pantallaBienvenida) pantallaBienvenida.style.display = "none";
    if (pantallaLectura) pantallaLectura.style.display = "flex";
    activarModoLectura(true);

    const divResultado = document.getElementById('resultado');
    if (!divResultado) return;
    divResultado.innerHTML = "";

    const tituloRitual = document.createElement('strong');
    tituloRitual.style.color = "#f3d06c";
    tituloRitual.style.fontSize = "1.2em";
    tituloRitual.textContent = (modoActual === "tarot") ? "✨ Ritual de la Carta del Día ✨" : "✨ Runa del Día ✨";

    const descRitual = document.createElement('p');
    descRitual.style.color = "#d1c4e9";
    descRitual.style.fontSize = "0.95em";
    descRitual.style.marginTop = "20px";
    descRitual.textContent = (modoActual === "tarot") ? "El mazo completo de 78 arcanos está extendido en abanico. Desplázate horizontalmente y elige una carta por intuición:" : "Las runas están preparadas. Selecciona una pieza por intuición:";

    const mesaAbanico = document.createElement('div');
    mesaAbanico.className = "mesa-seleccion-cartas";

    if (modoActual === "tarot") {
        const mazoMezclado = mezclarMazo(mazo);
        mazoMezclado.forEach((cartaSecreta) => {
            const archivoRider = imagenesRiderWaite[cartaSecreta];
            
            const cartaContenedor = document.createElement('div');
            cartaContenedor.className = 'carta-contenedor';
            cartaContenedor.innerHTML = `<div class="carta-flipper"><div class="cara-trasera"></div><img class="cara-frontal" src="imagenes/${archivoRider}" alt="${cartaSecreta}"></div>`;

            cartaContenedor.addEventListener('click', () => elegirCartaInteractiva(cartaContenedor, cartaSecreta, archivoRider));
            mesaAbanico.appendChild(cartaContenedor);
        });
    } else {
        const runasMezcladas = mezclarRunas(mazoRunas);
        runasMezcladas.forEach((runaSecreta) => {
            const cartaContenedor = document.createElement('div');
            cartaContenedor.className = 'carta-contenedor';
            cartaContenedor.style.width = '70px';
            cartaContenedor.innerHTML = `<div class="carta-flipper"><div class="cara-trasera" style="background-image: none; background-color: #1a122a; border-radius: 12px; border: 2px solid #c59b27;"></div><img class="cara-frontal" src="runas_imagenes/${runaSecreta.id}.png" alt="${runaSecreta.nombre}" style="border-radius: 12px; border: 2px solid #c59b27; background-color: #1a122a; object-fit: contain; padding: 5px;"></div>`;

            cartaContenedor.addEventListener('click', () => {
                realizarConsultaRunas(1, "runa_odin");
            });
            mesaAbanico.appendChild(cartaContenedor);
        });
    }

    divResultado.appendChild(tituloRitual);
    divResultado.appendChild(descRitual);
    divResultado.appendChild(mesaAbanico);
});

async function elegirCartaInteractiva(elementoContenedor, cartaElegida, archivoRider) {
    if (document.querySelector('.carta-contenedor.seleccionada')) return;
    
    elementoContenedor.classList.add('seleccionada', 'volteada');

    ultimaPregunta = "Carta del Día";
    ultimasCartas = [cartaElegida];

    const divResultado = document.getElementById('resultado');
    if (!divResultado) return;
    
    setTimeout(async () => {
        divResultado.innerHTML = `<strong>✨ Tu Carta del Día: ${cartaElegida} ✨</strong><div class="contenedor-cartas"><div class="posicion-carta"><img src="imagenes/${archivoRider}" class="carta-animada"></div></div><p><em style='color: #f3d06c;'>Canalizando el mensaje del oráculo...</em></p>`;

        try {
            const respuesta = await fetch('/api/consultar-tarot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pregunta: "Carta del Día", cartas: [cartaElegida], idTirada: "1", cantidadCartas: 1 })
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.error || `Servidor respondió con código ${respuesta.status}`);
            }
            const datos = await respuesta.json();

            divResultado.innerHTML = `
                <h3 class="titulo-consulta">Tu Carta del Día: ${cartaElegida}</h3>
                <div class="lectura-layout lectura-simple">
                    <div class="zona-oraculo">
                        <div class="contenedor-cartas"><div class="posicion-carta"><img src="imagenes/${archivoRider}" class="carta-animada" alt="${cartaElegida}"></div></div>
                    </div>
                    <div class="texto-lectura">${formatearTextoMarkdown(datos.lectura)}</div>
                </div>`;
            crearBotonProfundizar(divResultado);

        } catch (error) {
            console.error("Error detectado:", error);
            divResultado.innerHTML += `<div style="margin-top: 20px; padding: 15px; border: 1px solid #ff6b6b; border-radius: 8px; background-color: rgba(255, 107, 107, 0.1);"><strong style='color: #ff6b6b;'>Error de conexión:</strong><br><span style='color: #d1c4e9;'>${error.message}</span><br><br><small>Por favor, revisá los Logs de tu servidor en Render para ver el detalle técnico exacto.</small></div>`;
        }
    }, 1000);
}

// --- CONSULTAS DE API ---
async function realizarConsultaTarot(cantidadCartas, idTirada) {
    const preguntaInput = document.getElementById('preguntaUsuario');
    const pregunta = preguntaInput ? preguntaInput.value : "";
    const divResultado = document.getElementById('resultado');

    if (pantallaRecomendacion) pantallaRecomendacion.style.display = "none";
    if (pantallaLectura) pantallaLectura.style.display = "flex";
    activarModoLectura(true);

    if (!divResultado) return;
    divResultado.innerHTML = "<p><strong style='color: #f3d06c;'>Barajando el mazo y canalizando la energía... 🔮</strong></p>";

    const mazoMezclado = mezclarMazo(mazo);
    const cartasSeleccionadas = mazoMezclado.slice(0, cantidadCartas);

    ultimaPregunta = pregunta;
    ultimasCartas = cartasSeleccionadas;

    let claseMesa = "contenedor-cartas ";
    if (idTirada === "3") claseMesa += "mesa-pasado-presente-futuro";
    else if (idTirada === "3_ap") claseMesa += "mesa-aprendizaje";
    else if (idTirada === "4_lab") claseMesa += "mesa-brujula";
    else if (idTirada === "4_am" || (cantidadCartas === 4 && idTirada !== "4_lab")) claseMesa += "mesa-espejo";
    else if (idTirada.startsWith("5")) claseMesa += "mesa-encrucijada";
    else if (idTirada === "7") claseMesa += "mesa-herradura";
    else if (idTirada === "10") claseMesa += "mesa-cruz-celta";
    else if (idTirada === "12") claseMesa += "mesa-mapamundi";

    try {
        const respuesta = await fetch('/api/consultar-tarot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pregunta, cartas: cartasSeleccionadas, idTirada, cantidadCartas })
        });
        
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.error || `Servidor respondió con código ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        
        const tiradaElegida = catalogoTiradas.find(tirada => tirada.id === idTirada);
        const nombreTirada = tiradaElegida ? tiradaElegida.nombre : `Tirada de ${cantidadCartas} cartas`;
        const listaCartas = cartasSeleccionadas.join(', ');
        const claseLayoutTarot = cantidadCartas >= 7 ? 'lectura-tarot-amplia' : 'lectura-tarot';

        divResultado.innerHTML = `
            <h3 class="titulo-consulta">Tu Lectura de Tarot</h3>
            <div class="lectura-resumen lectura-resumen-tarot">
                <span><strong>Pregunta</strong>${pregunta}</span>
                <span><strong>Método</strong>${nombreTirada}</span>
                <span><strong>Cartas</strong>${listaCartas}</span>
            </div>
            <div class="lectura-layout ${claseLayoutTarot}">
                <div class="zona-oraculo zona-oraculo-tarot">
                    <div class="${claseMesa}">
                        ${cartasSeleccionadas.map((carta, index) => `<div class="posicion-carta pos-${index + 1}"><img src="imagenes/${imagenesRiderWaite[carta]}" class="carta-animada" style="animation-delay: ${index * 0.2}s" alt="${carta}"></div>`).join('')}
                    </div>
                </div>
                <div class="texto-lectura">${formatearTextoMarkdown(datos.lectura)}</div>
            </div>`;
        
        crearBotonProfundizar(divResultado);
    } catch (error) { 
        console.error("Error detectado:", error);
        divResultado.innerHTML = `<div style="margin-top: 20px; padding: 15px; border: 1px solid #ff6b6b; border-radius: 8px; background-color: rgba(255, 107, 107, 0.1);"><strong style='color: #ff6b6b;'>Error de conexión:</strong><br><span style='color: #d1c4e9;'>${error.message}</span><br><br><small>Por favor, revisá los Logs de tu servidor en Render para ver el detalle técnico exacto.</small></div>`; 
    }
}

async function realizarConsultaRunas(cantidadRunas, idTirada) {
    const preguntaInput = document.getElementById('preguntaUsuario');
    const pregunta = preguntaInput ? preguntaInput.value : "";
    const divResultado = document.getElementById('resultado');

    if (pantallaRecomendacion) pantallaRecomendacion.style.display = "none";
    if (pantallaLectura) pantallaLectura.style.display = "flex";
    activarModoLectura(true);

    if (!divResultado) return;
    divResultado.innerHTML = "<p><strong style='color: #f3d06c;'>Tallando y arrojando las runas sagradas... ᛟ</strong></p>";

    const runasMezcladas = mezclarRunas(mazoRunas);
    const runasSeleccionadas = runasMezcladas.slice(0, cantidadRunas);

    ultimaPregunta = pregunta;
    ultimasCartas = runasSeleccionadas.map(r => r.nombre);

    let claseMesaRunas = "mesa-runas-lineal";
    if (idTirada === "cruz_runica") claseMesaRunas = "mesa-cruz-runica";
    else if (idTirada === "tirada_5") claseMesaRunas = "mesa-tirada-5-runas";
    else if (idTirada === "cruz_celta") claseMesaRunas = "mesa-cruz-celta-runas";
    else if (idTirada === "martillo_thor") claseMesaRunas = "mesa-martillo-thor";
    else if (idTirada === "tirada_7") claseMesaRunas = "mesa-tirada-7-runas";
    else if (idTirada === "yggdrasil") claseMesaRunas = "mesa-yggdrasil";

    try {
        const respuesta = await fetch('/api/consultar-runas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pregunta, runas: ultimasCartas, idTirada, cantidadRunas })
        });
        
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.error || `Servidor respondió con código ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        
        const tiradaElegida = catalogoTiradasRunas.find(tirada => tirada.id === idTirada);
        const nombreTirada = tiradaElegida ? tiradaElegida.nombre : `Tirada de ${cantidadRunas} runas`;
        const listaRunas = runasSeleccionadas.map(runa => runa.nombre).join(', ');

        let HTMLRunas = `
            <h3 class="titulo-consulta">Tu Consulta Rúnica</h3>
            <div class="lectura-resumen lectura-resumen-runas">
                <span><strong>Pregunta</strong>${pregunta}</span>
                <span><strong>Método</strong>${nombreTirada}</span>
                <span><strong>Runas</strong>${listaRunas}</span>
            </div>
            <div class="lectura-layout lectura-runas">
                <div class="zona-oraculo zona-oraculo-runas">
                    <div class="${claseMesaRunas}">`;
        
        runasSeleccionadas.forEach((runa, index) => {
            let gridArea = (idTirada === "cruz_runica" || idTirada === "cruz_celta" || idTirada === "martillo_thor" || idTirada === "yggdrasil" || idTirada === "tirada_7") ? `grid-area: runa${index + 1};` : "";
            
            HTMLRunas += `
                <div class="runa-ficha" style="animation: aparecerCarta 0.6s ease-out ${index * 0.2}s forwards; ${gridArea}">
                    <img src="runas_imagenes/${runa.id}.png" alt="${runa.nombre}" class="img-runa">
                    <strong style="display: block; font-family: 'Playfair Display', serif; font-size: 0.95em; line-height: 1.2;">
                        <span style="opacity: 0.8; font-size: 0.9em;">${index + 1}.</span><br>
                        ${runa.nombre}
                    </strong>
                </div>`;
        });
        HTMLRunas += `
                    </div>
                </div>
                <div class="texto-lectura">${formatearTextoMarkdown(datos.lectura)}</div>
            </div>`;
        
        divResultado.innerHTML = HTMLRunas;
        crearBotonProfundizar(divResultado);

    } catch (error) { 
        console.error("Error detectado:", error);
        divResultado.innerHTML = `<div style="margin-top: 20px; padding: 15px; border: 1px solid #ff6b6b; border-radius: 8px; background-color: rgba(255, 107, 107, 0.1);"><strong style='color: #ff6b6b;'>Error de conexión:</strong><br><span style='color: #d1c4e9;'>${error.message}</span><br><br><small>Por favor, revisá los Logs de tu servidor en Render para ver el detalle técnico exacto.</small></div>`; 
    }
}

// NUEVA FUNCIÓN: Ahora el botón usa la clase en lugar de estilos en línea
function crearBotonProfundizar(contenedor) {
    const btn = document.createElement('button');
    btn.className = 'btn-profundizar';
    btn.textContent = '💡 PROFUNDIZAR EN ESTA LECTURA';

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '✨ Ya se profundizó en esta lectura';

        const seccionProfundizacion = document.createElement('div');
        seccionProfundizacion.className = 'caja-profundizacion'; // <-- ACÁ APLICAMOS LA CLASE CSS
        seccionProfundizacion.innerHTML = `<em>Canalizando una explicación más profunda y detallada de la tirada... 🔮</em>`;
        contenedor.appendChild(seccionProfundizacion);

        try {
            // LÓGICA INTELIGENTE: Elige el servidor de Tarot o Runas según el modoActual
            const endpoint = modoActual === "tarot" ? '/api/profundizar-tarot' : '/api/profundizar-runas';
            const payload = modoActual === "tarot" ? { pregunta: ultimaPregunta, cartas: ultimasCartas } : { pregunta: ultimaPregunta, runas: ultimasCartas };

            const respuesta = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.error || `Servidor respondió con código ${respuesta.status}`);
            }
            
            const datos = await respuesta.json();
            
            seccionProfundizacion.innerHTML = `<strong>✨ Clarificación y Profundización del Oráculo:</strong><br><br>${formatearTextoMarkdown(datos.profundizacion)}`;
            seccionProfundizacion.scrollIntoView({ behavior: 'smooth' });

        } catch (error) { 
            console.error("Error detectado:", error);
            seccionProfundizacion.innerHTML = `<span style='color: #ff6b6b;'>No se pudo conectar para profundizar: ${error.message}</span>`; 
        }
    });

    contenedor.appendChild(btn);
}
