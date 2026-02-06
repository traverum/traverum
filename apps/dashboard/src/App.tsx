import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ActivePartnerProvider } from "@/hooks/useActivePartner";
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
import PendingRequests from "./pages/supplier/PendingRequests";
import SessionDetail from "./pages/supplier/SessionDetail";
import StripeConnect from "./pages/supplier/StripeConnect";
import ExperienceSelection from "./pages/hotel/ExperienceSelection";
import HotelDashboard from "./pages/hotel/Dashboard";
import LocationSettings from "./pages/hotel/LocationSettings";
import EmbedSetup from "./pages/hotel/EmbedSetup";
import WidgetCustomization from "./pages/hotel/WidgetCustomization";
import AddBusinessFlow from "./pages/onboarding/AddBusinessFlow";
import EmailVerification from "./pages/EmailVerification";
import Analytics from "./pages/Analytics";
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
            <SidebarProvider>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
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
                path="/supplier/requests" 
                element={
                  <ProtectedRoute>
                    <PendingRequests />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/sessions/:sessionId" 
                element={
                  <ProtectedRoute>
                    <SessionDetail />
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
              
              {/* Hotel Routes */}
              <Route 
                path="/hotel/dashboard" 
                element={
                  <ProtectedRoute>
                    <HotelDashboard />
                  </ProtectedRoute>
                } 
              />
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
              
              {/* Analytics */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </ActivePartnerProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
