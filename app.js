import { mazo, imagenesRiderWaite, catalogoTiradas, mezclarMazo } from './tarot-data.js';
import { mazoRunas, catalogoTiradasRunas, mezclarRunas } from './runas-data.js';

let ultimaPregunta = "";
let ultimasCartas = [];
let modoActual = "tarot"; // "tarot" o "runas"

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
    if (audio.paused) {
        audio.play().then(() => {
            btnAudio.textContent = "🔇 Silenciar Sonido";
        }).catch(() => {
            alert("El navegador requiere interacción previa para reproducir sonido.");
        });
    } else {
        audio.pause();
        btnAudio.textContent = "🎵 Activar Sonido";
    }
});

// --- NAVEGACIÓN ENTRE PANTALLAS ---
const pantallaBienvenida = document.getElementById('pantalla-bienvenida');
const pantallaTiradas = document.getElementById('pantalla-tiradas');
const pantallaRecomendacion = document.getElementById('pantalla-recomendacion');
const pantallaLectura = document.getElementById('pantalla-lectura');

// Botón: Ir a Tiradas de Tarot
document.getElementById('btnIrTiradasTarot').addEventListener('click', () => {
    modoActual = "tarot";
    document.getElementById('tituloSeccionTirada').textContent = "Consulta de Tarot";
    pantallaBienvenida.style.display = "none";
    pantallaTiradas.style.display = "flex";
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "none";
});

// Botón: Ir a Runas Vikingas
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

// --- GENERACIÓN DEL CARRUSEL (DEPENDIENDO SI ES TAROT O RUNAS) ---
document.getElementById('btnMostrarOpciones').addEventListener('click', () => {
    const pregunta = document.getElementById('preguntaUsuario').value;
    if (!pregunta.trim()) {
        alert("Por favor, escribí tu consulta antes de continuar.");
        return;
    }

    pantallaTiradas.style.display = "none";
    pantallaRecomendacion.style.display = "flex";

    const carrusel = document.getElementById('carruselTiradas');
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

document.getElementById('btnFlechaIzq').addEventListener('click', () => {
    document.getElementById('carruselTiradas').scrollBy({ left: -260, behavior: 'smooth' });
});
document.getElementById('btnFlechaDer').addEventListener('click', () => {
    document.getElementById('carruselTiradas').scrollBy({ left: 260, behavior: 'smooth' });
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
        if (idTirada === "runa_3") cantidadRunas = 3;
        else if (idTirada === "runa_5") cantidadRunas = 5;

        realizarConsultaRunas(cantidadRunas, idTirada);
    }
}

// --- RITUAL INTERACTIVO DE LA CARTA DEL DÍA (TAROT) ---
document.getElementById('btnRitualDia').addEventListener('click', () => {
    modoActual = "tarot";
    pantallaBienvenida.style.display = "none";
    pantallaTiradas.style.display = "none";
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "flex";

    const divResultado = document.getElementById('resultado');
    divResultado.innerHTML = "";

    const tituloRitual = document.createElement('strong');
    tituloRitual.style.color = "#f3d06c";
    tituloRitual.style.fontSize = "1.2em";
    tituloRitual.textContent = "✨ Ritual de la Carta del Día ✨";

    const descRitual = document.createElement('p');
    descRitual.style.color = "#d1c4e9";
    descRitual.style.fontSize = "0.95em";
    descRitual.style.marginTop = "20px";
    descRitual.textContent = "El mazo completo de 78 arcanos está extendido en abanico. Desplazate horizontalmente y elegí una carta por intuición:";

    const mesaAbanico = document.createElement('div');
    mesaAbanico.className = "mesa-seleccion-cartas";

    const mazoMezclado = mezclarMazo(mazo);

    mazoMezclado.forEach((cartaSecreta) => {
        const archivoRider = imagenesRiderWaite[cartaSecreta];
        
        const cartaContenedor = document.createElement('div');
        cartaContenedor.className = 'carta-contenedor';
        
        const cartaFlipper = document.createElement('div');
        cartaFlipper.className = 'carta-flipper';

        const caraTrasera = document.createElement('div');
        caraTrasera.className = 'cara-trasera';

        const caraFrontal = document.createElement('img');
        caraFrontal.className = 'cara-frontal';
        caraFrontal.src = `imagenes/${archivoRider}`;
        caraFrontal.alt = cartaSecreta;

        cartaFlipper.appendChild(caraTrasera);
        cartaFlipper.appendChild(caraFrontal);
        cartaContenedor.appendChild(cartaFlipper);

        cartaContenedor.addEventListener('click', () => {
            elegirCartaInteractiva(cartaContenedor, cartaSecreta, archivoRider);
        });

        mesaAbanico.appendChild(cartaContenedor);
    });

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
    
    setTimeout(async () => {
        divResultado.innerHTML = "";

        const titulo = document.createElement('strong');
        titulo.style.color = "#f3d06c";
        titulo.style.fontSize = "1.2em";
        titulo.textContent = `✨ Tu Carta del Día: ${cartaElegida} ✨`;

        const contenedorCarta = document.createElement('div');
        contenedorCarta.className = "contenedor-cartas";
        const pos = document.createElement('div');
        pos.className = "posicion-carta";
        const img = document.createElement('img');
        img.className = "carta-animada";
        img.src = `imagenes/${archivoRider}`;
        img.alt = cartaElegida;
        pos.appendChild(img);
        contenedorCarta.appendChild(pos);

        const loader = document.createElement('p');
        loader.innerHTML = "<em style='color: #f3d06c;'>Canalizando el mensaje del oráculo...</em>";

        divResultado.appendChild(titulo);
        divResultado.appendChild(contenedorCarta);
        divResultado.appendChild(loader);

        try {
            const respuesta = await fetch('/api/consultar-tarot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pregunta: "Carta del Día",
                    cartas: [cartaElegida],
                    idTirada: "1",
                    cantidadCartas: 1
                })
            });

            if (!respuesta.ok) throw new Error("Error en la respuesta del servidor.");
            const datos = await respuesta.json();

            loader.remove();

            const textoReflexion = document.createElement('div');
            textoReflexion.style.marginTop = "15px";
            textoReflexion.innerHTML = formatearTextoMarkdown(datos.lectura);
            divResultado.appendChild(textoReflexion);

            crearBotonProfundizar(divResultado);

        } catch (error) {
            loader.innerHTML = "<span style='color: #ff6b6b;'>No se pudo obtener el mensaje de la Carta del Día en este momento.</span>";
        }
    }, 1000);
}

