import type { Metadata } from "next";
import "./globals.scss";
import { Jost } from "next/font/google";
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
    <html lang="en" className={jost.variable}>
      <head>
        {/* Cormorant Garamond — display / serif font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
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