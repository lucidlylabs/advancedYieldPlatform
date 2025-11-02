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
          "header": "eyJmaWQiOjIyODcsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNzBlMTgwNTMxNUMxYUY1ZjA3MDQ3Njc4MEZDQTY1OTMwMzNlMzYxIn0",
          "payload": "eyJkb21haW4iOiJhcHAubHVjaWRseS5maW5hbmNlIn0",
          "signature": "J/ee7swoif6sa1+yg0BTHvD4Aofp3YIjS89gk+6NlulD9qD0aFAjD8sulX2yyQIgateZ2k0PWhMVgnDo7mucLBw="
        },
    baseBuilder: {
      ownerAddress: "0xF902E6483c651CfB1F8518D069e70Ebd9b9e7606" // add your Base Account address here
    },
    miniapp: {
      ...withValidProperties({
        version: "1",
        name: "Lucidly",
        homeUrl: `${URL}/farcaster`,
        iconUrl: `${URL}/images/logo/Dark_Logomark_1024_1024.png`,
        imageUrl: `${URL}/images/logo/Dark_Logomark_200_200.png`, // Required for Base Build preview
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
        ogImageUrl: `${URL}/images/logo/Dark_Logomark_200_200.png`
      }),
      noindex: false, // Explicitly set to false to enable indexing
      // webhookUrl is omitted since we're not using webhooks
    }
  };

  return Response.json(manifest);
}

