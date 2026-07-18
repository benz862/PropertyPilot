import { describe, expect, it } from "vitest";

import { parseMlsUploadText } from "./mls-upload-parser";

describe("parseMlsUploadText", () => {
  it("normalizes common MLS CSV headers", () => {
    const result = parseMlsUploadText(
      "listing.csv",
      [
        "Street Address,City,State,Zip,List Price,Beds,Baths,Sq Ft,Public Remarks,Features",
        "\"123 Main St\",Austin,TX,78701,\"$725,000\",4,3,2450,\"Updated kitchen\",\"Pool; Solar\"",
      ].join("\n"),
    );

    expect(result.structured).toMatchObject({
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      listing_price: 725000,
      bedrooms: 4,
      bathrooms: 3,
      square_feet: 2450,
      public_remarks: "Updated kitchen",
      features: ["Pool", "Solar"],
    });
    expect(result.rawText).toContain("Street Address");
  });

  it("normalizes MLS JSON objects", () => {
    const result = parseMlsUploadText(
      "listing.json",
      JSON.stringify({
        "Street Address": "456 Oak Ave",
        "List Price": "$550,000",
        Beds: "3",
        Remarks: "Close to downtown",
      }),
    );

    expect(result.structured).toMatchObject({
      street: "456 Oak Ave",
      listing_price: 550000,
      bedrooms: 3,
      public_remarks: "Close to downtown",
    });
  });
});
