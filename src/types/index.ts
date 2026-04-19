/**
 * Type definitions for F1 data structures
 */

export interface F1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  session_type: string;
  meeting_key: number;
  location: string;
  country_name: string;
  circuit_short_name: string;
  year: number;
}

export interface F1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  year: number;
}

export interface F1DriverResult {
  position: number;
  driver_number: number;
  broadcast_name: string;
  team_name: string;
  time: string;
  gap_to_leader?: string;
}

export interface SessionResult {
  session: F1Session;
  results: F1DriverResult[];
  nextSession?: F1Session;
}

export interface FacebookPostResponse {
  id: string;
}

export interface Config {
  facebookPageAccessToken: string;
  facebookPageId: string;
  cronSchedule: string;
  autoPostEnabled: boolean;
  f1Season?: number;
  logLevel: string;
}
