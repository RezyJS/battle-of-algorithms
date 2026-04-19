declare module 'jshint' {
  export interface JSHintError {
    line?: number;
    character?: number;
    reason?: string;
  }

  export interface JSHintFunction {
    (source: string, options?: Record<string, unknown>): boolean;
    errors: Array<JSHintError | null>;
  }

  export const JSHINT: JSHintFunction;
}
