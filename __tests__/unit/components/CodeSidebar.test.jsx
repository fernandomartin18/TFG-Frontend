import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CodeSidebar from '../../../src/components/CodeSidebar';
import JSZip from 'jszip';

// Mock JSZip
vi.mock('jszip', () => {
    return {
        default: class MockJSZip {
            file = vi.fn()
            generateAsync = vi.fn().mockResolvedValue(new Blob(['mock-zip'], { type: 'application/zip' }))
        }
    }
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');

// Spy on link click and dom methods to avoid strict DOM nesting errors in jsdom
beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
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
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCodeRequests = [
        {
            userMessage: 'Show me python',
            codes: [
                {
                    content: 'print("hello world")',
                    language: 'python'
                }
            ]
        },
        {
            userMessage: 'html css js with description',
            codes: [
                { content: '/* File: test_file.js */\nconsole.log(1);', language: 'javascript' },
                { content: 'public class User { }', language: 'java' },
                { content: '<title>   My Test HTML   </title>\n<body id="main-body">', language: 'html' },
                { content: '/* styles.css */\n.main-class { }\n#id-test { }', language: 'css' },
                { content: 'export default function App() {}', language: 'javascript' },
                { content: 'class Admin:\n  pass', language: 'python' },
                { content: 'def test_func():\n  pass', language: 'python' },
                { content: 'class Vector {}', language: 'cpp' },
                { content: 'int calculate() {}', language: 'cpp' },
                { content: 'typedef struct Data {}', language: 'c' },
                { content: '// Purpose: Main App Component', language: 'javascript' },
                { content: '<div>\n  React Component\n</div>', language: 'jsx' }
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
        expect(screen.getAllByText('python').length).toBeGreaterThan(0);
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
        
        // Open the sidebar first to make sure click events are normal
        fireEvent.click(screen.getByLabelText('Abrir panel'));
        
        const codeItem = screen.getByText(/print\("hello world"\)/);
        fireEvent.click(codeItem);
        
        expect(screen.getByTestId('code-modal')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Mock Cerrar'));
        expect(screen.queryByTestId('code-modal')).not.toBeInTheDocument();
    });

    it('downloads single code file', async () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        fireEvent.click(screen.getByLabelText('Abrir panel'));
        
        // click download on a single code item
        const downloadBtns = document.querySelectorAll('.download-code-button');
        fireEvent.click(downloadBtns[0]);
        
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('downloads all codes in a request', async () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        fireEvent.click(screen.getByLabelText('Abrir panel'));
        
        const downloadAllBtns = document.querySelectorAll('.download-all-button');
        fireEvent.click(downloadAllBtns[1]); // the second request has multiple codes
        
        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });
    });

    it('handles generic file paths correctly', () => {
        const customRequests = [{
            userMessage: 'dame un componente ahora',
            codes: [
                { content: '<div></div>', language: 'jsx' }
            ]
        }];
        render(<CodeSidebar codeRequests={customRequests} />);
        expect(screen.getByLabelText('Abrir panel')).toBeInTheDocument();
    });

    it('handles various title generation logics and class matchers', () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        expect(screen.getByText(/My Test Html/i)).toBeInTheDocument();
        expect(screen.getByText(/styles/i)).toBeInTheDocument();
    });
});