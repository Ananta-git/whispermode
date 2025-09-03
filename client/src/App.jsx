import { useEffect, useState } from "react";
import { io } from "socket.io-client";

//for local and deployed backend
const URL = import.meta.env.MODE === "development"
  ? "http://localhost:3000"
  : "https://whispermode.onrender.com";  // ✅ your backend

const socket = io(URL);


function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState("");
  const [targetId, setTargetId] = useState(""); // For whisper
  const [username, setUsername] = useState(""); // Username input

 useEffect(() => {
  console.log("Socket connected?", socket.connected); // Check connection status

  socket.on("connect", () => {
    console.log("Socket connected?", socket.connected);
    console.log("Connected to server with id:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });

  socket.on("your id", (id) => setMyId(id));
  socket.on("user list", (list) => setUsers(list));
  socket.on("chat message", (msg) => setMessages((prev) => [...prev, msg]));

  return () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("your id");
    socket.off("user list");
    socket.off("chat message");
  };
}, []);


const setUserName = () => {
  if (username.trim() !== "") {
    socket.emit("set username", username);
    setUsername(""); // clear input
  }
};


  const sendMessage = () => {
    if (input.trim() === "") return;

    if (targetId) {
      // Whisper
      socket.emit("chat message", { to: targetId, message: input });
    } else {
      // Public
      socket.emit("chat message", input);
    }

    setInput("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Whispermode Chat🤐</h1>

      {/* Display your username */}
      <h2>Your username: {users.find(u => u.id === myId)?.name || "Not set"}</h2>

      {/* Username input */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          style={{ marginRight: 10 }}
        />
        <button onClick={setUserName}>Set Username</button>
      </div>

      {/* Whisper dropdown */}
      <div style={{ marginBottom: 10 }}>
        <label>Send To: </label>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          <option value="">Public</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.id === myId ? `${user.name} (You)` : user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chat messages */}
      <ul style={{ minHeight: 200, border: "1px solid gray", padding: 10 }}>
        {messages.map((msg, i) => (
          <li key={i} style={{ color: msg.includes("[Whisper") ? "red" : "white" }}>
            {msg}
          </li>
        ))}
      </ul>

      {/* Message input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        style={{ width: "70%", marginRight: 10 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
