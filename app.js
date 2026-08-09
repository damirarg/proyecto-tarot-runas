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

// --- NAVEGACIÓN ---
const pantallaBienvenida = document.getElementById('pantalla-bienvenida');
const pantallaTiradas = document.getElementById('pantalla-tiradas');
const pantallaRecomendacion = document.getElementById('pantalla-recomendacion');
const pantallaLectura = document.getElementById('pantalla-lectura');

document.getElementById('btnIrTiradasTarot').addEventListener('click', () => { modoActual = "tarot"; document.getElementById('tituloSeccionTirada').textContent = "Consulta de Tarot"; pantallaBienvenida.style.display = "none"; pantallaTiradas.style.display = "flex"; });
document.getElementById('btnIrRunas').addEventListener('click', () => { modoActual = "runas"; document.getElementById('tituloSeccionTirada').textContent = "Consulta de Runas Vikingas"; pantallaBienvenida.style.display = "none"; pantallaTiradas.style.display = "flex"; });

document.querySelectorAll('.btn-volver-inicio').forEach(btn => btn.addEventListener('click', () => {
    pantallaBienvenida.style.display = "flex"; pantallaTiradas.style.display = "none"; pantallaRecomendacion.style.display = "none"; pantallaLectura.style.display = "none";
}));

// --- CARRUSEL Y EJECUCIÓN ---
document.getElementById('btnMostrarOpciones').addEventListener('click', () => {
    const pregunta = document.getElementById('preguntaUsuario').value;
    if (!pregunta.trim()) return alert("Escribí tu consulta primero.");
    pantallaTiradas.style.display = "none";
    pantallaRecomendacion.style.display = "flex";
    const carrusel = document.getElementById('carruselTiradas');
    carrusel.innerHTML = "";
    (modoActual === "tarot" ? catalogoTiradas : catalogoTiradasRunas).forEach(info => {
        const tarjeta = document.createElement('button');
        tarjeta.className = 'tarjeta-carrusel';
        tarjeta.innerHTML = `<strong>${info.nombre}</strong><br><small>${info.desc}</small>`;
        tarjeta.addEventListener('click', () => ejecutarTiradaElegida(info.id));
        carrusel.appendChild(tarjeta);
    });
});

function ejecutarTiradaElegida(idTirada) {
    if (modoActual === "tarot") {
        let cant = 3;
        if (idTirada === "1") cant = 1; else if (idTirada.startsWith("4")) cant = 4; else if (idTirada.startsWith("5")) cant = 5; else if (idTirada === "7") cant = 7;
        realizarConsultaTarot(cant, idTirada);
    } else {
        let cant = 1;
        if (idTirada === "nornas") cant = 3;
        else if (idTirada === "cruz_runica") cant = 4;
        else if (idTirada === "tirada_5") cant = 5;
        else if (idTirada === "cruz_celta" || idTirada === "martillo_thor") cant = 6;
        else if (idTirada === "tirada_7") cant = 7;
        else if (idTirada === "yggdrasil") cant = 9;
        realizarConsultaRunas(cant, idTirada);
    }
}

// --- CONSULTA DE RUNAS ---
async function realizarConsultaRunas(cantidad, idTirada) {
    const pregunta = document.getElementById('preguntaUsuario').value;
    const divResultado = document.getElementById('resultado');
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "flex";
    divResultado.innerHTML = "<em>Canalizando las runas...</em>";

    const runas = mezclarRunas(mazoRunas).slice(0, cantidad);
    ultimaPregunta = pregunta;
    ultimasCartas = runas.map(r => r.nombre);

    let claseMesa = "mesa-runas-lineal";
    if (idTirada === "cruz_runica") claseMesa = "mesa-cruz-runica";
    else if (idTirada === "tirada_5") claseMesa = "mesa-tirada-5-runas";
    else if (idTirada === "cruz_celta" || idTirada === "martillo_thor") claseMesa = "mesa-cruz-celta-runas";
    else if (idTirada === "yggdrasil") claseMesa = "mesa-yggdrasil";

    try {
        const respuesta = await fetch('/api/consultar-runas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pregunta, runas: ultimasCartas, idTirada, cantidadRunas: cantidad })
        });
        const datos = await respuesta.json();
        
        divResultado.innerHTML = `<h3>Consulta: ${pregunta}</h3>`;
        const contenedor = document.createElement('div');
        contenedor.className = claseMesa;

        runas.forEach((runa, index) => {
            const ficha = document.createElement('div');
            ficha.className = "runa-ficha";
            
            // ASIGNACIÓN GEOMÉTRICA: Esto le dice a cada ficha en qué posición de la grilla (definida en CSS) debe ir
            ficha.style.gridArea = `runa${index + 1}`;

            ficha.innerHTML = `<img src="runas_imagenes/${runa.id}.png" style="width:70px; height:70px; object-fit:contain;"><br><strong>${index + 1}. ${runa.nombre}</strong>`;
            contenedor.appendChild(ficha);
        });
        divResultado.appendChild(contenedor);
        divResultado.innerHTML += formatearTextoMarkdown(datos.lectura);
        crearBotonProfundizar(divResultado);
    } catch (e) { divResultado.innerHTML = "Error de conexión."; }
}

// --- CONSULTA DE TAROT ---
async function realizarConsultaTarot(cantidadCartas, idTirada) {
    const pregunta = document.getElementById('preguntaUsuario').value;
    const divResultado = document.getElementById('resultado');
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "flex";
    divResultado.innerHTML = "Barajando...";

    const mazoMezclado = mezclarMazo(mazo);
    const cartas = mazoMezclado.slice(0, cantidadCartas);
    ultimaPregunta = pregunta;
    ultimasCartas = cartas;

    try {
        const respuesta = await fetch('/api/consultar-tarot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pregunta, cartas, idTirada, cantidadCartas })
        });
        const datos = await respuesta.json();
        divResultado.innerHTML = `<h3>Consulta: ${pregunta}</h3>`;
        
        const contenedor = document.createElement('div');
        contenedor.className = "contenedor-cartas";
        cartas.forEach(c => {
            contenedor.innerHTML += `<div class="posicion-carta"><img src="imagenes/${imagenesRiderWaite[c]}" class="carta-animada"></div>`;
        });
        divResultado.appendChild(contenedor);
        
        divResultado.innerHTML += formatearTextoMarkdown(datos.lectura);
        crearBotonProfundizar(divResultado);
    } catch (e) { divResultado.innerHTML = "Error."; }
}

function crearBotonProfundizar(contenedor) {
    const btn = document.createElement('button');
    btn.className = 'btn-profundizar';
    btn.textContent = '💡 PROFUNDIZAR';
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        const seccion = document.createElement('div');
        contenedor.appendChild(seccion);
        try {
            const res = await fetch('/api/profundizar-tarot', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({pregunta: ultimaPregunta, cartas: ultimasCartas})});
            const datos = await res.json();
            seccion.innerHTML = formatearTextoMarkdown(datos.profundizacion);
        } catch(e) { seccion.innerHTML = "Error."; }
    });
    contenedor.appendChild(btn);
}