import type { LotEvent } from "@/lib/contracts";
import type { PlatformAdapter } from "./adapter";
import { MockAdapter } from "./mock";

// Registre des adapters. Le swap mock → API réelle est un one-liner :
// remplacer `new MockAdapter("ebay")` par `new EbayAdapter()` ici, et rien
// d'autre ne bouge (ni routes, ni UI).

const adapters: Record<LotEvent["platform"], PlatformAdapter> = {
  ebay: new MockAdapter("ebay"),
  catawiki: new MockAdapter("catawiki"),
  drouot: new MockAdapter("drouot"),
};

export function getAdapter(platform: LotEvent["platform"]): PlatformAdapter {
  return adapters[platform];
}

export type { PlatformAdapter };
