const { Server } = require("socket.io");

require('dotenv').config();

const io = new Server(process.env.PORT, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  // console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    // console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    // console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("call:ended", ({ to }) => {
    io.to(to).emit("call:ended");
  });  

  socket.on("camera:toggle",({to,email,newCameraState})=>{
    socket.to(to).emit("camera:toggle",{from:socket.id,email,newCameraState});
  });

  socket.on("messages:sent",({to,currMsg})=>{
    // console.log(currMsg);
    socket.broadcast.emit("messages:sent",{from:socket.id,currMsg});
  })

});