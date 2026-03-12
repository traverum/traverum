import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SuperadminGuard } from "@/components/SuperadminGuard";
import { AdminLayout } from "@/components/AdminLayout";
import Auth from "./pages/Auth";
import Overview from "./pages/Overview";
import Analytics from "./pages/Analytics";
import Payouts from "./pages/Payouts";
import Partners from "./pages/Partners";
import PartnerDetail from "./pages/PartnerDetail";
import SupportFeedback from "./pages/SupportFeedback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <SuperadminGuard>
                  <AdminLayout />
                </SuperadminGuard>
              }
            >
              <Route path="/" element={<Overview />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/payouts" element={<Payouts />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/partners/:partnerId" element={<PartnerDetail />} />
              <Route path="/support-feedback" element={<SupportFeedback />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
