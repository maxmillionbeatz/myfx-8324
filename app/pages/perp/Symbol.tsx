import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { API } from "@orderly.network/types";
import { TradingPage } from "@orderly.network/trading";
import { useTickerStream } from "@orderly.network/hooks";
import { updateSymbol } from "@/utils/storage";
import { formatSymbol, generatePageTitle } from "@/utils/utils";
import { useOrderlyConfig } from "@/utils/config";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

export default function PerpSymbol() {
  const params = useParams();
  const [symbol, setSymbol] = useState(params.symbol!);
  const config = useOrderlyConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 1. DATA: Get real-time data
  const ticker = useTickerStream(symbol);

  // 2. DATA CLEANING: Ensure no "undefined" errors
  const currentPrice = ticker?.["24h_close"] ? String(ticker["24h_close"]) : "---";
  const volume24h = ticker?.["24h_amount"] ? (ticker["24h_amount"] / 1000000).toFixed(2) + "M" : "---";
  const fundingRate = ticker?.est_funding_rate
    ? (ticker.est_funding_rate * 100).toFixed(4) + "%"
    : "---";

  const rawSymbol = params.symbol || "";
  const cleanSymbol = rawSymbol.includes('_') ? rawSymbol.split('_')[1] : rawSymbol;

  // 3. SEO TEXT GENERATION
  const seoDescription = `The current price of ${cleanSymbol} is $${currentPrice}. 24h trading volume is $${volume24h}. Long or Short ${cleanSymbol} with up to 100x leverage and ${fundingRate} funding rate on Oklong.`;

  // 4. JSON-LD STRUCTURED DATA (The "Rich Snippet" Magic)
  // We treat the Contract like a "Product" so Google shows the Price.
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": `${cleanSymbol} Perpetual Futures Contract`,
    "image": `https://oklong.io/assets/coins/${cleanSymbol}.png`, // Make sure this path exists or remove this line
    "description": `Trade ${cleanSymbol} perps with 100x leverage.`,
    "brand": {
      "@type": "Organization",
      "name": "Oklong"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://oklong.io/perp/${rawSymbol}`,
      "priceCurrency": "USD",
      "price": currentPrice !== "---" ? currentPrice : "0",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }
  };

  useEffect(() => {
    updateSymbol(symbol);
  }, [symbol]);

  const onSymbolChange = useCallback(
    (data: API.Symbol) => {
      const symbol = data.symbol;
      setSymbol(symbol);
      const searchParamsString = searchParams.toString();
      const queryString = searchParamsString ? `?${searchParamsString}` : '';
      navigate(`/perp/${symbol}${queryString}`);
    },
    [navigate, searchParams]
  );

  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle(formatSymbol(params.symbol!));

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}

      <Helmet>
        {/* Dynamic Title & Meta */}
        <title>Trade {cleanSymbol} (${currentPrice}) | Oklong DEX</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`https://oklong.io/perp/${rawSymbol}`} />

        {/* Social Cards */}
        <meta property="og:title" content={`Long/Short ${cleanSymbol} ($${currentPrice})`} />
        <meta property="og:description" content={`24h Volume: $${volume24h} | Funding: ${fundingRate}`} />
        <meta property="og:url" content={`https://oklong.io/perp/${rawSymbol}`} />

        {/* INJECT JSON-LD HERE */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* Hidden SEO Text Block (Kept from previous step) */}
      <div style={{ height: 0, width: 0, overflow: 'hidden', position: 'absolute', opacity: 0 }}>
        <h1>Trade {cleanSymbol} Perpetual Futures</h1>
        <p>{seoDescription}</p>
        <ul>
          <li>Symbol: {cleanSymbol}</li>
          <li>Current Price: {currentPrice} USD</li>
          <li>24h Volume: {volume24h} USD</li>
          <li>Liquidity Source: Orderly Network</li>
        </ul>
      </div>

      <TradingPage
        symbol={symbol}
        onSymbolChange={onSymbolChange}
        tradingViewConfig={config.tradingPage.tradingViewConfig}
        sharePnLConfig={config.tradingPage.sharePnLConfig}
      />
    </>
  );
}