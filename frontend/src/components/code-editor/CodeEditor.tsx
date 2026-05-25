'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Play, RotateCcw, Download, Upload, Minus, Plus, Map, WrapText } from 'lucide-react';
import { useSessionSocket } from '@/context/SessionSocketContext';

interface CodeEditorProps {
  sessionId: string;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', ext: 'js' },
  { value: 'typescript', label: 'TypeScript', ext: 'ts' },
  { value: 'python', label: 'Python', ext: 'py' },
  { value: 'java', label: 'Java', ext: 'java' },
  { value: 'cpp', label: 'C++', ext: 'cpp' },
  { value: 'csharp', label: 'C#', ext: 'cs' },
  { value: 'go', label: 'Go', ext: 'go' },
  { value: 'rust', label: 'Rust', ext: 'rs' },
  { value: 'php', label: 'PHP', ext: 'php' },
  { value: 'ruby', label: 'Ruby', ext: 'rb' },
];

const DEFAULT_CODE: Record<string, string> = {
  javascript: `// WebFlexi Collaborative Editor\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('Developer'));`,
  typescript: `// WebFlexi Collaborative Editor\nfunction greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('Developer'));`,
  python: `# WebFlexi Collaborative Editor\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet('Developer'))`,
  java: `// WebFlexi Collaborative Editor\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Developer!");\n    }\n}`,
  go: `// WebFlexi Collaborative Editor\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Developer!")\n}`,
  rust: `// WebFlexi Collaborative Editor\nfn main() {\n    println!("Hello, Developer!");\n}`,
};

type SyncStatus = 'synced' | 'syncing' | 'disconnected';

