// FILE: lib/converters/censys.js

/**
 * Censys query converter (CenQL - Censys Query Language)
 * Maps normalized fields to Censys Platform CenQL syntax
 * Reference: https://docs.censys.com/docs/query-converter
 * 
 * Field mappings (CenQL):
 * - ip: host.ip: "IP"
 * - cidr: host.ip: "CIDR"
 * - port: host.services.port: PORT
 * - domain: host.dns.names: "DOMAIN"
 * - country: host.location.country_code: "COUNTRY"
 * - org: host.autonomous_system.name: "ORG"
 * - asn: host.autonomous_system.asn: ASN
 * - httpTitle: web.endpoints.http.html_title: "TITLE"
 * - httpStatus: web.endpoints.http.status_code: STATUS
 * - serverHeader: web.endpoints.http.headers: (key: "Server" and value: "HEADER")
 * - product: host.services.software.product: "PRODUCT" or web.software.product: "PRODUCT"
 * - version: host.services.software.version: "VERSION" or web.software.version: "VERSION"
 * - os: host.operating_system.product: "OS"
 * - ssl: host.services.cert.names: "SSL"
 * - hostname: host.dns.names: "HOSTNAME" or web.hostname: "HOSTNAME"
 * - city: host.location.city: "CITY"
 */

// Helper to handle array values with OR logic
function handleArrayValue(value, formatFunc) {
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.length === 1) return formatFunc(value[0]);
    // Multiple values: use OR logic
    return `(${value.map(v => formatFunc(v)).join(' OR ')})`;
  }
  return formatFunc(value);
}

