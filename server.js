import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { mazo } from './tarot-data.js';
import { mazoRunas } from './runas-data.js';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// La clave de la API se lee de las variables de entorno de Render
const API_KEY_GROQ = process.env.GROQ_API_KEY;
const MODELO_GROQ = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || '').replace(/\/+$/, '');
const TIRADAS_DIARIAS_PREMIUM = Number(process.env.PREMIUM_DAILY_READINGS || 0);
const PRECIO_PREMIUM_ARS = Number(process.env.PREMIUM_PRICE_ARS || 0);
const LARGO_MAXIMO_PREGUNTA = 500;

function esEnteroPositivo(valor) {
    return Number.isInteger(valor) && valor > 0;
}

function esUrlPublicaHttps(valor) {
    try {
        const url = new URL(valor);
        return url.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname);
    } catch {
        return false;
    }
}

const PAGOS_CONFIGURADOS = Boolean(
    MP_ACCESS_TOKEN &&
    MP_WEBHOOK_SECRET &&
    esUrlPublicaHttps(PUBLIC_SITE_URL) &&
    Number.isFinite(PRECIO_PREMIUM_ARS) &&
    PRECIO_PREMIUM_ARS > 0 &&
    esEnteroPositivo(TIRADAS_DIARIAS_PREMIUM)
);

// Catálogo de productos cobrables. Para vender un manual u otro material,
// alcanza con agregar una entrada nueva (dias: 0 si no otorga membresía).
const PRODUCTOS = {
    premium_30d: {
        titulo: 'Oráculos Premium · 30 días',
        descripcion: `${TIRADAS_DIARIAS_PREMIUM} tiradas diarias de Tarot o Runas durante 30 días`,
        precio: PRECIO_PREMIUM_ARS,
        dias: 30
    }
};

const CANTIDAD_POR_TIRADA_TAROT = { "1": 1, "3": 3, "3_ap": 3, "4_am": 4, "4_lab": 4, "5_prof": 5, "5": 5, "7": 7, "10": 10, "12": 12, "carta_dia": 1 };
const CANTIDAD_POR_TIRADA_RUNAS = { runa_odin: 1, nornas: 3, cruz_runica: 4, tirada_5: 5, cruz_celta: 6, martillo_thor: 6, tirada_7: 7, yggdrasil: 9, runa_dia: 1 };
const NOMBRES_CARTAS = new Set(mazo);
const NOMBRES_RUNAS = new Set(mazoRunas.map(runa => runa.nombre));

app.set('trust proxy', true);
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/configuracion-publica', (req, res) => {
    res.json({
        authDisponible: Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY),
        supabaseUrl: SUPABASE_URL || null,
        supabasePublicKey: SUPABASE_PUBLIC_KEY || null
    });
});

class ErrorAplicacion extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

async function obtenerUsuarioAutenticado(req) {
    if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
        throw new ErrorAplicacion(503, 'AUTH_NOT_CONFIGURED', 'El servicio de cuentas todavía no está disponible.');
    }

    const authorization = req.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
        throw new ErrorAplicacion(401, 'AUTH_REQUIRED', 'Ingresá a tu cuenta para acceder al ritual diario.');
    }

    const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: SUPABASE_PUBLIC_KEY,
            Authorization: authorization
        }
    });

    if (!respuesta.ok) {
        throw new ErrorAplicacion(401, 'INVALID_SESSION', 'Tu sesión venció. Volvé a ingresar para continuar.');
    }

    return respuesta.json();
}

async function ejecutarFuncionPrivada(nombre, payload) {
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
        throw new ErrorAplicacion(503, 'USAGE_NOT_CONFIGURED', 'El control de beneficios todavía no está disponible.');
    }

    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_SECRET_KEY,
            Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        console.error(`Error en Supabase RPC (${nombre}):`, respuesta.status, detalle);
        throw new ErrorAplicacion(503, 'USAGE_SERVICE_ERROR', 'No pudimos comprobar tu beneficio diario. Probá nuevamente.');
    }

    return respuesta.json();
}

