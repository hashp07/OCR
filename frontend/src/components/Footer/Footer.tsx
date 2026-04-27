import React, { useState } from "react";
import logo1 from "@/assets/logo2.jpeg";

// --- CONTENT DATA ---
const footerContentMap: Record<string, { title: string; subtitle: string; body: React.ReactNode }> = {
  features: {
    title: "Features",
    subtitle: "Intelligent Document Automation at Scale",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>OCRIQ bridges the gap between messy physical documents and clean, actionable data.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Document Ingestion:</strong> Securely upload high-res images and PDFs via our API or drag-and-drop interface.</li>
          <li><strong className="text-white">AI Preprocessing:</strong> Automatic deskewing, noise reduction, and contrast enhancement ensure perfect scans every time.</li>
          <li><strong className="text-white">Vision AI Extraction:</strong> Powered by the advanced Qwen-VL model, our system identifies bounding boxes and extracts raw text with unparalleled accuracy.</li>
          <li><strong className="text-white">Semantic Structuring:</strong> Raw text is instantly parsed and mapped into perfectly formatted JSON key-value pairs.</li>
          <li><strong className="text-white">Human Validation:</strong> A sleek workspace allows your team to review flagged fields, correct errors, and verify final data.</li>
        </ul>
      </div>
    ),
  },
  integrations: {
    title: "Integrations",
    subtitle: "Connect Your Entire Ecosystem",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>Don't let your data sit in a silo. OCRIQ is built to seamlessly plug into the tools your team already uses every day.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Native Apps:</strong> Instantly route extracted data to Gmail, Slack, and Discord for real-time team notifications.</li>
          <li><strong className="text-white">AI Sync:</strong> Continuous synchronization with ChatGPT for advanced data querying and workflow automation.</li>
          <li><strong className="text-white">Database & ERP:</strong> Export validated data directly to MongoDB, download as CSV, or sync with your existing accounting software.</li>
          <li><strong className="text-white">Webhooks:</strong> Fire custom webhooks the second a document completes human validation.</li>
        </ul>
      </div>
    ),
  },
  api: {
    title: "API Documentation",
    subtitle: "Developer-First Document Parsing",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>Integrate state-of-the-art OCR directly into your application with just a few lines of code. Our RESTful API allows you to programmatically upload invoices, check processing status, and retrieve structured JSON.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Endpoints:</strong> Access our dedicated endpoints for <code>POST /upload</code>, <code>GET /status</code>, and <code>POST /webhook</code>.</li>
          <li><strong className="text-white">SDKs:</strong> We offer native support and quick-start Python scripts for seamless backend integration.</li>
        </ul>
        <p className="italic mt-4 text-[#d946ef]">Explore our interactive API reference and authentication guides to generate your first API key today.</p>
      </div>
    ),
  },
  pricing: {
    title: "Pricing",
    subtitle: "Scale Without Limits",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>Whether you are processing 100 receipts a month or 100,000 enterprise invoices a day, we have a plan that fits your workflow.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Starter:</strong> Perfect for small teams. Includes 500 pages/month, basic JSON export, and standard email support.</li>
          <li><strong className="text-white">Pro:</strong> For growing businesses. Includes 5,000 pages/month, webhook integrations, human validation workspace, and priority support.</li>
          <li><strong className="text-white">Enterprise:</strong> For high-volume operations. Includes custom Qwen-VL model fine-tuning, dedicated account management, SLA guarantees, and limitless API access.</li>
        </ul>
      </div>
    ),
  },
  about: {
    title: "About Us",
    subtitle: "Perfecting Data Extraction with AI",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>OCRIQ was built on a simple premise: unstructured pixels shouldn't slow down modern business.</p>
        <p>We are a team of AI engineers, designers, and workflow optimizers dedicated to eliminating manual data entry. By combining cutting-edge Vision-Language models with an intuitive, human-centric validation workspace, we empower developers and enterprises to turn physical documents into structured intelligence in seconds.</p>
      </div>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Your Data, Secured and Private",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>We treat your sensitive documents with the highest level of security.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Data Handling:</strong> Uploaded documents (invoices, tax forms, receipts) are encrypted in transit and at rest.</li>
          <li><strong className="text-white">Model Training:</strong> We do not use your private financial or personal documents to train our public OCR models without your explicit, opt-in consent.</li>
          <li><strong className="text-white">Data Retention:</strong> Once a document is processed and the JSON data is exported, you have full control to automatically wipe the source images from our servers.</li>
        </ul>
      </div>
    ),
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Using the OCRIQ Workspace",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>By accessing the OCRIQ API and Workspace, you agree to our standard terms of use. This includes guidelines on acceptable use, API rate limiting, and account responsibilities.</p>
        <p>We guarantee a 99.9% uptime SLA for our Enterprise clients, ensuring your document pipelines never stall. Repeated violations of our rate limits or attempts to reverse-engineer our proprietary models will result in immediate account suspension.</p>
      </div>
    ),
  },
  support: {
    title: "Contact Support",
    subtitle: "We're Here to Help",
    body: (
      <div className="space-y-4 text-gray-300">
        <p>Having trouble with a webhook? Need to inquire about custom model fine-tuning for a specific document type? Or just want to talk Enterprise pricing?</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Reach Out:</strong> Fill out the "Get in Touch" form on our homepage or inside your dashboard.</li>
          <li><strong className="text-white">Response Time:</strong> Our enterprise support team aims to respond to all technical and pricing inquiries within 24 hours.</li>
        </ul>
      </div>
    ),
  },
};

