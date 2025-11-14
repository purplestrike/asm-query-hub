// FILE: pages/api/convert.js

import { convertAll } from '../../lib/converterIndex.js';

/**
 * API endpoint for converting normalized fields to ASM platform queries
 * POST /api/convert
 * 
 * Body: {
 *   fields: Object,     // Normalized fields object
 *   engines: Array      // Array of engine IDs to convert for
 * }
 * 
 * Returns: {
 *   [engineId]: {
 *     query: string,
 *     notes: Array,
 *     fallback?: string
 *   }
 * }
 */
export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, engines } = req.body;

    // Validate input
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'Invalid fields object' });
    }

    if (!Array.isArray(engines)) {
      return res.status(400).json({ error: 'Engines must be an array' });
    }

    // Convert fields to queries for specified engines
    const results = convertAll(fields, engines);

    // Return results
    res.status(200).json(results);

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
