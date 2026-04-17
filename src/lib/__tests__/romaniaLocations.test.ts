import { describe, expect, it } from "vitest";
import {
  ROMANIA_COUNTIES,
  ROMANIA_URBAN_LOCALITIES,
  findRomaniaCity,
  getCitiesByCounty,
  isRomaniaCityForCounty,
  isRomaniaCountyCode,
} from "../romaniaLocations";

describe("Romania locations dataset", () => {
  it("contains unique county codes", () => {
    const codes = ROMANIA_COUNTIES.map((county) => county.code);

    expect(codes).toHaveLength(42);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("links every urban locality to a valid county", () => {
    const countyCodes = new Set(ROMANIA_COUNTIES.map((county) => county.code));

    expect(ROMANIA_URBAN_LOCALITIES.length).toBeGreaterThan(300);
    expect(
      ROMANIA_URBAN_LOCALITIES.every((city) => countyCodes.has(city.countyCode))
    ).toBe(true);
  });

  it("returns București for county code B", () => {
    expect(getCitiesByCounty("B")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cityCode: "179132",
          cityName: "București",
        }),
      ])
    );
  });

  it("does not accept a city under the wrong county", () => {
    const bucuresti = findRomaniaCity("B", "179132");

    expect(bucuresti?.cityName).toBe("București");
    expect(isRomaniaCityForCounty("CJ", "179132")).toBe(false);
  });

  it("validates county codes case-insensitively", () => {
    expect(isRomaniaCountyCode("b")).toBe(true);
    expect(isRomaniaCountyCode("XX")).toBe(false);
  });
});
