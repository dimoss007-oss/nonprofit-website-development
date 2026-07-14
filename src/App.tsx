
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import News from "./pages/News";
import AdminNews from "./pages/AdminNews";
import Program from "./pages/Program";
import DonationTerms from "./pages/DonationTerms";
import EduLicense from "./pages/EduLicense";
import NotFound from "./pages/NotFound";
import Gallery from "./pages/Gallery";
import AdminGallery from "./pages/AdminGallery";
import OurFamilies from "./pages/OurFamilies";
import AdminFinance from "./pages/AdminFinance";
import Gratitude from "./pages/Gratitude";
import Donate from "./pages/Donate";
import DonatePay from "./pages/DonatePay";
import Partners from "./pages/Partners";
import CaseReferral from "./pages/CaseReferral";
import CrmPatients from "./pages/CrmPatients";
import AdminPanel from "./pages/AdminPanel";
import AccessibilityWidget from "./components/shared/AccessibilityWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AccessibilityWidget />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/news" element={<News />} />
          <Route path="/admin/news" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          <Route path="/program" element={<Program />} />
          <Route path="/donation-terms" element={<DonationTerms />} />
          <Route path="/edu-license" element={<EduLicense />} />
          <Route path="/gallery" element={<Gallery />} />
          {/* Скрытая страница — не в навигации */}
          <Route path="/our-families" element={<OurFamilies />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/gratitude" element={<Gratitude />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/donate-pay" element={<DonatePay />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/case-referral" element={<CaseReferral />} />
          <Route path="/crm" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminPanel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;