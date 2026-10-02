import app from "../server";

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error("[Vercel Function Error]", err);
    return res.status(500).json({
      success: false,
      error: `Serverless Function Error: ${err?.message || String(err)}`
    });
  }
}
