import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const nextIntlConfig = withNextIntl(nextConfig);

export default withSentryConfig(nextIntlConfig, {
  org: "popescu-pompiliu-ion-pfa",
  project: "ai-nevoie-landing-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/api/monitoring",
  widenClientFileUpload: true,
  silent: !process.env.CI,
});
