import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingDots from '../../../src/components/LoadingDots.jsx';

describe('LoadingDots Component', () => {
  test('renderiza correctamente', () => {
    render(<LoadingDots />);
    
    const loadingElement = document.querySelector('.loading-dots');
    expect(loadingElement).toBeInTheDocument();
  });

  test('muestra tres puntos de carga', () => {
    render(<LoadingDots />);
    
    const dots = document.querySelectorAll('.dot');
    expect(dots).toHaveLength(3);
  });

  test('cada punto tiene la clase correcta', () => {
    render(<LoadingDots />);
    
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => {
      expect(dot).toHaveClass('dot');
    });
  });

  test('tiene la estructura correcta', () => {
    const { container } = render(<LoadingDots />);
    
    const loadingDiv = container.querySelector('.loading-dots');
    expect(loadingDiv).toBeInTheDocument();
    
    const spans = loadingDiv.querySelectorAll('span');
    expect(spans).toHaveLength(3);
  });
});
