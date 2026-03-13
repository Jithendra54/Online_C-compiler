import React, { useState, useCallback } from 'react';
import { Play, Trash2, Keyboard, FileCode } from 'lucide-react';
import Editor from './components/Editor';
import OutputPanel from './components/OutputPanel';
import InputPanel from './components/InputPanel';
import { compileAndRunCode } from './services/geminiService';
import { INITIAL_C_CODE } from './constants';
import { CompilationResult } from './types';

const App: React.FC = () => {
  const [code, setCode] = useState<string>(INITIAL_C_CODE);
  const [stdin, setStdin] = useState<string>("");
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isInputOpen, setIsInputOpen] = useState<boolean>(false);

  const handleRun = useCallback(async () => {
    if (isCompiling) return;
    
    setIsCompiling(true);
    setResult(null);
    
    const compilationResult = await compileAndRunCode(code, stdin);
    
    setResult(compilationResult);
    setIsCompiling(false);
  }, [code, stdin, isCompiling]);

  const handleClear = () => {
    setResult(null);
  };

  const handleResetCode = () => {
    if (window.confirm("Are you sure you want to reset the code to default?")) {
        setCode(INITIAL_C_CODE);
        setResult(null);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-[#0f0f0f] text-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[#18181b] border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-md">
            <FileCode size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-100 text-lg leading-tight tracking-tight">C-Compiler</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsInputOpen(!isInputOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isInputOpen ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Keyboard size={14} />
            Stdin {isInputOpen ? 'Active' : ''}
          </button>

          <div className="h-4 w-[1px] bg-gray-700 mx-1"></div>

           <button 
            onClick={handleResetCode}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            title="Reset Code"
          >
             <Trash2 size={16} />
          </button>

          <button 
            onClick={handleRun}
            disabled={isCompiling}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-all shadow-lg shadow-emerald-900/20 ${
                isCompiling 
                ? 'bg-emerald-800 cursor-not-allowed opacity-70' 
                : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105'
            }`}
          >
            <Play size={16} fill="currentColor" />
            {isCompiling ? 'Compiling...' : 'Run Code'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-gray-800 relative p-2 gap-2">
            <Editor code={code} onChange={setCode} />
            <InputPanel 
                input={stdin} 
                onChange={setStdin} 
                isOpen={isInputOpen} 
                toggle={() => setIsInputOpen(false)} 
            />
        </div>

        {/* Right Pane: Output */}
        <div className="h-1/3 lg:h-auto lg:w-[40%] flex flex-col bg-[#0f0f0f] p-2">
          <OutputPanel result={result} isCompiling={isCompiling} />
          
          {result && (
              <div className="flex justify-end mt-2">
                  <button onClick={handleClear} className="text-xs text-gray-500 hover:text-gray-300 underline decoration-gray-600 hover:decoration-gray-300">
                      Clear Console
                  </button>
              </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;