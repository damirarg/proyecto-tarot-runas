import { mazo, imagenesRiderWaite, catalogoTiradas, mezclarMazo } from './tarot-data.js';
import { mazoRunas, catalogoTiradasRunas, mezclarRunas } from './runas-data.js';

let ultimaPregunta = "";
let ultimasCartas = [];
let modoActual = "tarot"; 

// --- FUNCIÓN PARA CONVERTIR MARKDOWN EN HTML DORADO ---
function formatearTextoMarkdown(texto) {
    if (!texto) return "";
    return texto
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f3d06c; font-family: \'Playfair Display\', serif; font-size: 1.1em;">$1</strong>')
        .replace(/###\s*(.*?)\n/g, '<h4 style="color: #f3d06c; font-family: \'Playfair Display\', serif; margin-top: 15px; margin-bottom: 5px;">$1</h4>')
        .replace(/\n/g, '<br>');
}

// --- CONTROL DE AUDIO SEGURO ---
const audio = document.getElementById('audioFondo');
const btnAudio = document.getElementById('btnAudio');
btnAudio.addEventListener('click', () => {
    if (audio.paused) { audio.play(); btnAudio.textContent = "🔇 Silenciar Sonido"; }
    else { audio.pause(); btnAudio.textContent = "🎵 Activar Sonido"; }
});

// --- NAVEGACIÓN ENTRE PANTALLAS ---
const pantallaBienvenida = document.getElementById('pantalla-bienvenida');
const pantallaTiradas = document.getElementById('pantalla-tiradas');
const pantallaRecomendacion = document.getElementById('pantalla-recomendacion');
const pantallaLectura = document.getElementById('pantalla-lectura');

document.getElementById('btnIrTiradasTarot').addEventListener('click', () => {
    modoActual = "tarot";
    document.getElementById('tituloSeccionTirada').textContent = "Consulta de Tarot";
    pantallaBienvenida.style.display = "none";
    pantallaTiradas.style.display = "flex";
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "none";
});

document.getElementById('btnIrRunas').addEventListener('click', () => {
    modoActual = "runas";
    document.getElementById('tituloSeccionTirada').textContent = "Consulta de Runas Vikingas";
    pantallaBienvenida.style.display = "none";
    pantallaTiradas.style.display = "flex";
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "none";
});

document.querySelectorAll('.btn-volver-inicio').forEach(btn => {
    btn.addEventListener('click', () => {
        pantallaBienvenida.style.display = "flex";
        pantallaTiradas.style.display = "none";
        pantallaRecomendacion.style.display = "none";
        pantallaLectura.style.display = "none";
        document.getElementById('preguntaUsuario').value = "";
    });
});

document.getElementById('btnCambiarPregunta').addEventListener('click', () => {
    pantallaBienvenida.style.display = "none";
    pantallaTiradas.style.display = "flex";
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "none";
});

// --- GENERACIÓN DEL CARRUSEL ---
document.getElementById('btnMostrarOpciones').addEventListener('click', () => {
    const pregunta = document.getElementById('preguntaUsuario').value;
    if (!pregunta.trim()) { alert("Por favor, escribí tu consulta antes de continuar."); return; }
    pantallaTiradas.style.display = "none";
    pantallaRecomendacion.style.display = "flex";
    const carrusel = document.getElementById('carruselTiradas');
    carrusel.innerHTML = ""; 
    const catalogoActivo = (modoActual === "tarot") ? catalogoTiradas : catalogoTiradasRunas;
    catalogoActivo.forEach(info => {
        const tarjeta = document.createElement('button');
        tarjeta.className = 'tarjeta-carrusel';
        tarjeta.innerHTML = `<strong>${(modoActual === "tarot" ? '🔮 ' : 'ᛟ ') + info.nombre}</strong><br><small>${info.desc}</small>`;
        tarjeta.addEventListener('click', () => ejecutarTiradaElegida(info.id));
        carrusel.appendChild(tarjeta);
    });
});