// --- CONSULTA GENERAL DE TAROT ---
async function realizarConsultaTarot(cantidadCartas, idTirada) {
    const pregunta = document.getElementById('preguntaUsuario').value;
    const divResultado = document.getElementById('resultado');

    pantallaBienvenida.style.display = "none";
    pantallaTiradas.style.display = "none";
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "flex";

    divResultado.innerHTML = "";
    const loader = document.createElement('p');
    loader.innerHTML = "<strong style='color: #f3d06c;'>Barajando el mazo y canalizando la energía... 🔮</strong>";
    divResultado.appendChild(loader);

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

        if (!respuesta.ok) throw new Error("Error en el servidor.");

        const datos = await respuesta.json();
        divResultado.innerHTML = "";

        const tituloPregunta = document.createElement('h3');
        tituloPregunta.style.color = "#f3d06c";
        tituloPregunta.textContent = `Tu Pregunta: ${pregunta}`;
        divResultado.appendChild(tituloPregunta);

        const contenedorCartas = document.createElement('div');
        contenedorCartas.className = claseMesa;

        cartasSeleccionadas.forEach((carta, index) => {
            const pos = document.createElement('div');
            pos.className = `posicion-carta pos-${index + 1}`;
            
            const img = document.createElement('img');
            img.src = `imagenes/${imagenesRiderWaite[carta]}`;
            img.className = 'carta-animada';
            img.style.animationDelay = `${index * 0.2}s`;
            img.alt = carta;
            
            pos.appendChild(img);
            contenedorCartas.appendChild(pos);
        });
        divResultado.appendChild(contenedorCartas);

        const textoIA = document.createElement('div');
        textoIA.style.marginTop = "15px";
        textoIA.innerHTML = formatearTextoMarkdown(datos.lectura);
        divResultado.appendChild(textoIA);

        crearBotonProfundizar(divResultado);

    } catch (error) {
        divResultado.innerHTML = "<p style='color: #ff6b6b;'>Hubo un problema de conexión al procesar la lectura.</p>";
    }
}

