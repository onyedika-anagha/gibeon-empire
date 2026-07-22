"use client";

import { PageHeader } from "@/components/ui";
import PaymentProviderToggle from "@/components/PaymentProviderToggle";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Platform configuration." />
      <PaymentProviderToggle />
    </>
  );
}
