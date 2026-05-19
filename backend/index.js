const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  path: "/socket",
  cors: { origin: "*" },
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, "../build")));

// Handles any requests that don't match the ones above
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  
  socket.on("TURN_SWITCH", ()=>{
    console.log(socket.id);
    socket.broadcast.emit("TURN_SWITCH_CLIENT",{user:socket.id});
  });

  socket.on("ping", ()=>{
    console.log("ping");
    io.emit("pong");
  })

  socket.on("LETTER_PLAYED", (data)=>{
    console.log(data);
    socket.broadcast.emit('LETTER_RECEIVED', data);
  });

  socket.on("LETTERS_ADD", (data)=>{
    console.log(data);
    socket.broadcast.emit("CLIENT_LETTERS_ADD", data);
  })

  socket.on("LETTER_REMOVED", (data)=>{
    console.log(data);
    socket.broadcast.emit('LETTER_REMOVED_CLIENT', data);
  })

  socket.on("SPACE_REMOVED", ()=>{
    socket.broadcast.emit("SPACE_REMOVED_CLIENT");
  })

  socket.on("SCORE_UPDATE", (data) => {
    socket.broadcast.emit("SCORE_UPDATE_CLIENT", data);
  });

  socket.on("END_TURN", ()=>{
    console.log("ended");
    socket.broadcast.emit('END_TURN_CLIENT');
  })

  socket.on("TILES_INIT", (data)=>{
    socket.broadcast.emit("TILES_INIT_CLIENT", data);
    io.emit("TURN_SWITCH_CLIENT", {user:socket.id})
  });

  socket.on("FACTORY_ADD", (data)=>{
    socket.broadcast.emit("FACTORY_ADD_CLIENT", data);
  });

  socket.on("OPEN_FACTORY", (data) => {
    socket.broadcast.emit("OPEN_FACTORY", data);
  })
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("listening on PORT " + PORT);
});
