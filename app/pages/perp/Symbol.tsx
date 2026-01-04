import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async"; // <--- IMPORT THIS
import { API } from "@orderly.network/types";
import { TradingPage } from "@orderly.network/trading";
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

  // --- SEO HELPER LOGIC ---
  // Orderly symbols look like "PERP_BTC_USDC". We want just "BTC".
  const rawSymbol = params.symbol || "";
  const cleanSymbol = rawSymbol.includes('_') ? rawSymbol.split('_')[1] : rawSymbol;
  // ------------------------

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
      {/* 1. Standard Tags (Keep these for fallback) */}
      {renderSEOTags(pageMeta, pageTitle)}

      {/* 2. DYNAMIC SEO OVERRIDE (This is what fixes the Google Indexing) */}
      <Helmet>
        <title>Trade {cleanSymbol} Perp | Long/Short {cleanSymbol} | Oklong</title>

        <meta
          name="description"
          content={`Trade ${cleanSymbol} perpetual futures with up to 50x leverage. Deep liquidity, low fees, and no gas. Powered by Orderly Network.`}
        />

        {/* Canonical Link: Prevents "Duplicate Content" penalties */}
        <link rel="canonical" href={`https://oklong.io/perp/${rawSymbol}`} />

        {/* Social Cards: Makes your link look professional on Twitter/Discord */}
        <meta property="og:title" content={`Long/Short ${cleanSymbol} - No KYC`} />
        <meta property="og:description" content={`Trade ${cleanSymbol} with deep liquidity on Oklong.`} />
        <meta property="og:url" content={`https://oklong.io/perp/${rawSymbol}`} />
      </Helmet>

      {/* 3. The actual Trading Interface */}
      <TradingPage
        symbol={symbol}
        onSymbolChange={onSymbolChange}
        tradingViewConfig={config.tradingPage.tradingViewConfig}
        sharePnLConfig={config.tradingPage.sharePnLConfig}
      />
    </>
  );
}