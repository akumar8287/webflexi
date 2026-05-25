'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Code2, X, Plus, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  bio: z.string().max(500).optional(),
  experienceYears: z.coerce.number().int().min(0).max(50).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  timezone: z.string().optional(),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || '',
        experienceYears: user.experienceYears,
        hourlyRate: user.hourlyRate,
        timezone: user.timezone || 'UTC',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        portfolioUrl: user.portfolioUrl || '',
      });
      setSkills(user.skills || []);
    }
  }, [_hasHydrated, isAuthenticated, user, reset, router]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        skills,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
      };
      const response = await api.put('/auth/profile', payload);
      updateUser(response.data.data);
      toast.success('Profile updated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!_hasHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Code2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  {...register('firstName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  {...register('lastName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                {...register('bio')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Tell others about yourself..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input
                  {...register('experienceYears')}
                  type="number"
                  min={0}
                  max={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              {user.role === 'SENIOR' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (USD)</label>
                  <input
                    {...register('hourlyRate')}
                    type="number"
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <input
                {...register('timezone')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g. America/New_York"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
            <div className="flex space-x-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="React, Node.js, Python..."
              />
              <button
                type="button"
                onClick={addSkill}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet</p>}
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Links</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
              <input
                {...register('githubUrl')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://github.com/username"
              />
              {errors.githubUrl && <p className="mt-1 text-sm text-red-600">{errors.githubUrl.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                {...register('linkedinUrl')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://linkedin.com/in/username"
              />
              {errors.linkedinUrl && <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
              <input
                {...register('portfolioUrl')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://yoursite.com"
              />
              {errors.portfolioUrl && <p className="mt-1 text-sm text-red-600">{errors.portfolioUrl.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? (
              <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Saving...</>
            ) : (
              <><Save className="h-5 w-5 mr-2" /> Save Profile</>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
