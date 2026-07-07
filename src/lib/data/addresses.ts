import { addVisit, data } from "./store";
import type { AddressWithStats, LogVisitInput, Visit } from "./types";

export type { AddressWithStats, LogVisitInput };

export function listAddresses(): AddressWithStats[] {
  const peopleByAddress = new Map<number, number>();
  for (const p of data.people) {
    peopleByAddress.set(p.addressId, (peopleByAddress.get(p.addressId) ?? 0) + 1);
  }
  const visitsByAddress = new Map<number, Visit[]>();
  for (const v of data.visits) {
    const list = visitsByAddress.get(v.addressId) ?? [];
    list.push(v);
    visitsByAddress.set(v.addressId, list);
  }
  for (const list of visitsByAddress.values()) {
    list.sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime());
  }

  return data.addresses.map((a) => {
    const visits = visitsByAddress.get(a.id) ?? [];
    return {
      ...a,
      peopleCount: peopleByAddress.get(a.id) ?? 0,
      visitCount: visits.length,
      lastVisit: visits[0] ?? null,
    };
  });
}

export function getAddress(id: number) {
  const address = data.addresses.find((a) => a.id === id);
  if (!address) return null;
  const people = data.people.filter((p) => p.addressId === id);
  const visits = data.visits
    .filter((v) => v.addressId === id)
    .sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime());
  return { address, people, visits };
}

export function logVisit(input: LogVisitInput): Visit {
  return addVisit({
    addressId: input.addressId,
    personId: input.personId ?? null,
    homeStatus: input.homeStatus,
    talked: input.talked,
    interested: input.interested ?? null,
    notes: input.notes ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
  });
}

export function listVisits(limit = 200) {
  return [...data.visits]
    .sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime())
    .slice(0, limit)
    .map((v) => {
      const address = data.addresses.find((a) => a.id === v.addressId);
      const person = v.personId != null ? data.people.find((p) => p.id === v.personId) : undefined;
      return {
        id: v.id,
        visitedAt: v.visitedAt,
        homeStatus: v.homeStatus,
        talked: v.talked,
        interested: v.interested,
        notes: v.notes,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        addressId: v.addressId,
        personId: v.personId,
        street: address?.street ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
        zip: address?.zip ?? "",
        personFirst: person?.firstName ?? null,
        personLast: person?.lastName ?? null,
      };
    });
}

export function stats() {
  const visits = data.visits;
  return {
    addresses: data.addresses.length,
    people: data.people.length,
    visits: visits.length,
    talked: visits.filter((v) => v.talked).length,
    interested: visits.filter((v) => v.interested === true).length,
  };
}
