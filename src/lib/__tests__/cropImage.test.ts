import { afterEach, describe, expect, it, vi } from "vitest";
import { createSquareAvatarFile } from "../cropImage";

describe("createSquareAvatarFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports a 1024 square jpg from the selected crop", async () => {
    const drawImage = vi.fn();
    const toBlob = vi.fn(
      (
        callback: BlobCallback,
        type?: string,
      ) => callback(new Blob(["avatar"], { type: type || "image/jpeg" }))
    );
    const canvas = {
      getContext: vi.fn(() => ({ drawImage })),
      height: 0,
      toBlob,
      width: 0,
    };

    class FakeImage {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("window", { Image: FakeImage });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => canvas),
    });

    const file = await createSquareAvatarFile(
      "blob:avatar-source",
      { height: 320, width: 320, x: 40, y: 80 },
      "provider-avatar.jpg"
    );

    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(1024);
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(FakeImage),
      40,
      80,
      320,
      320,
      0,
      0,
      1024,
      1024
    );
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.92);
    expect(file.name).toBe("provider-avatar.jpg");
    expect(file.type).toBe("image/jpeg");
  });
});
