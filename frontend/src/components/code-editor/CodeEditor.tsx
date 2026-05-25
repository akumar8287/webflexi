'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { Play, RotateCcw, Download, Upload } from 'lucide-react';

interface CodeEditorProps {
  sessionId: string;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
];

const DEFAULT_CODE: Record<string, string> = {
  javascript: `// Welcome to WebFlexi Code Editor\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('Developer'));`,
  typescript: `// Welcome to WebFlexi Code Editor\nfunction greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('Developer'));`,
  python: `# Welcome to WebFlexi Code Editor\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet('Developer'))`,
  java: `// Welcome to WebFlexi Code Editor\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Developer!");\n    }\n}`,
};

export default function CodeEditor({ sessionId }: CodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [output, setOutput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time collaboration
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    const socket = io(WS_URL);
    socketRef.current = socket;

    // Join the session room
    socket.emit('join-room', sessionId);

    // Listen for code updates from other users
    socket.on('code-update', (data: { code: string }) => {
      setCode(data.code);
    });

    return () => {
      socket.emit('leave-room', sessionId);
      socket.disconnect();
    };
  }, [sessionId]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      // Broadcast code changes to other users
      if (socketRef.current) {
        socketRef.current.emit('code-change', {
          roomId: sessionId,
          code: value,
        });
      }
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage] || '// Start coding...');
  };

  const handleRunCode = () => {
    setOutput('> Running code...\n> Output will be displayed here in production version');
    // In production, this would send code to a sandboxed execution environment
  };

  const handleReset = () => {
    setCode(DEFAULT_CODE[language] || '');
    setOutput('');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code.${language}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'vs-dark' | 'light')}
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="vs-dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".js,.ts,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.txt"
          />
          <button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Upload File"
          >
            <Upload className="h-4 w-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Download Code"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Reset Code"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleRunCode}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme}
          onChange={handleEditorChange}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Output Console */}
      {output && (
        <div className="h-32 bg-black border-t border-gray-700 p-4 overflow-auto">
          <div className="text-xs text-gray-400 mb-1">Console Output:</div>
          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
