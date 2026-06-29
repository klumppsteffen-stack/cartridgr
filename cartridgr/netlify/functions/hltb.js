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
    const { title } = JSON.parse(event.body || "{}");
    if (!title) return { statusCode: 400, headers: corsHeaders, body: "Missing title" };

    const searchTerms = title.split(" ").filter(Boolean);

    const res = await httpsPost(
      "https://howlongtobeat.com/api/search/",
      {
        "Content-Type": "application/json",
        "Referer": "https://howlongtobeat.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://howlongtobeat.com",
      },
      JSON.stringify({ searchTerms, searchType: "games", size: 5, page: 1 })
    );

    if (!res.body?.data?.length) {
      return { statusCode: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, body: "null" };
    }

    // Try exact match first, fall back to first result
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const match = res.body.data.find(r => norm(r.game_name) === norm(title)) || res.body.data[0];

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        comp_main: match.comp_main || null,
        comp_plus: match.comp_plus || null,
        comp_100: match.comp_100 || null,
        game_name: match.game_name,
      }),
    };
  } catch (err) {
    console.error("HLTB proxy error:", err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
