import DashboardContainer from "@/components/DashboardContainer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
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
