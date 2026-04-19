import axios from 'axios';
import { F1Session, F1Meeting, F1DriverResult } from '../types';
import { logger } from '../utils/logger';

const OPENF1_API_BASE = 'https://api.openf1.org/v1';

/**
 * Service for interacting with the OpenF1 API
 */
export class F1ApiService {
  /**
   * Get all sessions for a specific year
   */
  async getSessions(year: number): Promise<F1Session[]> {
    try {
      logger.debug(`Fetching F1 sessions for year ${year}`);
      const response = await axios.get<F1Session[]>(`${OPENF1_API_BASE}/sessions`, {
        params: { year },
      });
      logger.debug(`Retrieved ${response.data.length} sessions`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching F1 sessions', error);
      throw new Error(`Failed to fetch F1 sessions: ${error}`);
    }
  }

  /**
   * Get meetings (race weekends) for a specific year
   */
  async getMeetings(year: number): Promise<F1Meeting[]> {
    try {
      logger.debug(`Fetching F1 meetings for year ${year}`);
      const response = await axios.get<F1Meeting[]>(`${OPENF1_API_BASE}/meetings`, {
        params: { year },
      });
      logger.debug(`Retrieved ${response.data.length} meetings`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching F1 meetings', error);
      throw new Error(`Failed to fetch F1 meetings: ${error}`);
    }
  }

  /**
   * Get a specific session by session key
   */
  async getSession(sessionKey: number): Promise<F1Session | null> {
    try {
      logger.debug(`Fetching session with key ${sessionKey}`);
      const response = await axios.get<F1Session[]>(`${OPENF1_API_BASE}/sessions`, {
        params: { session_key: sessionKey },
      });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      logger.error(`Error fetching session ${sessionKey}`, error);
      throw new Error(`Failed to fetch session: ${error}`);
    }
  }

  /**
   * Get the latest completed session
   */
  async getLatestCompletedSession(): Promise<F1Session | null> {
    try {
      const currentYear = new Date().getFullYear();
      const sessions = await this.getSessions(currentYear);

      const now = new Date();
      const completedSessions = sessions.filter(session => {
        const endDate = new Date(session.date_end);
        return endDate < now;
      });

      if (completedSessions.length === 0) {
        logger.info('No completed sessions found');
        return null;
      }

      // Sort by end date descending to get the most recent
      completedSessions.sort((a, b) =>
        new Date(b.date_end).getTime() - new Date(a.date_end).getTime()
      );

      return completedSessions[0];
    } catch (error) {
      logger.error('Error getting latest completed session', error);
      throw new Error(`Failed to get latest completed session: ${error}`);
    }
  }

  /**
   * Get the next upcoming session
   */
  async getNextSession(): Promise<F1Session | null> {
    try {
      const currentYear = new Date().getFullYear();
      const sessions = await this.getSessions(currentYear);

      const now = new Date();
      const upcomingSessions = sessions.filter(session => {
        const startDate = new Date(session.date_start);
        return startDate > now;
      });

      if (upcomingSessions.length === 0) {
        logger.info('No upcoming sessions found');
        return null;
      }

      // Sort by start date ascending to get the next one
      upcomingSessions.sort((a, b) =>
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      );

      return upcomingSessions[0];
    } catch (error) {
      logger.error('Error getting next session', error);
      throw new Error(`Failed to get next session: ${error}`);
    }
  }

  /**
   * Get driver standings/results for a specific session
   * Note: OpenF1 API provides position data which we can use for results
   */
  async getSessionResults(sessionKey: number): Promise<F1DriverResult[]> {
    try {
      logger.debug(`Fetching results for session ${sessionKey}`);

      // Get position data from the session
      const response = await axios.get(`${OPENF1_API_BASE}/position`, {
        params: {
          session_key: sessionKey,
        },
      });

      if (!response.data || response.data.length === 0) {
        logger.warn(`No position data found for session ${sessionKey}`);
        return [];
      }

      // Get driver information
      const driversResponse = await axios.get(`${OPENF1_API_BASE}/drivers`, {
        params: {
          session_key: sessionKey,
        },
      });

      const drivers = driversResponse.data;

      // Group position data by driver and get final positions
      const driverPositions = new Map<number, any>();

      response.data.forEach((pos: any) => {
        const existing = driverPositions.get(pos.driver_number);
        if (!existing || new Date(pos.date) > new Date(existing.date)) {
          driverPositions.set(pos.driver_number, pos);
        }
      });

      // Create results array
      const results: F1DriverResult[] = [];

      driverPositions.forEach((pos, driverNumber) => {
        const driver = drivers.find((d: any) => d.driver_number === driverNumber);
        if (driver && pos.position) {
          results.push({
            position: pos.position,
            driver_number: driverNumber,
            broadcast_name: driver.broadcast_name || driver.full_name,
            team_name: driver.team_name,
            time: '', // Will be populated separately if available
            gap_to_leader: '',
          });
        }
      });

      // Sort by position
      results.sort((a, b) => a.position - b.position);

      logger.debug(`Retrieved ${results.length} driver results`);
      return results;
    } catch (error) {
      logger.error(`Error fetching session results for ${sessionKey}`, error);
      throw new Error(`Failed to fetch session results: ${error}`);
    }
  }

  /**
   * Get race control messages which can help determine if a session is complete
   */
  async isSessionComplete(sessionKey: number): Promise<boolean> {
    try {
      const response = await axios.get(`${OPENF1_API_BASE}/race_control`, {
        params: { session_key: sessionKey },
      });

      // Check if there's a message indicating session end
      const messages = response.data;
      const hasEndMessage = messages.some((msg: any) =>
        msg.message && (
          msg.message.includes('CHEQUERED FLAG') ||
          msg.message.includes('END OF SESSION') ||
          msg.message.includes('SESSION FINISHED')
        )
      );

      return hasEndMessage;
    } catch (error) {
      logger.debug(`Could not determine session completion status: ${error}`);
      // If we can't get race control messages, assume complete if past end time
      const session = await this.getSession(sessionKey);
      if (session) {
        return new Date(session.date_end) < new Date();
      }
      return false;
    }
  }
}
