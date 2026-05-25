'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Editor from '@monaco-editor/react';
import { Code2, ArrowLeft, X, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCreateSubmission } from '@/hooks/useSubmissions';

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp',
  'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
];

const schema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().min(1, 'Description required'),
  language: z.string().min(1, 'Language required'),
  framework: z.string().optional(),
  errorDescription: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewSubmissionPage() {
  const router = useRouter();
  const createMutation = useCreateSubmission();
  const [code, setCode] = useState('// Paste your code here...');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { language: 'javascript' },
  });

  const language = watch('language');

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync({
      ...data,
      codeContent: code,
      tags,
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Code2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Submit Code for Help</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Issue Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. React useEffect infinite loop"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Briefly describe what you're trying to do"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
                  <select
                    {...register('language')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
                  <input
                    {...register('framework')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g. React, Express"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                <textarea
                  {...register('errorDescription')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                  placeholder="Paste the error message here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Behavior</label>
                <input
                  {...register('expectedBehavior')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="What should happen?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Behavior</label>
                <input
                  {...register('actualBehavior')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="What actually happens?"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    placeholder="bug, async, hooks..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {createMutation.isPending ? (
                <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Submitting...</>
              ) : (
                'Submit for Help'
              )}
            </button>
          </div>

          {/* Right — Code Editor */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-300 font-medium">Your Code *</span>
              <span className="text-xs text-gray-500">{language}</span>
            </div>
            <div style={{ height: '600px' }}>
              <Editor
                height="100%"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
