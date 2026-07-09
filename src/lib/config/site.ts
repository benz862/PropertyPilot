export const siteConfig = {
  name: "PropertyPilot",
  tagline: "AI-powered property tours",
  description:
    "Scan one QR code and speak naturally with an intelligent voice assistant that understands every aspect of the property.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    login: "/login",
    signup: "/signup",
    dashboard: "/dashboard",
  },
} as const;
