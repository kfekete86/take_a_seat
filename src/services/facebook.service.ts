import axios from 'axios';
import { FacebookPostResponse } from '../types';
import { logger } from '../utils/logger';

const FACEBOOK_GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Service for posting to Facebook using the Graph API
 */
export class FacebookService {
  private pageAccessToken: string;
  private pageId: string;

  constructor(pageAccessToken: string, pageId: string) {
    this.pageAccessToken = pageAccessToken;
    this.pageId = pageId;
  }

  /**
   * Post a message to the Facebook page
   */
  async postMessage(message: string): Promise<FacebookPostResponse> {
    try {
      logger.debug('Posting message to Facebook', { messageLength: message.length });

      const response = await axios.post<FacebookPostResponse>(
        `${FACEBOOK_GRAPH_API_BASE}/${this.pageId}/feed`,
        {
          message,
          access_token: this.pageAccessToken,
        }
      );

      logger.info('Successfully posted to Facebook', { postId: response.data.id });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error('Facebook API error', {
          status: error.response.status,
          data: error.response.data,
        });
        throw new Error(
          `Facebook API error: ${JSON.stringify(error.response.data)}`
        );
      }
      logger.error('Error posting to Facebook', error);
      throw new Error(`Failed to post to Facebook: ${error}`);
    }
  }

  /**
   * Validate the access token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API_BASE}/me`,
        {
          params: {
            access_token: this.pageAccessToken,
          },
        }
      );

      logger.info('Facebook token validated successfully', { pageId: response.data.id });
      return true;
    } catch (error) {
      logger.error('Facebook token validation failed', error);
      return false;
    }
  }

  /**
   * Get page information
   */
  async getPageInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API_BASE}/${this.pageId}`,
        {
          params: {
            fields: 'id,name,fan_count',
            access_token: this.pageAccessToken,
          },
        }
      );

      logger.debug('Retrieved page info', response.data);
      return response.data;
    } catch (error) {
      logger.error('Error getting page info', error);
      throw new Error(`Failed to get page info: ${error}`);
    }
  }
}
