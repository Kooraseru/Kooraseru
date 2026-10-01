const ALLOWED_ORIGIN = "https://kooraseru.com";
const MAX_MESSAGE_LENGTH = 800;
const TOPICS = new Set(["commission", "collaboration", "question", "other"]);

function json(body, status, origin) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    },
  });
}

function cleanHeader(value) {
  return value.replace(/[\r\n]/g, " ").trim();
}

function base64Url(text) {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(env) {
  const body = new URLSearchParams({
    client_id: env.GMAIL_CLIENT_ID,
    client_secret: env.GMAIL_CLIENT_SECRET,
    refresh_token: env.GMAIL_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`Gmail token request failed: ${response.status}`);
  const result = await response.json();
  if (!result.access_token) throw new Error("Gmail token response lacked an access token");
  return result.access_token;
}

async function sendEmail(env, name, email, topic, subject, message) {
  const accessToken = await getAccessToken(env);
  const sender = cleanHeader(env.GMAIL_EMAIL);
  const safeName = cleanHeader(name);
  const raw = base64Url([
    `From: ${sender}`,
    `To: ${sender}`,
    `Subject: Website contact: ${cleanHeader(subject)}`,
    `Reply-To: ${cleanHeader(email)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    `Name: ${safeName}`,
    `Email: ${email}`,
    `Topic: ${topic}`,
    `Subject: ${subject}`,
    "Message:",
    message,
  ].join("\r\n"));
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) throw new Error(`Gmail send failed: ${response.status}`);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const path = new URL(request.url).pathname;
    if (path !== "/") return json({ success: false, error: "Not found" }, 404, origin);
    if (origin !== ALLOWED_ORIGIN) return json({ success: false, error: "Forbidden" }, 403, origin);
    if (request.method === "OPTIONS") return json({}, 204, origin);
    if (request.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405, origin);
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return json({ success: false, error: "Expected JSON" }, 415, origin);
    }

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ success: false, error: "Invalid JSON" }, 400, origin);
    }
    if (!input || typeof input !== "object") return json({ success: false, error: "Invalid fields" }, 400, origin);
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim() : "";
    const topic = typeof input.topic === "string" ? input.topic.trim() : "";
    const subject = typeof input.subject === "string" ? input.subject.trim() : "";
    const message = typeof input.message === "string" ? input.message.trim() : "";
    if (input.website) return json({ success: true }, 200, origin);
    if (!name || name.length > 80 || !email || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !TOPICS.has(topic) ||
        !subject || subject.length > 100 || message.length < 10 || message.length > MAX_MESSAGE_LENGTH) {
      return json({ success: false, error: "Invalid contact details" }, 400, origin);
    }

    const visitorKey = request.headers.get("CF-Connecting-IP") || email.toLowerCase();
    const { success: withinLimit } = await env.CONTACT_RATE_LIMIT.limit({ key: visitorKey });
    if (!withinLimit) return json({ success: false, error: "Too many messages" }, 429, origin);

    try {
      await sendEmail(env, name, email, topic, subject, message);
      return json({ success: true }, 200, origin);
    } catch (error) {
      console.error("Contact delivery failed:", error);
      return json({ success: false, error: "Delivery failed" }, 502, origin);
    }
  },
};
