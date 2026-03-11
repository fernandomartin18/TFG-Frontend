import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserProfileModal from '../../../src/components/UserProfileModal';
import authService from '../../../src/services/auth.service';

vi.mock('../../../src/services/auth.service', () => ({
  default: {
    getUser: vi.fn(),
    getAccessToken: vi.fn(),
    logout: vi.fn(),
    updateUserProfile: vi.fn(),
  }
}));

describe('UserProfileModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnToggleTheme = vi.fn();
  const mockUser = {
    username: 'testuser',
    email: 'test@example.com',
    avatar_url: '/avatar.jpg'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService.getUser.mockReturnValue(mockUser);
    authService.updateUserProfile.mockResolvedValue({});
    authService.getAccessToken.mockReturnValue('mock-token');
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    }));
  });

  it('renders correctly and loads user data', () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    expect(authService.getUser).toHaveBeenCalled();
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
  });

  it('handles theme toggle', () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const themeCheckbox = screen.getByRole('checkbox');
    fireEvent.click(themeCheckbox);
    expect(mockOnToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('handles logout', () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const logoutBtn = screen.getByText('Cerrar sesión');
    fireEvent.click(logoutBtn);
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('does not display save button when there are no changes', () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const saveBtn = screen.queryByText('Guardar cambios');
    expect(saveBtn).not.toBeInTheDocument();
  });

  it('displays save button when username is changed', () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: 'newuser' } });
    
    const saveBtn = screen.getByText('Guardar cambios');
    expect(saveBtn).toBeInTheDocument();
  });

  it('saves profile changes', async () => {
    
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: 'newuser' } });
    
    const saveBtn = screen.getByText('Guardar cambios');
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(authService.updateUserProfile).toHaveBeenCalledWith('newuser', null);
    });
  });

  it('shows error when passwords do not match', async () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const currentPassInput = screen.getByPlaceholderText('Contraseña actual');
    const newPassInput = screen.getByPlaceholderText('Nueva contraseña');
    const confirmPassInput = screen.getByPlaceholderText('Confirmar nueva contraseña');
    
    fireEvent.change(currentPassInput, { target: { value: 'old123' } });
    fireEvent.change(newPassInput, { target: { value: 'New1234' } });
    fireEvent.change(confirmPassInput, { target: { value: 'New4321' } });
    
    const saveBtn = screen.getByText('Guardar cambios');
    fireEvent.click(saveBtn);
    
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });
  
  it('changes password successfully', async () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const currentPassInput = screen.getByPlaceholderText('Contraseña actual');
    const newPassInput = screen.getByPlaceholderText('Nueva contraseña');
    const confirmPassInput = screen.getByPlaceholderText('Confirmar nueva contraseña');
    
    fireEvent.change(currentPassInput, { target: { value: 'old123' } });
    fireEvent.change(newPassInput, { target: { value: 'New1234' } });
    fireEvent.change(confirmPassInput, { target: { value: 'New1234' } });
    
    const saveBtn = screen.getByText('Guardar cambios');
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/users/me/password', expect.any(Object));
    });
  });
});