const Footer = () => {
  // State to track which modal is currently open
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Function to close the modal
  const closeModal = () => setActiveModal(null);

  // --- ADDED scrollToSection FUNCTION ---
  const scrollToSection = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Match the offset used in your Hero component
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-xl pt-16 pb-10 px-6 lg:px-12 font-sans">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* --- Brand Column --- */}
          <div className="col-span-1 md:col-span-2">
             <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => scrollToSection(e, 'home')}>
            <img 
              src={logo1} 
              alt="OCRIQ Logo" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain pb-1"
            />
          </div>
            <p className="text-gray-400 text-[15px] max-w-[340px] leading-relaxed">
              Transforming physical documents into structured data with the power of advanced AI and seamless workflow integrations.
            </p>
          </div>

          {/* --- Product Links Column --- */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Product</h4>
            <ul className="space-y-4 text-gray-400 text-[15px]">
              <li><button onClick={() => setActiveModal('features')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">Features</button></li>
              <li><button onClick={() => setActiveModal('integrations')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">Integrations</button></li>
              <li><button onClick={() => setActiveModal('api')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">API Documentation</button></li>
              <li><button onClick={() => setActiveModal('pricing')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">Pricing</button></li>
            </ul>
          </div>

          {/* --- Company Links Column --- */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-4 text-gray-400 text-[15px]">
              <li><button onClick={() => setActiveModal('about')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">About Us</button></li>
              <li><button onClick={() => setActiveModal('privacy')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">Privacy Policy</button></li>
              <li><button onClick={() => setActiveModal('terms')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">Terms of Service</button></li>
              <li><button onClick={() => setActiveModal('support')} className="text-left hover:text-[#d946ef] transition-colors cursor-pointer focus:outline-none w-full">Contact Support</button></li>
            </ul>
          </div>

        </div>
        
        {/* --- Bottom Row: Copyright & Socials --- */}
        <div className="max-w-[1200px] mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} OCRIQ Inc. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6 text-gray-500">
            {/* Facebook Icon */}
            <button onClick={() => window.open('https://facebook.com', '_blank')} className="hover:text-white transition-colors focus:outline-none" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Twitter Icon */}
            <button onClick={() => window.open('https://twitter.com', '_blank')} className="hover:text-white transition-colors focus:outline-none" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
            
            {/* GitHub Icon */}
            <button onClick={() => window.open('https://github.com', '_blank')} className="hover:text-white transition-colors focus:outline-none" aria-label="GitHub">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* --- MODAL POPUP --- */}
      {/* If activeModal has a value, this renders the popup */}
      {activeModal && footerContentMap[activeModal] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          
          {/* Background Dark Overlay (Clicking it closes modal) */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
            onClick={closeModal}
          ></div>
          
          {/* Modal Content Box */}
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 animate-in zoom-in-95 duration-200">
            
            {/* Close "X" Button top right */}
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-8 pr-8">
              <h2 className="text-3xl font-extrabold text-white mb-2">
                {footerContentMap[activeModal].title}
              </h2>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] font-semibold text-lg">
                {footerContentMap[activeModal].subtitle}
              </p>
            </div>

            {/* Modal Body */}
            <div className="text-[15px] leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {footerContentMap[activeModal].body}
            </div>

            {/* Modal Action Button */}
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button 
                onClick={closeModal}
                className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SCROLLBAR STYLES --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(217, 70, 239, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 70, 239, 0.8);
        }
      `}</style>
    </>
  );
};

export default Footer;