document.getElementById('btnFlechaIzq').addEventListener('click', () => document.getElementById('carruselTiradas').scrollBy({ left: -260, behavior: 'smooth' }));
document.getElementById('btnFlechaDer').addEventListener('click', () => document.getElementById('carruselTiradas').scrollBy({ left: 260, behavior: 'smooth' }));

// --- EJECUCIÓN DE TIRADAS ---
function ejecutarTiradaElegida(idTirada) {
    if (modoActual === "tarot") {
        let cantidad = 3;
        if (idTirada === "1") cantidad = 1; else if (idTirada.startsWith("4")) cantidad = 4; else if (idTirada.startsWith("5")) cantidad = 5; else if (idTirada === "7") cantidad = 7; else if (idTirada === "10") cantidad = 10; else if (idTirada === "12") cantidad = 12;
        realizarConsultaTarot(cantidad, idTirada);
    } else {
        let cantidadRunas = 1;
        if (idTirada === "nornas") cantidadRunas = 3;
        else if (idTirada === "cruz_runica") cantidadRunas = 4;
        else if (idTirada === "tirada_5") cantidadRunas = 5;
        else if (idTirada === "cruz_celta" || idTirada === "martillo_thor") cantidadRunas = 6;
        else if (idTirada === "tirada_7") cantidadRunas = 7;
        else if (idTirada === "yggdrasil") cantidadRunas = 9;
        realizarConsultaRunas(cantidadRunas, idTirada);
    }
}

// --- RITUAL CARTA DEL DÍA ---
document.getElementById('btnRitualDia').addEventListener('click', () => {
    modoActual = "tarot";
    pantallaBienvenida.style.display = "none";
    pantallaLectura.style.display = "flex";
    const divResultado = document.getElementById('resultado');
    divResultado.innerHTML = "<strong>✨ Ritual de la Carta del Día ✨</strong><br><p>Elegí una carta:</p>";
    const mesaAbanico = document.createElement('div');
    mesaAbanico.className = "mesa-seleccion-cartas";
    mezclarMazo(mazo).forEach((carta) => {
        const cartaContenedor = document.createElement('div');
        cartaContenedor.className = 'carta-contenedor';
        cartaContenedor.innerHTML = `<div class="carta-flipper"><div class="cara-trasera"></div><img class="cara-frontal" src="imagenes/${imagenesRiderWaite[carta]}" alt="${carta}"></div>`;
        cartaContenedor.addEventListener('click', () => elegirCartaInteractiva(cartaContenedor, carta, imagenesRiderWaite[carta]));
        mesaAbanico.appendChild(cartaContenedor);
    });
    divResultado.appendChild(mesaAbanico);
});

