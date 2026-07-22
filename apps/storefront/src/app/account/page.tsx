import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountPanel from "@/components/AccountPanel";

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 pt-32 pb-24 md:pt-40">
        <AccountPanel />
      </main>
      <Footer />
    </>
  );
}
