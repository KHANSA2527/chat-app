"use client";
import React, { useState } from "react";
import { Send, File, Smile } from "lucide-react";

const Conversation: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; sender: string; file?: string }[]>([  
    { text: "Hey, how are you?", sender: "other" },
    { text: "I'm good, how about you?", sender: "me" },
    { text: "Doing great! What's up?", sender: "other" },
  ]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState("John Doe");
  
  const users = ["John Doe", "Jane Smith", "Alice Brown"]; // List of users

  const sendMessage = () => {
    if (message.trim() === "" && !file) return;
    setMessages([...messages, { text: message, sender: "me", file: file ? URL.createObjectURL(file) : undefined }]);
    setMessage("");
    setFile(null);
  };

  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 text-lg font-semibold flex justify-between items-center">
        <select
          className="bg-blue-500 text-white p-2 rounded-md"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          {users.map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`relative max-w-xs md:max-w-md p-4 rounded-lg text-white ${msg.sender === "me" ? "bg-blue-500 self-end ml-auto rounded-tr-none" : "bg-gray-500 self-start rounded-tl-none"}`}>
            {msg.text}
            {msg.file && <img src={msg.file} alt="file" className="mt-2 max-w-full rounded-lg" />}
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t flex items-center relative">
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your message..."
        />
        <input type="file" className="hidden" id="file-upload" onChange={handleFileChange} />
        <label htmlFor="file-upload" className="ml-2 cursor-pointer">
          <File size={24} />
        </label>
        <button onClick={sendMessage} className="ml-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Send size={18} /> Send
        </button>
      </div>
    </div>
  );
};

export default Conversation;
