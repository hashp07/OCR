import { useRef, useEffect } from "react";
import heroVideo from "../../assets/1.mp4";

const VideoBackground = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute w-full h-full object-cover scale-105"
        style={{
          transform: "translateZ(0)", // ✅ GPU hint
          willChange: "transform",
        }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-charcoal/60" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-charcoal/0 to-charcoal" />

      {/* ✅ Disable heavy glow layers on mobile */}
      <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] animate-pulse-glow" />
      <div className="hidden md:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[120px] animate-breathe" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--charcoal))_100%)] opacity-50" />
    </div>
  );
};

export default VideoBackground;
