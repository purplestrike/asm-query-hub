// FILE: scripts/assertions.js

import { convertAll } from '../lib/converterIndex.js';

/**
 * Assertion tests for converter functionality
 * Minimal checks for expected query patterns
 */

console.log('🔍 Running Converter Assertions\n');

// Test cases with expected patterns
const testCases = [
  {
    name: 'IP Address Query',
    fields: { ip: '1.2.3.4' },
    assertions: {
      shodan: (query) => query.includes('1.2.3.4'),
      censys: (query) => query.includes('1.2.3.4'),
      fofa: (query) => query.includes('1.2.3.4')
    }
  },
  {
    name: 'Port and Protocol',
    fields: { port: 80, protocol: 'tcp' },
    assertions: {
      shodan: (query) => query.includes('port:80') && query.includes('protocol:tcp'),
      censys: (query) => query.includes('port:80') && query.includes('protocol:"tcp"'),
      fofa: (query) => query.includes('port="80"') && query.includes('protocol="tcp"')
    }
  },
  {
    name: 'Domain Search',
    fields: { domain: 'example.com' },
    assertions: {
      shodan: (query) => query.includes('hostname:example.com'),
      censys: (query) => query.includes('example.com'),
      fofa: (query) => query.includes('host="example.com"')
    }
  },
  {
    name: 'Banner Search',
    fields: { banner: 'Apache/2.4.41' },
    assertions: {
      shodan: (query) => query.includes('"Apache/2.4.41"'),
      censys: (query) => query.includes('"Apache/2.4.41"'),
      fofa: (query) => query.includes('"Apache/2.4.41"')
    }
  },
  {
    name: 'TLS Certificate',
    fields: { tlsCN: '*.example.com' },
    assertions: {
      shodan: (query) => query.includes('ssl.cert.subject.cn:"*.example.com"'),
      censys: (query) => query.includes('ssl.certificate.parsed.subject.common_name:"*.example.com"'),
      fofa: (query) => query.includes('cert="*.example.com"')
    }
  },
  {
    name: 'ASN Search',
    fields: { asn: 'AS13335' },
    assertions: {
      shodan: (query) => query.includes('asn:13335'),
      censys: (query) => query.includes('asn:13335'),
      fofa: (query) => query.includes('asn="13335"')
    }
  }
];

let passedTests = 0;
let totalTests = 0;

// Run assertions
testCases.forEach(testCase => {
  console.log(`🧪 Testing: ${testCase.name}`);
  
  const results = convertAll(testCase.fields, Object.keys(testCase.assertions));
  
  Object.entries(testCase.assertions).forEach(([engineId, assertion]) => {
    totalTests++;
    const result = results[engineId];
    const query = result ? result.query : '';
    
    if (assertion(query)) {
      console.log(`   ✅ ${engineId}: PASS`);
      passedTests++;
    } else {
      console.log(`   ❌ ${engineId}: FAIL`);
      console.log(`      Expected pattern in: ${query}`);
    }
  });
  
  console.log('');
});

// Summary
console.log('📊 Test Summary:');
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 All assertions passed!');
} else {
  console.log('⚠️  Some assertions failed. Check converter implementations.');
}
