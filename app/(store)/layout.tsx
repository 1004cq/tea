import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="shop-shell">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
