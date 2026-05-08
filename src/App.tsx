
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import News from "./pages/News";
import AdminNews from "./pages/AdminNews";
import Program from "./pages/Program";
import DonationTerms from "./pages/DonationTerms";
import NotFound from "./pages/NotFound";
import Gallery from "./pages/Gallery";
import AdminGallery from "./pages/AdminGallery";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/news" element={<News />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          <Route path="/program" element={<Program />} />
          <Route path="/donation-terms" element={<DonationTerms />} />
          <Route path="/gallery" element={<Gallery />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;