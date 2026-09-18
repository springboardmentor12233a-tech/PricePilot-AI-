import React, { useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers,
} from "lucide-react";

const HeroSection = ({ onNavigatePrediction, onNavigateDashboard }) => {
  useEffect(() => {
    // Calculate path lengths for accurate SVG draw animations
    const paths = document.querySelectorAll(".animation-line");
    paths.forEach((path) => {
      try {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}px`;
        path.style.strokeDashoffset = `${len}px`;

        // Trigger the draw animation after a short delay
        setTimeout(() => {
          path.style.transition =
            "stroke-dashoffset 2.4s cubic-bezier(0.4, 0, 0.2, 1)";
          path.style.strokeDashoffset = "0px";
        }, 300);
      } catch (e) {
        // Fallback if SVG measurement is unsupported
      }
    });
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center bg-black text-white font-sans overflow-hidden px-6 py-16">
      <style>
        {`
          @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes heroFadeIn {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes patternScroll {
            0% { transform: translate(-5%, -5%); }
            100% { transform: translate(5%, 5%); }
          }
          
          .animate-heroFadeIn {
            animation: heroFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          
          .animate-patternScroll {
            animation: patternScroll 25s linear infinite;
          }
          
          .gradient-text {
            background: linear-gradient(270deg, #ec4899, #6366f1, #06b6d4, #a855f7, #ec4899);
            background-size: 500% 500%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradientFlow 10s ease infinite;
          }
          
          .animation-line {
            fill: none;
            stroke: rgba(255, 255, 255, 0.45);
            stroke-width: 2;
          }
          
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.35); }
            50% { box-shadow: 0 0 28px rgba(99, 102, 241, 0.7); }
            100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.35); }
          }
          
          .pulse-animation {
            animation: pulseGlow 2.5s infinite;
          }
        `}
      </style>

      {/* Dynamic Animated Line Overlay */}
      <div className="line-group absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <svg
          className="line-wrapper absolute w-full h-full opacity-60"
          viewBox="0 0 177 159"
          preserveAspectRatio="none"
        >
          <path
            className="animation-line"
            d="M176 1L53.5359 1C52.4313 1 51.5359 1.89543 51.5359 3L51.5359 56C51.5359 57.1046 50.6405 58 49.5359 58L0 58"
          />
        </svg>

        <svg
          className="line-wrapper absolute w-full h-full opacity-60"
          viewBox="0 0 176 59"
          preserveAspectRatio="none"
        >
          <path
            className="animation-line"
            d="M0 1L122.464 1C123.569 1 124.464 1.89543 124.464 3L124.464 56C124.464 57.1046 125.36 58 126.464 58L176 58"
          />
        </svg>
      </div>

      {/* Subtle Geometric Background Patterns */}
      <div
        className="pattern absolute w-[220%] h-[220%] bg-[repeating-linear-gradient(45deg,transparent,transparent_14px,rgba(255,255,255,0.03)_14px,rgba(255,255,255,0.03)_28px)] animate-patternScroll pointer-events-none"
        style={{ top: "-60%", left: "-60%" }}
      ></div>
      <div
        className="pattern absolute w-[220%] h-[220%] bg-[repeating-linear-gradient(-45deg,transparent,transparent_18px,rgba(99,102,241,0.03)_18px,rgba(99,102,241,0.03)_36px)] animate-patternScroll pointer-events-none"
        style={{ top: "40%", left: "40%" }}
      ></div>

      {/* Radial Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Hero Container */}
      <div className="max-w-5xl mx-auto text-center z-10 relative animate-heroFadeIn">
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-lg shadow-indigo-950/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>PricePilot AI · Dynamic Revenue & Pricing Intelligence</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] m-0 relative z-20">
          Ready to optimize pricing
          <br />
          <span className="gradient-text inline-block relative z-10 mt-1">
            with predictive AI?
          </span>
        </h1>

        {/* Description */}
        <p className="mt-6 text-slate-400 text-base sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
          Continuously balance real-time competitor feeds, historical demand
          elasticity, and seasonal trends to deploy maximum-margin prices with
          99.1% R² precision.
        </p>

        {/* Interactive Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
          <button
            onClick={onNavigatePrediction}
            className="w-full sm:w-auto px-9 py-4 bg-white text-black font-bold rounded-xl cursor-pointer text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all duration-300 ease-in-out hover:shadow-[0_0_25px_rgba(255,255,255,0.7)] hover:-translate-y-1 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 pulse-animation"
          >
            <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-600" />
            <span>Launch Prediction Engine</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>

          <button
            onClick={onNavigateDashboard}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 rounded-xl cursor-pointer text-base font-semibold transition-all duration-200 backdrop-blur-md flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Explore Live Dashboard</span>
          </button>
        </div>

        {/* Platform Highlights / Telemetry Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-800/80 pt-10">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl font-extrabold text-white font-mono">
              0.9908
            </div>
            <div className="text-xs text-indigo-400 font-semibold mt-0.5">
              Test R² Score
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Random Forest Benchmarked
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl font-extrabold text-white font-mono">
              $3.32
            </div>
            <div className="text-xs text-emerald-400 font-semibold mt-0.5">
              Mean Abs. Error
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              On $98+ Avg Unit Price
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl font-extrabold text-white font-mono">
              3 Feeds
            </div>
            <div className="text-xs text-amber-400 font-semibold mt-0.5">
              Competitor Intel
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Real-time market tracking
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl font-extrabold text-white font-mono">
              &lt; 86 ms
            </div>
            <div className="text-xs text-cyan-400 font-semibold mt-0.5">
              Inference Latency
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Instant dynamic re-pricing
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
