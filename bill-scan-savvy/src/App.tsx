import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import your pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ImageProcessor from "./pages/ImageProcessor";

// Import your new AuthForm
// Note: Make sure this path matches exactly where you saved AuthForm.tsx
import AuthForm from "./pages/AuthForm"; 
import Home from "./components/Home/Hero";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        
        <div className="w-screen min-h-screen m-0 p-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/process-image" element={<ImageProcessor />} />    
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;