import "./globals.css";

export const metadata = {
  title: "福成上傳產品",
  description: "FuShing 上傳產品",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` `}
      >
        {children}
      </body>
    </html>
  );
}
