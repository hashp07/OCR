import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import VideoBackground from "../VideoBackground/VideoBackground";

gsap.registerPlugin(ScrollTrigger);

// --- HELPER COMPONENT ---
const ShatteredText = ({
  text,
  className,
  colorClass,
}: {
  text: string;
  className?: string;
  colorClass: string;
}) => {
  return (
    <span className={`inline-block whitespace-nowrap ${className || ""}`}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className={`char inline-block will-change-transform ${
            char === " " ? "w-[0.25em]" : ""
          } ${colorClass}`}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            willChange: "transform, opacity",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

interface HomeProps {
  startAnimation?: boolean;
}

const Hero = ({ startAnimation = true }: HomeProps) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const topLineRef = useRef<HTMLSpanElement>(null);
  const bottomLineRef = useRef<HTMLSpanElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = headingRef.current;
    const top = topLineRef.current;
    const bottom = bottomLineRef.current;
    if (!el || !top || !bottom) return;

    const fit = () => {
      gsap.set([top, bottom], { scale: 1, transformOrigin: "center" });

      const parentWidth = el.getBoundingClientRect().width;
      const topWidth = top.getBoundingClientRect().width;
      const bottomWidth = bottom.getBoundingClientRect().width;
      const maxWidth = Math.max(topWidth, bottomWidth);

      const safe = parentWidth * 0.985;

      if (maxWidth > safe) {
        const scale = safe / maxWidth;
        gsap.set([top, bottom], { scale: Math.max(scale, 0.78) });
      }
    };

    fit();

    const ro = new ResizeObserver(() => fit());
    ro.observe(el);

    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  useEffect(() => {
    if (!startAnimation) return;

    const ctx = gsap.context(() => {
      const chars = headingRef.current?.querySelectorAll(".char");
      if (!chars || chars.length === 0) return;

      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      const resetAll = () => {
        gsap.set(headingRef.current, { rotateX: 0, rotateY: 0 });

        if (isMobile) {
          gsap.set(chars, {
            opacity: 0,
            y: 18,
            x: 0,
            rotation: 0,
            clearProps: "filter",
            force3D: false,
          });
        } else {
          gsap.set(chars, {
            opacity: 0,
            x: () => gsap.utils.random(-120, 120),
            y: () => gsap.utils.random(-120, 120),
            z: () => gsap.utils.random(-220, 220),
            rotationX: () => gsap.utils.random(-90, 90),
            rotationY: () => gsap.utils.random(-90, 90),
            filter: "blur(10px)",
            force3D: true,
          });
        }

        gsap.set([subheadingRef.current, ctaRef.current], {
          opacity: 0,
          y: 24,
        });
      };

      const playAnim = () => {
        const tl = gsap.timeline({ defaults: { overwrite: "auto" } });

        if (isMobile) {
          tl.to(chars, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: { amount: 0.35, from: "start" },
            force3D: false,
          });
        } else {
          tl.to(chars, {
            opacity: 1,
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            filter: "blur(0px)",
            duration: 1.6,
            stagger: { amount: 0.75, from: "random" },
            ease: "elastic.out(1, 0.75)",
            force3D: true,
          });
        }

        tl.to(
          [subheadingRef.current, ctaRef.current],
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: "power2.out",
          },
          "-=0.35"
        );

        return tl;
      };

      resetAll();

      let currentTL: gsap.core.Timeline | null = null;

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom top",
        invalidateOnRefresh: true,
        fastScrollEnd: true,

        onEnter: () => {
          resetAll();
          currentTL?.kill();
          currentTL = playAnim();
        },
        onEnterBack: () => {
          resetAll();
          currentTL?.kill();
          currentTL = playAnim();
        },
      });

      if (!isMobile) {
        const handleMouseMove = (e: MouseEvent) => {
          if (!headingRef.current) return;

          const xPos = (e.clientX / window.innerWidth - 0.5) * 2;
          const yPos = (e.clientY / window.innerHeight - 0.5) * 2;

          gsap.to(headingRef.current, {
            rotateY: xPos * 3,
            rotateX: -yPos * 3,
            duration: 1.2,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [startAnimation]);

 return (
    <section
      ref={sectionRef}
      className="fixed top-0 left-0 w-screen h-screen m-0 p-0 flex items-center justify-center overflow-hidden font-sans bg-black z-50"
      style={{ perspective: "1200px" }}
    >
      {/* ✅ BACKGROUND VIDEO */}
      <VideoBackground />
      
      {/* Premium centered container */}
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10 text-center">
        {/* Heading */}
        <div
          ref={headingRef}
          className="mb-6 sm:mb-8"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* ✅ FIX: Added drop-shadow-2xl for better separation from the background */}
          <h1 className="font-bold tracking-[-0.04em] leading-[0.86] drop-shadow-2xl">
            {/* Top Line */}
            <div className="block">
              <span
                ref={topLineRef}
                className="inline-block text-white"
                style={{
                  fontSize: "clamp(2.2rem, 6.3vw, 6.8rem)",
                  // ✅ FIX: Added a heavy text shadow
                  textShadow: "0px 4px 20px rgba(0,0,0,0.8)"
                }}
              >
                <ShatteredText text="INTELLIGENT" colorClass="text-white" />
              </span>
            </div>

            {/* Bottom Line */}
            <div className="block mt-2 sm:mt-4">
              <span
                ref={bottomLineRef}
                // ✅ FIX: Changed to a brighter neon purple (#d946ef / fuchsia-500)
                className="inline-block text-[#812cef]" 
                style={{
                  fontSize: "clamp(2.3rem, 7vw, 7.2rem)",
                  // ✅ FIX: Added a glowing text shadow
                  textShadow: "0px 4px 25px rgba(217, 70, 239, 0.4), 0px 8px 30px rgba(0,0,0,0.9)"
                }}
              >
                <ShatteredText
                  text="OCR WORKSPACE"
                  colorClass="text-[#812cef]"
                />
              </span>
            </div>
          </h1>
        </div>

        {/* Subheading */}
        <p
          ref={subheadingRef}
          // ✅ FIX: Changed text to solid white and added a strong drop shadow
          className="mx-auto max-w-[52ch] text-[14px] sm:text-base md:text-lg lg:text-xl text-white font-medium leading-relaxed mb-8 sm:mb-10 drop-shadow-xl"
          style={{ textShadow: "0px 2px 10px rgba(0,0,0,0.9)" }}
        >
          Transform physical documents into structured, actionable data instantly using our advanced AI-powered optical character recognition.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/auth')}
            className="px-7 py-3 sm:px-10 sm:py-4 text-sm sm:text-base bg-[#7816b5] text-white font-bold rounded-full hover:scale-105 hover:bg-[#a75edb] transition-all duration-300 shadow-xl hover:shadow-[#7816b5]/50 cursor-pointer"
          >
            Sign Up
          </button>
          
          <button
            onClick={() => navigate('/auth')}
            // ✅ FIX: Added a semi-transparent black background to the login button so it doesn't get lost
            className="px-7 py-3 sm:px-10 sm:py-4 text-sm sm:text-base bg-black/40 backdrop-blur-sm border border-[#7e0fcd] text-white font-bold rounded-full hover:scale-105 hover:bg-[#a75edb]/20 transition-all duration-300 cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>

      {/* ✅ FIX: Made the overlays significantly darker to hide the video complexity behind the text */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-purple-900/30 to-black/90 pointer-events-none z-0" />
    </section>
  );
};

export default Hero;

