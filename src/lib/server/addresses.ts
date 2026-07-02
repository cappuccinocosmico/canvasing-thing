"use server";
import { db } from "../db/client";
import { addresses, people, visits } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { Address, Person, Visit, NewVisit, HomeStatus } from "../db/schema";

export type AddressWithStats = Address & {
  peopleCount: number;
  lastVisit: Visit | null;
  visitCount: number;
};

export async function listAddresses(): Promise<AddressWithStats[]> {
  const rows = db
    .select({
      id: addresses.id,
      lat: addresses.lat,
      lng: addresses.lng,
      street: addresses.street,
      city: addresses.city,
      state: addresses.state,
      zip: addresses.zip,
      geocodedAt: addresses.geocodedAt,
      createdAt: addresses.createdAt,
      peopleCount: sql<number>`(SELECT COUNT(*) FROM ${people} WHERE ${people.addressId} = ${addresses.id})`.as(
        "people_count",
      ),
      visitCount: sql<number>`(SELECT COUNT(*) FROM ${visits} WHERE ${visits.addressId} = ${addresses.id})`.as(
        "visit_count",
      ),
    })
    .from(addresses)
    .all();

  const lastVisits = db
    .select()
    .from(visits)
    .orderBy(desc(visits.visitedAt))
    .all();
  const lastByAddress = new Map<number, Visit>();
  for (const v of lastVisits) {
    if (!lastByAddress.has(v.addressId)) lastByAddress.set(v.addressId, v);
  }

  return rows.map((r) => ({ ...r, lastVisit: lastByAddress.get(r.id) ?? null }));
}

export async function getAddress(id: number) {
  const addr = db.select().from(addresses).where(eq(addresses.id, id)).get();
  if (!addr) return null;
  const residents = db.select().from(people).where(eq(people.addressId, id)).all();
  const history = db
    .select()
    .from(visits)
    .where(eq(visits.addressId, id))
    .orderBy(desc(visits.visitedAt))
    .all();
  return { address: addr, people: residents, visits: history };
}

export type LogVisitInput = {
  addressId: number;
  personId?: number | null;
  homeStatus: HomeStatus;
  talked: boolean;
  interested?: boolean | null;
  notes?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export async function logVisit(input: LogVisitInput): Promise<Visit> {
  const data: NewVisit = {
    addressId: input.addressId,
    personId: input.personId ?? null,
    homeStatus: input.homeStatus,
    talked: input.talked,
    interested: input.interested ?? null,
    notes: input.notes ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
  };
  const inserted = db.insert(visits).values(data).returning().get();
  return inserted;
}

export async function listVisits(limit = 200) {
  return db
    .select({
      id: visits.id,
      visitedAt: visits.visitedAt,
      homeStatus: visits.homeStatus,
      talked: visits.talked,
      interested: visits.interested,
      notes: visits.notes,
      contactEmail: visits.contactEmail,
      contactPhone: visits.contactPhone,
      addressId: visits.addressId,
      personId: visits.personId,
      street: addresses.street,
      city: addresses.city,
      state: addresses.state,
      zip: addresses.zip,
      personFirst: people.firstName,
      personLast: people.lastName,
    })
    .from(visits)
    .leftJoin(addresses, eq(visits.addressId, addresses.id))
    .leftJoin(people, eq(visits.personId, people.id))
    .orderBy(desc(visits.visitedAt))
    .limit(limit)
    .all();
}

export async function stats() {
  const a = db.select({ c: sql<number>`COUNT(*)`.as("c") }).from(addresses).get()?.c ?? 0;
  const p = db.select({ c: sql<number>`COUNT(*)`.as("c") }).from(people).get()?.c ?? 0;
  const v = db.select({ c: sql<number>`COUNT(*)`.as("c") }).from(visits).get()?.c ?? 0;
  const talked = db
    .select({ c: sql<number>`COUNT(*)`.as("c") })
    .from(visits)
    .where(eq(visits.talked, true))
    .get()?.c ?? 0;
  const interested = db
    .select({ c: sql<number>`COUNT(*)`.as("c") })
    .from(visits)
    .where(eq(visits.interested, true))
    .get()?.c ?? 0;
  return { addresses: a, people: p, visits: v, talked, interested };
}
