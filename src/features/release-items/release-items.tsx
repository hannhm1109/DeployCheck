"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { ReleaseItemStatus, ReleaseItemType } from "@/generated/prisma/enums";
import { removeReleaseItemAction } from "@/server/actions/release-items";
import { ItemForm } from "@/features/release-items/item-form";

type Item = {
  id: string;
  externalReference: string;
  title: string;
  type: ReleaseItemType;
  status: ReleaseItemStatus;
  notes: string | null;
};

const typeLabels: Record<ReleaseItemType, string> = {
  FEATURE: "Feature",
  BUG: "Bug",
  HOTFIX: "Hotfix",
  INFRASTRUCTURE: "Infrastructure",
  TECHNICAL: "Technical",
};

const statusDisplay: Record<ReleaseItemStatus, { label: string; className: string }> = {
  TODO: { label: "To do", className: "bg-[#e8eeeb] text-[#54665c]" },
  IN_PROGRESS: { label: "In progress", className: "bg-[#e0edfa] text-[#2e638e]" },
  QA_PENDING: { label: "QA pending", className: "bg-[#fff0d6] text-[#865900]" },
  READY: { label: "Ready", className: "bg-[#d9f0e3] text-[#176143]" },
};

function RemoveItemButton({ releaseId, item }: { releaseId: string; item: Item }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function remove() {
    if (!window.confirm(`Remove ${item.externalReference} from this release?`)) return;
    setError("");
    startTransition(async () => {
      const result = await removeReleaseItemAction(releaseId, item.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <span className="flex flex-col items-end">
      <button type="button" onClick={remove} disabled={pending} title={`Remove ${item.externalReference}`} aria-label={`Remove ${item.externalReference}`} className="inline-flex size-8 items-center justify-center rounded-[4px] text-[#697a70] hover:bg-[#f9e2df] hover:text-[#a3443c] focus-visible:outline-2 focus-visible:outline-[#a3443c] disabled:opacity-50">
        {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
      </button>
      {error && <span className="max-w-48 text-right text-xs text-[#a13e3b]" role="alert">{error}</span>}
    </span>
  );
}

export function ReleaseItems({
  releaseId,
  items,
  editable,
  readiness,
}: {
  releaseId: string;
  items: Item[];
  editable: boolean;
  readiness: { readyItems: number; totalItems: number };
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section id="tickets" aria-labelledby="tickets-heading" className="scroll-mt-6 border-t border-[#e2e9e5] pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="tickets-heading" className="text-lg font-semibold text-[#1b3029]">Tickets <span className="ml-1 text-sm font-normal tabular-nums text-[#697a70]">{items.length}</span></h2>
          <p className="mt-1 text-sm text-[#64746e]">{readiness.readyItems}/{readiness.totalItems} items ready</p>
        </div>
        {editable && (
          <button type="button" onClick={() => { setEditingId(null); setShowCreate((value) => !value); }} aria-expanded={showCreate} className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm font-semibold text-[#0d6b57] hover:border-[#0d6b57] focus-visible:outline-2 focus-visible:outline-[#0d6b57]"><Plus size={16} aria-hidden="true" /> Add item</button>
        )}
      </div>
      <div className="mt-5">
        {showCreate && <ItemForm releaseId={releaseId} onCancel={() => setShowCreate(false)} />}
        {items.length === 0 ? (
          <p className="border-y border-[#d9e2dd] py-10 text-sm text-[#6b7d72]">No tickets in this release yet.</p>
        ) : (
          <ul className="divide-y divide-[#e2e9e5] border-y border-[#d9e2dd]">
            {items.map((item) => (
              <li key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="break-all font-mono text-sm font-semibold text-[#1c4033]">{item.externalReference}</span>
                      <span className="text-xs text-[#76877d]">{typeLabels[item.type]}</span>
                    </div>
                    <p className="mt-1 break-words text-sm text-[#34483d]">{item.title}</p>
                    {item.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[#75857b]">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${statusDisplay[item.status].className}`}>{statusDisplay[item.status].label}</span>
                    {editable && (
                      <>
                        <button type="button" onClick={() => { setShowCreate(false); setEditingId((value) => value === item.id ? null : item.id); }} title={`Edit ${item.externalReference}`} aria-label={`Edit ${item.externalReference}`} aria-expanded={editingId === item.id} className="inline-flex size-8 items-center justify-center rounded-[4px] text-[#697a70] hover:bg-[#e8eeeb] hover:text-[#164d40] focus-visible:outline-2 focus-visible:outline-[#0d6b57]"><Pencil size={16} aria-hidden="true" /></button>
                        <RemoveItemButton releaseId={releaseId} item={item} />
                      </>
                    )}
                  </div>
                </div>
                {editingId === item.id && <ItemForm releaseId={releaseId} item={{ ...item, notes: item.notes ?? "" }} onCancel={() => setEditingId(null)} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
