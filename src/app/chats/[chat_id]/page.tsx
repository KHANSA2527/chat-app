import Conversation from '@/Components/ChatRoom/ChatRoom'
import Sidebar from '@/Components/ChatRoom/Sidebar'
import React from 'react'

type tParams = Promise<{ chat_id: string }>;

const page = async ({ params }: { params: tParams }) => {
      const { chat_id } = await  params;
    
  return (
    <div className="flex h-screen">
    <Sidebar />
    <Conversation chat_id={chat_id}/>
  </div>
  )
}

export default page
