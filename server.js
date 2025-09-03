// Import required modules
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Create app
const app = express();

// Allowed origins (local + deployed frontend)
const allowedOrigins = [
  "http://localhost:5173",
  "https://whispermode-frontend.onrender.com" // ✅ your actual deployed frontend
];

// Enable CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // allow
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"]
}));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"]
  }
});

// Track connected users
const users = {}; // { id, name }

// Optional: simple route
app.get("/", (req, res) => {
  res.send("Whispermode chat server is running 🚀");
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Default username
  users[socket.id] = { id: socket.id, name: `User-${socket.id.slice(0, 4)}` };

  // Send own socket ID
  socket.emit("your id", socket.id);

  // Send updated user list
  io.emit("user list", Object.values(users));

  // Set username from client
  socket.on("set username", (username) => {
    users[socket.id].name = username || users[socket.id].name;
    io.emit("user list", Object.values(users));
  });

  // Listen for messages
  socket.on("chat message", (msg) => {
    const fromName = users[socket.id].name;
    if (msg.to && msg.message) {
      const formattedMsg = `[Whisper to ${users[msg.to]?.name || "Unknown"}]: ${msg.message}`;
      // Send to the sender
      socket.emit("chat message", formattedMsg);
      // Send to the target
      io.to(msg.to).emit("chat message", `[Whisper from ${fromName}]: ${msg.message}`);
    } else {
      io.emit("chat message", `[${fromName}]: ${msg}`);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("user list", Object.values(users));
    console.log("A user disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000; // ✅ Render will set process.env.PORT
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
