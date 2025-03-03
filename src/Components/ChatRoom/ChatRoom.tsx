"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, File, ChevronLeft } from "lucide-react";
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
} from "firebase/firestore";

interface Chat {
  chat_id: string;
}

const Conversation = ({ chat_id }: Chat) => {
  const [messages, setMessages] = useState<
    { id: string; text: string; senderId: string; createdAt?: any }[]
  >([]);
  const [message, setMessage] = useState("");
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
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
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any;
      setMessages(fetchedMessages);

      // Auto-scroll to the latest message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [chat_id]);

  const sendMessage = async () => {
    if (message.trim() === "") return;

    try {
      const messagesRef = collection(db, `chats/${chat_id}/messages`);

      await addDoc(messagesRef, {
        text: message,
        senderId: userId,
        createdAt: serverTimestamp(),
      });

      setMessage("");
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`relative max-w-xs md:max-w-md p-4 rounded-xl text-white shadow-md ${
              msg.senderId === userId
                ? "bg-blue-500 ml-auto rounded-tr-none" // Sender (Right Side)
                : "bg-gray-500 mr-auto rounded-tl-none" // Receiver (Left Side)
            }`}
          >
            {msg.text}
            <span className="absolute bottom-1 right-2 text-xs text-gray-200">
              {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString() : ""}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Box */}
      <div className="p-4 bg-gray-200 border-t flex items-center gap-3 shadow-md">
        <button className="p-2 rounded-full hover:bg-gray-300">
          <File size={24} className="text-gray-600" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your message..."
        />
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
