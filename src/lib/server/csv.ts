"use server";
import { db } from "../db/client";
import { addresses, people, imports, type NewAddress, type NewPerson } from "../db/schema";
import { geocode } from "./geocode";
import Papa from "papaparse";
import { eq } from "drizzle-orm";

export type ImportSummary = {
  id: number;
  filename: string;
  rowCount: number;
  addressesAdded: number;
  peopleAdded: number;
  geocodedCount: number;
  failed: Array<{ row: number; reason: string; data: Record<string, unknown> }>;
};

type ColumnMap = {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  age?: string;
  party?: string;
};

function pick<T extends Record<string, unknown>>(row: T, key: string | undefined): string {
  if (!key) return "";
  const v = row[key];
  if (v == null) return "";
  return String(v).trim();
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[\s_-]+/g, "");
}

function autoMap(headers: string[]): ColumnMap {
  const norm = new Map(headers.map((h) => [normalizeHeader(h), h]));
  const find = (...candidates: string[]) => {
    for (const c of candidates) {
      const k = norm.get(c);
      if (k) return k;
    }
    return "";
  };
  return {
    firstName: find("firstname", "first", "fname", "givenname"),
    lastName: find("lastname", "last", "lname", "surname", "familyname"),
    street: find("street", "address1", "address", "addr", "streetaddress"),
    city: find("city", "town"),
    state: find("state", "region", "st"),
    zip: find("zip", "zipcode", "postalcode", "postcode"),
    age: find("age") || undefined,
    party: find("party", "affiliation", "registration") || undefined,
  };
}

export async function importCsv(
  filename: string,
  csvText: string,
  mapOverride?: Partial<ColumnMap>,
): Promise<ImportSummary> {
  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error: ${first.message} (row ${first.row})`);
  }
  const headers = parsed.meta.fields ?? [];
  const colMap: ColumnMap = { ...autoMap(headers), ...mapOverride };
  const required: (keyof ColumnMap)[] = ["firstName", "lastName", "street", "city", "state", "zip"];
  for (const r of required) {
    if (!colMap[r]) {
      throw new Error(`Missing required column for "${r}". Detected headers: ${headers.join(", ")}`);
    }
  }

  const importRow = db
    .insert(imports)
    .values({ filename, rowCount: parsed.data.length, status: "pending" })
    .returning()
    .get();

  const summary: ImportSummary = {
    id: importRow.id,
    filename,
    rowCount: parsed.data.length,
    addressesAdded: 0,
    peopleAdded: 0,
    geocodedCount: 0,
    failed: [],
  };

  // index existing addresses by normalized street+zip to avoid duplicates
  const existing = db.select().from(addresses).all();
  const addrKey = (a: { street: string; zip: string }) =>
    `${a.street.toLowerCase().trim()}|${a.zip.trim()}`;
  const addrByKey = new Map<string, number>();
  for (const a of existing) addrByKey.set(addrKey(a), a.id);

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const firstName = pick(row, colMap.firstName);
    const lastName = pick(row, colMap.lastName);
    const street = pick(row, colMap.street);
    const city = pick(row, colMap.city);
    const state = pick(row, colMap.state);
    const zip = pick(row, colMap.zip);
    if (!firstName || !lastName || !street || !city || !state || !zip) {
      summary.failed.push({ row: i + 1, reason: "missing required field", data: row });
      continue;
    }

    let addressId = addrByKey.get(`${street.toLowerCase()}|${zip}`);
    if (!addressId) {
      const fullQuery = `${street}, ${city}, ${state} ${zip}`;
      const geo = await geocode(fullQuery);
      if (!geo) {
        summary.failed.push({ row: i + 1, reason: "geocoding failed", data: row });
        continue;
      }
      summary.geocodedCount++;
      const newAddr: NewAddress = {
        street,
        city,
        state,
        zip,
        lat: geo.lat,
        lng: geo.lng,
        geocodedAt: new Date(),
      };
      const inserted = db.insert(addresses).values(newAddr).returning().get();
      addressId = inserted.id;
      addrByKey.set(`${street.toLowerCase()}|${zip}`, addressId);
      summary.addressesAdded++;
    }

    const newPerson: NewPerson = {
      addressId,
      firstName,
      lastName,
      age: colMap.age ? parseInt(pick(row, colMap.age), 10) || null : null,
      party: colMap.party ? pick(row, colMap.party) || null : null,
      source: `import:${filename}`,
    };
    db.insert(people).values(newPerson).run();
    summary.peopleAdded++;
  }

  db.update(imports)
    .set({
      status: summary.failed.length === parsed.data.length ? "failed" : "complete",
      rowCount: summary.peopleAdded,
      error: summary.failed.length > 0 ? `${summary.failed.length} row(s) failed` : null,
    })
    .where(eq(imports.id, importRow.id))
    .run();

  return summary;
}
