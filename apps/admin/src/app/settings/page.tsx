"use client";

import { PageHeader } from "@/components/ui";
import PaymentProviderToggle from "@/components/PaymentProviderToggle";
import ChangePasswordCard from "@/components/ChangePasswordCard";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Platform configuration." />
      <PaymentProviderToggle />
      <ChangePasswordCard />
    </>
  );
}
