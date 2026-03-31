import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mocks de assets
vi.mock('../../../src/assets/Genesis_Sign_Violet.png', () => ({ default: 'mock-logo' }));
vi.mock('../../../src/assets/Genesis_Horizontal_Violet.png', () => ({ default: 'mock-text' }));

// Mock de authService
vi.mock('../../../src/services/auth.service.js', () => ({
  default: {
    register: vi.fn(),
  },
}));

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import Register from '../../../src/components/Register.jsx';
import authService from '../../../src/services/auth.service.js';

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

const fillForm = ({ username = 'usuario', email = 'user@test.com', password = 'Pass123', confirmPassword = 'Pass123' } = {}) => {
  fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: username } });
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: email } });
  // Usamos getByPlaceholderText para distinguir los dos campos de contraseña
  const [passInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
  fireEvent.change(passInput, { target: { value: password } });
  fireEvent.change(confirmInput, { target: { value: confirmPassword } });
};

describe('Register component', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renderiza el formulario de registro', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
  });

  test('muestra error si el username tiene menos de 3 caracteres', async () => {
    renderRegister();
    fillForm({ username: 'ab' });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(await screen.findByText(/mínimo 3 caracteres/i)).toBeInTheDocument();
  });

  test('muestra error si el username tiene mas de 50 caracteres', async () => {
    renderRegister();
    fillForm({ username: 'a'.repeat(51) });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(await screen.findByText(/máximo 50 caracteres/i)).toBeInTheDocument();
  });

  test('muestra error si el username tiene caracteres inválidos', async () => {
    renderRegister();
    fillForm({ username: 'user name!' });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(await screen.findByText(/solo letras, números, guiones/i)).toBeInTheDocument();
  });

  test('muestra error si el email es inválido', async () => {
    renderRegister();
    fillForm({ email: 'noesvalido' });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(await screen.findByText(/formato de email inválido/i)).toBeInTheDocument();
  });

  test('cambia la visibilidad de la contraseña y confirmación', () => {
    renderRegister();
    
    const passwordInput = screen.getByLabelText(/^Contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/Repetir Contraseña/i);
    
    // Al inicio, ambos son de tipo password
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Clic en los botones de toggle (asumiremos que están en el DOM, podemos usar container.querySelectorAll)
    const toggles = document.querySelectorAll('.password-toggle');
    expect(toggles.length).toBe(2);

    // Toggle password
    fireEvent.click(toggles[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggles[0]);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Toggle confirm password
    fireEvent.click(toggles[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggles[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  test('muestra error si la contraseña es demasiado corta', async () => {
    renderRegister();
    fillForm({ password: '123', confirmPassword: '123' });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(await screen.findByText(/mínimo 6 caracteres/i)).toBeInTheDocument();
  });

  test('muestra error si la contraseña no tiene mayúscula/número', async () => {
    renderRegister();
    fillForm({ password: 'solominusculas', confirmPassword: 'solominusculas' });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(await screen.findByText(/mayúscula, minúscula y número/i)).toBeInTheDocument();
  });

  test('muestra error si las contraseñas no coinciden', async () => {
    renderRegister();
    fillForm({ password: 'Pass123', confirmPassword: 'Pass456' });
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  test('no llama a authService si hay errores de validación', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    expect(authService.register).not.toHaveBeenCalled();
  });

  test('llama a authService.register con datos válidos', async () => {
    authService.register.mockResolvedValue({});
    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith('usuario', 'user@test.com', 'Pass123');
    });
  });

  test('navega a "/" tras registro exitoso', async () => {
    authService.register.mockResolvedValue({});
    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('muestra error del servidor cuando el registro falla', async () => {
    authService.register.mockRejectedValue(new Error('El email ya está registrado'));
    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText(/el email ya está registrado/i)).toBeInTheDocument();
  });

  test('el botón muestra estado de carga mientras registra', async () => {
    authService.register.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderRegister();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(await screen.findByText(/registrando/i)).toBeInTheDocument();
  });
});
