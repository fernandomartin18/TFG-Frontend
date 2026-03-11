import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock de api.service
vi.mock('../../../src/services/api.service.js', () => ({
  fetchWithAuth: vi.fn(),
}));

import chatService from '../../../src/services/chat.service.js';
import { fetchWithAuth } from '../../../src/services/api.service.js';

// Helper: crea un fetchWithAuth mock con respuesta
const mockFetch = (status, body) => {
  fetchWithAuth.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
};

describe('ChatService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── getUserChats ─────────────────────────────────────────────────────────
  describe('getUserChats', () => {
    test('devuelve los chats del usuario', async () => {
      mockFetch(200, { chats: [{ id: 1, title: 'Chat 1' }] });
      const result = await chatService.getUserChats();
      expect(result).toEqual([{ id: 1, title: 'Chat 1' }]);
    });

    test('lanza error si la respuesta no es ok', async () => {
      mockFetch(500, { error: 'Server error' });
      await expect(chatService.getUserChats()).rejects.toThrow('Server error');
    });
  });

  // ─── getChatById ──────────────────────────────────────────────────────────
  describe('getChatById', () => {
    test('devuelve un chat por id', async () => {
      mockFetch(200, { chat: { id: 5, title: 'Mi chat' } });
      const result = await chatService.getChatById(5);
      expect(result).toEqual({ id: 5, title: 'Mi chat' });
      expect(fetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/chats/5'));
    });

    test('lanza error si el chat no existe', async () => {
      mockFetch(404, { error: 'Chat no encontrado' });
      await expect(chatService.getChatById(99)).rejects.toThrow('Chat no encontrado');
    });
  });

  // ─── createChat ───────────────────────────────────────────────────────────
  describe('createChat', () => {
    test('crea un chat con título por defecto', async () => {
      mockFetch(201, { chat: { id: 2, title: 'Nuevo Chat' } });
      const result = await chatService.createChat();
      expect(result).toEqual({ id: 2, title: 'Nuevo Chat' });
    });

    test('crea un chat con título personalizado', async () => {
      mockFetch(201, { chat: { id: 3, title: 'Mi proyecto' } });
      const result = await chatService.createChat('Mi proyecto');
      expect(result.title).toBe('Mi proyecto');
    });

    test('lanza error cuando falla la creación', async () => {
      mockFetch(400, { error: 'Título requerido' });
      await expect(chatService.createChat('')).rejects.toThrow('Título requerido');
    });
  });

  // ─── updateChatTitle ──────────────────────────────────────────────────────
  describe('updateChatTitle', () => {
    test('actualiza el título correctamente', async () => {
      mockFetch(200, { chat: { id: 1, title: 'Nuevo título' } });
      const result = await chatService.updateChatTitle(1, 'Nuevo título');
      expect(result.title).toBe('Nuevo título');
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/chats/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    test('lanza error si falla la actualización', async () => {
      mockFetch(500, { error: 'Error al actualizar chat' });
      await expect(chatService.updateChatTitle(1, 'x')).rejects.toThrow('Error al actualizar chat');
    });
  });

  // ─── deleteChat ───────────────────────────────────────────────────────────
  describe('deleteChat', () => {
    test('elimina un chat correctamente', async () => {
      mockFetch(200, { message: 'Eliminado' });
      const result = await chatService.deleteChat(1);
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/chats/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result.message).toBe('Eliminado');
    });

    test('lanza error si falla la eliminación', async () => {
      mockFetch(404, { error: 'Chat no encontrado' });
      await expect(chatService.deleteChat(99)).rejects.toThrow('Chat no encontrado');
    });
  });

  // ─── togglePinChat ────────────────────────────────────────────────────────
  describe('togglePinChat', () => {
    test('fija un chat correctamente', async () => {
      mockFetch(200, { chat: { id: 1, pinned: true } });
      const result = await chatService.togglePinChat(1, true);
      expect(result.pinned).toBe(true);
    });

    test('lanza error si falla el pin', async () => {
      mockFetch(500, { error: 'Error al fijar/desfijar chat' });
      await expect(chatService.togglePinChat(1, true)).rejects.toThrow();
    });
  });

  // ─── createMessage ────────────────────────────────────────────────────────
  describe('createMessage', () => {
    test('crea un mensaje correctamente', async () => {
      mockFetch(201, { data: { id: 10, content: 'Hola' } });
      const result = await chatService.createMessage(1, 'user', 'Hola');
      expect(result).toEqual({ id: 10, content: 'Hola' });
    });

    test('lanza error si falla la creación del mensaje', async () => {
      mockFetch(400, { error: 'Contenido requerido' });
      await expect(chatService.createMessage(1, 'user', '')).rejects.toThrow('Contenido requerido');
    });
  });

  // ─── getMessages ──────────────────────────────────────────────────────────
  describe('getMessages', () => {
    test('devuelve los mensajes de un chat', async () => {
      const msgs = [{ id: 1, content: 'Hola' }, { id: 2, content: 'Mundo' }];
      mockFetch(200, { messages: msgs });
      const result = await chatService.getMessages(1);
      expect(result).toEqual(msgs);
    });

    test('lanza error si falla la obtención de mensajes', async () => {
      mockFetch(500, { error: 'Error al obtener mensajes' });
      await expect(chatService.getMessages(1)).rejects.toThrow();
    });
  });

  // ─── createCode ───────────────────────────────────────────────────────────
  describe('createCode', () => {
    test('guarda el código correctamente', async () => {
      mockFetch(201, { code: { id: 1, language: 'python' } });
      const result = await chatService.createCode(10, { language: 'python', content: 'print()' });
      expect(result).toEqual({ id: 1, language: 'python' });
    });
  });

  // ─── Proyectos ────────────────────────────────────────────────────────────
  describe('getUserProjects', () => {
    test('devuelve los proyectos del usuario', async () => {
      mockFetch(200, { projects: [{ id: 1, name: 'Proyecto 1' }] });
      const result = await chatService.getUserProjects();
      expect(result.projects).toHaveLength(1);
    });
  });

  describe('createProject', () => {
    test('crea un proyecto correctamente', async () => {
      mockFetch(201, { project: { id: 1, name: 'Nuevo' } });
      const result = await chatService.createProject('Nuevo');
      expect(result.project.name).toBe('Nuevo');
    });

    test('lanza error si falla la creación', async () => {
      mockFetch(400, { error: 'Error al crear proyecto' });
      await expect(chatService.createProject('')).rejects.toThrow();
    });
  });

  describe('updateProjectName', () => {
    test('actualiza el nombre del proyecto', async () => {
      mockFetch(200, { project: { id: 1, name: 'Renombrado' } });
      const result = await chatService.updateProjectName(1, 'Renombrado');
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result.project.name).toBe('Renombrado');
    });
  });

  describe('deleteProject', () => {
    test('elimina un proyecto correctamente', async () => {
      mockFetch(200, { message: 'ok' });
      await chatService.deleteProject(1);
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    test('lanza error si falla la eliminación', async () => {
      mockFetch(404, { error: 'Error al eliminar proyecto' });
      await expect(chatService.deleteProject(99)).rejects.toThrow();
    });
  });

  describe('addChatToProject', () => {
    test('agrega un chat a un proyecto', async () => {
      mockFetch(200, { message: 'ok' });
      await chatService.addChatToProject(1, 2);
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/projects/add-chat'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('removeChatFromProject', () => {
    test('quita un chat de un proyecto', async () => {
      mockFetch(200, { message: 'ok' });
      await chatService.removeChatFromProject(1);
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/projects/remove-chat/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('toggleProjectExpanded', () => {
    test('alterna el estado expandido del proyecto', async () => {
      mockFetch(200, { project: { id: 1, isExpanded: true } });
      const result = await chatService.toggleProjectExpanded(1, true);
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1/toggle-expand'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result.project.isExpanded).toBe(true);
    });
  });
});
