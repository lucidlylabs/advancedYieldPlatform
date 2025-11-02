function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || 'https://app.lucidly.finance';
  
  // Manifest object - update accountAssociation and baseBuilder.ownerAddress in step 5
  const manifest = {
    "accountAssociation": {
          "header": "eyJmaWQiOjEyMjEwNjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxOTdGMDZEQjVEQTQ2MUI4MDRhMzU5NzdlMjc5QjE4QzI0YzVFMzgwIn0",
          "payload": "eyJkb21haW4iOiJhcHAubHVjaWRseS5maW5hbmNlIn0",
          "signature": "AMH+cpExHNqkx46iAqVa9ZI3JACB5yO9OBQLZysCH64m9LZCSkQgxCgkuXq5R9+TuWsuMhXSibgcqmG9xK25BBs="
    },
    baseBuilder: {
      ownerAddress: "0xD9C78d81716E049582C83a7CE0a691a06eF2B792" // add your Base Account address here
    },
    miniapp: {
      ...withValidProperties({
        version: "1",
        name: "Lucidly",
        homeUrl: `${URL}/farcaster`,
        iconUrl: `${URL}/images/logo/Dark_Logomark_1024_1024.png`,
        imageUrl: `${URL}/assets/farcaster/og-image.png`, // Required for Base Build preview
        splashImageUrl: `${URL}/images/logo/Dark_Logomark_200_200.png`,
        splashBackgroundColor: "#080B17",
        subtitle: "Advanced Yield Platform",
        description: "Discover and earn from the best DeFi yield opportunities across multiple chains with Lucidly's advanced yield platform.",
        screenshotUrls: [
          `${URL}/assets/farcaster/screenshot1.png`,
          `${URL}/assets/farcaster/screenshot2.png`,
          `${URL}/assets/farcaster/screenshot3.png`
        ],
        primaryCategory: "finance",
        tags: ["defi", "yield", "earn", "finance", "crypto"],
        heroImageUrl: `${URL}/assets/farcaster/hero.png`,
        tagline: "Maximize Your DeFi Returns",
        ogTitle: "Lucidly",
        ogDescription: "Discover and earn from the best DeFi yield opportunities across multiple chains.",
        ogImageUrl: `${URL}/assets/farcaster/og-image.png`
      })
    }
  };

  return Response.json(manifest);
}

