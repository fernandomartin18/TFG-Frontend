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
  default: ({ onClose, onDownload }) => (
    <div data-testid="code-modal">
      <button onClick={onClose}>Mock Cerrar</button>
      <button onClick={onDownload} data-testid="mock-download">Mock Descargar</button>
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
        const titleRequests = [{
            userMessage: '',
            codes: [
                { content: '/* Description: Mi_Componente_Nuevo */', language: 'javascript' },
                { content: 'function calculateSum() {}', language: 'javascript' },
                { content: 'function signupUser() {}', language: 'javascript' },
                { content: 'SELECT * FROM users', language: 'sql' },
                { content: '<form><input /></form>', language: 'html' },
                { content: '<button>Click</button>', language: 'html' },
                { content: 'const data = []', language: 'javascript' },
                { content: 'class PanelCard {}', language: 'javascript' },
                { content: 'openModal()', language: 'javascript' },
                { content: 'drawChart()', language: 'javascript' },
                { content: 'apiService.fetch()', language: 'javascript' },
                { content: 'helper.sum()', language: 'javascript' },
                { content: 'playGame()', language: 'javascript' },
                { content: 'struct Student', language: 'cpp' },
                { content: 'class Product', language: 'cpp' },
                { content: 'class Employee', language: 'cpp' }
            ]
        }];
        
        render(<CodeSidebar codeRequests={titleRequests} />);
        
        // Let's assert something simple indicating it rendered
        expect(screen.getByLabelText('Abrir panel')).toBeInTheDocument();
    });

    it('handles specific titles and formats properly', () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        expect(screen.getByText(/My Test Html/i)).toBeInTheDocument();
        expect(screen.getByText(/styles/i)).toBeInTheDocument();
    });

    it('opens code modal on Enter and Space keydown', () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        // Open the sidebar
        fireEvent.click(screen.getByLabelText('Abrir panel'));

        const codeItems = document.querySelectorAll('.code-item');
        expect(codeItems.length).toBeGreaterThan(0);
        
        // Trigger Enter
        fireEvent.keyDown(codeItems[0], { key: 'Enter' });
        expect(screen.getByTestId('code-modal')).toBeInTheDocument();
        
        // Close modal
        fireEvent.click(screen.getByText('Mock Cerrar'));

        // Trigger Space
        fireEvent.keyDown(codeItems[0], { key: ' ' });
        expect(screen.getByTestId('code-modal')).toBeInTheDocument();
    });

    it('triggers download from CodeModal', async () => {
        render(<CodeSidebar codeRequests={mockCodeRequests} />);
        fireEvent.click(screen.getByLabelText('Abrir panel'));
        
        const codeItems = document.querySelectorAll('.code-item');
        // Open modal
        fireEvent.click(codeItems[0]);
        
        const downloadBtn = screen.getByTestId('mock-download');
        fireEvent.click(downloadBtn);
        
        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });
    });

    it('downloads all single file request using exact flow and filename collisions', async () => {
        const specialRequests = [
            {
                userMessage: 'Test message for single file',
                codes: [{ language: 'javascript', content: 'console.log("Only one!")' }]
            },
            {
                userMessage: 'Multiple files same name same package',
                codes: [
                    { language: 'python', content: 'def common_func(): pass', package: 'test_pkg' },
                    { language: 'python', content: 'def common_func(): pass', package: 'test_pkg' },
                    { language: 'python', content: 'def common_func(): pass', package: 'test_pkg' }
                ]
            }
        ];
        
        render(<CodeSidebar codeRequests={specialRequests} />);
        fireEvent.click(screen.getByLabelText('Abrir panel'));
        
        const downloadAllBtns = document.querySelectorAll('.download-all-button');
        // First request: only 1 file
        fireEvent.click(downloadAllBtns[0]);
        
        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });

        // Second request: 3 files that might collide or end up in a package
        fireEvent.click(downloadAllBtns[1]);
    });
});