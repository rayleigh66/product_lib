"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/ProductForm";

export default function EditProduct({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/products/${params.id}`).then(async (r) => {
      const d = await r.json();
      setItem({
        sku: d.sku,
        name: d.name,
        color: d.color,
        fabric: d.fabric,
        lining: d.lining,
        release_date: d.releaseDate ? d.releaseDate.slice(0, 10) : "",
        stock: d.stock,
        weight_kg: d.weightKg,
        waterproof: d.waterproof,
        eco: d.eco
      });
    });
  }, [params.id]);
  if (!item) return <div>Loading...</div>;
  return <ProductForm id={params.id} defaultValue={item} />;
}
