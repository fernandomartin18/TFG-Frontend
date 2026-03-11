import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UserProfile from '../../../src/components/UserProfile.jsx';
import authService from '../../../src/services/auth.service';

vi.mock('../../../src/services/auth.service', () => ({
  default: {
    getUser: vi.fn(),
  },
}));

vi.mock('../../../src/components/UserProfileModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="user-profile-modal">
      <button onClick={onClose}>Close Modal</button>
    </div>
  )
}));

describe('UserProfile Component', () => {
  const defaultProps = {
    isDarkTheme: false,
    onToggleTheme: vi.fn(),
    compact: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('no renderiza nada si no hay usuario', () => {
    authService.getUser.mockReturnValue(null);
    const { container } = render(<UserProfile {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  test('renderiza avatar inicial y nombre si el usuario no tiene avatarUrl', () => {
    authService.getUser.mockReturnValue({ username: 'Juan Perez' });
    render(<UserProfile {...defaultProps} />);
    
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('Juan')).toBeInTheDocument();
  });

  test('renderiza imagen si el usuario tiene avatarUrl', () => {
    authService.getUser.mockReturnValue({ username: 'Maria', avatarUrl: 'http://example.com/avatar.jpg' });
    render(<UserProfile {...defaultProps} />);
    
    const img = screen.getByAltText('Maria');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'http://example.com/avatar.jpg');
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });

  test('solo renderiza el avatar en modo compact', () => {
    authService.getUser.mockReturnValue({ username: 'Carlos', avatarUrl: '' });
    render(<UserProfile {...defaultProps} compact={true} />);
    
    expect(screen.getByText('C')).toBeInTheDocument();
    // No debe estar el nombre visible en la clase user-name
    const nameSpan = document.querySelector('.user-name');
    expect(nameSpan).toBeNull();
  });

  test('abre y cierra el modal de perfil al interactuar', () => {
    authService.getUser.mockReturnValue({ username: 'Ana' });
    render(<UserProfile {...defaultProps} />);
    
    const profileDiv = document.querySelector('.user-profile');
    
    // Abrir modal
    fireEvent.click(profileDiv);
    expect(screen.getByTestId('user-profile-modal')).toBeInTheDocument();
    
    // Cerrar modal interno (usando mock)
    const closeBtn = screen.getByText('Close Modal');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('user-profile-modal')).not.toBeInTheDocument();
  });

  test('vuelve a obtener datos si se dispara userProfileUpdated globalmente', () => {
    authService.getUser.mockReturnValue({ username: 'Inicial', avatarUrl: '' });
    render(<UserProfile {...defaultProps} />);
    expect(screen.getByText('Inicial')).toBeInTheDocument();
    
    // Simular evento con nuevos datos
    const event = new Event('userProfileUpdated');
    act(() => {
      authService.getUser.mockReturnValue({ username: 'Actualizado', avatarUrl: '' });
      window.dispatchEvent(event);
    });
    
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});