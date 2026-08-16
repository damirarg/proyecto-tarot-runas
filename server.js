import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// La clave de la API se lee de las variables de entorno de Render
const API_KEY_GROQ = process.env.GROQ_API_KEY;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PERSONALIDAD_TAROTISTA = `Actuá como un experto tarotista tradicional basado estrictamente en el mazo Rider-Waite.

REGLAS GRAMATICALES OBLIGATORIAS DE ESPAÑOL:
1. Respetá el nombre exacto de cada carta.
2. Usá "La Sota de Bastos", "La Sota de Copas", "La Sota de Espadas" y "La Sota de Oros". Nunca escribas "El Sota".
3. Usá "La Reina..." para reinas, "El Rey..." para reyes y "El Caballo..." para caballos.
4. Para cartas numeradas, podés usar "El Seis de Espadas", "El Nueve de Bastos", "El Siete de Copas" o "la carta del Seis de Espadas", pero no inventes artículos que contradigan el nombre de la carta.`;

const PERSONALIDAD_RUNAS = `Actuá como un sabio maestro de la tradición nórdica y experto absoluto en el Futhark Antiguo. 

REGLAS PARA LAS LECTURAS DE RUNAS:
1. Analizá la energía profunda de cada runa seleccionada conectándola de manera directa con la pregunta del consultante y la posición específica que ocupa en la tirada.
2. Usá un tono místico, respetuoso, empático y constructivo. 
3. Utiliza formato Markdown con títulos destacados en **negritas** para ordenar la lectura de forma impecable.
4. Los nombres propios de runas no llevan artículo. Escribí "Laguz", "Fehu", "Isa" o "Mannaz", nunca "el Laguz", "la Fehu", "del Isa" ni formas similares.`;

const FORMATO_LECTURA = `REGLAS DE PRESENTACIÓN:
- No repitas la pregunta, el método, la cantidad de símbolos ni la lista completa de cartas o runas al inicio. Esa información ya se muestra en la interfaz.
- No escribas encabezados administrativos como "Consultante", "Método", "Runas extraídas", "Cartas extraídas", "Lectura de Runas Vikingas" o "Lectura de Tarot".
- Empezá directamente con la interpretación.
- Usá solo títulos breves en **negrita**. No uses encabezados con #, ## o ###.
- No uses listas con asteriscos sueltos. Si necesitás ordenar ideas, usá párrafos cortos.
- Cerrá con un apartado **Consejo final** claro, práctico y cuidadoso.
- Si la pregunta toca salud, dinero o temas legales, mantené la lectura en clave reflexiva y recordá con naturalidad consultar a un profesional calificado para decisiones importantes.`;

function obtenerPosicionesTarot(idTirada, cantidadCartas) {
    const posiciones = {
        "1": ["Energía central de la consulta"],
        "carta_dia": ["Energía simbólica del día"],
        "3": ["Pasado", "Presente", "Futuro"],
        "3_ap": ["Consejo", "Reflexión", "Aprendizaje"],
        "4_am": ["Tu energía afectiva", "La energía de la otra parte", "Dinámica del vínculo", "Consejo para el vínculo"],
        "4_lab": ["Situación laboral actual", "Obstáculo o tensión", "Recurso disponible", "Dirección aconsejada"],
        "5_prof": ["Raíz del asunto", "Lo visible", "Lo oculto", "Camino de acción", "Resultado posible"],
        "5": ["Camino actual", "Alternativa", "Lo que ayuda", "Lo que bloquea", "Consejo para decidir"],
        "7": ["Influencia pasada", "Estado presente", "Factor oculto", "Consejo", "Influencia externa", "Obstáculo o desafío", "Resultado probable"],
        "10": ["Situación central", "Lo que cruza o desafía", "Base inconsciente o raíz", "Pasado reciente", "Aspiración o posibilidad superior", "Futuro próximo", "Actitud del consultante", "Entorno e influencias externas", "Miedos y esperanzas", "Resultado o síntesis"],
        "12": ["Energía general", "Recursos", "Comunicación", "Base emocional", "Creatividad", "Rutina y cuidado", "Vínculos", "Transformación", "Expansión", "Vocación", "Comunidad", "Cierre e integración"]
    };

    return posiciones[idTirada] || Array.from({ length: cantidadCartas }, (_, index) => `Posición ${index + 1}`);
}

