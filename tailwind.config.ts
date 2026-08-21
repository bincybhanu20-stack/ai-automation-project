import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Needed so the literal Tailwind class strings in
    // src/lib/admin-module-colors.ts (built the same way as
    // StatusBadge.tsx's TONE_MAP) actually get scanned — those classes are
    // never written out as plain text anywhere under components/ or app/,
    // only assembled via ${...} interpolation from this file.
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Existing app theme (dashboards, auth, client portal) — unchanged.
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          900: '#0c4a6e',
        },
        // Public marketing site tokens ONLY — deliberately named
        // differently from `brand` above so nothing in the authenticated
        // app (admin/client/manager/auth) could ever collide with or
        // accidentally pick these up. Only src/components/marketing/*
        // and src/app/(public)/* reference these.
        crimson: {
          DEFAULT: '#DE0000',
          hover: '#B20000',
          light: '#FFF1F1',
        },
        charcoal: {
          DEFAULT: '#4B4846',
          dark: '#2E2C2B',
          muted: '#777371',
        },
        surface: '#F8F8F8',
        hairline: '#E8E6E5',
      },
      fontFamily: {
        // Named explicitly rather than overriding the default `sans` key —
        // applied only via an explicit `font-jakarta` class on the public
        // layout, so the app's existing system-ui body font is untouched.
        jakarta: ['var(--font-jakarta)', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
