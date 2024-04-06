import { ScraperScrapingResult } from 'israeli-bank-scrapers';
import getScrapers from './getScrapers';
import scrape from './scrape';
import { Transaction } from 'israeli-bank-scrapers/lib/transactions';
import { requests } from './requests';

const filter = (transaction: Transaction) =>
  transaction.description === 'אופה חלומות נורית אלפנדרי';

scrape(requests, filter).catch(console.error);