app.post('/api/consultar-tarot', async (req, res) => {
    try {
        const { pregunta, cartas, idTirada, cantidadCartas } = req.body;
        const listaCartas = Array.isArray(cartas) ? cartas : [];
        const listaCartasTexto = listaCartas.length ? listaCartas.join(", ") : (cartas || "Seleccionadas");
        const posicionesTarot = obtenerPosicionesTarot(idTirada, cantidadCartas);
        const cartasConPosiciones = listaCartas.map((carta, index) => `${index + 1}. ${posicionesTarot[index] || `Posición ${index + 1}`}: ${carta}`).join("\n");
        const esCartaDelDia = pregunta === "Carta del Día" || idTirada === "carta_dia";

        const instrucciones = esCartaDelDia ? `Carta elegida para la Carta del Día: ${listaCartasTexto}.

        REGLAS ESPECÍFICAS PARA CARTA DEL DÍA:
        - No la trates como una predicción cerrada ni como una tirada general.
        - Interpretala como clima simbólico, actitud disponible y orientación práctica para atravesar el día.
        - Estructurá la lectura con estos apartados exactos: **Energía del día**, **Qué observar**, **Qué evitar**, **Cómo aprovecharla**, **Consejo final**.
        - Relacioná cada apartado con la carta elegida, evitando repetir el mismo significado en todos los párrafos.
        - Mantené una extensión breve-media, clara y útil.

        ${FORMATO_LECTURA}` : `El consultante pregunta: "${pregunta}". 
        Tirada elegida ID: ${idTirada} con ${cantidadCartas} cartas: ${listaCartasTexto}.
        Cartas por posición:
        ${cartasConPosiciones}

        REGLAS INTERPRETATIVAS OBLIGATORIAS PARA TAROT:
        - Interpretá cada carta según la posición exacta en la que apareció, no como significado aislado.
        - Explicá qué función cumple cada posición dentro de la tirada cuando sea relevante.
        - Si una carta positiva aparece en una posición de bloqueo, contra, miedo, exceso o desafío, no la leas automáticamente como favorable: analizá si indica exceso de esa energía, idealización, dependencia, una virtud mal usada o una energía que falta.
        - Si una carta difícil aparece en una posición favorable, analizá qué aprendizaje, advertencia útil o fuerza de transformación puede aportar.
        - En tiradas de 7 cartas o más, cerrá con una síntesis que conecte patrones entre cartas, tensiones internas, repeticiones de palos/arcanos y dirección general de la lectura.
        Ofrece una lectura clara, empática y precisa siguiendo la tradición Rider-Waite.

        ${FORMATO_LECTURA}`;

        const respuestaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY_GROQ}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // <-- MODELO ACTUALIZADO
                temperature: 0.2,
                max_tokens: cantidadCartas >= 7 ? 1900 : 1200,
                messages: [
                    { role: "system", content: PERSONALIDAD_TAROTISTA },
                    { role: "user", content: instrucciones }
                ]
            })
        });

        if (!respuestaGroq.ok) {
            const detalleError = await respuestaGroq.text();
            console.error("Error en API Groq (Tarot):", respuestaGroq.status, detalleError);
            return res.status(respuestaGroq.status).json({ error: `Groq API Error (${respuestaGroq.status}): ${detalleError}` });
        }

        const datos = await respuestaGroq.json();
        res.json({ lectura: datos.choices[0].message.content });

    } catch (error) {
        console.error("Error interno:", error);
        res.status(500).json({ error: "Error interno del servidor Node.js." });
    }
});

app.post('/api/profundizar-tarot', async (req, res) => {
    try {
        const { pregunta, cartas } = req.body;
        const listaCartasTexto = Array.isArray(cartas) ? cartas.join(", ") : (cartas || "de la tirada");

        const instrucciones = `El usuario consultó sobre: "${pregunta || 'su inquietud'}" con las cartas: ${listaCartasTexto}.
        Por favor, ofrecé una clarificación adicional, desglosando con mayor sencillez y profundidad el consejo global de estas cartas para disipar cualquier duda. Sé cálido, claro y alentador.

        ${FORMATO_LECTURA}`;

        const respuestaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY_GROQ}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // <-- MODELO ACTUALIZADO
                temperature: 0.2,
                max_tokens: 1000,
                messages: [
                    { role: "system", content: PERSONALIDAD_TAROTISTA },
                    { role: "user", content: instrucciones }
                ]
            })
        });

        if (!respuestaGroq.ok) {
            const detalleError = await respuestaGroq.text();
            console.error("Error en API Groq (Profundización Tarot):", respuestaGroq.status, detalleError);
            return res.status(respuestaGroq.status).json({ error: `Groq API Error (${respuestaGroq.status}): ${detalleError}` });
        }

        const datos = await respuestaGroq.json();
        res.json({ profundizacion: datos.choices[0].message.content });

    } catch (error) {
        console.error("Error interno en profundización:", error);
        res.status(500).json({ error: "Error interno en el servidor de profundización." });
    }
});

