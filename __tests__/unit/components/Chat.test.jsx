import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Chat from '../../../src/components/Chat';

import chatService from '../../../src/services/chat.service';
import authService from '../../../src/services/auth.service';

vi.mock('../../../src/services/chat.service');
vi.mock('../../../src/services/auth.service');


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '123' }),
    useLocation: () => ({ pathname: '/chat/123' }),
    useNavigate: () => vi.fn()
  };
});

describe('Chat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    }));

    authService.getCurrentUser = vi.fn().mockReturnValue({ username: 'testuser' });
    authService.getUser = vi.fn().mockReturnValue({ username: 'testuser' });

    chatService.getChat = vi.fn().mockResolvedValue({ id: 123, title: 'Chat Test' });
    chatService.getMessages = vi.fn().mockResolvedValue([
      { id: 1, role: 'user', content: 'Hello' },
      { id: 2, role: 'assistant', content: 'Hi there' }
    ]);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );
  };

  it('renders empty state initially', () => {
    renderComponent();
    expect(screen.getByText('¿En qué puedo ayudarte hoy?')).toBeInTheDocument();
  });

  it('can open model selector', async () => {
    const { container } = renderComponent();
    
    const modelBtn = screen.getByText('Modelo');
    expect(modelBtn).toBeInTheDocument();
  });
});
