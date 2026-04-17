import { describe, expect, it } from "vitest";
import { parseBnrEurXml } from "../bnrEurRate";

describe("parseBnrEurXml", () => {
  it("parses the EUR rate and publishing date", () => {
    const result = parseBnrEurXml(`
      <DataSet>
        <Body>
          <Cube date="2026-04-17">
            <Rate currency="EUR">4.9764</Rate>
          </Cube>
        </Body>
      </DataSet>
    `);

    expect(result).toEqual({ date: "2026-04-17", ronPerEur: 4.9764 });
  });

  it("supports rates with a multiplier", () => {
    const result = parseBnrEurXml(`
      <Cube date="2026-04-17">
        <Rate currency="EUR" multiplier="100">497.64</Rate>
      </Cube>
    `);

    expect(result.ronPerEur).toBe(4.9764);
  });

  it("throws when the Cube date is missing", () => {
    expect(() => parseBnrEurXml(`<Rate currency="EUR">4.9764</Rate>`)).toThrow(
      "missing Cube date",
    );
  });

  it("throws when the EUR rate is missing", () => {
    expect(() => parseBnrEurXml(`<Cube date="2026-04-17"></Cube>`)).toThrow(
      "missing EUR rate",
    );
  });
});
