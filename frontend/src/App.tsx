import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react';

// Import your pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ImageProcessor from "./pages/ImageProcessor";

// Import your new AuthForm
import AuthForm from "./pages/AuthForm"; 
import Home from "./components/Home/Hero";
import Preloader from './components/Preloader';

// 1. ADD THE IMPORT HERE
import { CustomCursor } from "@/components/custom-cursor";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    // Fixed: Removed quotes around {queryClient}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="w-screen min-h-screen m-0 p-0 overflow-x-hidden">
            
            <CustomCursor />

            {/* Fixed: Syntax for the arrow function inside the prop */}
            {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
            
            {/* Fixed: Removed weird "{<Home"/>}" syntax on all routes */}
            {!isLoading && (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/process-image" element={<ImageProcessor />} />    
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}

          </div>
        {/* Fixed: Removed rogue closing </Preloader> tag that was here */}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;