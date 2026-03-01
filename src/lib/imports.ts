import Papa from "papaparse";
import { productSchema, normalizeSku } from "./validation";

export type ParsedRow = Record<string, string>;

export function parseCsv(rawCsv: string) {
  const parsed = Papa.parse<ParsedRow>(rawCsv, { header: true, skipEmptyLines: true });
  return parsed.data;
}

function boolFrom(v: string | undefined) {
  return String(v || "").toLowerCase() === "true";
}

export function validateRows(rows: ParsedRow[]) {
  const errors: string[] = [];
  const cleaned = rows.map((r, idx) => {
    const payload = {
      sku: r.sku,
      name: r.name,
      color: r.color,
      fabric: r.fabric,
      lining: r.lining,
      release_date: r.release_date || "",
      stock: Number(r.stock ?? 0),
      weight_kg: Number(r.weight_kg),
      waterproof: boolFrom(r.waterproof),
      eco: boolFrom(r.eco)
    };
    const result = productSchema.safeParse(payload);
    if (!result.success) errors.push(`row ${idx + 2}: ${result.error.issues.map((x) => x.path.join(".") + ":" + x.message).join("; ")}`);
    return payload;
  });

  const skuSet = new Set<string>();
  cleaned.forEach((row, idx) => {
    const n = normalizeSku(row.sku);
    if (skuSet.has(n)) errors.push(`row ${idx + 2}: duplicated sku after normalization`);
    skuSet.add(n);
  });

  return { cleaned, errors };
}

export function toFailureCsv(errors: string[]) {
  return ["error", ...errors.map((e) => `"${e.replaceAll('"', '""')}"`)].join("\n");
}