// --- CONSULTA DE RUNAS VIKINGAS ---
async function realizarConsultaRunas(cantidadRunas, idTirada) {
    const pregunta = document.getElementById('preguntaUsuario').value;
    const divResultado = document.getElementById('resultado');

    pantallaBienvenida.style.display = "none";
    pantallaTiradas.style.display = "none";
    pantallaRecomendacion.style.display = "none";
    pantallaLectura.style.display = "flex";

    divResultado.innerHTML = "";
    const loader = document.createElement('p');
    loader.innerHTML = "<strong style='color: #f3d06c;'>Tallando y arrojando las runas sagradas... ᛟ</strong>";
    divResultado.appendChild(loader);

    const runasMezcladas = mezclarRunas(mazoRunas);
    const runasSeleccionadas = runasMezcladas.slice(0, cantidadRunas);

    ultimaPregunta = pregunta;
    ultimasCartas = runasSeleccionadas.map(r => r.nombre);

    try {
        const respuesta = await fetch('/api/consultar-runas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pregunta, 
                runas: ultimasCartas, 
                idTirada, 
                cantidadRunas 
            })
        });

        if (!respuesta.ok) throw new Error("Error en el servidor de runas.");

        const datos = await respuesta.json();
        divResultado.innerHTML = "";

        const tituloPregunta = document.createElement('h3');
        tituloPregunta.style.color = "#f3d06c";
        tituloPregunta.textContent = `Tu Consulta Rúnica: ${pregunta}`;
        divResultado.appendChild(tituloPregunta);

        // Mostrar fichas visuales de las runas seleccionadas
        const contenedorRunas = document.createElement('div');
        contenedorRunas.style.display = "flex";
        contenedorRunas.style.justifyContent = "center";
        contenedorRunas.style.gap = "15px";
        contenedorRunas.style.margin = "20px 0";
        contenedorRunas.style.flexWrap = "wrap";

        runasSeleccionadas.forEach((runa, index) => {
            const ficha = document.createElement('div');
            ficha.style.background = "linear-gradient(135deg, rgba(38, 24, 60, 0.95) 0%, rgba(20, 12, 35, 0.95) 100%)";
            ficha.style.border = "1.5px solid #c59b27";
            ficha.style.borderRadius = "10px";
            ficha.style.padding = "20px";
            ficha.style.textAlign = "center";
            ficha.style.color = "#f3d06c";
            ficha.style.minWidth = "120px";
            ficha.style.boxShadow = "0 5px 15px rgba(0,0,0,0.6)";

            const simbolo = document.createElement('div');
            simbolo.style.fontSize = "2.5em";
            simbolo.style.marginBottom = "8px";
            simbolo.textContent = runa.nombre.match(/\(([^)]+)\)/)[1]; // Extrae el símbolo entre paréntesis

            const nombreRuna = document.createElement('strong');
            nombreRuna.style.display = "block";
            nombreRuna.style.fontFamily = "'Playfair Display', serif";
            nombreRuna.textContent = runa.nombre.split(' ')[0];

            ficha.appendChild(simbolo);
            ficha.appendChild(nombreRuna);
            contenedorRunas.appendChild(ficha);
        });

        divResultado.appendChild(contenedorRunas);

        const textoIA = document.createElement('div');
        textoIA.style.marginTop = "15px";
        textoIA.innerHTML = formatearTextoMarkdown(datos.lectura);
        divResultado.appendChild(textoIA);

    } catch (error) {
        divResultado.innerHTML = "<p style='color: #ff6b6b;'>Hubo un problema de conexión al procesar la lectura rúnica.</p>";
    }
}

// --- LÓGICA DEL BOTÓN DE PROFUNDIZACIÓN ---
function crearBotonProfundizar(contenedor) {
    const btn = document.createElement('button');
    btn.className = 'btn-profundizar';
    btn.textContent = '💡 PROFUNDIZAR EN ESTA LECTURA';

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '✨ Ya se profundizó en esta lectura';

        const seccionProfundizacion = document.createElement('div');
        seccionProfundizacion.style.marginTop = "25px";
        seccionProfundizacion.style.padding = "15px";
        seccionProfundizacion.style.backgroundColor = "rgba(42, 28, 68, 0.8)";
        seccionProfundizacion.style.borderRadius = "8px";
        seccionProfundizacion.style.border = "1px solid #c59b27";
        seccionProfundizacion.innerHTML = "<em style='color: #f3d06c;'>Canalizando una explicación más profunda y detallada de la tirada... 🔮</em>";
        contenedor.appendChild(seccionProfundizacion);

        try {
            const respuesta = await fetch('/api/profundizar-tarot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pregunta: ultimaPregunta, 
                    cartas: ultimasCartas 
                })
            });

            if (!respuesta.ok) throw new Error("Error al profundizar la lectura.");

            const datos = await respuesta.json();
            seccionProfundizacion.innerHTML = `
                <strong style='color: #f3d06c; font-family: "Playfair Display", serif; font-size: 1.2em;'>✨ Clarificación y Profundización del Oráculo:</strong><br><br>
                ${formatearTextoMarkdown(datos.profundizacion)}
            `;

            seccionProfundizacion.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            seccionProfundizacion.innerHTML = "<span style='color: #ff6b6b;'>No se pudo conectar para profundizar la lectura en este momento. Verificá la conexión con el servidor.</span>";
        }
    });

    contenedor.appendChild(btn);
}