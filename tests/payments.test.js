import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.VERCEL = '1';
process.env.SUPABASE_URL = 'https://proyecto.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY = 'publica-de-prueba';
process.env.SUPABASE_SECRET_KEY = 'privada-de-prueba';
process.env.MP_ACCESS_TOKEN = 'token-de-prueba';
process.env.MP_WEBHOOK_SECRET = 'secreto-de-prueba';
process.env.PUBLIC_SITE_URL = 'https://oraculos.example';
process.env.PREMIUM_PRICE_ARS = '12500';
process.env.PREMIUM_DAILY_READINGS = '3';

const solicitudesExternas = [];
const fetchNativo = global.fetch;
global.fetch = async (url, opciones = {}) => {
    if (String(url).startsWith('http://127.0.0.1:')) {
        return fetchNativo(url, opciones);
    }
    solicitudesExternas.push({ url: String(url), opciones });

    if (String(url).endsWith('/auth/v1/user')) {
        return Response.json({ id: '11111111-1111-1111-1111-111111111111', email: 'prueba@example.com' });
    }
    if (String(url).endsWith('/checkout/preferences')) {
        return Response.json({ init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect' });
    }
    throw new Error(`Solicitud externa inesperada: ${url}`);
};

const { default: app } = await import('../server.js');
let servidor;
let baseUrl;

before(async () => {
    servidor = await new Promise(resolve => {
        const instancia = app.listen(0, '127.0.0.1', () => resolve(instancia));
    });
    baseUrl = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => servidor.close(error => error ? reject(error) : resolve()));
});

test('la preferencia usa precio y URLs definidos por el servidor', async () => {
    const respuesta = await fetch(`${baseUrl}/api/pagos/crear-preferencia`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer sesion-de-prueba',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ producto: 'premium_30d', precio: 1 })
    });

    assert.equal(respuesta.status, 200);
    assert.equal((await respuesta.json()).url, 'https://www.mercadopago.com.ar/checkout/v1/redirect');

    const llamada = solicitudesExternas.find(({ url }) => url.endsWith('/checkout/preferences'));
    const preferencia = JSON.parse(llamada.opciones.body);
    assert.equal(preferencia.items[0].unit_price, 12500);
    assert.equal(preferencia.back_urls.success, 'https://oraculos.example/?pago=exito');
    assert.equal(preferencia.notification_url, 'https://oraculos.example/api/pagos/webhook');
    assert.equal(preferencia.external_reference, '11111111-1111-1111-1111-111111111111|premium_30d');
});

test('un webhook con firma inválida se rechaza antes de consultar el pago', async () => {
    const cantidadAnterior = solicitudesExternas.length;
    const respuesta = await fetch(`${baseUrl}/api/pagos/webhook?type=payment&data.id=123`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-request-id': 'request-de-prueba',
            'x-signature': 'ts=123,v1=incorrecta'
        },
        body: JSON.stringify({ type: 'payment', data: { id: '123' } })
    });

    assert.equal(respuesta.status, 401);
    assert.equal(solicitudesExternas.length, cantidadAnterior);
});
