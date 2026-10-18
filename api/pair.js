import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys"
import fs from "fs"

export default async function handler(req, res) {
  const num = (req.query.num || "").replace(/[^0-9]/g, "");
  if (!num) return res.json({ error: "Number missing" });
  try {
    const dir = `/tmp/${num}`;
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["SHAZI XMD", "Chrome", "1.0"]
    });
    sock.ev.on("creds.update", saveCreds);
    await new Promise((r) => setTimeout(r, 2000));
    let code = await sock.requestPairingCode(num);
    return res.json({ code: code });
  } catch (e) {
    return res.json({ error: e.message });
  }
}
