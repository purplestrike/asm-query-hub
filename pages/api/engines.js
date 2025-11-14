// FILE: pages/api/engines.js

import { getSupportedEngines } from '../../lib/converterIndex.js';

/**
 * API endpoint for getting supported engines
 * GET /api/engines
 * 
 * Returns: {
 *   engines: Array of engine objects with id, displayName, docsUrl
 * }
 */
export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const engines = getSupportedEngines();
    
    res.status(200).json({
      engines,
      total: engines.length
    });

  } catch (error) {
    console.error('Engines API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
