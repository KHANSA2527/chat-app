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
  onSnapshot,
  DocumentData,
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
  name: string;
  img: string;
}


const Sidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingChat, setIsAddingChat] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentUserUid = auth.currentUser?.uid;
 const router = useRouter()
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
    const unsubscribeChats = onSnapshot(
      query(collection(db, "chats"), where("members", "array-contains", currentUserUid)),
      (snapshot) => {
        const fetchedChats = snapshot.docs.map((doc) => ({
          id: doc.id, // Ensure unique id assignment
          ...doc.data(),
        })) as Chat[];
        setChats(fetchedChats);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeChats();
    };
  }, [currentUserUid]);

  const filteredChats = chats.filter(
    (chat) => chat.name && chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  

  const openModal = () => setIsAddingChat(true);
  const closeModal = () => setIsAddingChat(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const startChat = async (user: User) => {
    try {
      const chatQuery = query(
        collection(db, "chats"),
        where("members", "array-contains", currentUserUid)
      );
  
      const querySnapshot = await getDocs(chatQuery);
      let existingChat = null;
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.members.includes(user.uid)) {
          existingChat = { id: doc.id };
        }
      });
  
      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
      } else {
        const chatData: any = {
          members: [currentUserUid, user.uid],
          createdAt: new Date(),
        };
  
        if (user.img) {
          chatData.img = user.img; // ✅ Add only if defined
        }
  
        const newChatRef = await addDoc(collection(db, "chats"), chatData);
        router.push(`/chat/${newChatRef.id}`);
      }
  
      onClose(); // Close modal
    } catch (error) {
      console.error("Error creating chat:", error);
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
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <li
                key={chat.id}
                className="flex items-center gap-3 p-3 bg-gray-900 rounded-md cursor-pointer hover:bg-gray-700 transition"
              >
                <img
                  src={chat.img}
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
                  onClick={() => addChat(user)}
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