app.post('/api/profundizar-runas', async (req, res) => {
    try {
        const { pregunta, runas } = req.body;
        const listaRunasTexto = Array.isArray(runas) ? runas.join(", ") : (runas || "de la tirada");

        const instrucciones = `El usuario consultó sobre: "${pregunta || 'su inquietud'}" con las runas: ${listaRunasTexto}.
        Por favor, ofrecé una clarificación adicional, desglosando con mayor sencillez y profundidad el consejo global de estas runas para disipar cualquier duda. Sé cálido, claro, alentador y recordá que estás hablando de la sabiduría rúnica (no uses la palabra "carta").

        ${FORMATO_LECTURA}`;

        const respuestaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY_GROQ}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // <-- MODELO ACTUALIZADO
                temperature: 0.2,
                max_tokens: 1000,
                messages: [
                    { role: "system", content: PERSONALIDAD_RUNAS },
                    { role: "user", content: instrucciones }
                ]
            })
        });

        if (!respuestaGroq.ok) {
            const detalleError = await respuestaGroq.text();
            console.error("Error en API Groq (Profundización Runas):", respuestaGroq.status, detalleError);
            return res.status(respuestaGroq.status).json({ error: `Groq API Error (${respuestaGroq.status}): ${detalleError}` });
        }

        const datos = await respuestaGroq.json();
        res.json({ profundizacion: datos.choices[0].message.content });

    } catch (error) {
        console.error("Error interno en profundización de runas:", error);
        res.status(500).json({ error: "Error interno en el servidor de profundización rúnica." });
    }
});

