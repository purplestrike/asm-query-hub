/**
 * Search URL generators for ASM platforms
 * Creates direct search links for each platform
 */

/**
 * Generate search URL for Shodan
 * @param {string} query - The search query
 * @returns {string} - Shodan search URL
 */
export function getShodanUrl(query) {
  const encodedQuery = encodeURIComponent(query);
  return `https://www.shodan.io/search?query=${encodedQuery}`;
}

/**
 * Generate search URL for Censys
 * @param {string} query - The search query
 * @returns {string} - Censys search URL
 */
export function getCensysUrl(query) {
  const encodedQuery = encodeURIComponent(query);
  return `https://platform.censys.io/search?q=${encodedQuery}`;
}

/**
 * Generate search URL for FOFA
 * @param {string} query - The search query
 * @returns {string} - FOFA search URL
 */
export function getFofaUrl(query) {
  // FOFA requires the query to be base64 encoded directly
  // Handle Unicode characters properly for base64 encoding
  const base64Query = btoa(unescape(encodeURIComponent(query)));
  return `https://fofa.so/result?qbase64=${base64Query}`;
}

/**
 * Get search URL for any engine by ID
 * @param {string} engineId - The engine ID
 * @param {string} query - The search query
 * @returns {string} - Search URL for the engine
 */
export function getSearchUrl(engineId, query) {
  const urlGenerators = {
    shodan: getShodanUrl,
    censys: getCensysUrl,
    fofa: getFofaUrl
  };

  const generator = urlGenerators[engineId];
  if (!generator) {
    // Return null instead of throwing to prevent runtime errors
    console.warn(`No URL generator found for engine: ${engineId}`);
    return null;
  }

  return generator(query);
}
