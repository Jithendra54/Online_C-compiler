export const INITIAL_C_CODE = `#include <stdio.h>

int main() {
    int i;
    printf("Hello, World!\\n");
    
    printf("Counting to 5:\\n");
    for(i = 1; i <= 5; i++) {
        printf("%d ", i);
    }
    printf("\\n");
    
    return 0;
}`;

export const COMPILER_SYSTEM_INSTRUCTION = `You are a standard C compiler (GCC) and runtime environment. 
Your task is to simulate the compilation and execution of C code provided by the user.

Rules:
1. Analyze the C code and any provided Standard Input (stdin).
2. If the code has syntax errors or logic errors that would prevent compilation, output the compiler error messages exactly as GCC would.
3. If the code compiles successfully, simulate its execution using the provided stdin (if any) and output ONLY the Standard Output (stdout) of the program.
4. Do NOT wrap the output in markdown code blocks (e.g., no \`\`\` code \`\`\`).
5. Do NOT provide any conversational text, explanations, or "Here is the output". Just the raw output or raw error.
6. If the program requests input but no stdin is provided, assume valid inputs or empty strings as appropriate to prevent hanging, or print a runtime error if strictly necessary.
7. Treat "void main()" as valid but warn if strict standard checking is implied, though standard "int main()" is preferred.
`;
