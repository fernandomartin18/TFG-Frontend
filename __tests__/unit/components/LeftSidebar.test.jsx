import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LeftSidebar from '../../../src/components/LeftSidebar';
import chatService from '../../../src/services/chat.service';
import authService from '../../../src/services/auth.service';

vi.mock('../../../src/services/chat.service');
vi.mock('../../../src/services/auth.service');

const mockProps = {
  isOpen: true,
  setIsOpen: vi.fn(),
  isAuthenticated: true,
  isDarkTheme: false,
  onToggleTheme: vi.fn(),
  onChatSelect: vi.fn(),
  currentChatId: null,
  onNewChat: vi.fn(),
  hasMessages: false,
  isLoading: false
};

const mockChats = [
  { id: 1, title: 'Chat 1', project_id: null, updatedAt: new Date().toISOString() },
  { id: 2, title: 'Chat 2', project_id: null, updatedAt: new Date(Date.now() - 86400000).toISOString() }
];

const mockProjects = [
  { id: 1, name: 'Project 1', color: '#ff0000', chats: [] }
];

describe('LeftSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatService.getUserChats.mockResolvedValue(mockChats);
    chatService.getUserProjects.mockResolvedValue(mockProjects);
    authService.getUser = vi.fn().mockReturnValue({ username: 'testuser' });
  });

  const renderComponent = (props = mockProps) => {
    return render(
      <BrowserRouter>
        <LeftSidebar {...props} />
      </BrowserRouter>
    );
  };

  it('renders correctly and loads chats', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
  });

  it('handles new chat click', async () => {
    const props = { ...mockProps, hasMessages: true };
    renderComponent(props);
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });
    
    // "Nuevo chat" without capital C
    const newChatBtn = screen.getByText('Nuevo chat');
    fireEvent.click(newChatBtn);
    expect(props.onNewChat).toHaveBeenCalled();
  });

});