import Conversation from '@/Components/ChatRoom/ChatRoom'
import Sidebar from '@/Components/ChatRoom/Sidebar'
import React from 'react'

const Chats = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <Conversation />
    </div>
  )
}

export default Chats
