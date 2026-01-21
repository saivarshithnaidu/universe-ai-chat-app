import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://universalsai.co.in",
      lastModified: new Date(),
    },
  ];
}
