import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className="bg-primary fixed right-8 bottom-8 size-10 place-items-center rounded-md text-white shadow-md transition-opacity duration-300 hover:opacity-70"
      style={{
        display: isVisible ? "grid" : "none",
      }}
    >
      <span className="sr-only">Scroll to top</span>

      <span
        className="mt-[6px] size-3 rotate-45 border-t border-l border-white"
        aria-hidden
      />
    </button>
  );
}
