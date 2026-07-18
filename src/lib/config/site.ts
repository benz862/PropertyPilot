export const siteConfig = {
  name: "PropertyPilot",
  tagline: "AI-powered property tours",
  description:
    "Give every listing an always-ready guide—so buyers can explore with confidence and agents receive the context to follow up brilliantly.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    login: "/login",
    signup: "/signup",
    dashboard: "/dashboard",
  },
} as const;