export function convert(fields) {
  const queryParts = [];
  const notes = [];
  let fallback = null;

  // IP address handling - CenQL uses host.ip:
  if (fields.ip) {
    const ipValue = Array.isArray(fields.ip) ? fields.ip : [fields.ip];
    if (ipValue.length === 1) {
      queryParts.push(`host.ip: "${ipValue[0]}"`);
    } else {
      queryParts.push(`(${ipValue.map(ip => `host.ip: "${ip}"`).join(' OR ')})`);
    }
  }

  // CIDR handling - CenQL uses host.ip: with CIDR notation
  if (fields.cidr) {
    const cidrValue = Array.isArray(fields.cidr) ? fields.cidr : [fields.cidr];
    if (cidrValue.length === 1) {
      queryParts.push(`host.ip: "${cidrValue[0]}"`);
    } else {
      queryParts.push(`(${cidrValue.map(c => `host.ip: "${c}"`).join(' OR ')})`);
    }
    notes.push("CIDR notation uses host.ip: syntax");
  }

  // Port filtering - Censys uses host.services.port
  // Skip if title is also present (will be handled together in title filtering)
  if (fields.port && (Array.isArray(fields.port) ? fields.port.length > 0 : fields.port) && !fields.title) {
    const portValue = Array.isArray(fields.port) ? fields.port : [fields.port];
    if (portValue.length === 1) {
      queryParts.push(`host.services.port:${portValue[0]}`);
    } else {
      // Use array notation: host.services.port:{"80", "443"}
      queryParts.push(`host.services.port:{${portValue.map(p => `"${p}"`).join(', ')}}`);
    }
  }

  // Domain/hostname filtering - Censys uses host.dns.names
  if (fields.domain) {
    const domainValue = Array.isArray(fields.domain) ? fields.domain : [fields.domain];
    if (domainValue.length === 1) {
      queryParts.push(`host.dns.names: "${domainValue[0]}"`);
    } else {
      queryParts.push(`(${domainValue.map(d => `host.dns.names: "${d}"`).join(' OR ')})`);
    }
  }

  // Banner/text search - Censys uses services.http.response.body
  if (fields.banner) {
    const bannerValue = Array.isArray(fields.banner) ? fields.banner : [fields.banner];
    if (bannerValue.length === 1) {
      queryParts.push(`services.http.response.body: "${bannerValue[0]}"`);
    } else {
      queryParts.push(`(${bannerValue.map(b => `services.http.response.body: "${b}"`).join(' OR ')})`);
    }
  }

  // HTTP path search
  if (fields.httpPath) {
    const pathValue = Array.isArray(fields.httpPath) ? fields.httpPath : [fields.httpPath];
    if (pathValue.length === 1) {
      queryParts.push(`services.http.response.body: "${pathValue[0]}"`);
    } else {
      queryParts.push(`(${pathValue.map(p => `services.http.response.body: "${p}"`).join(' OR ')})`);
    }
    notes.push("HTTP path search uses response body");
  }

  // TLS certificate fields
  if (fields.tlsCN) {
    const cnValue = Array.isArray(fields.tlsCN) ? fields.tlsCN : [fields.tlsCN];
    if (cnValue.length === 1) {
      queryParts.push(`host.services.cert.parsed.subject.common_name = "${cnValue[0]}"`);
    } else {
      queryParts.push(`(${cnValue.map(cn => `host.services.cert.parsed.subject.common_name = "${cn}"`).join(' OR ')})`);
    }
  }

  if (fields.tlsSAN) {
    const sanValue = Array.isArray(fields.tlsSAN) ? fields.tlsSAN : [fields.tlsSAN];
    if (sanValue.length === 1) {
      queryParts.push(`certificates.parsed.extensions.subject_alt_name.dns_names: "${sanValue[0]}"`);
    } else {
      queryParts.push(`(${sanValue.map(san => `certificates.parsed.extensions.subject_alt_name.dns_names: "${san}"`).join(' OR ')})`);
    }
  }

  if (fields.tlsIssuer) {
    const issuerValue = Array.isArray(fields.tlsIssuer) ? fields.tlsIssuer : [fields.tlsIssuer];
    if (issuerValue.length === 1) {
      queryParts.push(`certificates.parsed.issuer.common_name = "${issuerValue[0]}"`);
    } else {
      queryParts.push(`(${issuerValue.map(i => `certificates.parsed.issuer.common_name = "${i}"`).join(' OR ')})`);
    }
  }

  // TLS Certificate Subject filtering - CenQL uses host.services.cert.parsed.subject.common_name
  if (fields.tlsSubject) {
    const subjectValue = Array.isArray(fields.tlsSubject) ? fields.tlsSubject : [fields.tlsSubject];
    if (subjectValue.length === 1) {
      queryParts.push(`host.services.cert.parsed.subject.common_name = "${subjectValue[0]}"`);
    } else {
      queryParts.push(`(${subjectValue.map(s => `host.services.cert.parsed.subject.common_name = "${s}"`).join(' OR ')})`);
    }
  }

  // ASN filtering - CenQL uses host.autonomous_system.asn:
  if (fields.asn) {
    const asnValue = Array.isArray(fields.asn) ? fields.asn : [fields.asn];
    const normalizedAsn = asnValue.map(a => {
      const val = typeof a === 'string' ? a.replace(/^AS/i, '') : a;
      return val;
    });
    if (normalizedAsn.length === 1) {
      queryParts.push(`host.autonomous_system.asn: ${normalizedAsn[0]}`);
    } else {
      queryParts.push(`(${normalizedAsn.map(a => `host.autonomous_system.asn: ${a}`).join(' OR ')})`);
    }
  }

  // Organization filtering - CenQL uses host.autonomous_system.name:
  if (fields.org) {
    const orgValue = Array.isArray(fields.org) ? fields.org : [fields.org];
    if (orgValue.length === 1) {
      queryParts.push(`host.autonomous_system.name: "${orgValue[0]}"`);
    } else {
      queryParts.push(`(${orgValue.map(o => `host.autonomous_system.name: "${o}"`).join(' OR ')})`);
    }
  }

  // Protocol filtering - Censys uses host.services.protocol
  if (fields.protocol && (Array.isArray(fields.protocol) ? fields.protocol.length > 0 : fields.protocol)) {
    const protocolValue = Array.isArray(fields.protocol) ? fields.protocol : [fields.protocol];
    if (protocolValue.length === 1) {
      queryParts.push(`host.services.protocol:"${protocolValue[0]}"`);
    } else {
      // Use array notation: host.services.protocol:{"HTTP", "HTTPS"}
      queryParts.push(`host.services.protocol:{${protocolValue.map(p => `"${p}"`).join(', ')}}`);
    }
  }

  // Country filtering - Censys uses host.location.country_code for country codes
  if (fields.countryFull) {
    queryParts.push(`host.location.country:"${fields.countryFull}"`);
  } else if (fields.country) {
    const countryValue = Array.isArray(fields.country) ? fields.country : [fields.country];
    if (countryValue.length === 1) {
      queryParts.push(`host.location.country_code:"${countryValue[0]}"`);
    } else {
      queryParts.push(`(${countryValue.map(c => `host.location.country_code:"${c}"`).join(' OR ')})`);
    }
  }

  // Product filtering - CenQL uses host.services.software.product: or web.software.product:
  if (fields.product) {
    const productValue = Array.isArray(fields.product) ? fields.product : [fields.product];
    if (productValue.length === 1) {
      queryParts.push(`host.services.software.product: "${productValue[0]}" or web.software.product: "${productValue[0]}"`);
    } else {
      const productQueries = productValue.map(p => `host.services.software.product: "${p}" or web.software.product: "${p}"`);
      queryParts.push(`(${productQueries.join(' OR ')})`);
    }
  }

  // Title filtering - CenQL uses web.endpoints.http.html_title: or host.services.endpoints.http.html_title:
  if (fields.title) {
    const titleValue = Array.isArray(fields.title) ? fields.title : [fields.title];
    
    // Special format when both port and title are present
    if (fields.port && (Array.isArray(fields.port) ? fields.port.length > 0 : fields.port)) {
      const portValue = Array.isArray(fields.port) ? fields.port : [fields.port];
      if (titleValue.length === 1) {
        // Format: host.services: (port: {80, 443, 8080, 8443} and endpoints.http.html_title: "phpMyAdmin")
        if (portValue.length === 1) {
          queryParts.push(`host.services: (port: ${portValue[0]} and endpoints.http.html_title: "${titleValue[0]}") or web.endpoints.http.html_title: "${titleValue[0]}"`);
        } else {
          queryParts.push(`host.services: (port: {${portValue.map(p => p).join(', ')}} and endpoints.http.html_title: "${titleValue[0]}") or web.endpoints.http.html_title: "${titleValue[0]}"`);
        }
      } else {
        // Multiple titles - create OR conditions
        const titleQueries = titleValue.map(t => {
          if (portValue.length === 1) {
            return `host.services: (port: ${portValue[0]} and endpoints.http.html_title: "${t}") or web.endpoints.http.html_title: "${t}"`;
          } else {
            return `host.services: (port: {${portValue.map(p => p).join(', ')}} and endpoints.http.html_title: "${t}") or web.endpoints.http.html_title: "${t}"`;
          }
        });
        queryParts.push(`(${titleQueries.join(' OR ')})`);
      }
    } else {
      // Title only - use standard format
      if (titleValue.length === 1) {
        queryParts.push(`host.services.endpoints.http.html_title: "${titleValue[0]}" or web.endpoints.http.html_title: "${titleValue[0]}"`);
      } else {
        const titleQueries = titleValue.map(t => `host.services.endpoints.http.html_title: "${t}" or web.endpoints.http.html_title: "${t}"`);
        queryParts.push(`(${titleQueries.join(' OR ')})`);
      }
    }
  }

  // Version filtering - CenQL uses host.services.software.version: or web.software.version:
  if (fields.version) {
    const versionValue = Array.isArray(fields.version) ? fields.version : [fields.version];
    if (versionValue.length === 1) {
      queryParts.push(`host.services.software.version: "${versionValue[0]}" or web.software.version: "${versionValue[0]}"`);
    } else {
      const versionQueries = versionValue.map(v => `host.services.software.version: "${v}" or web.software.version: "${v}"`);
      queryParts.push(`(${versionQueries.join(' or ')})`);
    }
  }

  // Vulnerability filtering
  if (fields.vuln) {
    const vulnValue = Array.isArray(fields.vuln) ? fields.vuln : [fields.vuln];
    if (vulnValue.length === 1) {
      // Use the correct Censys vulnerability format: host.services.vulns.id or web.vulns.id
      queryParts.push(`host.services.vulns.id:"${vulnValue[0]}" or web.vulns.id:"${vulnValue[0]}"`);
    } else {
      // For multiple CVEs, create OR conditions for each
      const cveQueries = vulnValue.map(v => `host.services.vulns.id:"${v}" or web.vulns.id:"${v}"`);
      queryParts.push(`(${cveQueries.join(' or ')})`);
    }
  }

  // Expired certificate filtering
  if (fields.expiredCert) {
    queryParts.push(`cert.parsed.validity_period.not_after <= "now"`);
  }

  // HTTP Title filtering - CenQL uses web.endpoints.http.html_title: or host.services.endpoints.http.html_title:
  if (fields.httpTitle) {
    const titleValue = Array.isArray(fields.httpTitle) ? fields.httpTitle : [fields.httpTitle];
    if (titleValue.length === 1) {
      queryParts.push(`web.endpoints.http.html_title: "${titleValue[0]}" or host.services.endpoints.http.html_title: "${titleValue[0]}"`);
    } else {
      const titleQueries = titleValue.map(t => `web.endpoints.http.html_title: "${t}" or host.services.endpoints.http.html_title: "${t}"`);
      queryParts.push(`(${titleQueries.join(' OR ')})`);
    }
  }

  // HTTP Status filtering - CenQL uses web.endpoints.http.status_code: or host.services.endpoints.http.status_code:
  if (fields.httpStatus) {
    const statusValue = Array.isArray(fields.httpStatus) ? fields.httpStatus : [fields.httpStatus];
    if (statusValue.length === 1) {
      queryParts.push(`web.endpoints.http.status_code: ${statusValue[0]} or host.services.endpoints.http.status_code: ${statusValue[0]}`);
    } else {
      const statusQueries = statusValue.map(s => `web.endpoints.http.status_code: ${s} or host.services.endpoints.http.status_code: ${s}`);
      queryParts.push(`(${statusQueries.join(' OR ')})`);
    }
  }

  // Server Header filtering - CenQL uses web.endpoints.http.headers: (key: "Server" and value: "HEADER")
  if (fields.serverHeader) {
    const serverValue = Array.isArray(fields.serverHeader) ? fields.serverHeader : [fields.serverHeader];
    if (serverValue.length === 1) {
      queryParts.push(`web.endpoints.http.headers: (key: "Server" and value: "${serverValue[0]}") or host.services.endpoints.http.headers: (key: "Server" and value: "${serverValue[0]}")`);
    } else {
      const serverQueries = serverValue.map(s => `web.endpoints.http.headers: (key: "Server" and value: "${s}") or host.services.endpoints.http.headers: (key: "Server" and value: "${s}")`);
      queryParts.push(`(${serverQueries.join(' OR ')})`);
    }
  }

  // Operating System filtering - CenQL uses host.operating_system.product:
  if (fields.os) {
    const osValue = Array.isArray(fields.os) ? fields.os : [fields.os];
    if (osValue.length === 1) {
      queryParts.push(`host.operating_system.product: "${osValue[0]}"`);
    } else {
      queryParts.push(`(${osValue.map(o => `host.operating_system.product: "${o}"`).join(' OR ')})`);
    }
  }

  // SSL Certificate filtering - CenQL uses host.services.cert.names:
  if (fields.ssl) {
    const sslValue = Array.isArray(fields.ssl) ? fields.ssl : [fields.ssl];
    if (sslValue.length === 1) {
      queryParts.push(`host.services.cert.names: "${sslValue[0]}"`);
    } else {
      queryParts.push(`(${sslValue.map(s => `host.services.cert.names: "${s}"`).join(' OR ')})`);
    }
  }

  // Hostname filtering - CenQL uses host.dns.names: or web.hostname:
  if (fields.hostname) {
    const hostnameValue = Array.isArray(fields.hostname) ? fields.hostname : [fields.hostname];
    if (hostnameValue.length === 1) {
      queryParts.push(`host.dns.names: "${hostnameValue[0]}" or web.hostname: "${hostnameValue[0]}"`);
    } else {
      const hostnameQueries = hostnameValue.map(h => `host.dns.names: "${h}" or web.hostname: "${h}"`);
      queryParts.push(`(${hostnameQueries.join(' OR ')})`);
    }
  }

  // City filtering - CenQL uses host.location.city:
  if (fields.city) {
    const cityValue = Array.isArray(fields.city) ? fields.city : [fields.city];
    if (cityValue.length === 1) {
      queryParts.push(`host.location.city: "${cityValue[0]}"`);
    } else {
      queryParts.push(`(${cityValue.map(c => `host.location.city: "${c}"`).join(' OR ')})`);
    }
  }


  // Generate query
  let query = queryParts.join(' and ');

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
    fallback = queryParts.slice(0, 3).join(' and ');
    notes.push("Query simplified for better performance - see fallback");
  }

  return {
    query,
    notes,
    fallback
  };
}
