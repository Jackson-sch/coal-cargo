import { describe, it, expect } from 'vitest';
import { validarDocumentoPeruano } from '@/lib/utils/documentos.js';

describe('validarDocumentoPeruano', () => {
  describe('DNI', () => {
    it('debe validar un DNI válido de 8 dígitos', () => {
      expect(validarDocumentoPeruano('DNI', '12345678')).toBe(true);
      expect(validarDocumentoPeruano('DNI', '87654321')).toBe(true);
      expect(validarDocumentoPeruano('DNI', '00000001')).toBe(true); // Mínimo válido
      expect(validarDocumentoPeruano('DNI', '99999999')).toBe(true); // Máximo válido
    });

    it('debe rechazar un DNI inválido', () => {
      expect(validarDocumentoPeruano('DNI', '1234567')).toBe(false); // 7 dígitos
      expect(validarDocumentoPeruano('DNI', '123456789')).toBe(false); // 9 dígitos
      expect(validarDocumentoPeruano('DNI', 'abc12345')).toBe(false); // contiene letras
      expect(validarDocumentoPeruano('DNI', '')).toBe(false); // vacío
      expect(validarDocumentoPeruano('DNI', null)).toBe(false); // null
      expect(validarDocumentoPeruano('DNI', undefined)).toBe(false); // undefined
    });
  });

  describe('RUC', () => {
    it('debe validar un RUC válido de 11 dígitos', () => {
      expect(validarDocumentoPeruano('RUC', '20123456789')).toBe(true);
      expect(validarDocumentoPeruano('RUC', '20567890123')).toBe(true);
      expect(validarDocumentoPeruano('RUC', '20100070970')).toBe(true); // Ejemplo real
    });

    it('debe rechazar un RUC inválido', () => {
      expect(validarDocumentoPeruano('RUC', '2012345678')).toBe(false); // 10 dígitos
      expect(validarDocumentoPeruano('RUC', '201234567890')).toBe(false); // 12 dígitos
      expect(validarDocumentoPeruano('RUC', 'abc12345678')).toBe(false); // contiene letras
      expect(validarDocumentoPeruano('RUC', '')).toBe(false); // vacío
      expect(validarDocumentoPeruano('RUC', null)).toBe(false); // null
    });
  });

  describe('Casos edge', () => {
    it('debe manejar tipos de documento inválidos', () => {
      expect(validarDocumentoPeruano('PASAPORTE', '123456')).toBe(false);
      expect(validarDocumentoPeruano('CARNET_EXTRANJERIA', '123456')).toBe(false);
      expect(validarDocumentoPeruano('', '12345678')).toBe(false); // tipo vacío
      expect(validarDocumentoPeruano(null, '12345678')).toBe(false); // tipo null
    });

    it('debe manejar números con espacios', () => {
      // La función hace trim, así que debería funcionar
      expect(validarDocumentoPeruano('DNI', ' 12345678 ')).toBe(true);
      expect(validarDocumentoPeruano('RUC', ' 20123456789 ')).toBe(true);
    });
  });
});

