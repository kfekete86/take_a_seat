import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
  facebookPageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
  facebookPageId: process.env.FACEBOOK_PAGE_ID || '',
  cronSchedule: process.env.CRON_SCHEDULE || '0 * * * *',
  autoPostEnabled: process.env.AUTO_POST_ENABLED === 'true',
  f1Season: process.env.F1_SEASON ? parseInt(process.env.F1_SEASON) : new Date().getFullYear(),
  logLevel: process.env.LOG_LEVEL || 'info',
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.facebookPageAccessToken) {
    errors.push('FACEBOOK_PAGE_ACCESS_TOKEN is required');
  }

  if (!config.facebookPageId) {
    errors.push('FACEBOOK_PAGE_ID is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
