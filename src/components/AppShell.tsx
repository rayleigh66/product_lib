"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dict, Lang } from "@/lib/i18n";

type User = { name: string; role: "VIEWER" | "EDITOR" | "ADMIN" };

export function AppShell({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved) setLang(saved);
    fetch("/api/auth/me").then(async (r) => setUser(r.ok ? await r.json() : null));
  }, []);

  const t = dict[lang];

  return (
    <div className="shell">
      <aside className="sidebar">
        <h3>ProductLib</h3>
        <nav>
          <Link href="/products">{t.productLibrary}</Link>
          {user?.role === "ADMIN" && <Link href="/imports">{t.importJobs}</Link>}
          <Link href="/profile">{t.profile}</Link>
        </nav>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <button onClick={() => { const n = lang === "zh" ? "en" : "zh"; setLang(n); localStorage.setItem("lang", n); }}>{lang.toUpperCase()}</button>
          </div>
          <div>{user?.name} ({user?.role})</div>
        </header>
        <section>{children}</section>
      </main>
    </div>
  );
}
