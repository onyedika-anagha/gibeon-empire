import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import { api, ApiError } from "@/lib/api";

export const dynamic = "force-dynamic"; // live stock

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const product = await api.product(slug);
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 pt-32 pb-24 md:pt-40">
          <ProductDetail product={product} />
        </main>
        <Footer />
      </>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
