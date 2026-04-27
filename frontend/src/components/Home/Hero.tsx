import React, { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import logo1 from "@/assets/logo2.jpeg";

// Import the Footer component!
// Ensure the path is correct based on where your Footer.tsx is located.
import Footer from "@/components/Footer/Footer"; 

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// --- DUMMY DATA FOR THE MARQUEE CARDS ---
const stepData = [
  {
    title: "1. Document Ingestion",
    description: "Securely upload physical documents, invoices, or receipts. We support high-res images and PDFs.",
    cards: ["invoice_jan.pdf", "receipt_001.jpg", "vendor_bill.png", "tax_form.pdf"],
    infoSide: "right", 
    scrollDirection: "right",
  },
  {
    title: "2. Image Preprocessing",
    description: "Auto-rotation, deskewing, and contrast enhancement ensure the AI gets the cleanest possible image.",
    cards: ["Fixing Skew...", "Contrast +20%", "Removing Noise...", "Binarizing Image"],
    infoSide: "left", 
    scrollDirection: "left",
  },
  {
    title: "3. Vision AI Extraction",
    description: "The advanced Qwen-VL model scans the image, identifying bounding boxes and raw text with high accuracy.",
    cards: ["Vendor: Nova Corp", "Total: $450.00", "Date: 10/24", "Tax: $45.00"],
    infoSide: "right",
    scrollDirection: "right",
  },
  {
    title: "4. Semantic Structuring",
    description: "Raw text is intelligently parsed and mapped into perfectly formatted JSON key-value pairs.",
    cards: ['{"vendor": "Nova"}', '{"total": 450}', '{"status": "paid"}', '{"tax": 45}'],
    infoSide: "left",
    scrollDirection: "left",
  },
  {
    title: "5. Human Validation",
    description: "Our sleek workspace allows you to review flagged fields, correct errors, and verify the final data.",
    cards: ["Confidence: 99%", "Requires Review", "Human Verified ✅", "Auto-Approved"],
    infoSide: "right",
    scrollDirection: "right",
  },
  {
    title: "6. Export & Integration",
    description: "Save directly to MongoDB or export your clean JSON to your ERP, accounting software, or API webhook.",
    cards: ["Saved to DB", "Webhook Fired", "Exported CSV", "API Synced"],
    infoSide: "left",
    scrollDirection: "left",
  },
];

// --- DUMMY PYTHON CODE FOR STEP 2 ---
const pythonCode = `def dot(a, b):
    """Dot product of two vectors."""
    return sum(x * y for x, y in zip(a, b))

def mat_vec_mul(W, x):
    """Matrix × vector  →  vector.  W is list-of-rows."""
    return [dot(row, x) for row in W]

def vec_add(a, b):
    return [x + y for x, y in zip(a, b)]

def vec_sub(a, b):
    return [x - y for x, y in zip(a, b)]

def vec_mul(a, b):
    """Element-wise multiply."""
    return [x * y for x, y in zip(a, b)]

def vec_scale(a, s):
    return [x * s for x in a]

def outer(a, b):
    """Outer product → matrix (list of lists)."""
    return [[ai * bj for bj in b] for ai in a]

def transpose(M):
    """Transpose a matrix."""
    return [list(row) for row in zip(*M)]

def mat_vec_mul_T(W, v):
    """W^T × v  (equivalent to transposing W then multiplying)."""
    return mat_vec_mul(transpose(W), v)

def clip(x, lo=-1e9, hi=1e9):
    return max(lo, min(hi, x))


# ─────────────────────────────────────────────────────────────
#  ACTIVATION FUNCTIONS
# ─────────────────────────────────────────────────────────────

class Activation:
    """Namespace for activation functions and their derivatives."""

    # ── Sigmoid ──────────────────────────────────────────────
    @staticmethod
    def sigmoid(z):
        return [1.0 / (1.0 + math.exp(-clip(zi, -500, 500))) for zi in z]

    @staticmethod
    def sigmoid_deriv(a):
        """Derivative given *activated* output a (not z)."""
        return [ai * (1.0 - ai) for ai in a]

    # ── ReLU ─────────────────────────────────────────────────
    @staticmethod
    def relu(z):
        return [max(0.0, zi) for zi in z]

    @staticmethod
    def relu_deriv(a):
        return [1.0 if ai > 0 else 0.0 for ai in a]

    # ── Tanh ─────────────────────────────────────────────────
    @staticmethod
    def tanh(z):
        return [math.tanh(zi) for zi in z]

    @staticmethod
    def tanh_deriv(a):
        return [1.0 - ai ** 2 for ai in a]

    # ── Softmax ──────────────────────────────────────────────
    @staticmethod
    def softmax(z):
        m = max(z)
        exps = [math.exp(zi - m) for zi in z]
        s = sum(exps)
        return [e / s for e in exps]

    @staticmethod
    def softmax_deriv(a):
        # Used with cross-entropy; combined gradient simplifies to (a - y)
        return [ai * (1.0 - ai) for ai in a]

    # ── Linear (identity) ────────────────────────────────────
    @staticmethod
    def linear(z):
        return list(z)

    @staticmethod
    def linear_deriv(a):
        return [1.0] * len(a)

    # ── Dispatcher ───────────────────────────────────────────
    @classmethod
    def get(cls, name):
        fns = {
            "sigmoid": (cls.sigmoid, cls.sigmoid_deriv),
            "relu":    (cls.relu,    cls.relu_deriv),
            "tanh":    (cls.tanh,    cls.tanh_deriv),
            "softmax": (cls.softmax, cls.softmax_deriv),
            "linear":  (cls.linear,  cls.linear_deriv),
        }
        if name not in fns:
            raise ValueError(f"Unknown activation '{name}'. Choose: {list(fns)}")
        return fns[name]


# ─────────────────────────────────────────────────────────────
#  LOSS FUNCTIONS
# ─────────────────────────────────────────────────────────────

class Loss:

    @staticmethod
    def mse(y_pred, y_true):
        n = len(y_pred)
        return sum((p - t) ** 2 for p, t in zip(y_pred, y_true)) / n

    @staticmethod
    def mse_deriv(y_pred, y_true):
        n = len(y_pred)
        return [(p - t) * 2 / n for p, t in zip(y_pred, y_true)]

    @staticmethod
    def binary_cross_entropy(y_pred, y_true):
        eps = 1e-12
        return -sum(
            t * math.log(clip(p, eps, 1 - eps)) +
            (1 - t) * math.log(clip(1 - p, eps, 1 - eps))
            for p, t in zip(y_pred, y_true)
        ) / len(y_pred)

    @staticmethod
    def binary_cross_entropy_deriv(y_pred, y_true):
        eps = 1e-12
        return [
            -(t / clip(p, eps, 1)) + (1 - t) / clip(1 - p, eps, 1)
            for p, t in zip(y_pred, y_true)
        ]

    @staticmethod
    def categorical_cross_entropy(y_pred, y_true):
        eps = 1e-12
        return -sum(t * math.log(clip(p, eps, 1)) for p, t in zip(y_pred, y_true))

    @staticmethod
    def categorical_cross_entropy_deriv(y_pred, y_true):
        eps = 1e-12
        return [-t / clip(p, eps, 1) for p, t in zip(y_pred, y_true)]

    @classmethod
    def get(cls, name):
        fns = {
            "mse":      (cls.mse,      cls.mse_deriv),
            "bce":      (cls.binary_cross_entropy,      cls.binary_cross_entropy_deriv),
            "cce":      (cls.categorical_cross_entropy, cls.categorical_cross_entropy_deriv),
        }
        if name not in fns:
            raise ValueError(f"Unknown loss '{name}'. Choose: {list(fns)}")
        return fns[name]


# ─────────────────────────────────────────────────────────────
#  LAYER
# ─────────────────────────────────────────────────────────────

class Layer:
    """
    A single fully-connected layer.

    Parameters
    ----------
    n_in  : number of input neurons
    n_out : number of output neurons
    activation : 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear'
    """

    def __init__(self, n_in, n_out, activation="relu"):
        self.n_in  = n_in
        self.n_out = n_out
        self.act_name = activation
        self.activate, self.act_deriv = Activation.get(activation)

        # He initialization for ReLU; Xavier for others
        if activation == "relu":
            scale = math.sqrt(2.0 / n_in)
        else:
            scale = math.sqrt(1.0 / n_in)

        self.W = [
            [random.gauss(0, scale) for _ in range(n_in)]
            for _ in range(n_out)
        ]
        self.b = [0.0] * n_out

        # Momentum terms
        self.vW = [[0.0] * n_in for _ in range(n_out)]
        self.vb = [0.0] * n_out

        # Cache for backprop
        self.z = None   # pre-activation
        self.a `;

const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  // Responsive Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxx9MAvfWggBs1dJ-96KDjWMT00fa5pimsz8Ujk1bkPoCimHHk5UMcn7v_BPnO7Pdegaw/exec";

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(formData),
      });

      setFormStatus('success');
      setFormData({ name: '', email: '', message: '' }); 
      setTimeout(() => setFormStatus('idle'), 5000); 
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormStatus('idle');
      alert("Failed to send message. Please try again.");
    }
  };

  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1 + "px",
      opacity: Math.random() * 0.8 + 0.2,
    }));
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(glowRef.current, { rotation: 360, duration: 12, repeat: -1, ease: "none" });
      gsap.to(".star", {
        opacity: "random(0.1, 0.9)",
        duration: "random(1, 3)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { amount: 5, from: "random" }
      });

      gsap.from(".fade-in-element", {
        y: 40, opacity: 0, duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.2,
      });

      const rows = gsap.utils.toArray<HTMLElement>('.step-row');
      rows.forEach((row, index) => {
        const textSide = row.querySelector('.text-side');
        const marqueeContainer = row.querySelector('.marquee-container');
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: row,
            start: "top 85%", // Adjusted slightly for mobile visibility
            toggleActions: "play none none reverse",
          }
        });

        // Disable heavy X offset transforms on mobile for better horizontal performance
        const isMobile = window.innerWidth < 768;
        const xOffset = isMobile ? 0 : (stepData[index].infoSide === 'right' ? 50 : -50);
        const startOpacity = isMobile ? 0 : 0;

        tl.fromTo(textSide, 
          { x: xOffset, opacity: startOpacity }, 
          { x: 0, opacity: 1, duration: 1, ease: "power3.out" }
        )
        .fromTo(marqueeContainer,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
          "-=0.7" 
        );
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Adjusted offset for mobile/desktop headers
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setIsMobileMenuOpen(false); // Close mobile menu after clicking
    }
  };

  return (
    <div ref={heroRef} className="relative w-full bg-[#020202] text-white overflow-x-hidden font-sans selection:bg-purple-500/30">
      
      {/* --- FIXED BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div ref={starsRef} className="absolute inset-0">
          {stars.map((star) => (
            <div key={star.id} className="star absolute bg-white rounded-full"
              style={{ left: star.left, top: star.top, width: star.size, height: star.size, opacity: star.opacity }} />
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-80 mix-blend-screen">
          <div ref={glowRef} className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
            <div className="absolute inset-0 rounded-full blur-[25px] md:blur-[35px]"
              style={{ 
                background: 'conic-gradient(from 0deg, transparent 0%, #4c1d95 30%, #8b5cf6 70%, #d946ef 100%)',
                maskImage: 'radial-gradient(circle, transparent 55%, black 60%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 55%, black 60%)'
              }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] bg-[#d946ef] rounded-full blur-[30px] opacity-70" />
          </div>
        </div>
      </div>

      {/* --- RESPONSIVE FLOATING HEADER --- */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] sm:w-[95%] max-w-[1200px] z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-between px-5 sm:px-6 w-full transition-all duration-300">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => scrollToSection(e, 'home')}>
            <img 
              src={logo1} 
              alt="OCRIQ Logo" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain p-1"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10 text-base font-semibold text-gray-300">
            <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="relative group hover:text-white transition-colors duration-300">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#8b5cf6] group-hover:w-full transition-all duration-300 rounded-full"></span>
            </a>
            <a href="#pipeline" onClick={(e) => scrollToSection(e, 'pipeline')} className="relative group hover:text-white transition-colors duration-300">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#8b5cf6] group-hover:w-full transition-all duration-300 rounded-full"></span>
            </a>
            <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="relative group hover:text-white transition-colors duration-300">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#8b5cf6] group-hover:w-full transition-all duration-300 rounded-full"></span>
            </a>
          </nav>

          {/* Desktop Login Button */}
          <button onClick={() => navigate('/auth', { state: { isSignUp: false } })} className="hidden md:block px-6 py-2.5 bg-[#8d5df5] hover:bg-[#d946ef] text-white text-sm font-bold rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:-translate-y-0.5">
            Workspace Login
          </button>

          {/* Mobile Hamburger Toggle */}
          <button 
            className="md:hidden text-gray-300 hover:text-white p-2 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className={`md:hidden mt-2 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
          <nav className="flex flex-col items-center gap-5 py-6">
            <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="text-lg font-semibold text-gray-300 hover:text-white transition-colors">Home</a>
            <a href="#pipeline" onClick={(e) => scrollToSection(e, 'pipeline')} className="text-lg font-semibold text-gray-300 hover:text-white transition-colors">About</a>
            <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="text-lg font-semibold text-gray-300 hover:text-white transition-colors">Contact</a>
            <button onClick={() => navigate('/auth', { state: { isSignUp: false } })} className="mt-2 px-8 py-3 bg-[#8d5df5] hover:bg-[#d946ef] transition-colors text-white text-sm font-bold rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              Workspace Login
            </button>
          </nav>
        </div>
      </header>

      {/* --- SECTION 1: HERO --- */}
      <section id="home" className="relative z-10 min-h-screen pt-32 pb-20 flex flex-col items-center justify-center px-4 sm:px-6 text-center mt-[-5vh]">
        <div className="fade-in-element flex items-center gap-2 sm:gap-3 p-1.5 pr-4 sm:pr-5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6 sm:mb-8 cursor-default">
          <span className="px-2.5 py-1 text-[10px] sm:text-xs font-bold bg-[#8d5df5] hover:bg-[#d946ef] transition-colors text-white rounded-full">New</span>
          <span className="text-xs sm:text-sm font-medium text-gray-200 truncate">Automated JSON Extraction</span>
        </div>
        <h1 className="fade-in-element text-4xl sm:text-[50px] md:text-[72px] lg:text-[84px] leading-[1.1] font-extrabold tracking-tight mb-4 sm:mb-6 max-w-[1000px]">
          Intelligent Automation for <br className="hidden sm:block" /> Modern Businesses.
        </h1>
        <p className="fade-in-element text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-[600px] font-light px-2">
          OCRIQ brings AI automation to your fingertips & streamlines your document processing tasks.
        </p>
        <div className="fade-in-element flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button onClick={() => navigate('/auth', { state: { isSignUp: true } })} className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto bg-[#8d5df5] hover:bg-[#d946ef] text-white font-bold rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.4)] sm:hover:-translate-y-1">
            Get Started
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
          <a href="#pipeline" onClick={(e) => scrollToSection(e, 'pipeline')} className="px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto bg-transparent border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-colors duration-300 cursor-pointer text-center">
            Learn More
          </a>
        </div>
      </section>

      {/* --- SECTION 2: THE PIPELINE --- */}
      <section id="pipeline" className="relative z-10 py-20 md:py-32 px-4 sm:px-6 border-y border-white/10" ref={stepsRef}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6">How It Works</h2>
            <p className="text-zinc-400 max-w-[600px] mx-auto text-base sm:text-lg px-4">
              A transparent look at how unstructured pixels become structured data.
            </p>
          </div>

          <div className="flex flex-col gap-16 md:gap-40">
            {stepData.map((step, index) => (
              <div 
                key={index} 
                className={`step-row flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16 ${
                  step.infoSide === 'right' ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Text Info Side with ANIMATED BORDER */}
                <div className="text-side w-full md:w-1/2">
                  <div className="animated-border-box">
                    <div className="animated-border-inner bg-black/40 backdrop-blur-xl space-y-3 sm:space-y-4 text-center md:text-left p-6 sm:p-8">
                      <div className="inline-block text-xs sm:text-sm font-bold text-[#d946ef] tracking-wider uppercase mb-1 bg-[#d946ef]/10 px-3 py-1 rounded-full border border-[#d946ef]/20">
                        Step 0{index + 1}
                      </div>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">{step.title}</h3>
                      <p className="text-zinc-400 text-sm sm:text-base lg:text-lg leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>

                {/* Animated Marquee Side */}
                <div className="marquee-container w-full md:w-1/2 relative overflow-hidden h-[140px] sm:h-[180px] flex items-center">
                  <div className="absolute inset-0 z-10 pointer-events-none" 
                        style={{ background: 'linear-gradient(to right, #020202 0%, transparent 15%, transparent 85%, #020202 100%)' }} />
                  
                  <div className="flex w-max gap-4 sm:gap-6" style={{
                    animation: `${step.scrollDirection === 'left' ? 'scrollLeft' : 'scrollRight'} 25s linear infinite`
                  }}>
                    {[...step.cards, ...step.cards, ...step.cards].map((cardText, i) => (
                      <div 
                        key={i} 
                        className="flex-shrink-0 w-[180px] sm:w-[220px] h-[90px] sm:h-[120px] flex items-center justify-center bg-white border border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center transition-transform hover:scale-105 cursor-default"
                      >
                        <span className="text-sm sm:text-[15px] font-mono font-bold text-[#4c1d95] truncate w-full">{cardText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 3: ADVANCED CAPABILITIES --- */}
      <section id="features" className="relative z-10 py-20 md:py-32 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Under The Hood</h2>
            <p className="text-zinc-400 max-w-[600px] mx-auto text-base sm:text-lg px-4">
              Enterprise-grade systems driving our OCR intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Step 1: Radar Tracking System */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col min-h-[300px] sm:min-h-[350px] overflow-hidden relative group shadow-2xl hover:shadow-[#8b5cf6]/20 transition-shadow">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 relative z-10">Analyzing Workflow</h3>
              <p className="text-zinc-400 text-xs sm:text-sm mb-6 relative z-10">Continuous operational tracking</p>
              
              <div className="flex-1 relative flex items-center justify-center mt-4">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-[#8b5cf6]/30 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full animate-radar-spin" 
                        style={{ background: 'conic-gradient(from 0deg, transparent 75%, rgba(139, 92, 246, 0.6) 100%)' }}>
                  </div>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
                  <div className="w-2 h-2 bg-[#d946ef] rounded-full shadow-[0_0_15px_#d946ef] z-10 relative"></div>
                  <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-[#8b5cf6]/20"></div>
                  <div className="absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-[#8b5cf6]/20"></div>
                  <div className="absolute top-8 sm:top-10 right-10 sm:right-12 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  <div className="absolute bottom-10 sm:bottom-12 left-8 sm:left-10 w-1 h-1 bg-[#d946ef] rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                </div>
              </div>
            </div>

            {/* Step 2: AI Development Code Editor */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col min-h-[300px] sm:min-h-[350px] overflow-hidden relative shadow-2xl hover:shadow-[#8b5cf6]/20 transition-shadow">
              <h3 className="text-xl sm:text-2xl font-bold mb-1">AI Development</h3>
              <p className="text-zinc-400 text-xs sm:text-sm mb-6">Continuous model training</p>
              
              <div className="flex-1 flex gap-3 sm:gap-4 bg-black/50 border border-white/5 rounded-xl p-3 sm:p-4 overflow-hidden relative shadow-inner">
                <div className="w-6 sm:w-8 flex flex-col gap-3 sm:gap-4 border-r border-white/10 pr-2 pt-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#8b5cf6]/20 rounded flex items-center justify-center"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 border border-[#8b5cf6] rounded-sm"></div></div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#d946ef]/20 rounded flex items-center justify-center"><div className="w-2.5 h-[2px] sm:w-3 bg-[#d946ef]"></div></div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500/20 rounded flex items-center justify-center"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div></div>
                </div>
                <div className="flex-1 overflow-hidden relative mask-fade-y">
                  <pre className="absolute w-full animate-code-scroll font-mono text-[8px] sm:text-[10px] md:text-xs text-[#a5b4fc] leading-relaxed">
                    <code>{pythonCode}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 3: Seamless Integration */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col min-h-[300px] sm:min-h-[350px] relative shadow-2xl hover:shadow-[#8b5cf6]/20 transition-shadow">
              <h3 className="text-xl sm:text-2xl font-bold mb-1">Seamless Integration</h3>
              <p className="text-zinc-400 text-xs sm:text-sm mb-6">Connecting your ecosystem</p>
              
              <div className="flex-1 relative flex items-center justify-center mt-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-zinc-800 border-t-[#d946ef] border-r-[#8b5cf6] rounded-full animate-spin z-20 bg-transparent shadow-[0_0_20px_rgba(217,70,239,0.3)]"></div>
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                   <div className="w-[140px] sm:w-[180px] flex justify-between absolute">
                       <div className="w-3 sm:w-4 h-1 bg-gradient-to-r from-transparent to-[#8b5cf6] animate-shoot-left"></div>
                       <div className="w-3 sm:w-4 h-1 bg-gradient-to-l from-transparent to-[#8b5cf6] animate-shoot-right"></div>
                   </div>
                   <div className="h-[140px] sm:h-[180px] flex flex-col justify-between absolute">
                       <div className="h-3 sm:h-4 w-1 bg-gradient-to-b from-transparent to-[#d946ef] animate-shoot-up"></div>
                       <div className="h-3 sm:h-4 w-1 bg-gradient-to-t from-transparent to-[#d946ef] animate-shoot-down"></div>
                   </div>
                </div>

                <div className="absolute top-4 sm:top-2 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center animate-float-delayed-1 z-20">
                  <span className="text-[#ea4335] font-bold text-sm sm:text-base">G</span>
                </div>
                <div className="absolute bottom-4 sm:bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center animate-float-delayed-2 z-20">
                  <span className="text-[#10a37f] font-bold text-xs sm:text-sm">GPT</span>
                </div>
                <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center animate-float-delayed-3 z-20">
                  <span className="text-[#e01e5a] font-bold text-lg sm:text-xl">#</span>
                </div>
                <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center animate-float-delayed-4 z-20">
                  <span className="text-[#5865F2] font-bold font-mono text-base sm:text-lg">D</span>
                </div>
              </div>
            </div>

            {/* Step 4: Continuous Optimization */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col min-h-[300px] sm:min-h-[350px] shadow-2xl hover:shadow-[#8b5cf6]/20 transition-shadow">
              <h3 className="text-xl sm:text-2xl font-bold mb-1">Continuous Optimization</h3>
              <p className="text-zinc-400 text-xs sm:text-sm mb-6">Real-time system scaling</p>
              
              <div className="flex-1 flex flex-col gap-3 sm:gap-4">
                <div className="flex-1 bg-black/50 border border-white/5 rounded-xl sm:rounded-2xl flex items-center px-4 sm:px-5 gap-3 sm:gap-4">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-[#10a37f]/20 border-t-[#10a37f] animate-spin"></div>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300">ChatGPT Sync Active</span>
                </div>
                
                <div className="flex-1 bg-black/50 border border-white/5 rounded-xl sm:rounded-2xl flex items-center px-4 sm:px-5 gap-3 sm:gap-4 overflow-hidden relative">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 bg-blue-500/10 rounded-full flex items-center justify-center relative overflow-hidden">
                    <div className="w-1 h-8 sm:h-10 bg-gradient-to-t from-transparent via-blue-500 to-transparent animate-arrow-up absolute"></div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300">Workflow Automation</span>
                </div>
                
                <div className="flex-1 bg-black/50 border border-white/5 rounded-xl sm:rounded-2xl flex items-center px-4 sm:px-5 gap-3 sm:gap-4">
                  <div className="flex gap-1 items-end h-4 sm:h-5">
                    <div className="w-1 sm:w-1.5 bg-[#d946ef] animate-bar-pulse" style={{height: '40%'}}></div>
                    <div className="w-1 sm:w-1.5 bg-[#d946ef] animate-bar-pulse" style={{height: '70%', animationDelay: '0.2s'}}></div>
                    <div className="w-1 sm:w-1.5 bg-[#d946ef] animate-bar-pulse" style={{height: '100%', animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300">Sales Velocity Tracking</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 4: CONTACT FORM --- */}
      <section id="contact" className="relative z-10 py-20 md:py-32 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto bg-black/40 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-12 rounded-3xl sm:rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[#8b5cf6]/10 blur-[60px] sm:blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[#d946ef]/10 blur-[60px] sm:blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 sm:mb-4">Get in Touch</h2>
            <p className="text-gray-400 text-xs sm:text-sm">Have questions about Enterprise pricing or custom models? Drop us a message.</p>
          </div>

          <div className="relative z-10">
            {formStatus === 'success' ? (
              <div className="text-center py-8 sm:py-10 animate-in fade-in duration-500">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-green-500/30">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-gray-400 text-sm">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-sm sm:text-base text-white focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all" 
                    placeholder="John Doe" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-sm sm:text-base text-white focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all" 
                    placeholder="john@company.com" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-wider">Message</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required 
                    rows={4} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-sm sm:text-base text-white focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all resize-none" 
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button type="submit" disabled={formStatus === 'submitting'} className="w-full py-3.5 sm:py-4 bg-[#8d5df5] hover:bg-[#d946ef] text-white text-sm sm:text-base font-extrabold rounded-full transition-all shadow-lg hover:shadow-[#8b5cf6]/40 flex justify-center items-center mt-2 sm:mt-4 disabled:opacity-50 cursor-pointer">
                  {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- RENDER THE COMPONENT FOOTER --- */}
      <Footer />

      {/* --- ALL CSS ANIMATIONS & STYLES --- */}
      <style>{`
        /* Pipeline CSS Marquee */
        @keyframes scrollLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes scrollRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }

        /* Animated Border Magic */
        @keyframes border-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animated-border-box {
          position: relative; overflow: hidden; border-radius: 1.5rem; padding: 2px;
        }
        .animated-border-box::before {
          content: ''; position: absolute; top: 50%; left: 50%; width: 250%; height: 250%;
          background: conic-gradient(from 0deg, transparent 0%, transparent 70%, #8b5cf6 85%, #d946ef 100%);
          animation: border-spin 4s linear infinite; transform-origin: center center;
        }
        .animated-border-inner {
          position: relative; background: #080808; border-radius: calc(1.5rem - 2px);
          height: 100%; width: 100%; padding: 1.5rem; z-index: 1;
        }
        @media (min-width: 640px) {
          .animated-border-inner { padding: 2rem; }
        }

        /* Radar Spin */
        @keyframes radar-spin { 100% { transform: rotate(360deg); } }
        .animate-radar-spin { animation: radar-spin 3s linear infinite; }

        /* Python Code Scrolling */
        @keyframes code-scroll { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } }
        .animate-code-scroll { animation: code-scroll 40s linear infinite; }
        .mask-fade-y { mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%); }

        /* Floating Nodes */
        @keyframes float { 0%, 100% { transform: translateY(0) translateX(-50%); } 50% { transform: translateY(-8px) translateX(-50%); } }
        @keyframes float-y { 0%, 100% { transform: translateY(-50%) translateX(0); } 50% { transform: translateY(-50%) translateX(-8px); } }
        .animate-float-delayed-1 { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed-2 { animation: float 3s ease-in-out infinite 0.75s; }
        .animate-float-delayed-3 { animation: float-y 3s ease-in-out infinite 1.5s; }
        .animate-float-delayed-4 { animation: float-y 3s ease-in-out infinite 2.25s; }

        /* Shooting Arrows */
        @keyframes shoot-left { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(-30px); opacity: 0; } }
        @keyframes shoot-right { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(30px); opacity: 0; } }
        @keyframes shoot-up { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-30px); opacity: 0; } }
        @keyframes shoot-down { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(30px); opacity: 0; } }
        
        @media (min-width: 640px) {
          @keyframes shoot-left { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(-40px); opacity: 0; } }
          @keyframes shoot-right { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(40px); opacity: 0; } }
          @keyframes shoot-up { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
          @keyframes shoot-down { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(40px); opacity: 0; } }
        }

        .animate-shoot-left { animation: shoot-left 1.5s infinite; }
        .animate-shoot-right { animation: shoot-right 1.5s infinite; }
        .animate-shoot-up { animation: shoot-up 1.5s infinite; }
        .animate-shoot-down { animation: shoot-down 1.5s infinite; }

        /* Upward Arrow Loop */
        @keyframes arrow-up-loop { 0% { transform: translateY(100%); opacity: 0;} 50% { opacity: 1;} 100% { transform: translateY(-100%); opacity: 0;} }
        .animate-arrow-up { animation: arrow-up-loop 1.5s linear infinite; }

        /* Bar Pulse */
        @keyframes bar-pulse { 0%, 100% { opacity: 0.5; transform: scaleY(0.8); transform-origin: bottom; } 50% { opacity: 1; transform: scaleY(1.2); transform-origin: bottom;} }
        .animate-bar-pulse { animation: bar-pulse 1s ease-in-out infinite; }
      `}</style>

    </div>
  );
};

export default Hero;