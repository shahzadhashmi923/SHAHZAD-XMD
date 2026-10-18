import { default as makeWASocket, useMultiFileAuthState, Browsers } from "@whiskeysockets/baileys";
import fs from "fs";
import pino from "pino";

export default async function handler(req, res) {
  const num = (req.query.num || "").replace(/[^0-9]/g,"");
  if(!num) return res.status(400).json({error:"number do"});
  
  const tmpDir = `/tmp/${num}_${Date.now()}`;
  fs.mkdirSync(tmpDir, { recursive: true });
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(tmpDir);
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome")
    });
    sock.ev.on("creds.update", saveCreds);
    
    await new Promise(r => setTimeout(r, 2500));
    const code = await sock.requestPairingCode(num);
    
    res.json({ code });
    
    setTimeout(() => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }, 5000);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
