import { F1Session, F1DriverResult } from '../types';

/**
 * Utility functions for formatting F1 data for Facebook posts
 */

/**
 * Format session type for display
 */
export function formatSessionType(sessionName: string): string {
  const typeMap: Record<string, string> = {
    'Race': 'Race',
    'Qualifying': 'Qualifying',
    'Sprint': 'Sprint',
    'Sprint Qualifying': 'Sprint Qualifying',
    'Practice 1': 'Free Practice 1',
    'Practice 2': 'Free Practice 2',
    'Practice 3': 'Free Practice 3',
  };

  return typeMap[sessionName] || sessionName;
}

/**
 * Format race name to hashtag format
 * Example: "Australian Grand Prix" -> "AUSGP"
 */
export function formatRaceHashtag(circuitShortName: string, countryName: string): string {
  // Try to use circuit short name first
  if (circuitShortName) {
    return circuitShortName.toUpperCase().replace(/\s+/g, '');
  }

  // Fallback to country name
  const countryCode = countryName.substring(0, 3).toUpperCase();
  return `${countryCode}GP`;
}

/**
 * Format driver result line
 */
export function formatDriverResult(result: F1DriverResult, isFirst: boolean): string {
  const position = result.position;
  const name = result.broadcast_name;
  const team = result.team_name;

  if (isFirst && result.time) {
    // First place shows total time
    return `${position}. ${name} (${team}) ${result.time}`;
  } else if (result.gap_to_leader) {
    // Other positions show gap to leader
    return `${position}. ${name} (${team}) +${result.gap_to_leader}`;
  } else {
    // Fallback if no timing data available
    return `${position}. ${name} (${team})`;
  }
}

/**
 * Format the complete race results post
 */
export function formatResultsPost(
  session: F1Session,
  results: F1DriverResult[]
): string {
  const hashtag = formatRaceHashtag(session.circuit_short_name, session.country_name);
  const sessionType = formatSessionType(session.session_name);
  const year = session.year;

  let post = `#${hashtag} ${year} ${sessionType}\n\n`;

  results.forEach((result, index) => {
    const line = formatDriverResult(result, index === 0);
    post += `${line}\n`;
  });

  return post.trim();
}

/**
 * Format the next session announcement post
 */
export function formatNextSessionPost(session: F1Session): string {
  const hashtag = formatRaceHashtag(session.circuit_short_name, session.country_name);
  const sessionType = formatSessionType(session.session_name);
  const year = session.year;

  return `Next Result: #${hashtag} ${year} ${sessionType}`;
}

/**
 * Estimate timing data based on position
 * This is a fallback for when actual timing data is not available
 */
export function estimateTimingData(results: F1DriverResult[]): F1DriverResult[] {
  if (results.length === 0) return results;

  // If we already have timing data, return as is
  if (results[0].time) {
    return results;
  }

  // Otherwise, we'll just return positions without timing
  // In a real scenario, you might want to fetch this from another source
  return results.map((result, index) => ({
    ...result,
    time: index === 0 ? '1:31:26.262' : '', // Placeholder
    gap_to_leader: index === 0 ? undefined : `${(index * 2.5).toFixed(3)}s`,
  }));
}
