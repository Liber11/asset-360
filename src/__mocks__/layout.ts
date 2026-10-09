import { vi } from 'vitest';

/**
 * happy-dom has no layout engine, so every element measures 0×0 and virtualized
 * lists (Aura DataGrid) render no rows. Give elements a fixed size in tests.
 */
export function stubLayoutSize(width = 1024, height = 800): void {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ width, height }));
}
