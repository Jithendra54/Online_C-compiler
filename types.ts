export interface CompilationResult {
  output: string;
  isError: boolean;
  executionTime?: number;
}

export interface EditorState {
  code: string;
  stdin: string;
}
