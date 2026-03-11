import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatMessage from '../../../src/components/ChatMessage';

// Mocks
vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>
}));

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language }) => (
    <pre data-testid={`syntax-highlighter-${language}`}>
      {children}
    </pre>
  )
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn())
}));

describe('ChatMessage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });
    });

    it('renders user message', () => {
        render(<ChatMessage message="Hello AI" isUser={true} />);
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
    });

    it('renders ai message with markdown', () => {
        render(<ChatMessage message="Hello User" isUser={false} />);
        expect(screen.getByTestId('markdown')).toHaveTextContent('Hello User');
    });

    it('renders loading dots when isLoading', () => {
        const { container } = render(<ChatMessage message="" isUser={false} isLoading={true} />);
        expect(container.querySelector('.loading-dots')).toBeInTheDocument();
    });

    it('renders error message', () => {
        const { container } = render(<ChatMessage message="Error!" isUser={false} isError={true} />);
        expect(container.querySelector('.error-message')).toBeInTheDocument();
        expect(screen.getByTestId('markdown')).toHaveTextContent('Error!');
    });

    it('renders code blocks correctly', () => {
        const codeMessage = '```javascript\nconst a = 1;\n```';
        render(<ChatMessage message={codeMessage} isUser={false} />);
        expect(screen.getByTestId('syntax-highlighter-javascript')).toHaveTextContent('const a = 1;');
    });

    it('copies code to clipboard', async () => {
        const codeMessage = '```javascript\nconst a = 1;\n```';
        render(<ChatMessage message={codeMessage} isUser={false} />);
        
        const copyBtn = screen.getByRole('button', { name: /Copiar código/i });
        fireEvent.click(copyBtn);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const a = 1;');
            expect(screen.getByText('¡Copiado!')).toBeInTheDocument();
        });
    });

    it('splits message and code blocks correctly', () => {
        const message = 'Here is code:\n```python\nprint("hi")\n```\nAnd more text.';
        render(<ChatMessage message={message} isUser={false} />);
        
        const texts = screen.getAllByTestId('markdown');
        expect(texts[0]).toHaveTextContent('Here is code:');
        expect(texts[1]).toHaveTextContent('And more text.');
        expect(screen.getByTestId('syntax-highlighter-python')).toHaveTextContent('print("hi")');
    });

    it('renders images for user message', () => {
        const images = [{ url: 'test.jpg' }];
        const { container } = render(<ChatMessage message="Look!" isUser={true} images={images} />);
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('src', 'test.jpg');
    });
});
