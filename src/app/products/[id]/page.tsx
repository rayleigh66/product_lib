"use client";

import { useEffect, useState } from "react";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/products/${params.id}`).then(async (r) => setItem(await r.json()));
  }, [params.id]);
  if (!item) return <div>Loading...</div>;
  return <pre className="panel">{JSON.stringify(item, null, 2)}</pre>;
}
