// FILE: scripts/test_converters.js

import { convertAll } from '../lib/converterIndex.js';
import presetsData from '../examples/presets.json' with { type: 'json' };

/**
 * Test script for converter functionality
 * Loads example presets and prints conversion results
 */

console.log('🧪 Testing ASM Query Hub Converters\n');

// Test data
const testFields = {
  ip: '1.2.3.4',
  port: 80,
  protocol: 'tcp',
  domain: 'example.com',
  banner: 'Apache/2.4.41',
  product: 'Apache',
  country: 'US'
};

// Test all engines
const allEngines = ['shodan', 'censys', 'fofa'];

console.log('📋 Test Fields:');
console.log(JSON.stringify(testFields, null, 2));
console.log('\n' + '='.repeat(50) + '\n');

// Convert for all engines
const results = convertAll(testFields, allEngines);

// Display results
Object.entries(results).forEach(([engineId, result]) => {
  console.log(`🔍 ${engineId.toUpperCase()} Query:`);
  console.log(`Query: ${result.query}`);
  if (result.notes && result.notes.length > 0) {
    console.log(`Notes: ${result.notes.join(', ')}`);
  }
  if (result.fallback) {
    console.log(`Fallback: ${result.fallback}`);
  }
  console.log('\n' + '-'.repeat(30) + '\n');
});

// Test with presets
console.log('📦 Testing with Built-in Presets:\n');

presetsData.forEach((preset, index) => {
  console.log(`${index + 1}. ${preset.name}:`);
  console.log(`   Description: ${preset.description}`);
  console.log(`   Fields: ${JSON.stringify(preset.fields)}`);
  
  const presetResults = convertAll(preset.fields, ['shodan', 'censys']);
  Object.entries(presetResults).forEach(([engineId, result]) => {
    console.log(`   ${engineId}: ${result.query}`);
  });
  console.log('');
});

console.log('✅ Converter testing completed!');
