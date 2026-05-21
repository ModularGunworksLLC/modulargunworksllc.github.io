/** Store contact defaults (Customizer values can move to env later). */
export const STORE = {
  name: "Modular Gunworks LLC",
  phone: "(256) 384-3852",
  phoneTel: "+12563843852",
  email: "info@modulargunworks.com",
  city: "Huntsville",
  state: "AL",
  hours: "M-F 9AM-6PM, Sat 10AM-4PM CT",
  addressDisplay: "Huntsville, AL",
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
