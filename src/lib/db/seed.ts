/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { addresses, people, visits } from "./schema";
import { runMigrations } from "./migrate";

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
  "4th St",
  "Valmont Rd",
  "Jay Rd",
  "Lookout Rd",
  "Baseline Rd",
];

const PARTIES = ["DEM", "REP", "UNA", "LIB", "GRE"] as const;

type GeocodeResult = { lat: number; lng: number } | null;

async function geocodeBoulder(street: string, zip: string): Promise<GeocodeResult> {
  const q = `${street}, Boulder, CO ${zip}`;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CanvasingThing/0.1" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { features: Array<{ geometry: { coordinates: [number, number] } }> };
    const feat = data.features?.[0];
    if (!feat) return null;
    const [lng, lat] = feat.geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function main() {
  faker.seed(42);
  const target = 60;

  console.log("Running migrations…");
  await runMigrations();

  console.log("Clearing existing data…");
  db.delete(visits).run();
  db.delete(people).run();
  db.delete(addresses).run();

  const targetCount = 30;
  console.log(`Seeding ${targetCount} addresses in Boulder, CO (1.1s rate limit per geocode request)…`);
  const zip = "80302";

  let added = 0;
  let attempt = 0;
  const maxAttempts = targetCount * 4;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  while (added < targetCount && attempt < maxAttempts) {
    attempt++;
    const streetName = faker.helpers.arrayElement(BOULDER_STREETS);
    const number = faker.number.int({ min: 100, max: 4999 });
    const street = `${number} ${streetName}`;

    process.stdout.write(`  [${added + 1}/${targetCount}] ${street}… `);
    const geo = await geocodeBoulder(street, zip);
    if (!geo) {
      console.log("no match");
      await sleep(1100);
      continue;
    }
    console.log("✓");

    // jitter slightly so duplicate-number streets don't perfectly stack
    const jitter = 0.0008;
    const lat = geo.lat + (Math.random() - 0.5) * jitter;
    const lng = geo.lng + (Math.random() - 0.5) * jitter;

    const addr = db
      .insert(addresses)
      .values({
        street,
        city: "Boulder",
        state: "CO",
        zip,
        lat,
        lng,
        geocodedAt: new Date(),
      })
      .returning()
      .get();
    added++;

    const peopleCount = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < peopleCount; i++) {
      const sex = faker.person.sexType();
      const first = faker.person.firstName(sex);
      const last = faker.person.lastName();
      db.insert(people)
        .values({
          addressId: addr.id,
          firstName: first,
          lastName: last,
          age: faker.number.int({ min: 19, max: 92 }),
          party: faker.helpers.arrayElement(PARTIES),
          source: "seed:faker",
        })
        .run();
    }

    // ~30% chance of an existing visit
    if (Math.random() < 0.3) {
      const residents = db
        .select()
        .from(people)
        .where(eq(people.addressId, addr.id))
        .all();
      const talked = Math.random() < 0.6;
      db.insert(visits)
        .values({
          addressId: addr.id,
          personId: faker.helpers.arrayElement(residents).id,
          homeStatus: faker.helpers.arrayElement(["home", "not_home", "unknown"] as const),
          talked,
          interested: talked ? Math.random() < 0.4 : null,
          notes: talked
            ? faker.helpers.arrayElement([
                "Interested in volunteering",
                "Asked us to come back next week",
                "Wants more info via email",
                "Not interested at this time",
                "Left a flyer",
                "Spoke for ~10 minutes about the issue",
              ])
            : null,
          contactEmail: talked && Math.random() < 0.3 ? faker.internet.email() : null,
          contactPhone: talked && Math.random() < 0.2 ? faker.phone.number() : null,
        })
        .run();
    }

    if (added % 5 === 0) {
      console.log(`  …${added}/${targetCount} added`);
    }
    await sleep(1100); // Nominatim usage policy: max 1 req/sec
  }

  const counts = {
    addresses: db.select().from(addresses).all().length,
    people: db.select().from(people).all().length,
    visits: db.select().from(visits).all().length,
  };
  console.log("Done.", counts);
  if (added < targetCount) {
    console.warn(
      `Note: only added ${added}/${targetCount} addresses — Nominatim returned no results for the rest.`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
