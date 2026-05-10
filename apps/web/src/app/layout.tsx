import type { Metadata } from "next";
import "./globals.scss";
import { Cormorant_Garamond, Jost } from "next/font/google";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { AuthProvider } from "@/services/auth/context";
import ToastProvider from "@/components/ui/ToastProvider/ToastProvider";
import AiAssistant from "@/components/ui/AiAssistant/AiAssistant";
import { ApolloClientProvider } from "@/graphql/ApolloProvider";


const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookMyTrip — Luxury Travel",
  description: "Flights, Hotels, Trains & Holiday Packages worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jost.variable} ${cormorant.variable}`}>
      <body>
        <ApolloClientProvider>
          <AuthProvider>
            <ToastProvider />
            <ConditionalLayout>{children}</ConditionalLayout>
            <AiAssistant />
          </AuthProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}