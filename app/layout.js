import "./globals.css";

export const metadata = {
  title: "FIREcalc — Monte Carlo Retirement Planner",
  description: "Simulate your FIRE journey with thousands of Monte Carlo scenarios. Built for Indian investors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
