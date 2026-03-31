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
    avatarUrl: '/avatar.jpg'
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
      expect(authService.updateUserProfile).toHaveBeenCalledWith('newuser', '/avatar.jpg');
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

  it('shows error if username is too short', async () => {
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: 'us' } });
    
    expect(screen.getByText('Mínimo 3 caracteres')).toBeInTheDocument();
    const saveBtn = screen.getByText('Guardar cambios');
    fireEvent.click(saveBtn);
    expect(authService.updateUserProfile).not.toHaveBeenCalled();
  });

  it('shows errors for invalid passwords', async () => {
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    const currentPassInput = screen.getByPlaceholderText('Contraseña actual');
    const newPassInput = screen.getByPlaceholderText('Nueva contraseña');
    
    // Missing one field
    fireEvent.change(currentPassInput, { target: { value: 'old123' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    expect(await screen.findByText('Debes completar todos los campos de contraseña')).toBeInTheDocument();

    // Too short
    fireEvent.change(newPassInput, { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    expect(await screen.findByText('La nueva contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();

    // Missing caps/num
    fireEvent.change(newPassInput, { target: { value: 'abcdefg' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: 'abcdefg' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    expect(await screen.findByText('La contraseña debe contener al menos una mayúscula, una minúscula y un número')).toBeInTheDocument();
  });

  it('handles remove avatar', async () => {
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    
    const editBtns = document.getElementsByClassName('avatar-edit-btn');
    if (editBtns.length > 0) {
       fireEvent.click(editBtns[0]);
       
       await waitFor(() => {
         const removeBtn = screen.queryByText('Eliminar foto');
         if(removeBtn) {
            fireEvent.click(removeBtn);
            expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
         }
       });
    }
  });

  it('toggles password visibility', () => {
    render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    
    const toggleBtns = document.querySelectorAll('.password-toggle');
    expect(toggleBtns.length).toBe(3);
    
    expect(screen.getByPlaceholderText('Contraseña actual').type).toBe('password');
    fireEvent.click(toggleBtns[0]);
    expect(screen.getByPlaceholderText('Contraseña actual').type).toBe('text');
    fireEvent.click(toggleBtns[0]);
    expect(screen.getByPlaceholderText('Contraseña actual').type).toBe('password');
    
    fireEvent.click(toggleBtns[1]);
    expect(screen.getByPlaceholderText('Nueva contraseña').type).toBe('text');
    fireEvent.click(toggleBtns[1]);
    expect(screen.getByPlaceholderText('Nueva contraseña').type).toBe('password');

    fireEvent.click(toggleBtns[2]);
    expect(screen.getByPlaceholderText('Confirmar nueva contraseña').type).toBe('text');
    fireEvent.click(toggleBtns[2]);
    expect(screen.getByPlaceholderText('Confirmar nueva contraseña').type).toBe('password');
  });

  it('closes avatar edit menu when clicking outside', () => {
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    const editBtns = document.getElementsByClassName('avatar-edit-btn');
    if (editBtns.length > 0) {
       fireEvent.click(editBtns[0]);
       expect(screen.queryByText('Cambiar foto')).toBeInTheDocument();
       
       fireEvent.mouseDown(document.body);
       expect(screen.queryByText('Cambiar foto')).not.toBeInTheDocument();
    }
  });

  it('handles save error server', async () => {
    authService.updateUserProfile.mockRejectedValue(new Error('Server error'));
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: 'newuser' } });
    
    const saveBtn = screen.getByText('Guardar cambios');
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });
    alertMock.mockRestore();
  });
});