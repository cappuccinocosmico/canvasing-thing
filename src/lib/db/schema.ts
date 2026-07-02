import { sqliteTable, integer, text, real, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const addresses = sqliteTable(
  "addresses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    street: text("street").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zip: text("zip").notNull(),
    geocodedAt: integer("geocoded_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    geoIdx: index("address_geo_idx").on(t.lat, t.lng),
  }),
);

export const people = sqliteTable(
  "people",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    addressId: integer("address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    age: integer("age"),
    party: text("party"),
    source: text("source"),
  },
  (t) => ({
    addressIdx: index("people_address_idx").on(t.addressId),
  }),
);

export const homeStatuses = ["home", "not_home", "unknown"] as const;
export type HomeStatus = (typeof homeStatuses)[number];

export const visits = sqliteTable(
  "visits",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    addressId: integer("address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
    personId: integer("person_id").references(() => people.id, { onDelete: "set null" }),
    visitedAt: integer("visited_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    homeStatus: text("home_status", { enum: homeStatuses }).notNull().default("unknown"),
    talked: integer("talked", { mode: "boolean" }).notNull().default(false),
    interested: integer("interested", { mode: "boolean" }),
    notes: text("notes"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
  },
  (t) => ({
    addressIdx: index("visits_address_idx").on(t.addressId),
    visitedAtIdx: index("visits_visited_at_idx").on(t.visitedAt),
  }),
);

export const importStatuses = ["pending", "complete", "failed"] as const;
export type ImportStatus = (typeof importStatuses)[number];

export const imports = sqliteTable("imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  rowCount: integer("row_count").notNull().default(0),
  status: text("status", { enum: importStatuses }).notNull().default("pending"),
  error: text("error"),
});

export const addressesRelations = relations(addresses, ({ many }) => ({
  people: many(people),
  visits: many(visits),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  address: one(addresses, { fields: [people.addressId], references: [addresses.id] }),
  visits: many(visits),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  address: one(addresses, { fields: [visits.addressId], references: [addresses.id] }),
  person: one(people, { fields: [visits.personId], references: [people.id] }),
}));

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
export type Import = typeof imports.$inferSelect;
