// FILE: lib/storageUtils.js

/**
 * Storage optimization utilities
 * Removes null/undefined/empty values and optimizes data structures for storage
 */

/**
 * Recursively remove null, undefined, and empty string values from an object
 * @param {*} obj - Object to clean
 * @returns {*} Cleaned object
 */
export function cleanObject(obj) {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    const cleaned = obj.map(item => cleanObject(item)).filter(item => item !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanObject(value);
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  
  if (typeof obj === 'string' && obj.trim() === '') {
    return undefined;
  }
  
  return obj;
}

/**
 * Optimize fields object for storage by removing empty values
 * @param {Object} fields - Fields object to optimize
 * @returns {Object} Optimized fields object
 */
export function optimizeFields(fields) {
  if (!fields || typeof fields !== 'object') {
    return {};
  }
  
  const cleaned = cleanObject(fields);
  return cleaned || {};
}

/**
 * Optimize preset object for storage
 * @param {Object} preset - Preset object to optimize
 * @returns {Object} Optimized preset object
 */
export function optimizePreset(preset) {
  if (!preset || typeof preset !== 'object') {
    return preset;
  }
  
  const optimized = {
    id: preset.id,
    name: preset.name,
    fields: optimizeFields(preset.fields)
  };
  
  // Use timestamp instead of ISO string for date (more compact)
  if (preset.createdAt) {
    const date = new Date(preset.createdAt);
    if (!isNaN(date.getTime())) {
      optimized.createdAt = date.getTime(); // Store as timestamp
    }
  }
  
  // Only include description if it exists and is not empty
  if (preset.description && preset.description.trim()) {
    optimized.description = preset.description.trim();
  }
  
  return cleanObject(optimized);
}

/**
 * Restore preset from optimized format
 * @param {Object} preset - Optimized preset object
 * @returns {Object} Restored preset object
 */
export function restorePreset(preset) {
  if (!preset || typeof preset !== 'object') {
    return preset;
  }
  
  const restored = {
    id: preset.id,
    name: preset.name,
    fields: preset.fields || {}
  };
  
  // Convert timestamp back to ISO string if needed
  if (preset.createdAt) {
    if (typeof preset.createdAt === 'number') {
      restored.createdAt = new Date(preset.createdAt).toISOString();
    } else {
      restored.createdAt = preset.createdAt;
    }
  }
  
  if (preset.description) {
    restored.description = preset.description;
  }
  
  return restored;
}

/**
 * Encode fields to base64url (URL-safe base64)
 * @param {Object} fields - Fields object to encode
 * @returns {string} Base64url encoded string
 */
export function encodeFields(fields) {
  const optimized = optimizeFields(fields);
  const json = JSON.stringify(optimized);
  // Use base64url encoding (URL-safe, more efficient for URLs)
  return btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode fields from base64url (with backward compatibility for base64)
 * @param {string} encoded - Base64url or base64 encoded string
 * @returns {Object} Decoded fields object
 */
export function decodeFields(encoded) {
  try {
    let base64 = encoded;
    
    // Check if it's base64url format (contains - or _ and no =)
    const isBase64Url = (encoded.includes('-') || encoded.includes('_')) && !encoded.includes('=');
    
    if (isBase64Url) {
      // Convert base64url back to base64
      base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed (base64url removes padding)
      while (base64.length % 4) {
        base64 += '=';
      }
    }
    // If it's regular base64, use as-is (may already have padding)
    
    const json = atob(base64);
    return JSON.parse(json);
  } catch (error) {
    console.error('Error decoding fields:', error);
    throw error;
  }
}

