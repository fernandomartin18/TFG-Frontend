import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatOptionsMenu from '../../../src/components/ChatOptionsMenu';

describe('ChatOptionsMenu Component', () => {
    let mockChat;
    const mockOnEdit = vi.fn();
    const mockOnTogglePin = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnAddToProject = vi.fn();
    const mockOnRemoveFromProject = vi.fn();

    const defaultProps = {
        onEdit: mockOnEdit,
        onTogglePin: mockOnTogglePin,
        onDelete: mockOnDelete,
        onAddToProject: mockOnAddToProject,
        onRemoveFromProject: mockOnRemoveFromProject,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockChat = {
            id: 1,
            title: 'Test Chat',
            pinned: false,
            project_id: null
        };
    });

    it('renders options button', () => {
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        expect(screen.getByLabelText('Opciones del chat')).toBeInTheDocument();
    });

    it('toggles menu on click', () => {
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        const button = screen.getByLabelText('Opciones del chat');
        
        fireEvent.click(button);
        expect(screen.getByText('Fijar')).toBeInTheDocument();
        expect(screen.getByText('Añadir a proyecto')).toBeInTheDocument();
        expect(screen.getByText('Editar título')).toBeInTheDocument();
        expect(screen.getByText('Eliminar')).toBeInTheDocument();

        fireEvent.click(button);
        expect(screen.queryByText('Fijar')).not.toBeInTheDocument();
    });

    it('handles Pin/Unpin click', async () => {
        const { rerender } = render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        
        // Open menu
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        
        // Click Pin
        fireEvent.click(screen.getByText('Fijar'));
        expect(mockOnTogglePin).toHaveBeenCalledWith(1, true);

        await waitFor(() => {
            expect(screen.queryByText('Fijar')).not.toBeInTheDocument();
        });

        // Update mock to be pinned
        mockChat.pinned = true;
        rerender(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);

        // Open menu
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        
        // Click Unpin
        fireEvent.click(screen.getByText('Desfijar'));
        expect(mockOnTogglePin).toHaveBeenCalledWith(1, false);
    });

    it('handles Add To Project workflow', () => {
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        
        fireEvent.click(screen.getByText('Añadir a proyecto'));
        expect(mockOnAddToProject).toHaveBeenCalled();
    });

    it('handles Remove From Project workflow', () => {
        mockChat.project_id = 99;
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        
        fireEvent.click(screen.getByText('Retirar de proyecto'));
        expect(mockOnRemoveFromProject).toHaveBeenCalledWith(1);
    });

    it('handles Delete workflow with cancel', () => {
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        
        // Click Delete
        fireEvent.click(screen.getByText('Eliminar'));
        expect(screen.getByText('¿Eliminar este chat?')).toBeInTheDocument();
        
        // Click Cancel
        fireEvent.click(screen.getByText('Cancelar'));
        expect(screen.queryByText('¿Eliminar este chat?')).not.toBeInTheDocument();
        // Menu should still be open
        expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });

    it('handles Delete workflow with confirm', () => {
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        
        // Click Delete
        fireEvent.click(screen.getByText('Eliminar'));
        
        // Click Confirm
        fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
        expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    it('handles Edit workflow', () => {
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        
        // Click Edit
        fireEvent.click(screen.getByText('Editar título'));
        
        // Check if input is rendered
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('Test Chat');
        
        // Change value
        fireEvent.change(input, { target: { value: 'New Title' } });
        
        // Press Enter to save
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(mockOnEdit).toHaveBeenCalledWith(1, 'New Title');
    });

    it('closes menu when clicking outside', () => {
        render(<ChatOptionsMenu {...defaultProps} chat={mockChat} />);
        
        fireEvent.click(screen.getByLabelText('Opciones del chat'));
        expect(screen.getByText('Eliminar')).toBeInTheDocument();
        
        // Click outside
        fireEvent.mouseDown(document.body);
        expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
    });
});