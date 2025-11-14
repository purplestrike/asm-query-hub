// FILE: lib/converters/shodan.js

/**
 * Shodan query converter
 * Maps normalized fields to Shodan search syntax
 * Reference: https://www.shodan.io/search/filters
 * 
 * Field mappings:
 * - ip: direct IP address search
 * - cidr: net:CIDR notation (e.g., 1.2.3.0/24)
 * - port: port:PORT filter
 * - domain: hostname:HOSTNAME filter
 * - banner: text search in banners
 * - httpPath: http.title:"TITLE" or http.html:"HTML"
 * - tlsCN: ssl.cert.subject.cn:"CN"
 * - tlsSAN: ssl.cert.extensions.subject_alt_name:"SAN"
 * - tlsIssuer: ssl.cert.issuer.cn:"ISSUER"
 * - tlsSubject: ssl.cert.subject.cn:SUBJECT
 * - asn: asn:ASN filter
 * - org: org:"ORGANIZATION"
 * - country: country:"COUNTRY"
 * - product: product:"PRODUCT"
 * - title: title:"TITLE"
 * - version: version:"VERSION"
 * - httpTitle: http.title:"TITLE"
 * - httpStatus: http.status:STATUS
 * - serverHeader: "Server: VALUE" (literal string search in HTTP response)
 * - os: os:"OS"
 * - ssl: ssl:"SSL"
 * - hostname: hostname:"HOSTNAME"
 * - city: city:"CITY"
 * - vuln: vuln:CVE-XXXX-XXXX
 * - expiredCert: ssl.cert.expired:true
 */

