# Proyecto Tarot y Runas

Aplicación web de lecturas de Tarot y Runas con cuentas de usuario, acceso gratuito limitado y un pase Premium de 30 días cobrado mediante Mercado Pago Checkout Pro.

## Desarrollo local

Requisitos: Node.js 20 o posterior y un proyecto de Supabase.

```bash
npm install
cp .env.example .env
npm start
```

La aplicación queda disponible en `http://localhost:3000`. Los pagos permanecen deshabilitados en local porque Mercado Pago necesita URLs públicas HTTPS para retornos y webhooks.

## Configuración de Supabase

1. Crear un proyecto en Supabase.
2. Ejecutar, en este orden, el contenido de las migraciones desde el SQL Editor:
   - `supabase/migrations/202609290001_cuentas_y_cupos.sql`
   - `supabase/migrations/202609300001_membresia_y_pagos.sql`
3. En Authentication > URL Configuration, configurar la URL pública del sitio y agregar las URLs de redirección autorizadas.
4. Copiar la URL, la clave pública y la clave privada del proyecto a las variables del servidor.
5. Mantener activa la confirmación de email para dificultar la creación masiva de cuentas de prueba.

La clave privada de Supabase nunca debe aparecer en `app.js`, `index.html` ni en variables expuestas al navegador.

## Configuración de Mercado Pago

La primera versión vende un pase de 30 días mediante Checkout Pro. No hay débito ni renovación automática.

1. Crear una aplicación en Mercado Pago Developers y comenzar con credenciales de prueba.
2. Configurar el webhook de pagos en `https://TU-DOMINIO/api/pagos/webhook`.
3. Copiar el access token y la clave secreta del webhook a las variables del servidor.
4. Definir el precio y el límite diario antes de habilitar el cobro.
5. Probar como mínimo pagos aprobados, pendientes, rechazados y reembolsados.

El backend consulta cada pago directamente a Mercado Pago antes de otorgar el acceso. La notificación también debe incluir una firma válida.

## Variables de entorno

Usar `.env.example` como referencia. En producción son obligatorias:

- `GROQ_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `PUBLIC_SITE_URL`, con HTTPS y sin barra final
- `PREMIUM_PRICE_ARS`, mayor que cero
- `PREMIUM_DAILY_READINGS`, entero mayor que cero

Si la configuración de pagos está incompleta, el servidor oculta la oferta y rechaza la creación de preferencias. Esto evita cobrar sin poder acreditar el beneficio.

## Verificación

```bash
npm test
node --check server.js
node --check app.js
```

Antes de publicar, registrar una cuenta nueva, confirmar el email, consumir el ritual diario y la lectura de prueba, completar un pago de prueba y verificar que el cupo Premium se limite a la cantidad diaria configurada.