async function reclamarRitualDiario(userId) {
    return ejecutarFuncionPrivada('claim_daily_ritual', { p_user_id: userId });
}

function primeraFila(resultado) {
    return Array.isArray(resultado) ? resultado[0] : resultado;
}

async function obtenerPagosAprobadosMercadoPago(userId) {
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return [];

    const parametros = new URLSearchParams({
        select: 'provider_payment_id',
        user_id: `eq.${userId}`,
        provider: 'eq.mercadopago',
        status: 'eq.approved',
        order: 'updated_at.desc',
        limit: '10'
    });
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/payments?${parametros}`, {
        headers: {
            apikey: SUPABASE_SECRET_KEY,
            Authorization: `Bearer ${SUPABASE_SECRET_KEY}`
        }
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        console.error('Error consultando pagos en Supabase:', respuesta.status, detalle);
        throw new Error('No se pudieron consultar los pagos aprobados.');
    }

    return respuesta.json();
}

// Respaldo para actualizaciones que no llegan por webhook, especialmente en modo de prueba.
async function sincronizarPagosAprobados(userId) {
    if (!PAGOS_CONFIGURADOS) return;

    const pagos = await obtenerPagosAprobadosMercadoPago(userId);
    await Promise.all(pagos.map(({ provider_payment_id: paymentId }) =>
        procesarPagoMercadoPago(paymentId, userId)
    ));
}

// Reserva el cupo de la lectura antes de llamar a la IA. Devuelve la fuente usada.
async function reservarLectura(userId, esRitualDiario) {
    if (esRitualDiario) {
        const disponible = await reclamarRitualDiario(userId);
        if (!disponible) {
            throw new ErrorAplicacion(429, 'DAILY_RITUAL_USED', 'Ya utilizaste tu Carta o Runa del Día. Podrás volver mañana.');
        }
        return 'ritual';
    }

    const reserva = primeraFila(await ejecutarFuncionPrivada('claim_reading', {
        p_user_id: userId,
        p_daily_limit: TIRADAS_DIARIAS_PREMIUM
    }));

    if (reserva?.allowed) return reserva.source;
    if (reserva?.reason === 'DAILY_LIMIT') {
        throw new ErrorAplicacion(429, 'DAILY_LIMIT', `Ya realizaste tus ${TIRADAS_DIARIAS_PREMIUM} tiradas de hoy. Se renuevan a medianoche (hora de Argentina).`);
    }
    throw new ErrorAplicacion(402, 'PREMIUM_REQUIRED', 'Ya usaste tu tirada de prueba. Activá Oráculos Premium para seguir consultando.');
}

async function liberarLectura(userId, fuente) {
    try {
        if (fuente === 'ritual') {
            await ejecutarFuncionPrivada('release_daily_ritual', { p_user_id: userId });
        } else {
            await ejecutarFuncionPrivada('release_reading', { p_user_id: userId, p_source: fuente });
        }
    } catch (error) {
        console.error('No se pudo devolver el cupo de la lectura:', error);
    }
}

async function registrarLectura(userId, oraculo, pregunta, simbolos, fuente) {
    try {
        return await ejecutarFuncionPrivada('record_reading', {
            p_user_id: userId,
            p_oracle: oraculo,
            p_question: pregunta,
            p_symbols: simbolos,
            p_source: fuente
        });
    } catch (error) {
        console.error('No se pudo registrar la lectura:', error);
        return null;
    }
}

function validarTirada(idTirada, simbolos, cantidadesPorTirada, nombresValidos, tipo) {
    const cantidadEsperada = cantidadesPorTirada[idTirada];
    if (!cantidadEsperada) {
        throw new ErrorAplicacion(400, 'INVALID_SPREAD', 'La tirada elegida no existe.');
    }
    if (!Array.isArray(simbolos) || simbolos.length !== cantidadEsperada || new Set(simbolos).size !== simbolos.length || !simbolos.every(nombre => nombresValidos.has(nombre))) {
        throw new ErrorAplicacion(400, 'INVALID_SYMBOLS', `Las ${tipo} enviadas no corresponden a la tirada elegida.`);
    }
    return cantidadEsperada;
}

function normalizarPregunta(pregunta) {
    return String(pregunta || '').trim().slice(0, LARGO_MAXIMO_PREGUNTA);
}

async function consultarGroq({ sistema, instrucciones, maxTokens, temperatura, contexto }) {
    const respuestaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY_GROQ}`
        },
        body: JSON.stringify({
            model: MODELO_GROQ,
            temperature: temperatura,
            max_tokens: maxTokens,
            messages: [
                { role: "system", content: sistema },
                { role: "user", content: instrucciones }
            ]
        })
    });

    if (!respuestaGroq.ok) {
        const detalleError = await respuestaGroq.text();
        console.error(`Error en API Groq (${contexto}):`, respuestaGroq.status, detalleError);
        throw new ErrorAplicacion(502, 'AI_ERROR', 'El oráculo no pudo completar la lectura. Tu cupo no fue descontado: probá nuevamente en unos minutos.');
    }

    const datos = await respuestaGroq.json();
    return datos.choices[0].message.content;
}

