"use client";

import { useState } from "react";
import { CrmRecordRow, type BusinessMember, type CrmRecordRowData } from "./crm-record-row";

export function ContactsList({
  records,
  members,
}: {
  records: CrmRecordRowData[];
  members: BusinessMember[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? records.filter((r) =>
        [r.contact.name, r.contact.company, r.contact.email].some((v) => v?.toLowerCase().includes(q))
      )
    : records;

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, company or email"
        aria-label="Search contacts"
        className="min-h-11 w-full px-3.5 text-base sm:max-w-sm sm:text-sm"
      />
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center text-sm text-muted">
          {records.length === 0 ? "No contacts yet." : "No contacts match that search."}
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map((record) => (
            <CrmRecordRow key={record.id} record={record} members={members} />
          ))}
        </div>
      )}
    </div>
  );
}
