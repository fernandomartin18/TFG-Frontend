import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatMessage from '../../../src/components/ChatMessage';
import { MemoryRouter } from 'react-router-dom';

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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('ChatMessage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });
        
        // Mock matchMedia for document theme
        document.documentElement.setAttribute('data-theme', 'light');
    });

    it('renders user message', () => {
        render(<MemoryRouter><ChatMessage message="Hello AI" isUser={true} /></MemoryRouter>);
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
    });

    it('renders ai message with markdown', () => {
        render(<MemoryRouter><ChatMessage message="Hello User" isUser={false} /></MemoryRouter>);
        expect(screen.getByTestId('markdown')).toHaveTextContent('Hello User');
    });

    it('renders loading dots when isLoading', () => {
        const { container } = render(<MemoryRouter><ChatMessage message="" isUser={false} isLoading={true} /></MemoryRouter>);
        expect(container.querySelector('.loading-dots')).toBeInTheDocument();
    });

    it('renders error message', () => {
        const { container } = render(<MemoryRouter><ChatMessage message="Error!" isUser={false} isError={true} /></MemoryRouter>);
        expect(container.querySelector('.error-message')).toBeInTheDocument();
        expect(screen.getByTestId('markdown')).toHaveTextContent('Error!');
    });

    it('renders code blocks correctly', () => {
        const codeMessage = '```javascript\nconst a = 1;\n```';
        render(<MemoryRouter><ChatMessage message={codeMessage} isUser={false} /></MemoryRouter>);
        expect(screen.getByTestId('syntax-highlighter-javascript')).toHaveTextContent('const a = 1;');
    });

    it('copies code to clipboard', async () => {
        const codeMessage = '```javascript\nconst a = 1;\n```';
        render(<MemoryRouter><ChatMessage message={codeMessage} isUser={false} /></MemoryRouter>);
        
        const copyBtn = screen.getByRole('button', { name: /Copiar código/i });
        fireEvent.click(copyBtn);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const a = 1;');
        });
    });

    it('splits message and code blocks correctly', () => {
        const message = 'Here is code:\n```python\nprint("hi")\n```\nAnd more text.';
        render(<MemoryRouter><ChatMessage message={message} isUser={false} /></MemoryRouter>);
        
        const texts = screen.getAllByTestId('markdown');
        expect(texts[0]).toHaveTextContent('Here is code:');
        expect(texts[1]).toHaveTextContent('And more text.');
        expect(screen.getByTestId('syntax-highlighter-python')).toHaveTextContent('print("hi")');
    });

    it('renders images for user message and handles modal interaction', () => {
        const images = [{ url: 'test.jpg' }];
        const { container } = render(<MemoryRouter><ChatMessage message="Look!" isUser={true} images={images} /></MemoryRouter>);
        const img = container.querySelector('img.image-preview');
        expect(img).toHaveAttribute('src', 'test.jpg');

        const btn = container.querySelector('.image-preview-button');
        fireEvent.click(btn);
        
        // Modal is open
        expect(document.querySelector('.image-modal')).not.toBeNull();
        
        // Close modal
        const closeBtn = document.querySelector('.modal-close');
        if (closeBtn) fireEvent.click(closeBtn);
    });

    it('renders image dropdown for multiple images', () => {
        const images = [{ url: 'test1.jpg', name: 'img1.jpg' }, { url: 'test2.jpg', name: 'img2.jpg' }];
        const { container } = render(<MemoryRouter><ChatMessage message="Look!" isUser={true} images={images} /></MemoryRouter>);
        
        const btn = container.querySelector('.image-preview-button');
        fireEvent.click(btn);
        
        const dropdown = container.querySelector('.image-dropdown');
        expect(dropdown).toBeInTheDocument();
        
        // Click on an image inside the dropdown
        const dropdownImage = container.querySelector('.image-dropdown-preview-btn');
        fireEvent.click(dropdownImage); 
        
        expect(document.querySelector('.image-modal')).not.toBeNull();
    });

    it('renders two-step PlantUML section, toggles collapse, and edits code', () => {
        const step1Code = '```plantuml\n@startuml\n@enduml\n```';
        const { container } = render(
            <MemoryRouter>
                <ChatMessage message="" isUser={false} isTwoStep={true} currentStep={1} step1Text={step1Code} chatId={123} />
            </MemoryRouter>
        );
        
        expect(screen.getByText('Generando PlantUML')).toBeInTheDocument();
        
        const header = container.querySelector('.plantuml-header');
        fireEvent.click(header); // expand
        expect(screen.getByTestId('syntax-highlighter-plantuml')).toHaveTextContent('@startuml @enduml');
        
        // Keydown toggle
        fireEvent.keyDown(header, { key: 'Enter', code: 'Enter' });
        
        // Expand again and test edit
        fireEvent.click(header); 
        const editBtn = screen.getByTitle('Editar PlantUML');
        fireEvent.click(editBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/editor', { state: { code: '@startuml\n@enduml', chatId: 123 } });
    });

    it('renders two-step step 2 correctly', () => {
        const step1Text = 'Some setup';
        const step2Text = 'Final answer is here\n```python\nx=1\n```';
        render(
            <MemoryRouter>
                <ChatMessage message="" isUser={false} isTwoStep={true} currentStep={2} step1Text={step1Text} step2Text={step2Text} />
            </MemoryRouter>
        );
        
        expect(screen.getByText('Final answer is here')).toBeInTheDocument();
        expect(screen.getByTestId('syntax-highlighter-python')).toHaveTextContent('x=1');
    });

    it('renders LoadingDots in PlantUML section when currentStep is 1 but step1Text is empty', () => {
        const { container } = render(<MemoryRouter><ChatMessage message="" isUser={false} isTwoStep={true} currentStep={1} step1Text="" /></MemoryRouter>);
        const header = container.querySelector('.plantuml-header');
        fireEvent.click(header);
        expect(container.querySelector('.loading-dots')).toBeInTheDocument();
    });

    it('renders LoadingDots in step 2 when currentStep is 2 but step2Text is empty', () => {
        const { container } = render(<MemoryRouter><ChatMessage message="" isUser={false} isTwoStep={true} currentStep={2} step1Text="OK" step2Text="" /></MemoryRouter>);
        expect(container.querySelector('.final-response .loading-dots')).toBeInTheDocument();
    });

    it('renders incomplete code block without crash', () => {
        const codeMessage = '```javascript\nconst a = 1;';
        render(<MemoryRouter><ChatMessage message={codeMessage} isUser={false} /></MemoryRouter>);
        expect(screen.getByTestId('syntax-highlighter-javascript')).toHaveTextContent('const a = 1;▊');
    });
});

