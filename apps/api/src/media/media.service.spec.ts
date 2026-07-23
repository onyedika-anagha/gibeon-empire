import { MediaService } from "./media.service";

describe("MediaService", () => {
  const ORIGINAL = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL,
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "key123",
      CLOUDINARY_API_SECRET: "topsecret",
      CLOUDINARY_FOLDER: "gibeon/products",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL;
    jest.restoreAllMocks();
  });

  it("signs upload params as sha1(sorted-params + secret)", () => {
    // Independently computed: sha1("folder=gibeon/products&timestamp=1700000000topsecret").
    jest.spyOn(Date, "now").mockReturnValue(1700000000 * 1000);
    const sig = new MediaService().signUpload();
    expect(sig).toEqual({
      cloudName: "demo",
      apiKey: "key123",
      timestamp: 1700000000,
      folder: "gibeon/products",
      signature: "e0227c2bd124df77c2fa6eadedb445edae4cd5c7",
    });
  });

  it("refuses to sign when Cloudinary is not configured", () => {
    delete process.env.CLOUDINARY_API_SECRET;
    expect(() => new MediaService().signUpload()).toThrow(/not configured/i);
  });
});
