import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mocks de assets (imágenes estáticas)
vi.mock('../../../src/assets/Genesis_Sign_Violet.png', () => ({ default: 'mock-logo' }));
vi.mock('../../../src/assets/Genesis_Horizontal_Violet.png', () => ({ default: 'mock-text' }));

// Mock de authService
vi.mock('../../../src/services/auth.service.js', () => ({
  default: {
    login: vi.fn(),
  },
}));

// Mock de react-router-dom (solo useNavigate, conservamos el resto)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import Login from '../../../src/components/Login.jsx';
import authService from '../../../src/services/auth.service.js';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza el formulario de login', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('muestra error de email inválido', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'nocorrecto' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Pass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/formato de email inválido/i)).toBeInTheDocument();
  });

  test('muestra error de contraseña demasiado corta', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/mínimo 6 caracteres/i)).toBeInTheDocument();
  });

  test('muestra error si la contraseña no tiene mayúscula/número', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'solominusculas' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/mayúscula, minúscula y número/i)).toBeInTheDocument();
  });

  test('no llama a authService si hay errores de validación', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('llama a authService.login con credenciales válidas', async () => {
    authService.login.mockResolvedValue({});
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Pass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('user@test.com', 'Pass123');
    });
  });

  test('navega a "/" tras login exitoso', async () => {
    authService.login.mockResolvedValue({});
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Pass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('muestra error del servidor cuando el login falla', async () => {
    authService.login.mockRejectedValue(new Error('Credenciales inválidas'));
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Pass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
  });

  test('el botón muestra estado de carga mientras hace login', async () => {
    authService.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'Pass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/iniciando sesión/i)).toBeInTheDocument();
  });

  test('alterna visibilidad de la contraseña al pulsar el botón', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/contraseña/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = passwordInput.closest('.input-with-error').querySelector('.password-toggle');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
