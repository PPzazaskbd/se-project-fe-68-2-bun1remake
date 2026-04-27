import type { Metadata } from "next";
import "./globals.css";
import TopMenu from "@/components/TopMenu";
import PageTransition from "@/components/PageTransition";
import CookieConsentModal from "@/components/CookieConsentModal";
import NextAuthProvider from "@/providers/NextAuthProvider";
import ReduxProvider from "@/redux/ReduxProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export const metadata: Metadata = {
  title: "Bun1 | Hotel Booking",
  description: "Boutique hotel booking experience",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions).catch(() => null);

  return (
    <html lang="en">
      <body className="overflow-hidden">
        <ReduxProvider>
          <NextAuthProvider session={session}>
            <TopMenu />
            <div id="app-scroll-root" className="overflow-y-auto">
              <PageTransition>{children}</PageTransition>
            </div>
            <CookieConsentModal />
          </NextAuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
// test
