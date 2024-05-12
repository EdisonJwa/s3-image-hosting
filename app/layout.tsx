import "./globals.scss";

export const metadata = {
  title: "Image Hosting - Edison Network",
  description: "A simple image hosting service provided by EdisonJwa.",
  url: "https://img.hit.moe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
