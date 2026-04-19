import { F1ApiService } from './services/f1-api.service';
import { FacebookService } from './services/facebook.service';
import { logger } from './utils/logger';
import { formatResultsPost, formatNextSessionPost, estimateTimingData } from './utils/formatter';
import { F1Session } from './types';

/**
 * Main orchestrator service that coordinates F1 data fetching and Facebook posting
 */
export class F1FacebookPoster {
  private f1Service: F1ApiService;
  private facebookService: FacebookService;
  private lastPostedSessionKey: number | null = null;

  constructor(
    facebookPageAccessToken: string,
    facebookPageId: string
  ) {
    this.f1Service = new F1ApiService();
    this.facebookService = new FacebookService(facebookPageAccessToken, facebookPageId);
  }

  /**
   * Initialize and validate services
   */
  async initialize(): Promise<void> {
    logger.info('Initializing F1 Facebook Poster...');

    // Validate Facebook token
    const isValid = await this.facebookService.validateToken();
    if (!isValid) {
      throw new Error('Invalid Facebook access token');
    }

    // Get page info to confirm access
    const pageInfo = await this.facebookService.getPageInfo();
    logger.info(`Connected to Facebook page: ${pageInfo.name}`);

    logger.info('Initialization complete');
  }

  /**
   * Check for new results and post if found
   */
  async checkAndPost(): Promise<void> {
    try {
      logger.info('Checking for new F1 session results...');

      // Get the latest completed session
      const latestSession = await this.f1Service.getLatestCompletedSession();

      if (!latestSession) {
        logger.info('No completed sessions found');
        return;
      }

      // Check if we've already posted this session
      if (this.lastPostedSessionKey === latestSession.session_key) {
        logger.info(`Session ${latestSession.session_key} already posted, skipping`);
        return;
      }

      // Verify session is actually complete
      const isComplete = await this.f1Service.isSessionComplete(latestSession.session_key);
      if (!isComplete) {
        logger.info(`Session ${latestSession.session_key} is not yet complete`);
        return;
      }

      logger.info(`Found new completed session: ${latestSession.session_name} - ${latestSession.location}`);

      // Get session results
      const results = await this.f1Service.getSessionResults(latestSession.session_key);

      if (results.length === 0) {
        logger.warn(`No results available for session ${latestSession.session_key}`);
        return;
      }

      // Estimate timing data if not available
      const resultsWithTiming = estimateTimingData(results);

      // Post results to Facebook
      await this.postResults(latestSession, resultsWithTiming);

      // Get and post next session
      const nextSession = await this.f1Service.getNextSession();
      if (nextSession) {
        await this.postNextSession(nextSession);
      }

      // Update last posted session
      this.lastPostedSessionKey = latestSession.session_key;

      logger.info('Successfully posted session results and next session');
    } catch (error) {
      logger.error('Error in checkAndPost', error);
      throw error;
    }
  }

  /**
   * Post session results to Facebook
   */
  private async postResults(session: F1Session, results: any[]): Promise<void> {
    const message = formatResultsPost(session, results);
    logger.debug('Posting results message', { message });
    await this.facebookService.postMessage(message);
  }

  /**
   * Post next session announcement to Facebook
   */
  private async postNextSession(session: F1Session): Promise<void> {
    const message = formatNextSessionPost(session);
    logger.debug('Posting next session message', { message });
    await this.facebookService.postMessage(message);
  }

  /**
   * Manually post a specific session's results
   */
  async postSessionResults(sessionKey: number): Promise<void> {
    try {
      logger.info(`Manually posting results for session ${sessionKey}`);

      const session = await this.f1Service.getSession(sessionKey);
      if (!session) {
        throw new Error(`Session ${sessionKey} not found`);
      }

      const results = await this.f1Service.getSessionResults(sessionKey);
      if (results.length === 0) {
        throw new Error(`No results available for session ${sessionKey}`);
      }

      const resultsWithTiming = estimateTimingData(results);
      await this.postResults(session, resultsWithTiming);

      const nextSession = await this.f1Service.getNextSession();
      if (nextSession) {
        await this.postNextSession(nextSession);
      }

      this.lastPostedSessionKey = sessionKey;
      logger.info('Manual post completed successfully');
    } catch (error) {
      logger.error(`Error posting session ${sessionKey}`, error);
      throw error;
    }
  }

  /**
   * Get the last posted session key (useful for persistence)
   */
  getLastPostedSessionKey(): number | null {
    return this.lastPostedSessionKey;
  }

  /**
   * Set the last posted session key (useful for restoring state)
   */
  setLastPostedSessionKey(sessionKey: number | null): void {
    this.lastPostedSessionKey = sessionKey;
  }
}