app.post('/api/consultar-runas', async (req, res) => {
    try {
        const { pregunta, runas, idTirada, cantidadRunas } = req.body;
        const listaRunasTexto = Array.isArray(runas) ? runas.join(", ") : (runas || "Seleccionadas");
        const esRunaDelDia = pregunta === "Runa del Día" || idTirada === "runa_dia";

        let detallePosiciones = "";

        if (idTirada === "runa_dia") {
            detallePosiciones = `Lectura diaria de 1 runa.
            - Runa 1: Energía simbólica del día, actitud disponible, observación útil y consejo práctico.`;
        } else if (idTirada === "runa_odin") {
            detallePosiciones = `Tirada: La Runa de Odín (1 runa).
            - Runa 1: Indica la energía que rige sobre la situación. Marca el rumbo de los acontecimientos y actitudes a seguir, previniendo al consultante sobre cómo actuar. Proporciona una perspectiva directa, fresca y simple que invita a la intuición. Da un consejo claro y concreto.`;
        } else if (idTirada === "cruz_runica") {
            detallePosiciones = `Tirada: Cruz Rúnica (4 runas).
            - Runa 1 (Izquierda): La situación tal cual se presenta en tu vida.
            - Runa 2 (Derecha): Lo que se opone a tus intereses o te bloquea (obstáculo).
            - Runa 3 (Arriba): Discernimiento, lo que hay que reflexionar.
            - Runa 4 (Abajo): Consejo de las runas / advertencia.`;
        } else if (idTirada === "nornas") {
            detallePosiciones = `Tirada: Tríptico de las Nornas (3 runas).
            - Runa 1 (Urdh): El Pasado / Cómo se generó la situación.
            - Runa 2 (Verdhandi): El Presente / Estado actual y acciones de ahora.
            - Runa 3 (Skuld): El Futuro / Tendencia y cómo prepararse o mejorar el desenlace.`;
        } else if (idTirada === "tirada_5") {
            detallePosiciones = `Tirada de 5 Runas (5 runas).
            - Runa 1: Visión global y factores externos.
            - Runa 2: Desafío o pruebas a superar.
            - Runa 3: Situación actual (posibilidades o debilidades).
            - Runa 4: Acciones necesarias / correctivos.
            - Runa 5: Situación futura y desenlace posible.`;
        } else if (idTirada === "tirada_7") {
            detallePosiciones = `Tirada de 7 Runas / Mimir (7 runas).
            - Runas 1 y 2: Pasado (aspectos positivos y negativos).
            - Runas 3 y 4: Presente (análisis integral del momento).
            - Runas 5 y 6: Futuro (tendencias temporales).
            - Runa 7: Consejo final u orientación.`;
        } else if (idTirada === "cruz_celta") {
            detallePosiciones = `Tirada: Cruz Celta Rúnica (6 runas).
            - Runa 1: Pasado / Circunstancias anteriores.
            - Runa 2: Condiciones del presente.
            - Runa 3: Tendencia a futuro.
            - Runa 4: Bases de la situación / elementos inconscientes.
            - Runa 5: Naturaleza del asunto.
            - Runa 6: Resultado sugerido y acciones posibles.`;
        } else if (idTirada === "martillo_thor") {
            detallePosiciones = `Tirada: El Martillo de Thor / En "T" (6 runas).
            - Runa 1: Pasado.
            - Runa 2: Presente.
            - Runa 3: Tendencia en el futuro inmediato.
            - Runa 4: Bases y fundamentos del asunto.
            - Runa 5: Retos y dificultades a superar.
            - Runa 6: Influencia del consultante en lo que ocurre.`;
        } else if (idTirada === "yggdrasil") {
            detallePosiciones = `Tirada: Yggdrasil - El Árbol Sagrado (9 runas).
            - Runa 1: Situación actual.
            - Runa 2: Percepción / Cómo afecta al consultante.
            - Runa 3: Desafíos y temas cruciales a superar.
            - Runa 4: Fortalezas y recursos externos.
            - Runa 5: Aprendizaje obtenido hasta ahora.
            - Runa 6: Lo que se necesita aprender todavía.
            - Runa 7: Ayuda / Personas o situaciones favorables.
            - Runa 8: Consejo guía y fuente de sabiduría.
            - Runa 9: Advertencias y tendencias inmediatas a tener en cuenta.`;
        } else {
            detallePosiciones = `Tirada general con ${cantidadRunas} runas.`;
        }

        const instrucciones = esRunaDelDia ? `Runa elegida para la Runa del Día: ${listaRunasTexto}.

        REGLAS ESPECÍFICAS PARA RUNA DEL DÍA:
        - No la trates como una predicción cerrada ni como una consulta general.
        - Interpretala como clima simbólico, actitud disponible y orientación práctica para atravesar el día.
        - Estructurá la lectura con estos apartados exactos: **Energía del día**, **Qué observar**, **Qué evitar**, **Cómo aprovecharla**, **Consejo final**.
        - Relacioná cada apartado con la runa elegida, evitando repetir el mismo significado en todos los párrafos.
        - No uses artículo antes del nombre de la runa.
        - Mantené una extensión breve-media, clara y útil.

        ${FORMATO_LECTURA}` : `El consultante pregunta: "${pregunta}". 
        Método seleccionado: ${idTirada}.
        Runas extraídas en orden numérico: ${listaRunasTexto}.

        Estructura de la lectura obligatoria basada en la disposición rúnica:
        ${detallePosiciones}

        Ofrece una lectura de runas vikingas profunda, mística y estructurada paso a paso según cada posición indicada.

        ${FORMATO_LECTURA}`;

        const respuestaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY_GROQ}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // <-- MODELO ACTUALIZADO
                temperature: 0.3,
                max_tokens: 1500,
                messages: [
                    { role: "system", content: PERSONALIDAD_RUNAS },
                    { role: "user", content: instrucciones }
                ]
            })
        });

        if (!respuestaGroq.ok) {
            const detalleError = await respuestaGroq.text();
            console.error("Error en API Groq (Runas):", respuestaGroq.status, detalleError);
            return res.status(respuestaGroq.status).json({ error: `Groq API Error (${respuestaGroq.status}): ${detalleError}` });
        }

        const datos = await respuestaGroq.json();
        res.json({ lectura: datos.choices[0].message.content });

    } catch (error) {
        console.error("Error interno en /api/consultar-runas:", error);
        res.status(500).json({ error: "Error interno del servidor Node.js al consultar runas." });
    }
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`✨ Servidor corriendo con éxito en http://localhost:${PORT}`);
    });
}

export default app;
