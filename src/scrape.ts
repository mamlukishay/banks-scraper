import {
  CompanyTypes,
  ScraperCredentials,
  createScraper,
} from 'israeli-bank-scrapers';
import Papa from 'papaparse';
import fs from 'fs';
import { Transaction } from 'israeli-bank-scrapers/lib/transactions';

const fieldsToScrape = [
  'vendor',
  'accountNumber',
  'identifier',
  'type',
  'status',
  'date',
  'processedDate',
  'originalAmount',
  'originalCurrency',
  'chargedAmount',
  'chargedCurrency',
  'description',
  'memo',
  'category',
];

export type ScrapingRequest = {
  companyId: CompanyTypes;
  startDate: Date;
  credentials: ScraperCredentials;
};

export default async function (
  requests: ScrapingRequest[],
  filter: (transaction: Transaction) => boolean
) {
  try {
    const filename = `${new Date().toISOString()}.csv`;

    const scrapingPromises = requests.map(async (request) => {
      const options = {
        companyId: request.companyId,
        startDate: request.startDate,
        combineInstallments: false,
        showBrowser: true,
      };

      const scraper = createScraper(options);

      const scrapeResult = await scraper.scrape(request.credentials);

      return {
        vendor: request.companyId,
        scrapeResult,
      };
    });

    const scrapingResults = await Promise.all(scrapingPromises);

    const data = scrapingResults.flatMap(({ vendor, scrapeResult }) => {
      if (!scrapeResult.success) throw new Error(scrapeResult.errorType);

      const accounts = scrapeResult.accounts ?? [];

      accounts.forEach((account) => {
        console.log(
          `found ${account.txns.length} transactions for account number ${account.accountNumber}`
        );
      });

      return accounts.flatMap((account) =>
        account.txns
          .map((txn) => ({
            vendor,
            accountNumber: account.accountNumber,
            ...txn,
          }))
          .filter(filter)
      );
    });

    const csv = Papa.unparse(data, { columns: fieldsToScrape });

    fs.writeFileSync(`${__dirname}/../results/${filename}.csv`, csv, {
      flag: 'a',
    });
  } catch (e: any) {
    console.error(`scraping failed for the following reason: ${e.message}`);
  }
}
