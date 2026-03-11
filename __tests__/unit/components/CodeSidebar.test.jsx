import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CodeSidebar from '../../../src/components/CodeSidebar';

// Mock JSZip
vi.mock('jszip', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            file: vi.fn(),
            generateAsync: vi.fn().mockResolvedValue('mock-zip-content')
        }))
    }
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();
const originalCreateElement = document.createElement.bind(document);
global.document.createElement = vi.fn().mockImplementation((tag) => {
    if (tag === 'a') {
        return {
            href: '',
            download: '',
            click: vi.fn(),
            style: {}
        }
    }
    return originalCreateElement(tag);
});

// Mock CodeModal
vi.mock('../../../src/components/CodeModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="code-modal">
      <button onClick={onClose}>Mock Cerrar</button>
    </div>
  )
}));

describe('CodeSidebar Component', () => {
    const mockCodeRequests = [
        {
            userMessage: 'Show me python',
            codes: [
                {
                    content: 'print("hello world")',
                    language: 'python'
                }
            ]
        }
    ];

    it('renders null when there are no code requests', () => {
        const { container } = render(<CodeSidebar codeRequests={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders sidebar when there are code requests', () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        
        expect(screen.getByLabelText('Abrir panel')).toBeInTheDocument();
        
        expect(screen.getByText('python')).toBeInTheDocument();
        expect(screen.getByText(/print\("hello world"\)/)).toBeInTheDocument();
    });

    it('toggles sidebar on click', () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        const toggleButton = screen.getByLabelText('Abrir panel');
        
        fireEvent.click(toggleButton);
        expect(toggleButton).toHaveAttribute('aria-label', 'Cerrar panel');
        
        fireEvent.click(toggleButton);
        expect(toggleButton).toHaveAttribute('aria-label', 'Abrir panel');
    });

    it('opens code modal on code item click', () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        
        const codeItem = screen.getByText(/print\("hello world"\)/);
        fireEvent.click(codeItem);
        
        expect(screen.getByTestId('code-modal')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Mock Cerrar'));
        expect(screen.queryByTestId('code-modal')).not.toBeInTheDocument();
    });
});