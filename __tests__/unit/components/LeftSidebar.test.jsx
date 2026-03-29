import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LeftSidebar from '../../../src/components/LeftSidebar';
import chatService from '../../../src/services/chat.service';
import authService from '../../../src/services/auth.service';

vi.mock('../../../src/services/chat.service', () => {
  return {
    default: {
      getUserChats: vi.fn(),
      getUserProjects: vi.fn(),
      createProject: vi.fn(),
      updateProjectName: vi.fn(),
      toggleProjectExpanded: vi.fn(),
      deleteProject: vi.fn(),
      createChat: vi.fn(),
      addChatToProject: vi.fn(),
      removeChatFromProject: vi.fn(),
      updateChatTitle: vi.fn(),
      togglePinChat: vi.fn(),
      deleteChat: vi.fn()
    }
  };
});
vi.mock('../../../src/services/auth.service');

// Mock components to avoid complexities
vi.mock('../../../src/components/UserProfile', () => ({
  default: () => <div data-testid="user-profile">UserProfile</div>
}));
vi.mock('../../../src/components/ChatOptionsMenu', () => ({
  default: ({ onEdit, onTogglePin, onDelete, onAddToProject, onRemoveFromProject }) => (
    <div data-testid="chat-options-menu">
      <button onClick={() => onEdit(1, 'New Title')}>Edit Chat</button>
      <button onClick={() => onTogglePin(1, true)}>Toggle Pin</button>
      <button onClick={() => onDelete(1)}>Delete Chat</button>
      <button onClick={() => onAddToProject(1, { x: 0, y: 0 })}>Add Project</button>
      <button onClick={() => onRemoveFromProject(1)}>Remove Project</button>
    </div>
  )
}));
vi.mock('../../../src/components/ProjectSelector', () => ({
  default: ({ onSelectProject }) => (
    <div data-testid="project-selector">
      <button onClick={() => onSelectProject(1)}>Select Project 1</button>
      <button onClick={() => onSelectProject(null)}>New Project Option</button>
    </div>
  )
}));
vi.mock('../../../src/components/ProjectModal', () => ({
  default: ({ onSave, onClose }) => (
    <div data-testid="project-modal">
      <button onClick={() => onSave('My New Project')}>Save Project</button>
      <button onClick={onClose}>Close Project</button>
    </div>
  )
}));

const mockProps = {
  isOpen: true,
  setIsOpen: vi.fn(),
  isAuthenticated: true,
  isDarkTheme: false,
  onToggleTheme: vi.fn(),
  onChatSelect: vi.fn(),
  currentChatId: 1,
  onNewChat: vi.fn(),
  hasMessages: false,
  isLoading: false
};

const mockChats = [
  { id: 1, title: 'Chat 1', project_id: null, pinned: false, updated_at: new Date().toISOString() },
  { id: 2, title: 'Chat 2', project_id: 1, pinned: true, updated_at: new Date(Date.now() - 86400000).toISOString() }
];

const mockProjects = [
  { id: 1, name: 'Project 1', color: '#ff0000', isExpanded: true, chats: [{ id: 2, title: 'Chat 2' }] }
];

