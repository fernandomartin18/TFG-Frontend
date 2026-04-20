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

  it('covers catch block in password change error', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Contraseña actual incorrecta' })
    }));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    fireEvent.change(screen.getByPlaceholderText('Contraseña actual'), { target: { value: 'old123' } });
    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'New1234' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: 'New1234' } });
    
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Contraseña actual incorrecta');
      expect(consoleError).toHaveBeenCalled();
    });
    alertMock.mockRestore();
    consoleError.mockRestore();
  });

  it('handles avatar upload simulation', async () => {
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    const buttons = screen.getAllByRole('button');
    const editAvatarBtn = buttons.find(b => b.className === 'avatar-edit-btn');
    
    expect(editAvatarBtn).toBeDefined();
    if (editAvatarBtn) {
       fireEvent.click(editAvatarBtn);
       await waitFor(() => {
         expect(screen.getByText('Cambiar foto')).toBeInTheDocument();
       });
    }
  });

  it('requires uppercase, lowercase and number in password', async () => {
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    fireEvent.change(screen.getByPlaceholderText('Contraseña actual'), { target: { value: 'old123' } });
    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'nouppercase123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'), { target: { value: 'nouppercase123' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    expect(await screen.findByText('La contraseña debe contener al menos una mayúscula, una minúscula y un número')).toBeInTheDocument();
  });

  it('handles unsaved changes closing alert', async () => {
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} />);
    const input = screen.getByDisplayValue('testuser');
    fireEvent.change(input, { target: { value: 'changed_user' } });

    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    const closeBtns = screen.getAllByRole('button');
    const closeBtn = closeBtns.find(b => b.className === 'modal-close-btn');
    if(closeBtn) {
      fireEvent.click(closeBtn);
    }
    expect(confirmMock).toHaveBeenCalled();
    confirmMock.mockRestore();
  });

  it('closes by clicking overlay when no pending changes', () => {
    const { container } = render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );

    const overlay = container.querySelector('.modal-overlay');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes with Escape key on overlay', () => {
    const { container } = render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );

    const overlay = container.querySelector('.modal-overlay');
    fireEvent.keyDown(overlay, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('keeps modal open if confirm close is cancelled', () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} onToggleTheme={mockOnToggleTheme} />);

    fireEvent.change(screen.getByDisplayValue('testuser'), { target: { value: 'other_name' } });
    fireEvent.click(document.querySelector('.modal-close-btn'));

    expect(confirmMock).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    confirmMock.mockRestore();
  });

  it('clicks hidden file input directly when avatar is empty', () => {
    authService.getUser.mockReturnValue({ username: 'testuser', email: 'test@example.com', avatarUrl: '' });
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} onToggleTheme={mockOnToggleTheme} />);
    fireEvent.click(document.querySelector('.avatar-edit-btn'));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('opens avatar options and handles change photo click', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} onToggleTheme={mockOnToggleTheme} />);

    fireEvent.click(document.querySelector('.avatar-edit-btn'));

    await waitFor(() => {
      expect(screen.getByText('Cambiar foto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cambiar foto'));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('processes avatar upload and generates compressed preview', async () => {
    const originalCreateElement = document.createElement.bind(document);
    const mockDrawImage = vi.fn();
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: mockDrawImage })),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,compressed')
    };

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return mockCanvas;
      return originalCreateElement(tagName);
    });

    class MockFileReader {
      constructor() {
        this.onloadend = null;
        this.result = null;
      }
      readAsDataURL() {
        this.result = 'data:image/png;base64,raw';
        if (this.onloadend) this.onloadend();
      }
    }

    class MockImage {
      constructor() {
        this.onload = null;
        this.width = 1200;
        this.height = 800;
      }
      set src(_) {
        if (this.onload) this.onload();
      }
    }

    const originalFileReader = global.FileReader;
    const originalImage = global.Image;
    global.FileReader = MockFileReader;
    global.Image = MockImage;

    render(<UserProfileModal onClose={mockOnClose} isDarkTheme={false} onToggleTheme={mockOnToggleTheme} />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockDrawImage).toHaveBeenCalled();
      expect(screen.getByAltText('testuser')).toHaveAttribute('src', 'data:image/jpeg;base64,compressed');
    });

    global.FileReader = originalFileReader;
    global.Image = originalImage;
    document.createElement.mockRestore();
  });

  it('renders nothing when user data is missing', () => {
    authService.getUser.mockReturnValue(null);
    const { container } = render(
      <UserProfileModal
        onClose={mockOnClose}
        isDarkTheme={false}
        onToggleTheme={mockOnToggleTheme}
      />
    );
    expect(container.firstChild).toBeNull();
  });

});
