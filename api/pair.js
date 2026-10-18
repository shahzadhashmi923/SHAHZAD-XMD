import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, useMultiFileAuthState } = pkg;
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const num = (req.query.num || "").replace(/[^0-9]/g, "");
  if (!num) return res.status(400).json({ error: "Number missing" });
  
  const dir = path.join("/tmp", num + "_" + Date.now());
  try {
    fs.mkdirSync(dir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["SHAZI XMD", "Chrome", "1.0"],
      syncFullHistory: false
    });
    sock.ev.on("creds.update", saveCreds);
    
    if (!sock.authState.creds.registered) {
      await new Promise(r => setTimeout(r, 2000));
      const code = await sock.requestPairingCode(num);
      res.status(200).json({ code });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
}
