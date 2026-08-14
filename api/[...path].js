/* global Buffer, process */

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
]);

const getRequestBody = (req) => {
  if (["GET", "HEAD"].includes(req.method)) return undefined;
  if (req.body === undefined || req.body === null) return undefined;
  return typeof req.body === "string" || Buffer.isBuffer(req.body)
    ? req.body
    : JSON.stringify(req.body);
};

export default async function handler(req, res) {
  const apiOrigin = process.env.API_ORIGIN?.replace(/\/$/, "");

  if (!apiOrigin) {
    return res.status(500).json({ message: "API_ORIGIN is not configured." });
  }

  const target = new URL(req.url, apiOrigin);
  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (value && !HOP_BY_HOP_HEADERS.has(name.toLowerCase())) headers[name] = value;
  }
  headers.host = target.host;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: getRequestBody(req),
      redirect: "manual",
    });

    for (const [name, value] of upstream.headers.entries()) {
      if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && name.toLowerCase() !== "set-cookie") {
        res.setHeader(name, value);
      }
    }

    const cookies = upstream.headers.getSetCookie?.() || [];
    if (cookies.length) res.setHeader("set-cookie", cookies);
    return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.error("API proxy failure:", error);
    return res.status(502).json({ message: "The API service is temporarily unavailable." });
  }
}
