import DashboardContainer from "@/components/DashboardContainer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            PRD Drift Detector
          </h1>
          <p className="text-slate-600">
            Real-time tracking of PRD-to-delivery alignment using GitHub Issues and Claude AI
          </p>
        </header>

        <DashboardContainer />
      </div>
    </main>
  );
}
