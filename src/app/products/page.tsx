"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = { id: string; sku: string; name: string; color: string; fabric: string; lining: string; stock: number; waterproof: boolean; eco: boolean };

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [stockState, setStockState] = useState("");

  useEffect(() => {
    fetch(`/api/products?search=${encodeURIComponent(search)}&stockState=${stockState}`).then(async (r) => {
      if (r.status === 401) location.href = "/login";
      if (r.ok) setItems((await r.json()).items);
    });
  }, [search, stockState]);

  return (
    <div>
      <div className="toolbar">
        <input placeholder="search sku/color/fabric/lining" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={stockState} onChange={(e) => setStockState(e.target.value)}>
          <option value="">all</option><option value="in">in stock</option><option value="out">out of stock</option>
        </select>
        <Link href="/products/new">+ New</Link>
      </div>
      <div className="grid">
        {items.map((x) => (
          <article key={x.id} className="card">
            <h4>{x.sku}</h4>
            <p>{x.name}</p>
            <p>{x.color} / {x.fabric} / {x.lining}</p>
            <p>{x.stock > 0 ? "可发货" : "缺货"}</p>
            <p>{x.waterproof ? "防水" : ""} {x.eco ? "环保" : ""}</p>
            <Link href={`/products/${x.id}`}>Detail</Link> | <Link href={`/products/${x.id}/edit`}>Edit</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