describe('LeftSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatService.getUserChats.mockResolvedValue(mockChats);
    chatService.getUserProjects.mockResolvedValue(mockProjects);
    authService.getUser.mockReturnValue({ username: 'testuser' });
  });

  const renderComponent = (props = mockProps, ref = null) => {
    return render(
      <BrowserRouter>
        <LeftSidebar {...props} ref={ref} />
      </BrowserRouter>
    );
  };

  it('renders correctly and loads chats', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });
  });

  it('handles new chat click', async () => {
    const props = { ...mockProps, hasMessages: true };
    renderComponent(props);
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });
    
    // Test the normal new chat button
    const buttons = screen.getAllByRole('button', { name: /Crear nuevo chat/i });
    fireEvent.click(buttons[0]);
    expect(props.onNewChat).toHaveBeenCalled();
  });

  it('handles search input', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });
    
    // Toggle search open
    const searchBtn = screen.getByRole('button', { name: "Buscar chats" });
    fireEvent.click(searchBtn);
    
    // Type in search
    const input = screen.getByPlaceholderText('Buscar por título o fecha');
    fireEvent.change(input, { target: { value: 'Chat 1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });

    // Date search formats
    fireEvent.change(input, { target: { value: '01/01/2023' } });
    fireEvent.change(input, { target: { value: 'ayer' } });
    fireEvent.change(input, { target: { value: 'hoy' } });
  });

  it('handles chat list interactions', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });
    
    // Click on chat
    const chatElement = screen.getByText('Chat 1').closest('.chat-item');
    fireEvent.click(chatElement);
    expect(mockProps.onChatSelect).toHaveBeenCalledWith(1);
  });

  it('handles chat options from ChatOptionsMenu', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('chat-options-menu')).toBeInTheDocument();
    });
    
    chatService.updateChatTitle.mockResolvedValue({});
    chatService.togglePinChat.mockResolvedValue({});
    chatService.deleteChat.mockResolvedValue({});
    chatService.addChatToProject.mockResolvedValue({});
    chatService.removeChatFromProject.mockResolvedValue({});

    fireEvent.click(screen.getByText('Edit Chat'));
    fireEvent.click(screen.getByText('Toggle Pin'));
    fireEvent.click(screen.getByText('Delete Chat')); // Should trigger loadChats and if currentChat eq, navigates
    fireEvent.click(screen.getByText('Add Project')); // shows project selector
    fireEvent.click(screen.getByText('Remove Project')); // calls remove

    await waitFor(() => {
      expect(chatService.updateChatTitle).toHaveBeenCalledWith(1, 'New Title');
      expect(chatService.togglePinChat).toHaveBeenCalledWith(1, true);
      expect(chatService.deleteChat).toHaveBeenCalledWith(1);
    });
  });

  it('handles Project Selector actions', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('chat-options-menu')).toBeInTheDocument();
    });
    
    // Open selector
    fireEvent.click(screen.getByText('Add Project'));
    
    await waitFor(() => {
      expect(screen.getByTestId('project-selector')).toBeInTheDocument();
    });

    // Select existing project
    chatService.addChatToProject.mockResolvedValue({});
    fireEvent.click(screen.getByText('Select Project 1'));
    await waitFor(() => {
      expect(chatService.addChatToProject).toHaveBeenCalled();
    });

    // Select new project option
    fireEvent.click(screen.getByText('Add Project')); // reopen
    await waitFor(() => {
      expect(screen.getByText('New Project Option')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Project Option'));
    
    // Wait for project modal
    await waitFor(() => {
      expect(screen.getByTestId('project-modal')).toBeInTheDocument();
    });
  });

  it('handles Project Modal save (Create and Edit)', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });
    
    // trigger a "create" modal by clicking + button near Proyectos
    const createProjectBtn = screen.getByRole('button', { name: "Nuevo proyecto" });
    fireEvent.click(createProjectBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('project-modal')).toBeInTheDocument();
    });

    chatService.createProject.mockResolvedValue({ id: 99, name: 'My New Project' });
    fireEvent.click(screen.getByText('Save Project'));
    
    await waitFor(() => {
      expect(chatService.createProject).toHaveBeenCalledWith('My New Project');
    });
  });

  it('handles project interactions (toggle, context menu)', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    const projectBlock = screen.getByText('Project 1').closest('.project-header');
    
    // Toggle expand
    chatService.toggleProjectExpanded.mockResolvedValue();
    fireEvent.click(projectBlock);
    await waitFor(() => {
      expect(chatService.toggleProjectExpanded).toHaveBeenCalled(); // sets isExpanded
    });

    // Context menu
    fireEvent.contextMenu(projectBlock);
    expect(screen.getByText('Editar título')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();

    // Click Edit
    fireEvent.click(screen.getByText('Editar título'));
    await waitFor(() => {
      expect(screen.getByTestId('project-modal')).toBeInTheDocument();
    });
    // save the edit
    chatService.updateProjectName.mockResolvedValue({});
    fireEvent.click(screen.getByText('Save Project'));

    // Open context menu again
    fireEvent.contextMenu(projectBlock);
    // Delete Project
    chatService.deleteProject.mockResolvedValue({});
    fireEvent.click(screen.getByText('Eliminar'));
    await waitFor(() => {
      expect(chatService.deleteProject).toHaveBeenCalledWith(1);
    });
  });

  it('handles new chat within project from context menu', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    const projectBlock = screen.getByText('Project 1').closest('.project-header');
    fireEvent.contextMenu(projectBlock);

    chatService.createChat.mockResolvedValue({ id: 100 });
    chatService.addChatToProject.mockResolvedValue();
    fireEvent.click(screen.getByText('Nuevo chat en proyecto'));

    await waitFor(() => {
      expect(chatService.createChat).toHaveBeenCalledWith('Nuevo Chat');
      expect(chatService.addChatToProject).toHaveBeenCalledWith(100, 1);
    });
  });

  it('handles imperative refreshChats', async () => {
    const ref = { current: null };
    renderComponent(mockProps, ref);
    await waitFor(() => {
      expect(screen.getByText('Chat 1')).toBeInTheDocument();
    });

    // Clear calls
    chatService.getUserChats.mockClear();
    chatService.getUserProjects.mockClear();

    // Trigger
    act(() => {
      ref.current.refreshChats();
    });

    expect(chatService.getUserChats).toHaveBeenCalled();
    expect(chatService.getUserProjects).toHaveBeenCalled();
  });
});