const jwt = require('jsonwebtoken');

let io = null;

/* Clients connect with: io(URL, { auth: { token } })
   Users join room "user:<id>", admins join room "admins". */
const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;
    socket.join(role === 'admin' ? 'admins' : `user:${id}`);
  });

  return io;
};

const emitToUser = (userId, event, data) => io?.to(`user:${userId}`).emit(event, data);
const emitToAdmins = (event, data) => io?.to('admins').emit(event, data);

module.exports = { initSocket, emitToUser, emitToAdmins };
