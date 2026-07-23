"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Field } from "@/components/ui";

export default function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone(false);
    try {
      await api.changePassword({ currentPassword: current, newPassword: next });
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 max-w-md p-6">
      <h2 className="text-sm font-semibold text-foreground">Change password</h2>
      <p className="mt-1 text-xs text-muted-foreground">Update the password for your staff account.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Current password" type="password" value={current} onChange={setCurrent} required />
        <Field label="New password" type="password" value={next} onChange={setNext} required />
        <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} required />
        {tooShort && <p className="text-xs text-warn">Use at least 8 characters.</p>}
        {mismatch && <p className="text-xs text-warn">Passwords do not match.</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        {done && <p className="text-sm text-ok">Password updated.</p>}
        <Button type="submit" disabled={!canSubmit}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
