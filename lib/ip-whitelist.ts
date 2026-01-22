// IP whitelisting utility
export function isIPAllowed(clientIP: string): boolean {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length === 0) {
    // If no IPs configured, allow all (development mode)
    return true;
  }

  // Check exact match
  if (allowedIPs.includes(clientIP)) {
    return true;
  }

  // Check CIDR notation
  for (const allowedIP of allowedIPs) {
    if (allowedIP.includes('/')) {
      if (isIPInCIDR(clientIP, allowedIP)) {
        return true;
      }
    }
  }

  return false;
}

function isIPInCIDR(ip: string, cidr: string): boolean {
  const [network, prefixLength] = cidr.split('/');
  const mask = parseInt(prefixLength);

  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(network);
  const maskNum = (0xffffffff << (32 - mask)) >>> 0;

  return (ipNum & maskNum) === (networkNum & maskNum);
}

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function getClientIP(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

