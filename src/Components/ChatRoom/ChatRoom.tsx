"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip, ChevronLeft, Mic, Smile } from "lucide-react";
import { db, auth } from "@/firebase/fireabseconfig";
import {
  collection,
  query,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  Timestamp 
} from "firebase/firestore";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";


interface Chat {
  chat_id: string;
}

interface Message {
  id: string;
  text?: string;
  fileUrl?: string;
  senderId: string;
  createdAt?: Timestamp;
}

interface EmojiType {
  native: string;
}

const Conversation = ({ chat_id }: Chat) => {
  const [messages, setMessages] = useState<
  { id: string; text?: string; fileUrl?: string; senderId: string; createdAt?: Timestamp }[]
  >([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!chat_id) return;

    const fetchChatDetails = async () => {
      try {
        const chatRef = doc(db, "chats", chat_id);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const members: string[] = chatData.members || [];
          const otherUserId = members.find((id) => id !== userId);

          if (otherUserId) {
            const userRef = doc(db, "users", otherUserId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              setOtherUserName(userSnap.data().name);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat details:", error);
      }
    };

    fetchChatDetails();
  }, [chat_id, userId]);

  useEffect(() => {
    if (!chat_id) return;

    const messagesRef = collection(db, `chats/${chat_id}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
    
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chat_id]);

  const sendMessage = async () => {
    if (!message.trim() && !file) return;

    try {
      const messagesRef = collection(db, `chats/${chat_id}/messages`);

      await addDoc(messagesRef, {
        text: message || null,
        fileUrl: file ? "uploaded_file_url_here" : null, // Upload logic needed
        senderId: userId,
        createdAt: serverTimestamp(),
      });

      setMessage("");
      setFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEmojiSelect = (emoji: EmojiType) => {
    setMessage((prevMessage) => prevMessage + emoji.native);
    setShowEmojiPicker(false);
  };
  

  return (
    <div className="flex flex-col w-full h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 bg-blue-600 text-white p-4 text-lg font-semibold shadow-md">
        <ChevronLeft size={24} className="cursor-pointer" />
        <img
          src={"/images/profile-user.svg"}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <span>{otherUserName ? otherUserName : "Loading..."}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`relative max-w-[80%] md:max-w-md p-3 rounded-xl text-white shadow-md ${
              msg.senderId === userId
                ? "bg-blue-500 ml-auto rounded-tr-none"
                : "bg-gray-500 mr-auto rounded-tl-none"
            }`}
          >
            {msg.text && <p>{msg.text}</p>}
            {msg.fileUrl && (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-200 underline"
              >
                View Attachment
              </a>
            )}
            <span className="absolute bottom-1 right-2 text-xs text-gray-200">
              {msg.createdAt?.toDate
                ? msg.createdAt
                    .toDate()
                    .toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                : ""}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-gray-200 border-t flex items-center gap-2 shadow-md relative">
        {/* File Attachment Icon */}
        <label className="p-2 rounded-full hover:bg-gray-300 cursor-pointer">
          <Paperclip size={24} className="text-gray-600" />
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        {/* Emoji Picker Toggle Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-full hover:bg-gray-300"
        >
          <Smile size={24} className="text-gray-600" />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-14 left-2 z-50">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          </div>
        )}

        {/* Text Input */}
        <div className="flex flex-1 items-center bg-white rounded-lg border focus-within:ring-2 focus-within:ring-blue-400">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 bg-transparent outline-none text-gray-800"
            placeholder="Type a message..."
          />
        </div>
        <button className="p-2 rounded-full hover:bg-gray-300">
            <Mic size={24} className="text-gray-600" />
          </button>
        {/* Send Button */}
        <button
          onClick={sendMessage}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Conversation;
