"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type AuditLog } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui";
import { Input } from "@/components/ui/input";

// Colour the action label by its verb so scanning the log is fast.
function actionTone(action: string): string {
  if (/(create|add|enrol)/.test(action)) return "text-ok";
  if (/(remove|delete|reset)/.test(action)) return "text-danger";
  if (/(update|change|adjust|price|transition|resolve)/.test(action)) return "text-warn";
  return "text-muted-foreground";
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .auditLogs({ limit: 250 })
      .then(setLogs)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load audit logs"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) =>
      [l.action, l.entity, l.entityId, l.actorEmail ?? l.actor].join(" ").toLowerCase().includes(term),
    );
  }, [logs, q]);

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Every product, price, inventory, order and account change — who and when."
        action={
          <button
            onClick={load}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            Refresh
          </button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Filter by action, entity, or user…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-accent/50">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground tabular-nums">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-foreground">{l.actorEmail ?? (l.actor === "system" ? "system" : l.actor.slice(0, 8))}</span>
                  </td>
                  <td className={`whitespace-nowrap px-5 py-3 font-medium ${actionTone(l.action)}`}>{l.action}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {l.entity}
                    <span className="ml-1 font-mono text-xs text-muted-foreground/70">{l.entityId.slice(0, 8)}</span>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 font-mono text-xs text-muted-foreground" title={l.data ? JSON.stringify(l.data) : ""}>
                    {l.data ? JSON.stringify(l.data) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {error || (logs.length === 0 ? "No audit entries yet." : "No entries match your filter.")}
            </p>
          )}
          {loading && <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>}
        </div>
      </Card>
    </>
  );
}
