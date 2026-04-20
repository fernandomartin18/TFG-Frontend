import { fetchWithAuth } from './api.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const plantUmlService = {
  async getTemplates() {
    try {
      const response = await fetchWithAuth(`${API_URL}/plantuml-templates`);
      
      if (!response.ok) {
        throw new Error('Error al obtener plantillas de PlantUML');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching plantuml templates:', error);
      throw error;
    }
  },
  
  async createTemplate(templateData) {
    try {
      const response = await fetchWithAuth(`${API_URL}/plantuml-templates`, {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear plantilla de PlantUML');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating plantuml template:', error);
      throw error;
    }
  },
  
  async updateTemplate(id, templateData) {
    try {
      const response = await fetchWithAuth(`${API_URL}/plantuml-templates/${encodeURIComponent(Number(id))}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar plantilla de PlantUML');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating plantuml template:', error);
      throw error;
    }
  },
  
  async deleteTemplate(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/plantuml-templates/${encodeURIComponent(Number(id))}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar plantilla de PlantUML');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting plantuml template:', error);
      throw error;
    }
  }
};

export default plantUmlService;
