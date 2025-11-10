import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enviarWhatsApp, isWhatsAppServiceConfigured } from '@/lib/services/notificaciones/whatsapp-service';

describe('WhatsApp Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('enviarWhatsApp', () => {
    it('debe validar que el destinatario sea requerido', async () => {
      const result = await enviarWhatsApp({
        destinatario: '',
        mensaje: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requerido');
    });

    it('debe validar que el mensaje sea requerido', async () => {
      const result = await enviarWhatsApp({
        destinatario: '999999999',
        mensaje: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requerido');
    });

    it('debe validar formato de teléfono peruano', async () => {
      const result = await enviarWhatsApp({
        destinatario: '123', // Inválido
        mensaje: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('debe aceptar números peruanos válidos de 9 dígitos', async () => {
      process.env.WHATSAPP_SERVICE = 'simulation';

      const result = await enviarWhatsApp({
        destinatario: '999999999',
        mensaje: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('simulation');
    });

    it('debe usar simulación por defecto', async () => {
      delete process.env.WHATSAPP_SERVICE;

      const result = await enviarWhatsApp({
        destinatario: '999999999',
        mensaje: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('simulation');
    });
  });

  describe('isWhatsAppServiceConfigured', () => {
    it('debe indicar que está usando simulación por defecto', async () => {
      delete process.env.WHATSAPP_SERVICE;

      const status = await isWhatsAppServiceConfigured();

      expect(status.configured).toBe(false);
      expect(status.provider).toBe('simulation');
    });

    it('debe verificar configuración de Twilio', async () => {
      process.env.WHATSAPP_SERVICE = 'twilio';
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886';

      const status = await isWhatsAppServiceConfigured();

      expect(status.configured).toBe(true);
      expect(status.provider).toBe('twilio');
    });

    it('debe verificar configuración de Meta', async () => {
      process.env.WHATSAPP_SERVICE = 'meta';
      process.env.META_WHATSAPP_PHONE_NUMBER_ID = 'test-id';
      process.env.META_WHATSAPP_ACCESS_TOKEN = 'test-token';

      const status = await isWhatsAppServiceConfigured();

      expect(status.configured).toBe(true);
      expect(status.provider).toBe('meta');
    });
  });
});