function responderErrorAplicacion(res, error) {
    if (!(error instanceof ErrorAplicacion)) return false;
    res.status(error.status).json({ error: error.message, code: error.code });
    return true;
}

app.get('/api/cuenta/estado', async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);

        try {
            await sincronizarPagosAprobados(usuario.id);
        } catch (error) {
            // La consulta de la cuenta no debe quedar inutilizable por una demora del proveedor de pagos.
            console.error('No se pudieron sincronizar los pagos de la cuenta:', error);
        }

        const estado = primeraFila(await ejecutarFuncionPrivada('get_account_status', { p_user_id: usuario.id }));
        const premiumHasta = estado?.membership_until || null;
        const premiumActivo = Boolean(premiumHasta && new Date(premiumHasta) > new Date());

        res.json({
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.user_metadata?.nombre || ''
            },
            plan: premiumActivo ? 'premium' : 'free',
            premiumHasta: premiumActivo ? premiumHasta : null,
            ritualDiarioDisponible: Number(estado?.ritual_used || 0) < 1,
            tiradaPruebaDisponible: !estado?.trial_reading_used,
            tiradasPremiumUsadas: Number(estado?.paid_readings_used || 0),
            tiradasPremiumLimite: TIRADAS_DIARIAS_PREMIUM,
            pagosDisponibles: PAGOS_CONFIGURADOS,
            premium: {
                precio: PRODUCTOS.premium_30d.precio,
                dias: PRODUCTOS.premium_30d.dias
            }
        });
    } catch (error) {
        if (responderErrorAplicacion(res, error)) return;
        console.error('Error consultando el estado de cuenta:', error);
        res.status(500).json({ error: 'No pudimos consultar el estado de tu cuenta.' });
    }
});

// --- PAGOS CON MERCADOPAGO (Checkout Pro) ---

async function llamarMercadoPago(ruta, opciones = {}) {
    if (!MP_ACCESS_TOKEN) {
        throw new ErrorAplicacion(503, 'PAYMENTS_NOT_CONFIGURED', 'Los pagos todavía no están habilitados.');
    }

    const respuesta = await fetch(`https://api.mercadopago.com${ruta}`, {
        ...opciones,
        headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            ...(opciones.headers || {})
        }
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        console.error(`Error en MercadoPago (${ruta}):`, respuesta.status, detalle);
        throw new ErrorAplicacion(502, 'PAYMENT_PROVIDER_ERROR', 'No pudimos comunicarnos con MercadoPago. Probá nuevamente.');
    }

    return respuesta.json();
}

