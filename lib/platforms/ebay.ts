import type { PlatformAdapter } from "./adapter";

// Stub — l'API officielle eBay (Browse + Bidding) sera branchée post-hackathon.
export class EbayAdapter implements PlatformAdapter {
  id = "ebay" as const;
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