export function convert(fields) {
  const queryParts = [];
  const notes = [];
  let fallback = null;

  // IP address handling
  if (fields.ip) {
    queryParts.push(fields.ip);
  }

  // CIDR handling
  if (fields.cidr) {
    queryParts.push(`net:${fields.cidr}`);
  }

  // Port filtering - handle arrays
  if (fields.port) {
    const portValue = Array.isArray(fields.port) ? fields.port : [fields.port];
    if (portValue.length === 1) {
      queryParts.push(`port:${portValue[0]}`);
    } else {
      // Use comma-separated format for multiple ports
      queryParts.push(`port:${portValue.join(',')}`);
    }
  }

  // Domain/hostname filtering
  if (fields.domain) {
    queryParts.push(`hostname:${fields.domain}`);
  }

  // Banner/text search
  if (fields.banner) {
    queryParts.push(`"${fields.banner}"`);
  }

  // HTTP path search
  if (fields.httpPath) {
    queryParts.push(`http.title:"${fields.httpPath}"`);
    notes.push("HTTP path search uses title matching; may need refinement for specific paths");
  }

  // TLS certificate fields
  if (fields.tlsCN) {
    queryParts.push(`ssl.cert.subject.cn:"${fields.tlsCN}"`);
  }

  if (fields.tlsSAN) {
    queryParts.push(`ssl.cert.extensions.subject_alt_name:"${fields.tlsSAN}"`);
  }

  if (fields.tlsIssuer) {
    queryParts.push(`ssl.cert.issuer.cn:"${fields.tlsIssuer}"`);
  }

  // TLS Certificate Subject filtering - Shodan uses ssl.cert.subject.cn:value (no quotes)
  if (fields.tlsSubject) {
    const subjectValue = Array.isArray(fields.tlsSubject) ? fields.tlsSubject : [fields.tlsSubject];
    if (subjectValue.length === 1) {
      queryParts.push(`ssl.cert.subject.cn:${subjectValue[0]}`);
    } else {
      queryParts.push(`(${subjectValue.map(s => `ssl.cert.subject.cn:${s}`).join(' OR ')})`);
    }
  }

  // ASN filtering
  if (fields.asn) {
    const asnValue = typeof fields.asn === 'string' ? fields.asn.replace('AS', '') : fields.asn;
    queryParts.push(`asn:${asnValue}`);
  }

  // Organization filtering
  if (fields.org) {
    queryParts.push(`org:"${fields.org}"`);
  }

  // Country filtering
  if (fields.country) {
    queryParts.push(`country:"${fields.country}"`);
  }

  // Product filtering - Shodan product filter syntax: product:value (no quotes around value)
  if (fields.product) {
    const productValue = Array.isArray(fields.product) ? fields.product : [fields.product];
    if (productValue.length === 1) {
      queryParts.push(`product:${productValue[0]}`);
    } else {
      queryParts.push(`(${productValue.map(p => `product:${p}`).join(' OR ')})`);
    }
  }

  // Title filtering
  if (fields.title) {
    queryParts.push(`title:"${fields.title}"`);
  }

  // Version filtering
  if (fields.version) {
    queryParts.push(`version:"${fields.version}"`);
  }

  // Vulnerability filtering
  if (fields.vuln) {
    queryParts.push(`vuln:${fields.vuln}`);
  }

  // Expired certificate filtering
  if (fields.expiredCert) {
    queryParts.push(`ssl.cert.expired:true`);
  }

  // HTTP Title filtering
  if (fields.httpTitle) {
    const titleValue = Array.isArray(fields.httpTitle) ? fields.httpTitle : [fields.httpTitle];
    if (titleValue.length === 1) {
      queryParts.push(`http.title:"${titleValue[0]}"`);
    } else {
      queryParts.push(`(${titleValue.map(t => `http.title:"${t}"`).join(' OR ')})`);
    }
  }

  // HTTP Status filtering
  if (fields.httpStatus) {
    const statusValue = Array.isArray(fields.httpStatus) ? fields.httpStatus : [fields.httpStatus];
    if (statusValue.length === 1) {
      queryParts.push(`http.status:${statusValue[0]}`);
    } else {
      queryParts.push(`(${statusValue.map(s => `http.status:${s}`).join(' OR ')})`);
    }
  }

  // Server Header filtering - Shodan searches for "Server: value" in HTTP response data
  if (fields.serverHeader) {
    const serverValue = Array.isArray(fields.serverHeader) ? fields.serverHeader : [fields.serverHeader];
    if (serverValue.length === 1) {
      queryParts.push(`"Server: ${serverValue[0]}"`);
    } else {
      queryParts.push(`(${serverValue.map(s => `"Server: ${s}"`).join(' OR ')})`);
    }
    notes.push("Server header search uses literal string matching in HTTP response data");
  }

  // Operating System filtering
  if (fields.os) {
    const osValue = Array.isArray(fields.os) ? fields.os : [fields.os];
    if (osValue.length === 1) {
      queryParts.push(`os:"${osValue[0]}"`);
    } else {
      queryParts.push(`(${osValue.map(o => `os:"${o}"`).join(' OR ')})`);
    }
  }

  // SSL Certificate filtering
  if (fields.ssl) {
    const sslValue = Array.isArray(fields.ssl) ? fields.ssl : [fields.ssl];
    if (sslValue.length === 1) {
      queryParts.push(`ssl:"${sslValue[0]}"`);
    } else {
      queryParts.push(`(${sslValue.map(s => `ssl:"${s}"`).join(' OR ')})`);
    }
  }

  // Hostname filtering (separate from domain)
  if (fields.hostname) {
    const hostnameValue = Array.isArray(fields.hostname) ? fields.hostname : [fields.hostname];
    if (hostnameValue.length === 1) {
      queryParts.push(`hostname:"${hostnameValue[0]}"`);
    } else {
      queryParts.push(`(${hostnameValue.map(h => `hostname:"${h}"`).join(' OR ')})`);
    }
  }

  // City filtering
  if (fields.city) {
    const cityValue = Array.isArray(fields.city) ? fields.city : [fields.city];
    if (cityValue.length === 1) {
      queryParts.push(`city:"${cityValue[0]}"`);
    } else {
      queryParts.push(`(${cityValue.map(c => `city:"${c}"`).join(' OR ')})`);
    }
  }

  // Generate query
  let query = queryParts.join(' ');

  // Handle empty query case
  if (!query.trim()) {
    query = '*';
    notes.push("No specific fields provided - using wildcard search");
  }

  // Add general notes
  if (queryParts.length > 1) {
    notes.push("Multiple filters combined with AND logic");
  }

  // Add fallback for complex queries
  if (queryParts.length > 5) {
    fallback = queryParts.slice(0, 3).join(' ');
    notes.push("Query simplified for better performance - see fallback");
  }

  return {
    query,
    notes,
    fallback
  };
}
