# 📧 Configuración de Notificaciones

Este documento explica cómo configurar los servicios de notificaciones (Email, SMS, WhatsApp) en el sistema.

## 📬 Email (Resend)

### Configuración Básica

1. Obtén tu API key en [Resend](https://resend.com/api-keys)
2. Verifica tu dominio en [Resend Domains](https://resend.com/domains)
3. Configura las variables de entorno:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=notificaciones@tudominio.com
```

**⚠️ Importante:**
- No puedes usar dominios públicos (gmail.com, yahoo.com, etc.)
- Debes verificar tu dominio antes de usar
- Para desarrollo/pruebas, usa: `onboarding@resend.dev`

## 📱 SMS

### Opción 1: Twilio (Recomendado)

1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Obtén tus credenciales:
   - Account SID
   - Auth Token
   - Phone Number (número de teléfono verificado)
3. Configura las variables de entorno:

```env
SMS_SERVICE=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Opción 2: Simulación (Desarrollo)

Por defecto, el sistema usa simulación para desarrollo:

```env
SMS_SERVICE=simulation
```

Los SMS se loggearán en la consola pero no se enviarán realmente.

### Formato de Números

El sistema valida automáticamente números peruanos:
- **Formato local**: 9 dígitos (ej: 999999999)
- **Formato internacional**: +51999999999

## 💬 WhatsApp

### Opción 1: Twilio WhatsApp API (Recomendado)

1. Activa WhatsApp en tu cuenta de Twilio
2. Obtén un número de WhatsApp verificado
3. Configura las variables de entorno:

```env
WHATSAPP_SERVICE=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Nota:** El número de WhatsApp debe incluir el prefijo `whatsapp:`

### Opción 2: WhatsApp Business API (Meta)

1. Crea una cuenta de negocio en [Meta for Developers](https://developers.facebook.com/)
2. Configura WhatsApp Business API
3. Obtén:
   - Phone Number ID
   - Access Token
4. Configura las variables de entorno:

```env
WHATSAPP_SERVICE=meta
META_WHATSAPP_PHONE_NUMBER_ID=123456789012345
META_WHATSAPP_ACCESS_TOKEN=your_access_token
META_WHATSAPP_API_VERSION=v21.0
```

### Opción 3: Simulación (Desarrollo)

```env
WHATSAPP_SERVICE=simulation
```

## ✅ Verificar Configuración

El sistema incluye funciones para verificar el estado de configuración:

```javascript
import { isSMSServiceConfigured } from '@/lib/services/notificaciones/sms-service';
import { isWhatsAppServiceConfigured } from '@/lib/services/notificaciones/whatsapp-service';

// Verificar SMS
const smsStatus = isSMSServiceConfigured();
console.log(smsStatus);
// { configured: true, provider: 'twilio', message: 'Twilio configurado' }

// Verificar WhatsApp
const whatsappStatus = isWhatsAppServiceConfigured();
console.log(whatsappStatus);
// { configured: true, provider: 'meta', message: 'Meta WhatsApp configurado' }
```

## 🧪 Pruebas

### Probar Email

```javascript
import { enviarEmail } from '@/lib/services/notificaciones/email-service';

const result = await enviarEmail({
  destinatario: 'test@example.com',
  asunto: 'Prueba',
  mensaje: 'Este es un mensaje de prueba',
});
```

### Probar SMS

```javascript
import { enviarSMS } from '@/lib/services/notificaciones/sms-service';

const result = await enviarSMS({
  destinatario: '999999999', // Número peruano
  mensaje: 'Mensaje de prueba',
});
```

### Probar WhatsApp

```javascript
import { enviarWhatsApp } from '@/lib/services/notificaciones/whatsapp-service';

const result = await enviarWhatsApp({
  destinatario: '999999999', // Número peruano
  mensaje: 'Mensaje de prueba',
});
```

## 🔒 Seguridad

- **Nunca** commitees credenciales en el código
- Usa variables de entorno para todas las credenciales
- Rota las API keys periódicamente
- Usa diferentes credenciales para desarrollo y producción

## 📊 Monitoreo

El sistema registra automáticamente:
- Intentos de envío
- Errores
- Estado de las notificaciones

Puedes verificar el estado en:
- Logs del servidor (desarrollo)
- Dashboard de notificaciones (en desarrollo)
- Tabla `notificaciones` en la base de datos

## 🚀 Producción

Antes de pasar a producción:

1. ✅ Verifica todos los dominios y números
2. ✅ Configura límites de rate limiting
3. ✅ Configura webhooks para tracking
4. ✅ Implementa retry logic (ya incluido)
5. ✅ Configura alertas para errores
6. ✅ Prueba todos los canales

## 📝 Notas Adicionales

### Límites de Twilio

- **SMS**: Consulta límites en [Twilio Limits](https://www.twilio.com/docs/limits)
- **WhatsApp**: Requiere aprobación de Meta para producción

### Límites de Meta WhatsApp

- Máximo 1000 mensajes por día (tier gratuito)
- Requiere verificación de negocio
- Mensajes deben cumplir con políticas de Meta

### Costos

- **Twilio SMS**: ~$0.0075 por SMS en Perú
- **Twilio WhatsApp**: ~$0.005 por mensaje
- **Meta WhatsApp**: Gratis (con límites)

---

*Última actualización: $(date)*

