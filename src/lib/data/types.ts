export type HomeStatus = "home" | "not_home" | "unknown";
export const homeStatuses: readonly HomeStatus[] = ["home", "not_home", "unknown"];

export type Address = {
  id: number;
  lat: number;
  lng: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  geocodedAt: Date | null;
  createdAt: Date;
};

export type NewAddress = Omit<Address, "id" | "createdAt"> & {
  id?: number;
  createdAt?: Date;
};

export type Person = {
  id: number;
  addressId: number;
  firstName: string;
  lastName: string;
  age: number | null;
  party: string | null;
  source: string | null;
};

export type NewPerson = Omit<Person, "id"> & { id?: number };

export type Visit = {
  id: number;
  addressId: number;
  personId: number | null;
  visitedAt: Date;
  homeStatus: HomeStatus;
  talked: boolean;
  interested: boolean | null;
  notes: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export type NewVisit = Omit<Visit, "id" | "visitedAt"> & {
  id?: number;
  visitedAt?: Date;
};

export type AddressWithStats = Address & {
  peopleCount: number;
  lastVisit: Visit | null;
  visitCount: number;
};

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

export type ImportSummary = {
  id: number;
  filename: string;
  rowCount: number;
  addressesAdded: number;
  peopleAdded: number;
  geocodedCount: number;
  failed: Array<{ row: number; reason: string; data: Record<string, unknown> }>;
};

export type SeedFile = {
  addresses: Address[];
  people: Person[];
  visits: Visit[];
  nextIds: { address: number; person: number; visit: number };
};
