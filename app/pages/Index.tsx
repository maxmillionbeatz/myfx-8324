import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { DEFAULT_SYMBOL } from "@/utils/storage";
import { getPageMeta } from "@/utils/seo";
import { getRuntimeConfig } from "@/utils/runtime-config";
import { renderSEOTags } from "@/utils/seo-tags";

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const searchParamsString = searchParams.toString();
    const redirectPath = `/perp/${DEFAULT_SYMBOL}${searchParamsString ? `?${searchParamsString}` : ''}`;
    navigate(redirectPath);
  }, [navigate, searchParams]);

  const pageMeta = getPageMeta();
  const appName = getRuntimeConfig("VITE_APP_NAME");

  return (
    <>
      {/* 1. Render standard tags (viewport, charset, etc.) */}
      {renderSEOTags(pageMeta, appName || undefined)}

      {/* 2. SEO OVERRIDE: Force Google to see these keywords before the redirect */}
      <Helmet>
        {/* The Title needs to contain "Orderly Network" and "No KYC" to rank */}
        <title>Oklong | Trade Perps on Orderly Network (No KYC)</title>

        {/* The Description needs to sell the benefits (Low Fees, Deep Liquidity) */}
        <meta
          name="description"
          content="Trade BTC, ETH, and SOL futures with deep orderbook liquidity. The fastest interface for Orderly Network. Gas-free, self-custody, and instant settlement."
        />

        {/* Canonical ensures this root domain owns the ranking, not the redirect target */}
        <link rel="canonical" href="https://oklong.io/" />

        {/* Open Graph Fix: Ensures your link looks good when shared on Discord/X */}
        <meta property="og:title" content="Oklong | No KYC Orderly DEX" />
        <meta property="og:description" content="Trade Crypto Perps with up to 50x leverage. Gas-free." />
        <meta property="og:url" content="https://oklong.io/" />
        <meta property="og:type" content="website" />
      </Helmet>
    </>
  );
}