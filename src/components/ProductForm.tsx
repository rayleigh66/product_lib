"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProductInput = {
  sku: string;
  name: string;
  color: string;
  fabric: string;
  lining: string;
  release_date?: string;
  stock: number;
  weight_kg: number;
  waterproof: boolean;
  eco: boolean;
};

const init: ProductInput = { sku: "", name: "", color: "", fabric: "", lining: "", release_date: "", stock: 0, weight_kg: 0, waterproof: false, eco: false };

export function ProductForm({ id, defaultValue }: { id?: string; defaultValue?: ProductInput }) {
  const [value, setValue] = useState<ProductInput>(defaultValue || init);
  const [skuExists, setSkuExists] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!value.sku) return;
    const timer = setTimeout(async () => {
      const url = `/api/products/exists?sku=${encodeURIComponent(value.sku)}${id ? `&excludeId=${id}` : ""}`;
      const data = await fetch(url).then((r) => r.json());
      setSkuExists(data.exists);
    }, 350);
    return () => clearTimeout(timer);
  }, [value.sku, id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = id ? `/api/products/${id}` : "/api/products";
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    if (res.ok) router.push("/products");
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      {Object.entries(value).map(([k, v]) => (
        <label key={k}>
          {k}
          {typeof v === "boolean" ? (
            <input type="checkbox" checked={v} onChange={(e) => setValue({ ...value, [k]: e.target.checked })} />
          ) : (
            <input value={String(v ?? "")} onChange={(e) => setValue({ ...value, [k]: ["stock", "weight_kg"].includes(k) ? Number(e.target.value) : e.target.value })} />
          )}
        </label>
      ))}
      {skuExists && <p className="error">SKU exists</p>}
      <button disabled={skuExists}>Save</button>
    </form>
  );
}
