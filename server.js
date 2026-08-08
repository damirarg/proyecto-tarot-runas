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

// La clave se lee de manera totalmente privada
const API_KEY_GROQ = process.env.GROQ_API_KEY;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PERSONALIDAD_TAROTISTA = `Actuá como un experto tarotista tradicional basado estrictamente en el mazo Rider-Waite.

REGLAS GRAMATICALES OBLIGATORIAS DE ESPAÑOL:
1. Todos los nombres de cartas y números deben tratarse SIEMPRE en género MASCULINO.
2. Usá exclusivamente "El" o "Del" antes del nombre del arcano. Ejemplos obligatorios: "El Seis de Espadas", "El Nueve de Bastos", "El Siete de Copas", "Del Cuatro de Bastos".
3. JAMÁS escribas artículos femeninos solos con números como "La Seis", "La Nueve", "La Siete" o "de la Seis". Si querés usar género femenino, debés escribir explícitamente la palabra 'carta' antes (ejemplo: 'La carta del Seis de Espadas').`;

app.post('/api/consultar-tarot', async (req, res) => {
    try {
        const { pregunta, cartas, idTirada, cantidadCartas } = req.body;
        const listaCartasTexto = Array.isArray(cartas) ? cartas.join(", ") : (cartas || "Seleccionadas");

        const instrucciones = `El consultante pregunta: "${pregunta}". 
        Tirada elegida ID: ${idTirada} con ${cantidadCartas} cartas: ${listaCartasTexto}.
        Ofrece una lectura clara, empática y precisa siguiendo la tradición Rider-Waite. Usa formato Markdown con **negritas** para los títulos.`;

        const respuestaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY_GROQ}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.2,
                max_tokens: 1200,
                messages: [
                    { role: "system", content: PERSONALIDAD_TAROTISTA },
                    { role: "user", content: instrucciones }
                ]
            })
        });

        if (!respuestaGroq.ok) {
            const detalleError = await respuestaGroq.text();
            console.error("Error en API Groq:", respuestaGroq.status, detalleError);
            return res.status(respuestaGroq.status).json({ error: "Error en la respuesta de la API." });
        }

        const datos = await respuestaGroq.json();
        res.json({ lectura: datos.choices[0].message.content });

    } catch (error) {
        console.error("Error interno:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

app.post('/api/profundizar-tarot', async (req, res) => {
    try {
        const { pregunta, cartas } = req.body;
        const listaCartasTexto = Array.isArray(cartas) ? cartas.join(", ") : (cartas || "de la tirada");

        const instrucciones = `El usuario consultó sobre: "${pregunta || 'su inquietud'}" con las cartas: ${listaCartasTexto}.
        Por favor, ofrecé una clarificación adicional, desglosando con mayor sencillez y profundidad el consejo global de estas cartas para disipar cualquier duda. Sé cálido, claro y alentador. Usa formato Markdown con **negritas** para los títulos.`;

        const respuestaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY_GROQ}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
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
            console.error("Error en API Groq profundización:", respuestaGroq.status, detalleError);
            return res.status(respuestaGroq.status).json({ error: "Error en la API al profundizar." });
        }

        const datos = await respuestaGroq.json();
        res.json({ profundizacion: datos.choices[0].message.content });

    } catch (error) {
        console.error("Error interno en profundización:", error);
        res.status(500).json({ error: "Error interno en la profundización." });
    }
});

app.listen(PORT, () => {
    console.log(`✨ Servidor de Tarot corriendo con éxito en http://localhost:${PORT}`);
});