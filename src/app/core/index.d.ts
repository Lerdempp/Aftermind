export class PointMorph {
  constructor(element: HTMLElement | string, config?: any);
  morphTo(form: string, options?: any): void;
  morphToModel(id: string, options?: any): void;
  morphToDefault(options?: any): void;
  loadModel(url: string, id: string): Promise<any>;
  getLoadedModels(): string[];
  destroy(): void;
}

export function registerAllTransitions(): void;
export function registerAllAnimations(): void;
