# ASM Query Hub

A unified web application for converting form inputs into search queries for multiple Attack Surface Management (ASM) platforms. Generate optimized queries for Shodan, Censys, and FOFA without requiring API keys or external vendor calls.

🌐 **[Live Demo](https://asm-query-hub.purplestrike.net/)** | [![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/purplestrike/ASM-Query-Hub)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18.0-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

- **3 ASM Platform Converters**: Shodan, Censys, and FOFA
- **Dynamic Form Interface**: Multi-select fields with real-time validation and comma-separated values
- **Syntax Highlighting**: Code-formatted query display with one-click copy functionality
- **Preset Management**: 9 built-in presets plus custom preset saving with optimized localStorage
- **Shareable URLs**: Base64url-encoded query parameters for easy sharing
- **Optimized Storage**: Efficient data storage with automatic cleanup of empty values
- **Dark Mode Support**: Built-in theme switching with next-themes
- **No External Dependencies**: Pure local conversion, no API keys required
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## 🌐 Live Demo

**Try it now**: [https://asm-query-hub.purplestrike.net/](https://asm-query-hub.purplestrike.net/)

The application is live and ready to use! No installation required.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager

### Local Installation

1. Clone the repository:
```bash
git clone https://github.com/purplestrike/ASM-Query-Hub.git
cd ASM-Query-Hub
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📋 Supported Fields

The application supports 15 different field types that can be combined to create complex queries:

| Field | Description | Example | Multiple Values |
|-------|-------------|---------|----------------|
| `ip` | IP address | `1.2.3.4` | No |
| `port` | Port number(s) | `80, 443, 8443` | Yes (comma-separated) |
| `domain` | Domain/hostname | `example.com` | Yes |
| `country` | Country code | `US, DE, AE` | Yes |
| `org` | Organization name | `Cloudflare, Inc.` | Yes |
| `asn` | ASN number | `AS13335` or `13335` | Yes |
| `httpTitle` | HTTP page title | `Welcome to nginx!` | Yes |
| `httpStatus` | HTTP status code | `200, 404, 500` | Yes |
| `serverHeader` | Server header | `nginx/1.18.0` | Yes |
| `product` | Product/service name | `nginx, Apache` | Yes |
| `version` | Version number | `1.18.0, 2.4.41` | Yes |
| `os` | Operating system | `Linux, Windows` | Yes |
| `ssl` | SSL certificate | `*.example.com` | Yes |
| `tlsSubject` | TLS certificate subject | `CN=example.com, O=Org` | Yes |
| `hostname` | Hostname | `server.example.com` | Yes |
| `city` | City name | `New York, London` | Yes |

## 🔄 Supported ASM Platforms

### Shodan
- **Query Format**: Space-separated filters with AND logic
- **Example**: `1.2.3.4 port:80 hostname:example.com`
- **Documentation**: [Shodan Search Filters](https://www.shodan.io/search/filters)

### Censys
- **Query Format**: Censys Query Language (CQL) with AND logic
- **Example**: `services.ip:"1.2.3.4" AND services.port:80`
- **Documentation**: [Censys Query Language](https://docs.censys.com/docs/censys-query-language)

### FOFA
- **Query Format**: Key-value pairs with `&&` logic
- **Example**: `ip="1.2.3.4" && port="80" && host="example.com"`
- **Documentation**: [FOFA API](https://en.fofa.info/api)

## 💾 Storage Optimizations

The application includes several storage optimizations to minimize data usage:

- **Automatic Cleanup**: Removes null, undefined, and empty values before storage
- **Optimized Presets**: Uses timestamps instead of ISO date strings for compact storage
- **Base64url Encoding**: URL-safe encoding for shareable links (more efficient than base64)
- **Minified JSON**: Built-in presets are minified to reduce file size
- **Backward Compatible**: Supports both old and new storage formats

## 📁 Project Structure

```
asm-query-hub/
├── components/              # React components
│   ├── EngineTabs.js       # Tabbed results display with syntax highlighting
│   ├── FieldsForm.js       # Dynamic form component with field selection
│   ├── Presets.js          # Preset management (built-in + custom)
│   └── ShareLink.js        # URL sharing functionality
├── examples/               # Example data
│   └── presets.json        # Built-in presets (9 presets)
├── lib/                    # Core logic
│   ├── converters/         # ASM platform converters
│   │   ├── shodan.js       # Shodan query converter
│   │   ├── censys.js       # Censys query converter
│   │   ├── fofa.js         # FOFA query converter
│   │   └── arrayHelper.js  # Array manipulation utilities
│   ├── converterIndex.js   # Converter orchestration
│   ├── searchUrls.js       # Platform search URL generators
│   └── storageUtils.js    # Storage optimization utilities
├── pages/                  # Next.js pages
│   ├── api/               # API routes
│   │   ├── convert.js     # Query conversion endpoint
│   │   └── engines.js     # Engine metadata endpoint
│   ├── _app.js            # App wrapper with theme provider
│   └── index.js           # Main application page
├── public/                 # Static assets
│   ├── logo.png           # Application logo
│   ├── shodan-logo.png    # Shodan logo
│   ├── censys-logo.png    # Censys logo
│   └── fofa-logo.png      # FOFA logo
├── scripts/               # Testing scripts
│   ├── test_converters.js # Converter tests
│   └── assertions.js      # Test assertions
├── styles/                # Global styles
│   └── globals.css        # Tailwind CSS imports
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Project dependencies
```

## 🧪 Testing

Run the test suite to verify converter functionality:

```bash
# Test all converters with example data
npm test

# Run assertion tests
node scripts/assertions.js
```

## 🔒 Security & Privacy

- **No External API Calls**: All conversion happens locally in the browser
- **No API Key Storage**: No vendor credentials required or stored
- **No Server-Side Data Storage**: All data processing is client-side
- **LocalStorage Only**: Presets are stored locally in the browser
- **No Tracking**: No analytics or tracking scripts included
- **Open Source**: Full source code available for security review

## 📖 Usage Examples

### Example 1: Find Exposed Web Servers

1. Select **Port** field and enter `80, 443`
2. Select **Protocol** field and enter `HTTP, HTTPS`
3. Click **Convert to Queries**
4. Copy the generated queries for each platform

### Example 2: Search by Certificate

1. Select **SSL Certificate** field and enter `*.example.com`
2. Select **Port** field and enter `443`
3. Click **Convert to Queries**

### Example 3: Use Built-in Presets

1. Scroll to the **Presets** section
2. Click **Load Preset** on any built-in preset
3. The form will auto-populate and convert automatically

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **Live Application**: [https://asm-query-hub.purplestrike.net/](https://asm-query-hub.purplestrike.net/)
- **GitHub Repository**: [https://github.com/purplestrike/ASM-Query-Hub](https://github.com/purplestrike/ASM-Query-Hub)
- **Report Issues**: [Open an issue on GitHub](https://github.com/purplestrike/ASM-Query-Hub/issues)

---

**Note**: This tool does not make external vendor API calls or store API keys. All conversion happens locally using documented query syntax from each ASM platform. The generated queries can be copied and used directly in each platform's search interface.
