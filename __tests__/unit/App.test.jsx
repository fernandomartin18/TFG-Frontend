import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';
import authService from '../../src/services/auth.service';

vi.mock('../../src/components/Chat', () => ({
  default: ({ isAuthenticated }) => <div data-testid="chat-component">{isAuthenticated ? 'Auth' : 'No Auth'}</div>
}));

vi.mock('../../src/components/Login', () => ({
  default: () => <div data-testid="login-component">Login</div>
}));

vi.mock('../../src/components/Register', () => ({
  default: () => <div data-testid="register-component">Register</div>
}));

vi.mock('../../src/components/PlantUMLEditor', () => ({
  default: () => <div data-testid="editor-component">Editor</div>
}));

vi.mock('../../src/services/auth.service');

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Chat route by default', () => {
    authService.isAuthenticated.mockReturnValue(false);
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('chat-component')).toBeInTheDocument();
    expect(screen.getByText('No Auth')).toBeInTheDocument();
  });

  it('renders Login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-component')).toBeInTheDocument();
  });

  it('renders Register route', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('register-component')).toBeInTheDocument();
  });

  it('renders Editor route', () => {
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('editor-component')).toBeInTheDocument();
  });

  it('updates auth state on authChange event', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('No Auth')).toBeInTheDocument();

    authService.isAuthenticated.mockReturnValue(true);
    await act(async () => {
      window.dispatchEvent(new Event('authChange'));
    });

    expect(screen.getByText('Auth')).toBeInTheDocument();
  });
});