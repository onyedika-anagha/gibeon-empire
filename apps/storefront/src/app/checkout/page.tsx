import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-24 md:pt-40">
        <CheckoutForm />
      </main>
      <Footer />
    </>
  );
}