export default function CodeEditor({ sessionId }: CodeEditorProps) {
  const { socket, isConnected } = useSessionSocket();

  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [remoteCursor, setRemoteCursor] = useState<{ name: string; line: number; column: number } | null>(null);
  const [output, setOutput] = useState('');

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const isRemoteRef = useRef(false);
  const emitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const remoteCursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced code emit
  const emitCodeChange = useCallback(
    (value: string, lang: string) => {
      if (!socket) return;
      if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
      setSyncStatus('syncing');
      emitTimerRef.current = setTimeout(() => {
        socket.emit('code-change', { roomId: sessionId, code: value, language: lang });
        setSyncStatus('synced');
      }, 300);
    },
    [socket, sessionId]
  );

  // Apply remote cursor decoration
  const applyRemoteCursorDecoration = useCallback(
    (line: number, column: number, name: string) => {
      if (!editorRef.current || !monacoRef.current) return;
      const monaco = monacoRef.current;
      const newDecorations = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(line, column, line, column + 1),
          options: {
            className: 'remote-cursor-line',
            hoverMessage: { value: `**${name}**'s cursor` },
          },
        },
      ]);
      decorationsRef.current = newDecorations;
    },
    []
  );

  useEffect(() => {
    if (!socket) return;

    const onCodeUpdate = (data: { code: string }) => {
      isRemoteRef.current = true;
      setCode(data.code);
    };

    const onLanguageUpdate = (data: { language: string }) => {
      isRemoteRef.current = true;
      setLanguage(data.language);
    };

    const onSyncResponse = (data: { code: string; language: string }) => {
      isRemoteRef.current = true;
      setCode(data.code);
      setLanguage(data.language);
    };

    const onCursorUpdate = (data: { name: string; line: number; column: number }) => {
      setRemoteCursor(data);
      applyRemoteCursorDecoration(data.line, data.column, data.name);
      // Auto-hide remote cursor after 3s of inactivity
      if (remoteCursorTimerRef.current) clearTimeout(remoteCursorTimerRef.current);
      remoteCursorTimerRef.current = setTimeout(() => setRemoteCursor(null), 3000);
    };

    socket.on('code-update', onCodeUpdate);
    socket.on('language-update', onLanguageUpdate);
    socket.on('sync-response', onSyncResponse);
    socket.on('cursor-update', onCursorUpdate);

    return () => {
      socket.off('code-update', onCodeUpdate);
      socket.off('language-update', onLanguageUpdate);
      socket.off('sync-response', onSyncResponse);
      socket.off('cursor-update', onCursorUpdate);
    };
  }, [socket, applyRemoteCursorDecoration]);

  useEffect(() => {
    setSyncStatus(isConnected ? 'synced' : 'disconnected');
  }, [isConnected]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Inject remote cursor CSS
    const style = document.createElement('style');
    style.textContent = `.remote-cursor-line { border-left: 2px solid #f97316; background: rgba(249,115,22,0.12); }`;
    document.head.appendChild(style);

    editor.onDidChangeCursorPosition((e) => {
      const { lineNumber, column } = e.position;
      setCursorPos({ line: lineNumber, column });
      if (socket && isConnected) {
        socket.emit('cursor-position', {
          roomId: sessionId,
          line: lineNumber,
          column,
        });
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    // Block re-broadcast of remote updates
    if (isRemoteRef.current) {
      isRemoteRef.current = false;
      return;
    }
    setCode(value);
    emitCodeChange(value, language);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const newCode = DEFAULT_CODE[newLang] || '// Start coding...';
    setCode(newCode);
    if (socket) {
      socket.emit('language-change', { roomId: sessionId, language: newLang });
      socket.emit('code-change', { roomId: sessionId, code: newCode, language: newLang });
    }
  };

  const handleRunCode = () => {
    setOutput('> Run sandbox not available in MVP.\n> Download your code to run it locally.');
  };

  const handleReset = () => {
    const fresh = DEFAULT_CODE[language] || '';
    setCode(fresh);
    setOutput('');
    emitCodeChange(fresh, language);
  };

  const handleDownload = () => {
    const ext = LANGUAGES.find((l) => l.value === language)?.ext ?? 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setCode(content);
      emitCodeChange(content, language);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const statusColor: Record<SyncStatus, string> = {
    synced: 'bg-green-500',
    syncing: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500',
  };

  const statusLabel: Record<SyncStatus, string> = {
    synced: 'Synced',
    syncing: 'Syncing…',
    disconnected: 'Offline',
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Language */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1.5 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          {/* Theme */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'vs-dark' | 'light')}
            className="bg-gray-700 text-white px-2 py-1.5 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
          </select>

          {/* Font size */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              className="p-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              title="Decrease font size"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-gray-400 text-xs w-6 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize((s) => Math.min(28, s + 1))}
              className="p-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              title="Increase font size"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Minimap toggle */}
          <button
            onClick={() => setShowMinimap((v) => !v)}
            className={`p-1.5 rounded transition-colors ${showMinimap ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            title="Toggle minimap"
          >
            <Map className="h-3.5 w-3.5" />
          </button>

          {/* Word wrap toggle */}
          <button
            onClick={() => setWordWrap((v) => (v === 'on' ? 'off' : 'on'))}
            className={`p-1.5 rounded transition-colors ${wordWrap === 'on' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            title="Toggle word wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync status */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${statusColor[syncStatus]}`} />
            <span className="text-xs text-gray-400">{statusLabel[syncStatus]}</span>
          </div>

          {/* Upload */}
          <input
            type="file"
            id="code-file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".js,.ts,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.txt"
          />
          <button
            onClick={() => document.getElementById('code-file-upload')?.click()}
            className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            title="Upload file"
          >
            <Upload className="h-4 w-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            title="Download code"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Run */}
          <button
            onClick={handleRunCode}
            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm"
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: showMinimap },
            fontSize,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap,
            bracketPairColorization: { enabled: true },
            renderLineHighlight: 'all',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            suggest: { showStatusBar: true },
          }}
        />
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 py-1 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
          {remoteCursor && (
            <span className="text-orange-400">
              {remoteCursor.name}: Ln {remoteCursor.line}, Col {remoteCursor.column}
            </span>
          )}
        </div>
        <span>{language}</span>
      </div>

      {/* Output Console */}
      {output && (
        <div className="h-28 bg-black border-t border-gray-700 p-3 overflow-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Console</span>
            <button onClick={() => setOutput('')} className="text-xs text-gray-600 hover:text-gray-400">
              ✕
            </button>
          </div>
          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}
