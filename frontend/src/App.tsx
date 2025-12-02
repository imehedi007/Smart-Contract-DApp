import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LoginPage from "./components/auth/LoginPage";
import Dashboard from "./pages/Dashboard";
import VideoDetail from "./pages/VideoDetail";
import Analytics from "./pages/Analytics";
import NIDBankDashboard from "./pages/NIDBankDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* Commented out - login no longer required
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};
*/

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* <Route path="/" element={<LoginPage />} /> */}
            <Route
              path="/"
              element={<Dashboard />}
            />
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/dashboard/video/:videoId"
              element={<VideoDetail />}
            />
            <Route
              path="/dashboard/analytics"
              element={<Analytics />}
            />
            <Route
              path="/dashboard/nid-database"
              element={<NIDBankDashboard />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
