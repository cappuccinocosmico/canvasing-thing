import { createStore, produce } from "solid-js/store";
import seed from "../../../data/seed.json";
import type { Address, NewAddress, NewPerson, NewVisit, Person, SeedFile, Visit } from "./types";

const parsed = seed as unknown as SeedFile;

const initial = {
  addresses: parsed.addresses.map((a) => ({
    ...a,
    geocodedAt: a.geocodedAt ? new Date(a.geocodedAt) : null,
    createdAt: new Date(a.createdAt),
  })),
  people: parsed.people,
  visits: parsed.visits.map((v) => ({ ...v, visitedAt: new Date(v.visitedAt) })),
  nextIds: { ...parsed.nextIds },
};

const [state, setState] = createStore<{
  addresses: Address[];
  people: Person[];
  visits: Visit[];
  nextIds: { address: number; person: number; visit: number };
}>(initial);

export const data = state;

export function addAddress(input: NewAddress): Address {
  const id = input.id ?? state.nextIds.address;
  const addr: Address = {
    id,
    lat: input.lat,
    lng: input.lng,
    street: input.street,
    city: input.city,
    state: input.state,
    zip: input.zip,
    geocodedAt: input.geocodedAt ?? new Date(),
    createdAt: input.createdAt ?? new Date(),
  };
  setState(
    produce((s) => {
      s.addresses.push(addr);
      if (input.id == null) s.nextIds.address = id + 1;
    }),
  );
  return addr;
}

export function addPerson(input: NewPerson): Person {
  const id = input.id ?? state.nextIds.person;
  const person: Person = {
    id,
    addressId: input.addressId,
    firstName: input.firstName,
    lastName: input.lastName,
    age: input.age,
    party: input.party,
    source: input.source,
  };
  setState(
    produce((s) => {
      s.people.push(person);
      if (input.id == null) s.nextIds.person = id + 1;
    }),
  );
  return person;
}

export function addVisit(input: NewVisit): Visit {
  const id = input.id ?? state.nextIds.visit;
  const visit: Visit = {
    id,
    addressId: input.addressId,
    personId: input.personId ?? null,
    visitedAt: input.visitedAt ?? new Date(),
    homeStatus: input.homeStatus,
    talked: input.talked,
    interested: input.interested ?? null,
    notes: input.notes ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
  };
  setState(
    produce((s) => {
      s.visits.push(visit);
      if (input.id == null) s.nextIds.visit = id + 1;
    }),
  );
  return visit;
}
