import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { AccountDropdown } from "./AccountDrawer";
import { LogIn } from "lucide-react";

interface HeaderProps {
  step: number;
  onLogoClick: () => void;
  onStartClick: () => void;
  onRestoreComparison?: (snapshot: any) => void;
}

export function Header({ step, onLogoClick, onStartClick, onRestoreComparison }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [showNavCta, setShowNavCta] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [xOffset, setXOffset] = useState(0);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);

  const { user, isLoading, signInWithGoogle } = useAuth();

  const handleAvatarClick = () => {
    if (drawerOpen) {
      setDrawerOpen(false);
      setXOffset(0);
      return;
    }
    if (!isLight && buttonWrapperRef.current) {
      const rect = buttonWrapperRef.current.getBoundingClientRect();
      const gap = (window.innerWidth - rect.right - 12) * 0.85;
      setXOffset(gap);
      setTimeout(() => setDrawerOpen(true), 360);
    } else {
      setDrawerOpen(true);
    }
  };

  const handleDropdownClose = () => {
    setDrawerOpen(false);
    setXOffset(0);
  };

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
  const isLight = isPastHero && step !== 4;

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
          <div
            className={cn(
              !isPastHero && "filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
            )}
          >
            <img
              src={
                !isMoved
                  ? "/compare_white.svg"
                  : isLight
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

        <div className="flex items-center gap-3 -translate-y-2 lg:-translate-y-3">
          {/* Start Comparing CTA — only on landing page after scrolling */}
          {step === 0 && (
            <button
              onClick={onStartClick}
              className={cn(
                "bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-2.5 rounded-full font-semibold text-[11px] sm:text-xs lg:text-sm transition-all duration-300 shadow-lg whitespace-nowrap",
                showNavCta
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-1 pointer-events-none",
              )}
            >
              Start Comparing
            </button>
          )}

          {/* Auth button */}
          {!isLoading && (
            <>
              {user ? (
                <div>
                  <div
                    ref={buttonWrapperRef}
                    className="relative"
                    style={{
                      transform: `translateX(${xOffset}px)`,
                      transition:
                        "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <button
                      onClick={handleAvatarClick}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-2.5 rounded-full font-semibold text-[11px] sm:text-xs lg:text-sm transition-all duration-300 shadow-lg",
                        isLight
                          ? "bg-white/90 hover:bg-white text-gray-800 border border-gray-200"
                          : "bg-white/15 hover:bg-white/25 text-white border border-white/20",
                      )}
                    >
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="avatar"
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {user.email?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="hidden sm:inline max-w-[100px] truncate">
                        {user.user_metadata?.full_name?.split(" ")[0] ??
                          user.email}
                      </span>
                    </button>
                    <AccountDropdown
                      open={drawerOpen}
                      onClose={handleDropdownClose}
                      isLight={isLight}
                      onRestoreComparison={onRestoreComparison}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-2.5 rounded-full font-semibold text-[11px] sm:text-xs lg:text-sm transition-all duration-300 shadow-lg whitespace-nowrap",
                    isLight
                      ? "bg-white/90 hover:bg-white text-gray-800 border border-gray-200"
                      : "bg-white/15 hover:bg-white/25 text-white border border-white/20",
                  )}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign in
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
