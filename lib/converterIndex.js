// FILE: lib/converterIndex.js

import { convert as shodanConvert } from './converters/shodan.js';
import { convert as censysConvert } from './converters/censys.js';
import { convert as fofaConvert } from './converters/fofa.js';

/**
 * Supported ASM engines with metadata
 */
const SUPPORTED_ENGINES = [
  {
    id: 'shodan',
    displayName: 'Shodan',
    docsUrl: 'https://www.shodan.io/search/filters'
  },
  {
    id: 'censys',
    displayName: 'Censys',
    docsUrl: 'https://docs.censys.com/docs/censys-query-language'
  },
  {
    id: 'fofa',
    displayName: 'FOFA',
    docsUrl: 'https://en.fofa.info/api'
  }
];

/**
 * Get list of supported engines
 * @returns {Array} Array of engine objects with id, displayName, docsUrl
 */
export function getSupportedEngines() {
  return SUPPORTED_ENGINES;
}

/**
 * Convert fields to queries for specified engines
 * @param {Object} fields - Normalized fields object
 * @param {Array} enginesArray - Array of engine IDs to convert for
 * @returns {Object} Object with engine IDs as keys and conversion results as values
 */
export function convertAll(fields, enginesArray = []) {
  const results = {};
  
  // All converters are now implemented
  const availableConverters = {
    shodan: shodanConvert,
    censys: censysConvert,
    fofa: fofaConvert
  };

  enginesArray.forEach(engineId => {
    if (availableConverters[engineId]) {
      try {
        results[engineId] = availableConverters[engineId](fields);
      } catch (error) {
        results[engineId] = {
          query: '',
          notes: [`Error converting for ${engineId}: ${error.message}`],
          fallback: null
        };
      }
    } else {
      results[engineId] = {
        query: '',
        notes: [`Converter for ${engineId} not yet implemented`],
        fallback: null
      };
    }
  });

  return results;
}
