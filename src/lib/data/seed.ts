/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Address, NewAddress, NewPerson, NewVisit, Person, SeedFile, Visit } from "./types";

const BOULDER_STREETS = [
  "Pearl St",
  "Boulder Canyon Dr",
  "Broadway",
  "College Ave",
  "28th St",
  "30th St",
  "Folsom St",
  "Walnut St",
  "Spruce St",
  "Pine St",
  "Maple St",
  "Cedar Ave",
  "Iris Ave",
  "Hillside Rd",
  "Norwood Ave",
  "4th St",
  "9th St",
  "13th St",
  "15th St",
  "17th St",
  "19th St",
  "20th St",
  "23rd St",
  "26th St",
  "Arapahoe Ave",
  "Canyon Blvd",
  "Table Mesa Dr",
  "South Boulder Rd",
  "Marshall Rd",
  "Dillon Rd",
  "Lee Hill Dr",
  "Wonderland Ave",
  "Sunshine Canyon Dr",
  "Valmont Rd",
  "Jay Rd",
  "Lookout Rd",
  "Baseline Rd",
];

const PARTIES = ["DEM", "REP", "UNA", "LIB", "GRE"] as const;
const NOTES = [
  "Interested in volunteering",
  "Asked us to come back next week",
  "Wants more info via email",
  "Not interested at this time",
  "Left a flyer",
  "Spoke for ~10 minutes about the issue",
];

// Boulder, CO downtown — used as the centroid for jittered coords so the map
// looks plausible without hitting the network.
const CENTER = { lat: 40.015, lng: -105.2705 };
const SPREAD = 0.015; // ~1.5km in each direction

function makeRecord<T>(rnd: () => number, choices: readonly T[]): T {
  return choices[Math.floor(rnd() * choices.length)];
}

async function main() {
  faker.seed(42);
  const targetCount = 30;
  const zip = "80302";

  console.log(`Generating ${targetCount} addresses in Boulder, CO…`);

  const addresses: Address[] = [];
  const people: Person[] = [];
  const visits: Visit[] = [];

  let nextAddressId = 1;
  let nextPersonId = 1;
  let nextVisitId = 1;

  const used = new Set<string>();
  for (let i = 0; i < targetCount; i++) {
    let street = "";
    for (let tries = 0; tries < 20; tries++) {
      const number = faker.number.int({ min: 100, max: 4999 });
      const streetName = faker.helpers.arrayElement(BOULDER_STREETS);
      const candidate = `${number} ${streetName}`;
      if (!used.has(candidate)) {
        used.add(candidate);
        street = candidate;
        break;
      }
    }
    if (!street) street = `${faker.number.int({ min: 100, max: 4999 })} ${faker.helpers.arrayElement(BOULDER_STREETS)}`;

    const jitter = 0.0008;
    const lat = CENTER.lat + (Math.random() - 0.5) * SPREAD + (Math.random() - 0.5) * jitter;
    const lng = CENTER.lng + (Math.random() - 0.5) * SPREAD + (Math.random() - 0.5) * jitter;

    const addr: Address = {
      id: nextAddressId++,
      lat,
      lng,
      street,
      city: "Boulder",
      state: "CO",
      zip,
      geocodedAt: new Date(),
      createdAt: new Date(),
    };
    addresses.push(addr);

    const peopleCount = faker.number.int({ min: 1, max: 4 });
    const residents: Person[] = [];
    for (let p = 0; p < peopleCount; p++) {
      const sex = faker.person.sexType();
      const person: Person = {
        id: nextPersonId++,
        addressId: addr.id,
        firstName: faker.person.firstName(sex),
        lastName: faker.person.lastName(),
        age: faker.number.int({ min: 19, max: 92 }),
        party: makeRecord(Math.random, PARTIES),
        source: "seed:faker",
      };
      people.push(person);
      residents.push(person);
    }

    if (Math.random() < 0.3) {
      const talked = Math.random() < 0.6;
      const visit: Visit = {
        id: nextVisitId++,
        addressId: addr.id,
        personId: residents[Math.floor(Math.random() * residents.length)].id,
        visitedAt: faker.date.recent({ days: 30 }),
        homeStatus: makeRecord(Math.random, ["home", "not_home", "unknown"] as const),
        talked,
        interested: talked ? Math.random() < 0.4 : null,
        notes: talked ? makeRecord(Math.random, NOTES) : null,
        contactEmail: talked && Math.random() < 0.3 ? faker.internet.email() : null,
        contactPhone: talked && Math.random() < 0.2 ? faker.phone.number() : null,
      };
      visits.push(visit);
    }
  }

  const out: SeedFile = {
    addresses,
    people,
    visits,
    nextIds: { address: nextAddressId, person: nextPersonId, visit: nextVisitId },
  };

  const outPath = resolve(process.cwd(), "data/seed.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(
    `Done. Wrote ${addresses.length} addresses, ${people.length} people, ${visits.length} visits → ${outPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
