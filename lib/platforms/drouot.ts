import type { PlatformAdapter } from "./adapter";

// Stub — l'API officielle Drouot Digital sera branchée post-hackathon.
export class DrouotAdapter implements PlatformAdapter {
  id = "drouot" as const;
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
