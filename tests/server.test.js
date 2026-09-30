import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.VERCEL = '1';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_PUBLISHABLE_KEY = '';
process.env.SUPABASE_ANON_KEY = '';
process.env.SUPABASE_SECRET_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.MP_ACCESS_TOKEN = '';
process.env.MP_WEBHOOK_SECRET = '';
process.env.PUBLIC_SITE_URL = '';
process.env.PREMIUM_PRICE_ARS = '';

const { default: app } = await import('../server.js');

let servidor;
let baseUrl;

before(() => new Promise((resolve, reject) => {
    servidor = app.listen(0, '127.0.0.1', () => {
        const direccion = servidor.address();
        baseUrl = `http://127.0.0.1:${direccion.port}`;
        resolve();
    });
    servidor.on('error', reject);
}));

after(() => new Promise(resolve => servidor.close(resolve)));

async function solicitar(ruta, opciones) {
    const respuesta = await fetch(`${baseUrl}${ruta}`, opciones);
    const datos = await respuesta.json().catch(() => ({}));
    return { respuesta, datos };
}

test('la configuración pública no expone claves privadas', async () => {
    const { respuesta, datos } = await solicitar('/api/configuracion-publica');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(datos, {
        authDisponible: false,
        supabaseUrl: null,
        supabasePublicKey: null
    });
    assert.equal('supabaseSecretKey' in datos, false);
    assert.equal('mpAccessToken' in datos, false);
});

test('los pagos permanecen cerrados si falta la configuración completa', async () => {
    const { respuesta, datos } = await solicitar('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto: 'premium_30d' })
    });

    assert.equal(respuesta.status, 503);
    assert.equal(datos.code, 'PAYMENTS_NOT_CONFIGURED');
});

test('una tirada sin pregunta se rechaza antes de consumir recursos', async () => {
    const { respuesta, datos } = await solicitar('/api/consultar-tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: '   ', cartas: ['El Loco'], idTirada: '1' })
    });

    assert.equal(respuesta.status, 400);
    assert.equal(datos.code, 'QUESTION_REQUIRED');
});

test('el ritual diario exige una sesión válida', async () => {
    const { respuesta, datos } = await solicitar('/api/consultar-runas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: 'Runa del Día', runas: ['Gebo'], idTirada: 'runa_dia' })
    });

    assert.equal(respuesta.status, 503);
    assert.equal(datos.code, 'AUTH_NOT_CONFIGURED');
});

test('el servidor rechaza símbolos que no pertenecen al mazo', async () => {
    const { respuesta, datos } = await solicitar('/api/consultar-runas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: 'Una consulta', runas: ['Runa inventada'], idTirada: 'runa_odin' })
    });

    assert.equal(respuesta.status, 400);
    assert.equal(datos.code, 'INVALID_SYMBOLS');
});
