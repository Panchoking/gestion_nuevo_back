import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';

// SOCKETS
import socketManager from './services/socketManager.js';

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// crear instancia de IO
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5175', 'https://gestion.altimec.cl'],
        credentials: true
    }
});
// inicializar servicio socketManager
socketManager.initialize(io);

io.on('connection', (socket) => {
    socketManager.handleConnection(socket);
});

// iniciar servidor
server.listen(PORT, () => {
  console.log(`ALTI.GESTION iniciado en el puerto ${PORT}`);
});

export { io };