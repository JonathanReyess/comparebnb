import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

interface HeaderProps {
  step: number;
  onLogoClick: () => void;
  onStartClick: () => void;
}

export function Header({ step, onLogoClick, onStartClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
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
          "mx-auto flex items-center justify-between transition-all duration-700 ease-in-out px-4 sm:px-10",
          isMoved ? "max-w-full" : "max-w-7xl",
        )}
      >
        <button
          onClick={onLogoClick}
          aria-label="Go to home"
          className={cn(
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded transition-all duration-700 ease-in-out",
            isMoved
              ? "transform translate-x-[-10px] sm:translate-x-[-20px]"
              : "translate-x-0",
          )}
        >
          <img
            src={isMoved ? "/white_comp_xs.svg" : "/compare_white.svg"}
            alt="CompareBnB"
            className={cn(
              "w-auto transition-all duration-700 ease-in-out",
              "filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
              // Increased h-16 to h-24 (96px) or h-32 (128px)
              isMoved
                ? "h-16 sm:h-32 md:h-48"
                : "h-[180px] sm:h-[200px] md:h-[400px]",
            )}
          />
        </button>

        {step === 0 && (
          <button
            onClick={onStartClick}
            className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all shadow-lg whitespace-nowrap"
          >
            Start Comparing
          </button>
        )}
      </div>
    </header>
  );
}