// Consulta el pago directamente a MercadoPago (fuente de verdad) y lo aplica a la cuenta.
async function procesarPagoMercadoPago(paymentId, usuarioEsperado = null) {
    const pago = await llamarMercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`);
    const [userId, productoId] = String(pago.external_reference || '').split('|');
    const producto = PRODUCTOS[productoId];

    if (!userId || !producto) {
        console.warn('Pago de MercadoPago sin referencia reconocida:', paymentId, pago.external_reference);
        return { estado: pago.status, aplicado: false };
    }
    if (usuarioEsperado && userId !== usuarioEsperado) {
        throw new ErrorAplicacion(403, 'PAYMENT_OTHER_USER', 'Este pago no corresponde a tu cuenta.');
    }

    const montoValido = pago.currency_id === 'ARS' && Number(pago.transaction_amount) + 0.01 >= producto.precio;
    if (!montoValido) {
        console.warn('Pago con monto o moneda inesperados:', paymentId, pago.transaction_amount, pago.currency_id);
    }

    const aplicado = await ejecutarFuncionPrivada('apply_payment', {
        p_user_id: userId,
        p_product: productoId,
        p_provider_payment_id: String(pago.id),
        p_status: pago.status,
        p_amount: Number(pago.transaction_amount) || 0,
        p_currency: pago.currency_id || 'ARS',
        p_days: montoValido ? producto.dias : 0
    });

    return { estado: pago.status, aplicado: Boolean(aplicado) };
}

function firmaWebhookValida(req, dataId) {
    const firma = req.get('x-signature') || '';
    const requestId = req.get('x-request-id') || '';
    const partes = Object.fromEntries(firma.split(',').map(parte => parte.split('=').map(valor => valor.trim())));
    if (!partes.ts || !partes.v1) return false;

    const idNormalizado = /^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : String(dataId);
    const manifiesto = `id:${idNormalizado};request-id:${requestId};ts:${partes.ts};`;
    const esperado = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifiesto).digest('hex');

    const bufferEsperado = Buffer.from(esperado);
    const bufferRecibido = Buffer.from(partes.v1);
    return bufferEsperado.length === bufferRecibido.length && crypto.timingSafeEqual(bufferEsperado, bufferRecibido);
}

app.post('/api/pagos/crear-preferencia', async (req, res) => {
    try {
        if (!PAGOS_CONFIGURADOS) {
            throw new ErrorAplicacion(503, 'PAYMENTS_NOT_CONFIGURED', 'Los pagos todavía no están habilitados.');
        }
        const usuario = await obtenerUsuarioAutenticado(req);
        const productoId = req.body?.producto || 'premium_30d';
        const producto = PRODUCTOS[productoId];
        if (!producto) {
            throw new ErrorAplicacion(400, 'UNKNOWN_PRODUCT', 'El producto elegido no existe.');
        }

        const origen = PUBLIC_SITE_URL;
        const preferencia = {
            items: [{
                id: productoId,
                title: producto.titulo,
                description: producto.descripcion,
                quantity: 1,
                currency_id: 'ARS',
                unit_price: producto.precio
            }],
            external_reference: `${usuario.id}|${productoId}`,
            back_urls: {
                success: `${origen}/?pago=exito`,
                failure: `${origen}/?pago=error`,
                pending: `${origen}/?pago=pendiente`
            },
            statement_descriptor: 'ORACULOS'
        };

        preferencia.auto_return = 'approved';
        preferencia.notification_url = `${origen}/api/pagos/webhook`;

        const datos = await llamarMercadoPago('/checkout/preferences', {
            method: 'POST',
            body: JSON.stringify(preferencia)
        });

        res.json({ url: datos.init_point });
    } catch (error) {
        if (responderErrorAplicacion(res, error)) return;
        console.error('Error creando la preferencia de pago:', error);
        res.status(500).json({ error: 'No pudimos iniciar el pago.' });
    }
});

// Confirmación al volver de MercadoPago: no depende de que el webhook haya llegado.
app.post('/api/pagos/confirmar', async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);
        const paymentId = String(req.body?.paymentId || '');
        if (!/^\d+$/.test(paymentId)) {
            throw new ErrorAplicacion(400, 'INVALID_PAYMENT_ID', 'El identificador de pago no es válido.');
        }

        const resultado = await procesarPagoMercadoPago(paymentId, usuario.id);
        res.json({ estado: resultado.estado });
    } catch (error) {
        if (responderErrorAplicacion(res, error)) return;
        console.error('Error confirmando el pago:', error);
        res.status(500).json({ error: 'No pudimos confirmar el pago.' });
    }
});

app.post('/api/pagos/webhook', async (req, res) => {
    const tipo = req.query.type || req.query.topic || req.body?.type;
    const dataId = req.query['data.id'] || req.body?.data?.id || (tipo === 'payment' ? req.query.id : null);

    if (tipo !== 'payment' || !dataId) return res.sendStatus(200);
    if (!PAGOS_CONFIGURADOS) return res.sendStatus(503);
    if (!firmaWebhookValida(req, dataId)) {
        console.warn('Webhook de MercadoPago con firma inválida.');
        return res.sendStatus(401);
    }

    try {
        await procesarPagoMercadoPago(dataId);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error procesando el webhook de MercadoPago:', error);
        // Un 500 hace que MercadoPago reintente la notificación más tarde.
        res.sendStatus(500);
    }
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
    let reserva = null;
    try {
        const { cartas, idTirada } = req.body;
        const esCartaDelDia = idTirada === "carta_dia";
        const pregunta = esCartaDelDia ? "Carta del Día" : normalizarPregunta(req.body.pregunta);
        if (!esCartaDelDia && !pregunta) {
            throw new ErrorAplicacion(400, 'QUESTION_REQUIRED', 'Escribí una pregunta antes de realizar la tirada.');
        }
        const cantidadCartas = validarTirada(idTirada, cartas, CANTIDAD_POR_TIRADA_TAROT, NOMBRES_CARTAS, 'cartas');
        const listaCartas = cartas;
        const listaCartasTexto = listaCartas.join(", ");
        const posicionesTarot = obtenerPosicionesTarot(idTirada, cantidadCartas);
        const cartasConPosiciones = listaCartas.map((carta, index) => `${index + 1}. ${posicionesTarot[index] || `Posición ${index + 1}`}: ${carta}`).join("\n");

        const usuario = await obtenerUsuarioAutenticado(req);
        reserva = { userId: usuario.id, fuente: await reservarLectura(usuario.id, esCartaDelDia) };

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

        const lectura = await consultarGroq({
            sistema: PERSONALIDAD_TAROTISTA,
            instrucciones,
            maxTokens: cantidadCartas >= 7 ? 1900 : 1200,
            temperatura: 0.2,
            contexto: 'Tarot'
        });
        const lecturaId = await registrarLectura(usuario.id, 'tarot', pregunta, listaCartas, reserva.fuente);
        reserva = null;
        res.json({ lectura, lecturaId });

    } catch (error) {
        if (reserva) await liberarLectura(reserva.userId, reserva.fuente);
        if (responderErrorAplicacion(res, error)) return;
        console.error("Error interno:", error);
        res.status(500).json({ error: "Error interno del servidor Node.js." });
    }
});

// Profundizar usa el contexto guardado de la lectura y se permite una sola vez por lectura.
async function profundizarLectura(req, res) {
    let reclamo = null;
    try {
        const usuario = await obtenerUsuarioAutenticado(req);
        const lecturaId = String(req.body?.lecturaId || '');
        if (!/^[0-9a-f-]{36}$/i.test(lecturaId)) {
            throw new ErrorAplicacion(400, 'INVALID_READING', 'No encontramos la lectura a profundizar.');
        }

        const lectura = primeraFila(await ejecutarFuncionPrivada('claim_deepening', { p_user_id: usuario.id, p_reading_id: lecturaId }));
        if (!lectura) {
            throw new ErrorAplicacion(409, 'ALREADY_DEEPENED', 'Esta lectura ya fue profundizada.');
        }
        reclamo = { userId: usuario.id, lecturaId };

        const esTarot = lectura.oracle === 'tarot';
        const listaSimbolosTexto = (lectura.symbols || []).join(", ");
        const instrucciones = esTarot ? `El usuario consultó sobre: "${lectura.question || 'su inquietud'}" con las cartas: ${listaSimbolosTexto}.
        Por favor, ofrecé una clarificación adicional, desglosando con mayor sencillez y profundidad el consejo global de estas cartas para disipar cualquier duda. Sé cálido, claro y alentador.

        ${FORMATO_LECTURA}` : `El usuario consultó sobre: "${lectura.question || 'su inquietud'}" con las runas: ${listaSimbolosTexto}.
        Por favor, ofrecé una clarificación adicional, desglosando con mayor sencillez y profundidad el consejo global de estas runas para disipar cualquier duda. Sé cálido, claro, alentador y recordá que estás hablando de la sabiduría rúnica (no uses la palabra "carta").

        ${FORMATO_LECTURA}`;

        const profundizacion = await consultarGroq({
            sistema: esTarot ? PERSONALIDAD_TAROTISTA : PERSONALIDAD_RUNAS,
            instrucciones,
            maxTokens: 1000,
            temperatura: 0.2,
            contexto: esTarot ? 'Profundización Tarot' : 'Profundización Runas'
        });
        reclamo = null;
        res.json({ profundizacion });

    } catch (error) {
        if (reclamo) {
            await ejecutarFuncionPrivada('release_deepening', { p_user_id: reclamo.userId, p_reading_id: reclamo.lecturaId }).catch(err => console.error('No se pudo liberar la profundización:', err));
        }
        if (responderErrorAplicacion(res, error)) return;
        console.error("Error interno en profundización:", error);
        res.status(500).json({ error: "Error interno en el servidor de profundización." });
    }
}

app.post('/api/profundizar-tarot', profundizarLectura);
app.post('/api/profundizar-runas', profundizarLectura);

app.post('/api/consultar-runas', async (req, res) => {
    let reserva = null;
    try {
        const { runas, idTirada } = req.body;
        const esRunaDelDia = idTirada === "runa_dia";
        const pregunta = esRunaDelDia ? "Runa del Día" : normalizarPregunta(req.body.pregunta);
        if (!esRunaDelDia && !pregunta) {
            throw new ErrorAplicacion(400, 'QUESTION_REQUIRED', 'Escribí una pregunta antes de realizar la tirada.');
        }
        const cantidadRunas = validarTirada(idTirada, runas, CANTIDAD_POR_TIRADA_RUNAS, NOMBRES_RUNAS, 'runas');
        const listaRunasTexto = runas.join(", ");

        const usuario = await obtenerUsuarioAutenticado(req);
        reserva = { userId: usuario.id, fuente: await reservarLectura(usuario.id, esRunaDelDia) };

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

        const lectura = await consultarGroq({
            sistema: PERSONALIDAD_RUNAS,
            instrucciones,
            maxTokens: 1500,
            temperatura: 0.3,
            contexto: 'Runas'
        });
        const lecturaId = await registrarLectura(usuario.id, 'runas', pregunta, runas, reserva.fuente);
        reserva = null;
        res.json({ lectura, lecturaId });

    } catch (error) {
        if (reserva) await liberarLectura(reserva.userId, reserva.fuente);
        if (responderErrorAplicacion(res, error)) return;
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
