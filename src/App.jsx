import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectWizard from './pages/ProjectWizard';
import DocumentPreview from './pages/DocumentPreview';
import ValidationReport from './pages/ValidationReport';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewScreen from './pages/ReviewScreen';
import ArchitectTrack from './pages/ArchitectTrack';
import ReviewerTrack from './pages/ReviewerTrack';

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/new" element={<ProjectWizard />} />
        <Route path="/project/:id/edit" element={<ProjectWizard />} />
        <Route path="/project/:id/preview" element={<DocumentPreview />} />
        <Route path="/project/:id/validation" element={<ValidationReport />} />
        <Route path="/reviewer-dashboard" element={<ReviewerDashboard />} />
        <Route path="/review/:id" element={<ReviewScreen />} />
        <Route path="/architect" element={<ArchitectTrack />} />
        <Route path="/reviewer" element={<ReviewerTrack />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App