import type { PlatformAdapter } from "./adapter";

// Stub — l'API officielle Catawiki sera branchée post-hackathon.
export class CatawikiAdapter implements PlatformAdapter {
  id = "catawiki" as const;
  searchListings(): never {
    throw new Error("API officielle branchée post-hackathon");
  }
  getPastSales(): never {
    throw new Error("API officielle branchée post-hackathon");
  }
  subscribeLot(): never {
    throw new Error("API officielle branchée post-hackathon");
  }
  placeBid(): never {
    throw new Error("API officielle branchée post-hackathon");
  }
}
