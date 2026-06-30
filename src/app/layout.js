import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "AZ Consultant — Study in Turkey | Find 1,950+ University Courses & Apply for Free",
  description: "Explore 1,950+ undergraduate, graduate, and associate programs across 17 top Turkish universities. Compare tuition fees, access scholarship waivers, and get free visa support.",
  keywords: "study in Turkey, Turkish universities, study abroad, free university application, course comparison, scholarships in Turkey, AZ Consultant",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${outfit.variable}`}
      style={{ scrollBehavior: "smooth" }}
    >
      <body>
        <div className="layout-container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Navbar />
          <main style={{ flex: 1, position: "relative" }}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
