import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';

// SOCKETS
import socketManager from './services/socketManager.js';

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// iniciar servidor
server.listen(PORT, () => {
  console.log(`ALTI.GESTION iniciado en el puerto ${PORT}`);
});
