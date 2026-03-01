"use client";

import { useEffect, useState } from "react";

export default function ImportsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [rawCsv, setRawCsv] = useState("sku,name,color,fabric,lining,release_date,stock,weight_kg,waterproof,eco\nSKU-100,Test,Red,Cotton,Poly,2026-03-01,2,0.2,true,true");

  async function refresh() {
    const r = await fetch("/api/imports");
    if (r.ok) setJobs(await r.json());
  }
  useEffect(() => { refresh(); }, []);

  async function uploadValidateCommit() {
    const upload = await fetch("/api/imports/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: "manual.csv", rawCsv }) }).then((r) => r.json());
    await fetch(`/api/imports/${upload.id}/validate`, { method: "POST" });
    await fetch(`/api/imports/${upload.id}/commit`, { method: "POST" });
    refresh();
  }

  return (
    <div>
      <h2>Import jobs (Admin)</h2>
      <textarea rows={8} value={rawCsv} onChange={(e) => setRawCsv(e.target.value)} />
      <button onClick={uploadValidateCommit}>Upload → Validate → Commit</button>
      <ul>{jobs.map((j) => <li key={j.id}>{j.fileName} - {j.status} - invalid:{j.invalidRows} <a href={`/api/imports/${j.id}/failures`}>failures csv</a></li>)}</ul>
    </div>
  );
}
