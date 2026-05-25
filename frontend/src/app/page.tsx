import Link from "next/link";
import { Code2, Video, MessageSquare, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">WebFlexi Solutions</h1>
          </div>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Get Real-Time Help from <span className="text-blue-600">Expert Developers</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Connect with senior developers for live code collaboration, debugging, and mentorship.
            Learn faster with personalized guidance through video calls and real-time code editing.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Find a Mentor
            </Link>
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border-2 border-blue-600"
            >
              Become a Mentor
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Code2 className="h-12 w-12 text-blue-600" />}
            title="Live Code Editing"
            description="Collaborate in real-time with Monaco Editor, just like VS Code"
          />
          <FeatureCard
            icon={<Video className="h-12 w-12 text-green-600" />}
            title="Video Calls"
            description="Face-to-face sessions with screen sharing for better learning"
          />
          <FeatureCard
            icon={<MessageSquare className="h-12 w-12 text-purple-600" />}
            title="Real-time Chat"
            description="Instant messaging with code snippets and file sharing"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-orange-600" />}
            title="Expert Mentors"
            description="Get help from experienced developers in your tech stack"
          />
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number="1"
              title="Submit Your Code"
              description="Upload your code or paste it directly with a description of your issue"
            />
            <Step
              number="2"
              title="Connect with a Mentor"
              description="Get matched with an expert or choose from available mentors"
            />
            <Step
              number="3"
              title="Learn & Debug"
              description="Work together in real-time via video call and live code editor"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-24 py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2024 WebFlexi Solutions. Built with 100% free and open-source technologies.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-4">
        {number}
      </div>
      <h4 className="text-xl font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
