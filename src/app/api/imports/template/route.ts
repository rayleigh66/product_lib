import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) return auth.error;
  const csv = "sku,name,color,fabric,lining,release_date,stock,weight_kg,waterproof,eco\nSKU-001,Jacket,Black,Nylon,Poly,2026-01-01,10,0.8,true,false";
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=product-template.csv" } });
}
