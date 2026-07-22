"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Role, type StaffMember } from "@/lib/api";
import { Badge, Button, Card, Field, PageHeader } from "@/components/ui";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const ROLES: Role[] = ["ADMIN", "STORE_MANAGER", "CASHIER"];

export default function StaffPage() {
  const { role } = useAdminAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "CASHIER" as Role });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.staff().then(setStaff).catch(() => setStaff([]));
  }, []);
  useEffect(load, [load]);

  if (role !== "ADMIN") {
    return (
      <>
        <PageHeader title="Staff" />
        <Card className="p-6 text-sm text-slate">Only administrators can manage staff accounts.</Card>
      </>
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.createStaff(form);
      setForm({ email: "", name: "", password: "", role: "CASHIER" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(id: string, r: Role) {
    await api.updateStaffRole(id, r);
    load();
  }

  return (
    <>
      <PageHeader title="Staff" subtitle="Accounts and role-based access." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{s.name}</td>
                  <td className="px-5 py-3 text-slate">{s.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={s.role}
                      onChange={(e) => changeRole(s.id, e.target.value as Role)}
                      className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="h-fit p-6">
          <p className="text-sm font-medium text-ink">Add staff member</p>
          <form onSubmit={create} className="mt-4 space-y-3">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Temp password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate">Role</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating…" : "Create account"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
