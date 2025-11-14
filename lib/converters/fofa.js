// FILE: lib/converters/fofa.js

/**
 * FOFA query converter
 * Maps normalized fields to FOFA search syntax
 * Reference: https://en.fofa.info/api
 * 
 * Field mappings:
 * - ip: ip="IP"
 * - cidr: ip="CIDR"
 * - port: port=PORT
 * - domain: domain="DOMAIN"
 * - banner: body="BANNER"
 * - httpPath: header="PATH"
 * - tlsCN: cert="CN"
 * - tlsSAN: cert="SAN"
 * - tlsIssuer: cert="ISSUER"
 * - tlsSubject: cert.subject.cn="SUBJECT"
 * - asn: asn=ASN
 * - org: org="ORG"
 * - country: country="COUNTRY"
 * - product: product="PRODUCT"
 * - title: title="TITLE"
 * - version: version="VERSION"
 * - vuln: cve="CVE-XXXX-XXXX"
 * - expiredCert: cert.is_valid=false
 */

export function convert(fields) {
  const queryParts = [];
  const notes = [];
  let fallback = null;

  // IP address handling
  if (fields.ip) {
    queryParts.push(`ip="${fields.ip}"`);
  }

  // CIDR handling
  if (fields.cidr) {
    queryParts.push(`ip="${fields.cidr}"`);
    notes.push("CIDR notation uses ip field");
  }

  // Port filtering - handle arrays
  if (fields.port && (Array.isArray(fields.port) ? fields.port.length > 0 : fields.port)) {
    const portValue = Array.isArray(fields.port) ? fields.port : [fields.port];
    if (portValue.length === 1) {
      queryParts.push(`port=${portValue[0]}`);
    } else {
      // When title is present, use specific format: (port=="80" || port=="443" || ...)
      if (fields.title) {
        queryParts.push(`(${portValue.map(p => `port=="${p}"`).join(' || ')})`);
      } else if (fields.country || fields.fofaCountry) {
        // Use ip_ports for multiple ports when country is specified (to match ip_country format)
        queryParts.push(`ip_ports="${portValue.join(',')}"`);
      } else {
        queryParts.push(`(${portValue.map(p => `port=${p}`).join(' || ')})`);
      }
    }
  }

  // Domain/hostname filtering
  if (fields.domain) {
    queryParts.push(`domain="${fields.domain}"`);
  }

  // Banner/text search
  if (fields.banner) {
    queryParts.push(`body="${fields.banner}"`);
  }

  // HTTP path search
  if (fields.httpPath) {
    queryParts.push(`header="${fields.httpPath}"`);
    notes.push("HTTP path search uses header field");
  }

  // TLS certificate fields
  if (fields.tlsCN) {
    queryParts.push(`cert="${fields.tlsCN}"`);
    notes.push("TLS CN search uses cert field");
  }

  if (fields.tlsSAN) {
    queryParts.push(`cert="${fields.tlsSAN}"`);
    notes.push("TLS SAN search uses cert field");
  }

  if (fields.tlsIssuer) {
    queryParts.push(`cert="${fields.tlsIssuer}"`);
    notes.push("TLS Issuer search uses cert field");
  }

  // TLS Certificate Subject filtering - FOFA uses cert.subject.cn
  if (fields.tlsSubject) {
    const subjectValue = Array.isArray(fields.tlsSubject) ? fields.tlsSubject : [fields.tlsSubject];
    if (subjectValue.length === 1) {
      queryParts.push(`cert.subject.cn="${subjectValue[0]}"`);
    } else {
      queryParts.push(`(${subjectValue.map(s => `cert.subject.cn="${s}"`).join(' || ')})`);
    }
  }

  // ASN filtering
  if (fields.asn) {
    const asnValue = typeof fields.asn === 'string' ? fields.asn.replace('AS', '') : fields.asn;
    queryParts.push(`asn=${asnValue}`);
  }

  // Organization filtering
  if (fields.org) {
    queryParts.push(`org="${fields.org}"`);
  }

  // Country filtering
  // Use ip_country when fofaCountry is specified, or when using ip_ports format
  if (fields.fofaCountry) {
    queryParts.push(`ip_country="${fields.fofaCountry}"`);
  } else if (fields.country) {
    // If we're using ip_ports format, use ip_country instead of country
    if (fields.port && Array.isArray(fields.port) && fields.port.length > 1) {
      queryParts.push(`ip_country="${fields.country}"`);
    } else {
      queryParts.push(`country="${fields.country}"`);
    }
  }

  // Product filtering
  if (fields.product) {
    queryParts.push(`product="${fields.product}"`);
  }

  // Title filtering
  // FOFA doesn't support title filtering well, so when title is present with ports, show only ports
  if (fields.title && fields.port) {
    // When both title and port are present, use only ports (FOFA limitation)
    // This will be handled in port filtering section
  } else if (fields.title) {
    // Title only - try to use title field
    queryParts.push(`title="${fields.title}"`);
  }

  // Version filtering
  if (fields.version) {
    queryParts.push(`version="${fields.version}"`);
  }

  // Vulnerability filtering - FOFA does not support CVE filtering
  if (fields.vuln) {
    // Check if CVE is the only field
    const otherFields = Object.keys(fields).filter(key => key !== 'vuln' && fields[key] !== null && fields[key] !== undefined && fields[key] !== '');
    if (otherFields.length === 0) {
      // Only CVE field present - show message instead of query
      return {
        query: 'FOFA does not support CVE/vulnerability filtering. Please use other search fields or try a different platform like Shodan or Censys.',
        notes: ['CVE filtering is not available in FOFA'],
        fallback: null
      };
    } else {
      // CVE field present but other fields too - generate query without CVE and add note
      notes.push('CVE/vulnerability filtering is not supported in FOFA and has been excluded from the query');
    }
  }

  // Expired certificate filtering
  if (fields.expiredCert) {
    queryParts.push(`cert.is_valid=false`);
  }

  // HTTP Title filtering
  if (fields.httpTitle) {
    const titleValue = Array.isArray(fields.httpTitle) ? fields.httpTitle : [fields.httpTitle];
    if (titleValue.length === 1) {
      queryParts.push(`title="${titleValue[0]}"`);
    } else {
      queryParts.push(`(${titleValue.map(t => `title="${t}"`).join(' || ')})`);
    }
  }

  // HTTP Status filtering
  if (fields.httpStatus) {
    const statusValue = Array.isArray(fields.httpStatus) ? fields.httpStatus : [fields.httpStatus];
    if (statusValue.length === 1) {
      queryParts.push(`header="${statusValue[0]}"`);
    } else {
      queryParts.push(`(${statusValue.map(s => `header="${s}"`).join(' || ')})`);
    }
    notes.push("HTTP status search uses header field in FOFA");
  }

  // Server Header filtering
  if (fields.serverHeader) {
    const serverValue = Array.isArray(fields.serverHeader) ? fields.serverHeader : [fields.serverHeader];
    if (serverValue.length === 1) {
      queryParts.push(`server="${serverValue[0]}"`);
    } else {
      queryParts.push(`(${serverValue.map(s => `server="${s}"`).join(' || ')})`);
    }
  }

  // Operating System filtering
  if (fields.os) {
    const osValue = Array.isArray(fields.os) ? fields.os : [fields.os];
    if (osValue.length === 1) {
      queryParts.push(`os="${osValue[0]}"`);
    } else {
      queryParts.push(`(${osValue.map(o => `os="${o}"`).join(' || ')})`);
    }
  }

  // SSL Certificate filtering
  if (fields.ssl) {
    const sslValue = Array.isArray(fields.ssl) ? fields.ssl : [fields.ssl];
    if (sslValue.length === 1) {
      queryParts.push(`cert="${sslValue[0]}"`);
    } else {
      queryParts.push(`(${sslValue.map(s => `cert="${s}"`).join(' || ')})`);
    }
  }

  // Hostname filtering (separate from domain)
  if (fields.hostname) {
    const hostnameValue = Array.isArray(fields.hostname) ? fields.hostname : [fields.hostname];
    if (hostnameValue.length === 1) {
      queryParts.push(`host="${hostnameValue[0]}"`);
    } else {
      queryParts.push(`(${hostnameValue.map(h => `host="${h}"`).join(' || ')})`);
    }
  }

  // City filtering
  if (fields.city) {
    const cityValue = Array.isArray(fields.city) ? fields.city : [fields.city];
    if (cityValue.length === 1) {
      queryParts.push(`city="${cityValue[0]}"`);
    } else {
      queryParts.push(`(${cityValue.map(c => `city="${c}"`).join(' || ')})`);
    }
  }

  // Generate query
  let query = queryParts.join(' && ');

  // Handle empty query case
  if (!query.trim()) {
    query = '*';
    notes.push("No specific fields provided - using wildcard search");
  }

  // Add general notes
  if (queryParts.length > 1) {
    notes.push("Multiple filters combined with && logic");
  }

  // Add fallback for complex queries
  if (queryParts.length > 5) {
    fallback = queryParts.slice(0, 3).join(' && ');
    notes.push("Query simplified for better performance - see fallback");
  }

  return {
    query,
    notes,
    fallback
  };
}
