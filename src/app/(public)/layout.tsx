import { Plus_Jakarta_Sans } from "next/font/google";
import { PublicNavbar } from "@/components/marketing/PublicNavbar";
import { Footer } from "@/components/marketing/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

/**
 * Scopes the redesign's visual system to the public site only:
 *  - `public-site` (globals.css) carries the new color tokens.
 *  - `${jakarta.variable} font-jakarta` loads and applies Plus Jakarta Sans.
 * The title template lives on the root layout now that the whole product
 * shares one brand — /admin, /client, /manager and every auth page still
 * keep their own dark theme and system-ui font, untouched by this redesign.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`public-site ${jakarta.variable} font-jakarta`}>
      {/* Visually hidden until focused — lets keyboard users skip the nav
          on every single page instead of tabbing through it every time. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-crimson focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <PublicNavbar />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
