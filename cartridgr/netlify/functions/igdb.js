const https = require("https");

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await httpsPost(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { "Content-Type": "application/x-www-form-urlencoded" },
    ""
  );
  if (!res.body.access_token) throw new Error("No token received");
  cachedToken = res.body.access_token;
  tokenExpiry = Date.now() + (res.body.expires_in - 60) * 1000;
  return cachedToken;
}

exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method not allowed" };
  }

  try {
    const { action, query } = JSON.parse(event.body || "{}");
    const token = await getAccessToken();

    if (action === "search") {
      const res = await httpsPost(
        "https://api.igdb.com/v4/games",
        {
          "Client-ID": process.env.IGDB_CLIENT_ID,
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
        `search "${query}"; fields name,cover.image_id,first_release_date,genres.name,summary; limit 8;`
      );
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(res.body),
      };
    }

    if (action === "getById") {
      const res = await httpsPost(
        "https://api.igdb.com/v4/games",
        {
          "Client-ID": process.env.IGDB_CLIENT_ID,
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
        `where id = ${query}; fields name,cover.image_id,first_release_date,genres.name,summary; limit 1;`
      );
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(res.body),
      };
    }

    return { statusCode: 400, headers: corsHeaders, body: "Unknown action" };
  } catch (err) {
    console.error("IGDB proxy error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
