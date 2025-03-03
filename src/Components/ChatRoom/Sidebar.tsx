"use client";
import React, { useState, useEffect } from "react";
import { Plus, Search, X, Menu } from "lucide-react";
import { db, auth } from "@/firebase/fireabseconfig";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface User {
  uid: string;
  name: string;
  img: string;
}

interface Chat {
  id: string;
  members: string[];
  createdAt: string;
  last_msg: string;
  name?: string;
  img?: string;
}

const Sidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingChat, setIsAddingChat] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUserUid = auth.currentUser?.uid;
  const router = useRouter();
  useEffect(() => {
    if (!currentUserUid) return;

    // Fetch all users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetchedUsers = snapshot.docs.map((doc) => ({
        uid: doc.id, // Ensure unique id assignment
        ...doc.data(),
      })) as User[];
      setUsers(fetchedUsers);
    });
    // Fetch user's chats
    const chatsRef = collection(db, "chats");
    const chatsQuery = query(
      chatsRef,
      where("members", "array-contains", currentUserUid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
      const chatData: Chat[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Chat), // Type assertion
      }));

      // Fetch user details for each chat
      const enrichedChats = await Promise.all(
        chatData.map(async (chat) => {
          const otherUserUid = chat.members.find(
            (uid) => uid !== currentUserUid
          );
          if (!otherUserUid) return chat;

          const userDoc = await getDoc(doc(db, "users", otherUserUid));
          const userData = userDoc.exists() ? (userDoc.data() as User) : null;

          return {
            ...chat,
            name: userData?.name || "Unknown User",
            img: userData?.img || "/profile-user.svg", // Default profile image
          };
        })
      );

      setChats(enrichedChats);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeChats();
    };
  }, [currentUserUid]);

  const filteredChats = chats.filter(
    (chat) =>
      chat.name && chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = () => setIsAddingChat(true);
  const closeModal = () => setIsAddingChat(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleChatClick = (chatId: string) => {
    router.push(`/chats/${chatId}`); // Navigates to chat page with chat ID
  };

  const startChat = async (user: User) => {
    console.log("user===", user);

    try {
      const currentUser = auth.currentUser; // Logged-in user
      if (!currentUser) return;

      // Reference to Firestore chats collection
      const chatsRef = collection(db, "chats");

      // Check if chat already exists
      const q = query(
        chatsRef,
        where("members", "array-contains", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      let chatExists = false;

      querySnapshot.forEach((doc) => {
        const chat = doc.data();
        if (chat.members.includes(user.uid)) {
          chatExists = true;
        }
      });

      // If chat exists, do nothing
      if (chatExists) {
        console.log("Chat already exists.");
        alert("Chat already exists");
        return;
      }

      // Create new chat
      await addDoc(chatsRef, {
        members: [currentUser.uid, user.uid], // Store both users
        createdAt: serverTimestamp(), // Timestamp when chat is created
        last_msg: "", // Initially empty
      });
      alert("Chat created successfully");
      console.log("Chat created successfully.");
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 h-full w-72 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
      >
        {/* Close button for mobile sidebar */}
        <button
          onClick={toggleSidebar}
          className="md:hidden absolute top-4 right-4 text-white"
        >
          <X size={24} />
        </button>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Chats</h2>
          <button
            onClick={openModal}
            className="p-2 rounded-full bg-white text-blue-600 hover:bg-gray-200 transition"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 text-black rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>

        {/* Chat List */}
        <ul className="mt-2 space-y-3">
          {loading ? (
            <p className="text-gray-300 text-sm text-center py-4">
              Loading chats...
            </p>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className="flex items-center gap-3 p-3  rounded-md cursor-pointer hover:bg-gray-400 transition"
              >
                <img
                  src="/images/profile-user.svg"
                  alt={chat.name}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <span className="text-sm">{chat.name}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-300 text-sm text-center py-4">
              No chats found
            </p>
          )}
        </ul>
      </div>

      {/* Modal for Adding New Chat */}
      {isAddingChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 text-black shadow-xl transform scale-100 transition duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Start a New Chat</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* User List */}
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <li
                  key={user.uid}
                  className="flex items-center gap-3 p-3 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition"
                  onClick={() => startChat(user)}
                >
                  <img
                    src={user.img || "https://i.pravatar.cc/40"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                  />
                  <span className="text-sm">{user.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
