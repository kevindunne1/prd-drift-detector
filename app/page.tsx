import DashboardContainer from "@/components/DashboardContainer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors">
      {/* Professional grid pattern background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(100, 116, 139) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(100, 116, 139) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        ></div>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-slate-100/40 dark:from-blue-950/20 dark:via-transparent dark:to-slate-800/20"></div>

        {/* Subtle accent gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        <DashboardContainer />
        <Footer />
      </div>
    </main>
  );
}
