

import { SharePnLWidget } from '@/components/CustomShare';
import { useOrderlyConfig } from '@/utils/config';
// import { SharePnLDialogWidget } from '@orderly.network/ui-share';

export function SharePnl() {
    const config = useOrderlyConfig();

    console.log(config.tradingPage.sharePnLConfig)

    return (<>
        <SharePnLWidget
            hide={false}
            pnl={{
                entity: {
                    symbol: "BTC-PERP",
                    side: "LONG",
                    pnl: -123.45,
                    roi: -0.12,
                    openPrice: 43000,
                    markPrice: 43500,
                    quantity: 0.5,
                    leverage: 10,
                    openTime: Date.now() - 60_000
                },
                // backgroundImages: [
                //     "https://cdn.oklong.io/pnl/poster1.jpg"
                // ],
                // refLink: "https://oklong.io",
                // refSlogan: "Trade on OKLONG"

                ...config.tradingPage.sharePnLConfig
            }}
        />
    </>)
}