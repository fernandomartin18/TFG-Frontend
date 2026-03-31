const { execSync } = require('child_process');
const fs = require('fs');

execSync('git checkout -- __tests__/unit/components/LeftSidebar.test.jsx');

let code = fs.readFileSync('__tests__/unit/components/LeftSidebar.test.jsx', 'utf8');

code = code.replace(/}\);\s*$/, '');

const newTests = `
  it('handles pinned chat interactions', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Chat 2')).toBeInTheDocument();
    });
    const pinnedChatElement = screen.getByText('Chat 2').closest('.chat-item');
    fireEvent.keyDown(pinnedChatElement, { key: 'Enter' });
    expect(mockProps.onChatSelect).toHaveBeenCalledWith(2);
  });

  it('displays login button when offline', async () => {
    renderComponent({...mockProps, isAuthenticated: false, isOpen: true});
    await waitFor(() => {
      expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
  });

  it('disables interactions when isLoading is true', async () => {
    renderComponent({...mockProps, isLoading: true});
    await waitFor(() => {
      const activeChat = screen.getByText('Chat 1').closest('.chat-item');
      expect(activeChat).toHaveClass('disabled');
    });
  });
});
`;

fs.writeFileSync('__tests__/unit/components/LeftSidebar.test.jsx', code + newTests);
console.log('Done!');
