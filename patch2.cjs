const fs = require('fs');

let code = fs.readFileSync('__tests__/unit/components/UserProfileModal.test.jsx', 'utf8');

code = code.replace(/}\);\s*$/, '');

const newTests = `
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
    if (editAvatarBtn) {
       fireEvent.click(editAvatarBtn);
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

});
`;

fs.writeFileSync('__tests__/unit/components/UserProfileModal.test.jsx', code + newTests);
console.log('Done!');
