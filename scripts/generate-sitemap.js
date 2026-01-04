import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Reconstruct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const BASE_URL = 'https://oklong.io';
const API_URL = 'https://api-evm.orderly.org/v1/public/info';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

const generateSitemap = async () => {
    console.log('🔄 Fetching Orderly Network pairs...');

    https.get(API_URL, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);

                if (!json.success || !json.data.rows) {
                    throw new Error('Invalid API response');
                }

                const pairs = json.data.rows
                    .filter(row => row.symbol.startsWith('PERP_'))
                    .map(row => row.symbol);

                console.log(`✅ Found ${pairs.length} active pairs.`);

                const currentDate = new Date().toISOString().split('T')[0];

                let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- STATIC CORE PAGES -->
  <url><loc>${BASE_URL}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>${BASE_URL}/markets</loc><priority>0.9</priority><changefreq>daily</changefreq></url>
  <url><loc>${BASE_URL}/leaderboard</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>${BASE_URL}/rewards</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
`;

                pairs.forEach(pair => {
                    xml += `  <url>
    <loc>${BASE_URL}/perp/${pair}</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>\n`;
                });

                xml += '</urlset>';

                fs.writeFileSync(OUTPUT_PATH, xml);
                console.log(`🎉 Sitemap generated at: ${OUTPUT_PATH}`);

            } catch (err) {
                console.error('❌ Error parsing Orderly API:', err.message);

            }
        });

    }).on('error', (err) => {
        console.error('❌ Network Error:', err.message);

    });
};

generateSitemap();