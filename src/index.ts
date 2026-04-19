import cron from 'node-cron';
import { F1FacebookPoster } from './poster';
import { config, validateConfig } from './config';
import { logger, setLogLevel } from './utils/logger';

/**
 * Main application entry point
 */
async function main() {
  try {
    // Set log level from config
    setLogLevel(config.logLevel as any);

    logger.info('=== F1 Facebook Poster Starting ===');

    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Create poster instance
    const poster = new F1FacebookPoster(
      config.facebookPageAccessToken,
      config.facebookPageId
    );

    // Initialize
    await poster.initialize();

    if (config.autoPostEnabled) {
      logger.info(`Scheduling automatic checks with cron: ${config.cronSchedule}`);

      // Validate cron expression
      if (!cron.validate(config.cronSchedule)) {
        throw new Error(`Invalid cron schedule: ${config.cronSchedule}`);
      }

      // Schedule the job
      const task = cron.schedule(config.cronSchedule, async () => {
        logger.info('Cron job triggered');
        try {
          await poster.checkAndPost();
        } catch (error) {
          logger.error('Error in scheduled job', error);
        }
      });

      logger.info('Cron job scheduled successfully');
      logger.info('Application running. Press Ctrl+C to stop.');

      // Also run once immediately on startup
      logger.info('Running initial check...');
      await poster.checkAndPost();

      // Keep the process alive
      process.on('SIGINT', () => {
        logger.info('Received SIGINT, stopping cron job...');
        task.stop();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        logger.info('Received SIGTERM, stopping cron job...');
        task.stop();
        process.exit(0);
      });
    } else {
      // Just run once
      logger.info('Auto-posting disabled, running once...');
      await poster.checkAndPost();
      logger.info('Done');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Fatal error in main', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Start the application
main();
