import dgram from 'dgram';

export default async function handler(req, res) {
  const { token } = req.query;
  if (token !== process.env.SECRET_TOKEN) {
    return res.status(403).send('Non autorizzato');
  }

  const mac = process.env.SERVER_MAC.replace(/:/g, '');
  const magic = Buffer.alloc(6, 0xFF);
  const macBuf = Buffer.from(mac, 'hex');
  const packet = Buffer.concat([magic, ...Array(16).fill(macBuf)]);

  const socket = dgram.createSocket('udp4');
  
  socket.bind(() => {
    socket.setBroadcast(true);
    
    // Invia al broadcast della rete locale
    socket.send(packet, 9, '192.168.1.255', (err) => {
      socket.close();
      if (err) return res.status(500).send('Errore: ' + err.message);
      res.status(200).send('WoL inviato in broadcast locale');
    });
  });
}
