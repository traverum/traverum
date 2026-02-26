import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ActivePartnerProvider } from "@/hooks/useActivePartner";
import { ActiveHotelConfigProvider } from "@/hooks/useActiveHotelConfig";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SupplierDashboard from "./pages/supplier/Dashboard";
import ExperiencesList from "./pages/supplier/ExperiencesList";
import ExperienceDashboard from "./pages/supplier/ExperienceDashboard";
import ExperienceFormRedirect from "./pages/supplier/ExperienceFormRedirect";
import ExperienceSessions from "./pages/supplier/ExperienceSessions";
import SupplierSessions from "./pages/supplier/SupplierSessions";
import BookingManagement from "./pages/supplier/BookingManagement";
import StripeConnect from "./pages/supplier/StripeConnect";
// SessionDetail redirect - old route now points to BookingManagement
function SessionDetailRedirect() {
  const { sessionId } = useParams();
  return <Navigate to={`/supplier/bookings?tab=upcoming`} replace />;
}
import ExperienceSelection from "./pages/hotel/ExperienceSelection";
import HotelDashboard from "./pages/hotel/Dashboard";
import LocationSettings from "./pages/hotel/LocationSettings";
import EmbedSetup from "./pages/hotel/EmbedSetup";
import WidgetCustomization from "./pages/hotel/WidgetCustomization";
import StayDashboard from "./pages/hotel/StayDashboard";
import StaysList from "./pages/hotel/StaysList";
import AddBusinessFlow from "./pages/onboarding/AddBusinessFlow";
import EmailVerification from "./pages/EmailVerification";
import AuthCallback from "./pages/AuthCallback";
import Analytics from "./pages/Analytics";
import HotelAnalytics from "./pages/hotel/Analytics";
import Settings from "./pages/Settings";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ActivePartnerProvider>
            <ActiveHotelConfigProvider>
            <SidebarProvider>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/invite/:token" element={<Invite />} />
              
              {/* Smart redirect based on capabilities */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Supplier Routes */}
              <Route 
                path="/supplier/dashboard" 
                element={
                  <ProtectedRoute>
                    <SupplierDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/experiences" 
                element={
                  <ProtectedRoute>
                    <ExperiencesList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/experiences/new" 
                element={
                  <ProtectedRoute>
                    <Navigate to="/supplier/experiences" replace />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/experiences/:id" 
                element={
                  <ProtectedRoute>
                    <ExperienceDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/experiences/:id/edit" 
                element={
                  <ProtectedRoute>
                    <ExperienceFormRedirect />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/experiences/:id/sessions" 
                element={
                  <ProtectedRoute>
                    <ExperienceSessions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/sessions" 
                element={
                  <ProtectedRoute>
                    <SupplierSessions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/bookings" 
                element={
                  <ProtectedRoute>
                    <BookingManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/stripe-connect" 
                element={
                  <ProtectedRoute>
                    <StripeConnect />
                  </ProtectedRoute>
                } 
              />
              {/* Redirect old route */}
              <Route 
                path="/supplier/requests" 
                element={<Navigate to="/supplier/bookings" replace />} 
              />
              {/* Redirect old session detail to new booking management page */}
              <Route 
                path="/supplier/sessions/:sessionId" 
                element={
                  <ProtectedRoute>
                    <SessionDetailRedirect />
                  </ProtectedRoute>
                } 
              />
              
              {/* Hotel / Stays Routes */}
              <Route 
                path="/hotel/dashboard" 
                element={
                  <ProtectedRoute>
                    <HotelDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hotel/stays" 
                element={
                  <ProtectedRoute>
                    <StaysList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hotel/stays/:id" 
                element={
                  <ProtectedRoute>
                    <StayDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Legacy hotel routes — redirect to stays dashboard */}
              <Route 
                path="/hotel/selection" 
                element={
                  <ProtectedRoute>
                    <ExperienceSelection />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hotel/location" 
                element={
                  <ProtectedRoute>
                    <LocationSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hotel/embed" 
                element={
                  <ProtectedRoute>
                    <EmbedSetup />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hotel/customize" 
                element={
                  <ProtectedRoute>
                    <WidgetCustomization />
                  </ProtectedRoute>
                } 
              />
              
              {/* Onboarding Routes */}
              <Route 
                path="/onboarding/add-business" 
                element={
                  <ProtectedRoute>
                    <AddBusinessFlow />
                  </ProtectedRoute>
                } 
              />
              
              {/* Email Verification */}
              <Route 
                path="/verify-email" 
                element={
                  <ProtectedRoute>
                    <EmailVerification />
                  </ProtectedRoute>
                } 
              />
              
              {/* Settings */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Analytics */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hotel/analytics" 
                element={
                  <ProtectedRoute>
                    <HotelAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
            </ActiveHotelConfigProvider>
          </ActivePartnerProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
