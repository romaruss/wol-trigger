import net from 'net';
import dgram from 'dgram';

function isHostUp(host, port = 80, timeout = 4000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(true));   // porta chiusa ma host raggiungibile = router acceso
    socket.on('timeout', () => { socket.destroy(); resolve(false); }); // nessuna risposta = router spento
    socket.connect(port, host);
  });
}

export default async function handler(req, res) {
  const { token } = req.query;
  if (token !== process.env.SECRET_TOKEN) {
    return res.status(403).send('Non autorizzato');
  }

  const up = await isHostUp(process.env.HOME_HOST);
  if (!up) {
    return res.status(200).send('Router non raggiungibile, nessuna azione');
  }

  const mac = process.env.SERVER_MAC.replace(/:/g, '');
  const magic = Buffer.alloc(6, 0xFF);
  const macBuf = Buffer.from(mac, 'hex');
  const packet = Buffer.concat([magic, ...Array(16).fill(macBuf)]);

  const socket = dgram.createSocket('udp4');
  socket.send(packet, 9, process.env.HOME_HOST, (err) => {
    socket.close();
    if (err) return res.status(500).send('Errore invio: ' + err.message);
    res.status(200).send('Router su, WOL inviato');
  });
}
