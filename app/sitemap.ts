import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://universalai.co.in",
      lastModified: new Date(),
    },
    {
      url: "https://universalai.co.in/privacy",
      lastModified: new Date(),
    },
    {
      url: "https://universalai.co.in/terms",
      lastModified: new Date(),
    },
  ];
}
