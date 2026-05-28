import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from './i18n/config';

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Configurar idioma por defecto para tests para que pasen las aserciones en español
  i18n.changeLanguage('es');
  
  // Ignorar errores en consola durante los tests
  console.error = vi.fn();
  // Ignorar warnings como los de act() durante los tests
  console.warn = vi.fn();

  // Mock matchMedia para que funcione en jsdom
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Limpiar después de cada test
afterEach(() => {
  cleanup();
});