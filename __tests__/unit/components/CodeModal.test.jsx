import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CodeModal from '../../../src/components/CodeModal';

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <pre data-testid="syntax-highlighter">{children}</pre>
}));

describe('CodeModal Component', () => {
  const mockCode = 'const x = 1;';
  const mockLanguage = 'javascript';
  const mockOnClose = vi.fn();
  const mockOnDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders the code modal with correctly', () => {
    render(
      <CodeModal
        code={mockCode}
        language={mockLanguage}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByTestId('syntax-highlighter')).toHaveTextContent(mockCode);
    expect(screen.getByText(mockLanguage)).toBeInTheDocument();
  });

  it('calls onDownload when download button is clicked', () => {
    render(
      <CodeModal
        code={mockCode}
        language={mockLanguage}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const downloadButton = screen.getByTitle('Descargar código');
    fireEvent.click(downloadButton);
    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <CodeModal
        code={mockCode}
        language={mockLanguage}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const closeButton = screen.getByTitle('Cerrar');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('copies code to clipboard', async () => {
    render(
      <CodeModal
        code={mockCode}
        language={mockLanguage}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const copyButton = screen.getByTitle('Copiar código');
    fireEvent.click(copyButton);

    await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockCode);
        expect(screen.getByText(/Copiado!/i)).toBeInTheDocument();
    });
  });

  it('closes modal on backdrop click', () => {
      const { container } = render(
          <CodeModal
              code={mockCode}
              language={mockLanguage}
              onClose={mockOnClose}
              onDownload={mockOnDownload}
          />
      );
      
      const backdrop = container.querySelector('.code-modal-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('does not close modal on container click', () => {
      const { container } = render(
          <CodeModal
              code={mockCode}
              language={mockLanguage}
              onClose={mockOnClose}
              onDownload={mockOnDownload}
          />
      );
      
      const modalContainer = container.querySelector('.code-modal-container');
      fireEvent.click(modalContainer);

      expect(mockOnClose).not.toHaveBeenCalled();
  });
});