async function elegirCartaInteractiva(elemento, carta, archivo) {
    if (document.querySelector('.carta-contenedor.seleccionada')) return;
    elemento.classList.add('seleccionada', 'volteada');
    ultimaPregunta = "Carta del Día";
    ultimasCartas = [carta];
    const divResultado = document.getElementById('resultado');
    setTimeout(async () => {
        divResultado.innerHTML = `<strong>✨ Tu Carta: ${carta} ✨</strong><div class="contenedor-cartas"><div class="posicion-carta"><img src="imagenes/${archivo}" class="carta-animada"></div></div><p><em>Canalizando...</em></p>`;
        try {
            const respuesta = await fetch('/api/consultar-tarot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pregunta: "Carta del Día", cartas: [carta], idTirada: "1", cantidadCartas: 1 }) });
            const datos = await respuesta.json();
            divResultado.innerHTML = `<strong>✨ Tu Carta: ${carta} ✨</strong><div class="contenedor-cartas"><div class="posicion-carta"><img src="imagenes/${archivo}" class="carta-animada"></div></div>` + formatearTextoMarkdown(datos.lectura);
            crearBotonProfundizar(divResultado);
        } catch (e) { divResultado.innerHTML = "Error."; }
    }, 1000);
}

// --- CONSULTA TAROT ---
async function realizarConsultaTarot(cantidad, idTirada) {
    const pregunta = document.getElementById('preguntaUsuario').value;
    const divResultado = document.getElementById('resultado');
    pantallaBienvenida.style.display = "none"; pantallaTiradas.style.display = "none"; pantallaRecomendacion.style.display = "none"; pantallaLectura.style.display = "flex";
    divResultado.innerHTML = "<strong>Barajando...</strong>";
    const cartas = mezclarMazo(mazo).slice(0, cantidad);
    ultimaPregunta = pregunta; ultimasCartas = cartas;
    try {
        const respuesta = await fetch('/api/consultar-tarot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pregunta, cartas, idTirada, cantidadCartas: cantidad }) });
        const datos = await respuesta.json();
        divResultado.innerHTML = `<h3>Consulta: ${pregunta}</h3><div class="contenedor-cartas">` + cartas.map((c, i) => `<div class="posicion-carta"><img src="imagenes/${imagenesRiderWaite[c]}" class="carta-animada" style="animation-delay:${i*0.2}s"></div>`).join('') + `</div>` + formatearTextoMarkdown(datos.lectura);
        crearBotonProfundizar(divResultado);
    } catch (e) { divResultado.innerHTML = "Error."; }
}

// --- CONSULTA RUNAS ---
async function realizarConsultaRunas(cantidad, idTirada) {
    const pregunta = document.getElementById('preguntaUsuario').value;
    const divResultado = document.getElementById('resultado');
    pantallaBienvenida.style.display = "none"; pantallaTiradas.style.display = "none"; pantallaRecomendacion.style.display = "none"; pantallaLectura.style.display = "flex";
    divResultado.innerHTML = "<strong>Tallando y arrojando las runas...</strong>";
    const runas = mezclarRunas(mazoRunas).slice(0, cantidad);
    ultimaPregunta = pregunta; ultimasCartas = runas.map(r => r.nombre);
    let claseMesa = idTirada === "cruz_runica" ? "mesa-cruz-runica" : idTirada === "tirada_5" ? "mesa-tirada-5-runas" : (idTirada === "cruz_celta" || idTirada === "martillo_thor") ? "mesa-cruz-celta-runas" : idTirada === "yggdrasil" ? "mesa-yggdrasil" : "mesa-runas-lineal";
    try {
        const respuesta = await fetch('/api/consultar-runas', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ pregunta, runas: ultimasCartas, idTirada, cantidadRunas: cantidad })});
        const datos = await respuesta.json();
        divResultado.innerHTML = `<h3>Consulta: ${pregunta}</h3>`;
        const cont = document.createElement('div');
        cont.className = claseMesa;
        runas.forEach((runa, i) => {
            const ficha = document.createElement('div');
            ficha.className = "runa-ficha";
            ficha.style.gridArea = `runa${i + 1}`;
            ficha.innerHTML = `<img src="runas_imagenes/${runa.id}.png" style="width:70px; height:70px;"><br><strong>${i + 1}. ${runa.nombre}</strong>`;
            cont.appendChild(ficha);
        });
        divResultado.appendChild(cont);
        divResultado.innerHTML += formatearTextoMarkdown(datos.lectura);
        crearBotonProfundizar(divResultado);
    } catch (e) { divResultado.innerHTML = "Error."; }
}

// --- PROFUNDIZACIÓN ---
function crearBotonProfundizar(contenedor) {
    const btn = document.createElement('button');
    btn.className = 'btn-profundizar';
    btn.textContent = '💡 PROFUNDIZAR EN ESTA LECTURA';
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        const seccion = document.createElement('div');
        contenedor.appendChild(seccion);
        try {
            const res = await fetch('/api/profundizar-tarot', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({pregunta: ultimaPregunta, cartas: ultimasCartas})});
            const datos = await res.json();
            seccion.innerHTML = formatearTextoMarkdown(datos.profundizacion);
            seccion.scrollIntoView({behavior: 'smooth'});
        } catch(e) { seccion.innerHTML = "Error."; }
    });
    contenedor.appendChild(btn);
}