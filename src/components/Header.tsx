import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

interface HeaderProps {
  step: number;
  onLogoClick: () => void;
  onStartClick: () => void;
}

export function Header({ step, onLogoClick, onStartClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [showNavCta, setShowNavCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setIsPastHero(window.scrollY > window.innerHeight * 0.75);
      const howItWorks = document.getElementById("how-it-works");
      if (howItWorks) {
        setShowNavCta(
          howItWorks.getBoundingClientRect().top <= window.innerHeight * 0.3,
        );
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isMoved = step > 0 || isScrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        "bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between transition-all duration-700 ease-in-out px-3 sm:px-6 lg:px-10",
          isMoved ? "max-w-full" : "max-w-7xl",
        )}
      >
        <button
          onClick={onLogoClick}
          aria-label="Go to home"
          className={cn(
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded transition-all duration-700 ease-in-out",
            isMoved
              ? "transform translate-x-[-8px] sm:translate-x-[-14px] lg:translate-x-[-20px]"
              : "lg:translate-x-[-60px]",
          )}
        >
          <div className={cn(!isPastHero && "filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]")}>
            <img
              src={
                !isMoved
                  ? "/compare_white.svg"
                  : isPastHero && step !== 4
                    ? "/blue_comp_xs.svg"
                    : "/white_comp_xs.svg"
              }
              alt="CompareBnB"
              className={cn(
                "w-auto block outline-none border-none transition-all duration-700 ease-in-out",
                isMoved
                  ? "h-14 sm:h-20 md:h-32 lg:h-40 xl:h-48"
                  : "h-[160px] sm:h-[160px] md:h-[260px] lg:h-[340px] xl:h-[400px]",
              )}
            />
          </div>
        </button>

        {step === 0 && (
          <button
            onClick={onStartClick}
            className={cn(
              "-translate-y-2 lg:-translate-y-3 -translate-x-4 sm:translate-x-0 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-2.5 rounded-full font-semibold text-[11px] sm:text-xs lg:text-sm transition-all duration-300 shadow-lg whitespace-nowrap",
              showNavCta
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-1 pointer-events-none",
            )}
          >
            Start Comparing
          </button>
        )}
      </div>
    </header>
  );
}
