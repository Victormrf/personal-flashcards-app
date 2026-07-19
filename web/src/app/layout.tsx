"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, LogOut, Mail, Sparkles } from "lucide-react";
import { getSavedTheme, saveTheme } from "@/lib/theme";
import "./globals.css";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();
  const router = useRouter();

  // Load initial theme
  useEffect(() => {
    const saved = getSavedTheme();
    setTheme(saved);
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    saveTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isLoginPage = pathname === "/login";

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <html lang="en" className={theme}>
      <body className="min-h-screen transition-colors duration-300 bg-[#f8f9fc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 flex flex-col font-sans">
        <QueryClientProvider client={queryClient}>
          {!isLoginPage && (
            <header className="border-b border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-[#0d1527]/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between transition-colors duration-300">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
                <img src="/recall-logo.svg" alt="Recall logo" className="w-8 h-8 rounded-xl shadow-sm" />
                <span className="text-xl font-black tracking-wider text-indigo-900 dark:text-white uppercase">
                  Recall
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer"
                  aria-label="Log out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </header>
          )}

          <div className="flex-1 flex flex-col w-full">
            {children}
          </div>

          {!isLoginPage && (
            <footer className="border-t border-gray-200/80 dark:border-gray-800/80 bg-white/50 dark:bg-[#0d1527]/30 py-8 px-6 flex flex-col items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 text-center transition-colors duration-300">
              <div>
                © 2026 Victor Fernandes · All rights reserved
              </div>
              <div className="flex items-center justify-center gap-6">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <LinkedinIcon className="w-[18px] h-[18px]" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <GithubIcon className="w-[18px] h-[18px]" />
                </a>
                <a href="mailto:victor@example.com" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <Mail size={18} />
                </a>
              </div>
            </footer>
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}
