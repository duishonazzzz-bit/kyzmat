const ipaddr = require("ipaddr.js");

const blockedMessage = "\u0414\u043e\u0441\u0442\u0443\u043f \u043a \u0441\u0430\u0439\u0442\u0443 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043d \u0442\u043e\u043b\u044c\u043a\u043e \u0447\u0435\u0440\u0435\u0437 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u0443\u044e VPN-\u0441\u0435\u0442\u044c.";
const ipUnavailable = "\u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c";
const pageTitle = "\u0414\u043e\u0441\u0442\u0443\u043f \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d";
const enableVpnMessage = "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0435 VPN \u0438 \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443.";
const detectedIpLabel = "\u0410\u0434\u0440\u0435\u0441, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u0432\u0438\u0434\u0438\u0442 \u0441\u0435\u0440\u0432\u0435\u0440:";
const allowlistHint = "\u0415\u0441\u043b\u0438 \u0434\u043e\u0441\u0442\u0443\u043f \u0432\u0441\u0451 \u0435\u0449\u0451 \u0437\u0430\u043a\u0440\u044b\u0442, \u0434\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u044d\u0442\u043e\u0442 \u0430\u0434\u0440\u0435\u0441 \u0432 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438";
const allowedAddressHint = "\u0434\u043b\u044f IPv4 \u0438\u043b\u0438";
const addressSuffixHint = "\u0434\u043b\u044f IPv6.";

function parseAllowedCidrs(value) {
  return String(value || "")
    .split(",")
    .map((cidr) => cidr.trim())
    .filter(Boolean)
    .map((cidr) => {
      let parsed;

      try {
        parsed = ipaddr.parseCIDR(cidr);
      } catch {
        throw new Error("VPN_ALLOWED_CIDRS contains an invalid CIDR range: " + cidr);
      }

      if (parsed[1] === 0) {
        throw new Error("VPN_ALLOWED_CIDRS must not allow the entire IPv4 or IPv6 internet");
      }

      return parsed;
    });
}

function isIpAllowed(ip, ranges) {
  if (!ip) {
    return false;
  }

  let address;
  try {
    address = ipaddr.process(ip);
  } catch {
    return false;
  }

  return ranges.some(([network, prefix]) => (
    address.kind() === network.kind() && address.match(network, prefix)
  ));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function createVpnAccessMiddleware({
  enabled = false,
  allowedCidrs = "",
  useCloudflareClientIp = false,
} = {}) {
  if (!enabled) {
    return (_req, _res, next) => next();
  }

  const ranges = parseAllowedCidrs(allowedCidrs);

  return (req, res, next) => {
    const clientIp = useCloudflareClientIp
      ? String(req.get("cf-connecting-ip") || "").trim()
      : (req.ip || "");
    if (isIpAllowed(clientIp, ranges)) {
      return next();
    }

    const detectedIp = clientIp || ipUnavailable;

    if (req.path.startsWith("/api/") || req.get("accept")?.includes("application/json")) {
      return res.status(403).json({ message: blockedMessage, detectedIp });
    }

    const html = [
      "<!doctype html><html lang=\"ru\"><head><meta charset=\"utf-8\">",
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
      "<title>", pageTitle, "</title></head>",
      "<body style=\"font-family:system-ui,sans-serif;max-width:42rem;margin:12vh auto;padding:0 1.25rem;line-height:1.6;color:#172033\">",
      "<h1>", pageTitle, "</h1><p>", blockedMessage, " ", enableVpnMessage, "</p>",
      "<p>", detectedIpLabel, " <code>", escapeHtml(detectedIp), "</code></p>",
      "<p>", allowlistHint, " <code>VPN_ALLOWED_CIDRS</code> \u0432 Render \u0441 \u043e\u043a\u043e\u043d\u0447\u0430\u043d\u0438\u0435\u043c <code>/32</code> ",
      allowedAddressHint, " <code>/128</code> ", addressSuffixHint, "</p></body></html>",
    ].join("");

    return res.status(403).type("html").send(html);
  };
}

module.exports = { createVpnAccessMiddleware, parseAllowedCidrs, isIpAllowed };
