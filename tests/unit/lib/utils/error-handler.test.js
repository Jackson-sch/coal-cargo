import { describe, it, expect } from 'vitest';
import {
  classifyError,
  getErrorMessage,
  ErrorTypes,
  handleServerActionError,
} from '@/lib/utils/error-handler';

describe('Error Handler Utils', () => {
  describe('classifyError', () => {
    it('debe clasificar errores de red', () => {
      expect(classifyError({ message: 'Network error' })).toBe(ErrorTypes.NETWORK);
      expect(classifyError({ message: 'Failed to fetch' })).toBe(ErrorTypes.NETWORK);
      expect(classifyError({ code: 'ECONNREFUSED' })).toBe(ErrorTypes.NETWORK);
    });

    it('debe clasificar errores de validación', () => {
      expect(classifyError({ message: 'Validation failed' })).toBe(ErrorTypes.VALIDATION);
      expect(classifyError({ message: 'Campo requerido' })).toBe(ErrorTypes.VALIDATION);
      expect(classifyError({ name: 'ZodError' })).toBe(ErrorTypes.VALIDATION);
    });

    it('debe clasificar errores de autenticación', () => {
      expect(classifyError({ message: 'Unauthorized', code: 401 })).toBe(
        ErrorTypes.AUTHENTICATION
      );
      expect(classifyError({ message: 'Sesión expirada' })).toBe(ErrorTypes.AUTHENTICATION);
    });

    it('debe clasificar errores de autorización', () => {
      expect(classifyError({ message: 'Forbidden', code: 403 })).toBe(
        ErrorTypes.AUTHORIZATION
      );
      expect(classifyError({ message: 'No tiene permisos' })).toBe(ErrorTypes.AUTHORIZATION);
    });

    it('debe clasificar errores de servidor', () => {
      expect(classifyError({ code: 500 })).toBe(ErrorTypes.SERVER);
      expect(classifyError({ code: 503 })).toBe(ErrorTypes.SERVER);
      expect(classifyError({ message: 'Server error' })).toBe(ErrorTypes.SERVER);
    });

    it('debe retornar UNKNOWN para errores desconocidos', () => {
      expect(classifyError({ message: 'Something went wrong' })).toBe(ErrorTypes.UNKNOWN);
      expect(classifyError(null)).toBe(ErrorTypes.UNKNOWN);
      expect(classifyError(undefined)).toBe(ErrorTypes.UNKNOWN);
    });
  });

  describe('getErrorMessage', () => {
    it('debe retornar mensaje por defecto si no hay error', () => {
      expect(getErrorMessage(null)).toBe('Ocurrió un error inesperado');
      expect(getErrorMessage(null, 'Error personalizado')).toBe('Error personalizado');
    });

    it('debe retornar mensaje del error si es amigable', () => {
      expect(getErrorMessage({ message: 'Cliente no encontrado' })).toBe(
        'Cliente no encontrado'
      );
    });

    it('debe retornar mensaje por tipo de error', () => {
      expect(getErrorMessage({ message: 'Network error' })).toContain('conexión');
      expect(getErrorMessage({ message: 'Validation failed' })).toContain('válidos');
      expect(getErrorMessage({ message: 'Unauthorized' })).toContain('sesión');
    });
  });

  describe('handleServerActionError', () => {
    it('debe retornar formato estándar de error', () => {
      const result = handleServerActionError(new Error('Test error'));
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('type');
    });

    it('debe incluir error original en desarrollo', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      const result = handleServerActionError(error);
      
      expect(result.originalError).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

