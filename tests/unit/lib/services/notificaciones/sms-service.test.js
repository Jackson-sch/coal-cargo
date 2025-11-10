import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enviarSMS, isSMSServiceConfigured } from '@/lib/services/notificaciones/sms-service';

describe('SMS Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('enviarSMS', () => {
    it('debe validar que el destinatario sea requerido', async () => {
      const result = await enviarSMS({
        destinatario: '',
        mensaje: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requerido');
    });

    it('debe validar que el mensaje sea requerido', async () => {
      const result = await enviarSMS({
        destinatario: '999999999',
        mensaje: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requerido');
    });

    it('debe validar formato de teléfono peruano', async () => {
      const result = await enviarSMS({
        destinatario: '123', // Inválido
        mensaje: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('debe aceptar números peruanos válidos de 9 dígitos', async () => {
      process.env.SMS_SERVICE = 'simulation';

      const result = await enviarSMS({
        destinatario: '999999999',
        mensaje: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('simulation');
    });

    it('debe usar simulación por defecto', async () => {
      delete process.env.SMS_SERVICE;

      const result = await enviarSMS({
        destinatario: '999999999',
        mensaje: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('simulation');
    });
  });

  describe('isSMSServiceConfigured', () => {
    it('debe indicar que está usando simulación por defecto', async () => {
      delete process.env.SMS_SERVICE;

      const status = await isSMSServiceConfigured();

      expect(status.configured).toBe(false);
      expect(status.provider).toBe('simulation');
    });

    it('debe verificar configuración de Twilio', async () => {
      process.env.SMS_SERVICE = 'twilio';
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      const status = await isSMSServiceConfigured();

      expect(status.configured).toBe(true);
      expect(status.provider).toBe('twilio');
    });

    it('debe indicar si faltan credenciales de Twilio', async () => {
      process.env.SMS_SERVICE = 'twilio';
      delete process.env.TWILIO_ACCOUNT_SID;

      const status = await isSMSServiceConfigured();

      expect(status.configured).toBe(false);
      expect(status.message).toContain('Faltan credenciales');
    });
  });
});

