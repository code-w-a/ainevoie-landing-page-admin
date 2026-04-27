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

  it("returns București sectors for county code B", () => {
    expect(getCitiesByCounty("B")).toEqual([
      expect.objectContaining({
        cityCode: "179141",
        cityName: "Sector 1",
      }),
      expect.objectContaining({
        cityCode: "179150",
        cityName: "Sector 2",
      }),
      expect.objectContaining({
        cityCode: "179169",
        cityName: "Sector 3",
      }),
      expect.objectContaining({
        cityCode: "179178",
        cityName: "Sector 4",
      }),
      expect.objectContaining({
        cityCode: "179187",
        cityName: "Sector 5",
      }),
      expect.objectContaining({
        cityCode: "179196",
        cityName: "Sector 6",
      }),
    ]);
  });

  it("does not accept a city under the wrong county", () => {
    const sector = findRomaniaCity("B", "179196");

    expect(sector?.cityName).toBe("Sector 6");
    expect(isRomaniaCityForCounty("CJ", "179196")).toBe(false);
  });

  it("validates county codes case-insensitively", () => {
    expect(isRomaniaCountyCode("b")).toBe(true);
    expect(isRomaniaCountyCode("XX")).toBe(false);
  });
});
