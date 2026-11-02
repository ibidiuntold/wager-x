import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
      },
      backgroundColor: {
        'radial-gradient': 'radial-gradient(169.40% 89.55% at 94.76% 6.29%, rgba(0, 0, 0, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'hide': 'hide 100ms ease-in',
        'slideIn': 'slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'swipeOut': 'swipeOut 100ms ease-out',
        'collapsibleDown': "collapsibleDown 0.2s ease-out",
        'collapsibleUp': "collapsibleUp 0.2s ease-out",
      },
      backgroundImage: {
        'side-bg-light': "url('/images/backgrounds/side-bg1.jpg')",
        'side-bg-dark': "url('/images/backgrounds/side-bg2.jpg')",
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        hide: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideIn: {
          from: { transform: 'translateX(-50%) translateY(-100%)' },
          to: { transform: 'translateX(-50%) translateY(0)' },
        },
        swipeOut: {
          from: { transform: 'translateX(-50%) translateY(var(--radix-toast-swipe-end-y))' },
          to: { transform: 'translateX(-50%) translateY(-100%)' },
        },
        collapsibleDown: {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        collapsibleUp: {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
