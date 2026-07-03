import dgram from 'dgram';

export default function handler(req, res) {
  const { token } = req.query;
  if (token !== process.env.SECRET_TOKEN) {
    return res.status(403).send('Non autorizzato');
  }

  const mac = process.env.SERVER_MAC.replace(/:/g, '');
  const magic = Buffer.alloc(6, 0xFF);
  const macBuf = Buffer.from(mac, 'hex');
  const packet = Buffer.concat([magic, ...Array(16).fill(macBuf)]);

  const socket = dgram.createSocket('udp4');
  socket.send(packet, 9, process.env.HOME_HOST, (err) => {
    socket.close();
    console.log('Host:', process.env.HOME_HOST);
    if (err) return res.status(500).send('Errore invio');
    res.status(200).send('WOL inviato');
  });
}
