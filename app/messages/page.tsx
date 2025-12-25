'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  receiverId: number;
  receiverName: string;
  receiverEmail: string;
  receiverRole: string;
  content: string;
  timestamp: string;
  read: boolean;
  conversationId: string;
}

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function Messages() {
  const { user } = useAuth();

  // All system users for messaging
  const [systemUsers] = useState<SystemUser[]>([
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'employee' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'employee' },
    { id: 3, name: 'Mike Johnson', email: 'mike@company.com', role: 'employee' },
    { id: 4, name: 'Sarah Davis', email: 'sarah@company.com', role: 'employee' },
    { id: 5, name: 'Admin User', email: 'admin@company.com', role: 'admin' },
    { id: 6, name: 'Cafeteria Manager', email: 'cafeteria@company.com', role: 'cafeteria_worker' },
    { id: 7, name: 'Tech Support', email: 'tech@company.com', role: 'technician' },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      senderId: 6,
      senderName: 'Cafeteria Manager',
      senderEmail: 'cafeteria@company.com',
      senderRole: 'cafeteria_worker',
      receiverId: 1,
      receiverName: 'John Doe',
      receiverEmail: 'john@company.com',
      receiverRole: 'employee',
      content: 'Your order is ready for pickup!',
      timestamp: '2025-12-25 12:30:00',
      read: true,
      conversationId: 'emp1-caf6',
    },
    {
      id: 2,
      senderId: 1,
      senderName: 'John Doe',
      senderEmail: 'john@company.com',
      senderRole: 'employee',
      receiverId: 6,
      receiverName: 'Cafeteria Manager',
      receiverEmail: 'cafeteria@company.com',
      receiverRole: 'cafeteria_worker',
      content: 'Can you add extra spice to my order?',
      timestamp: '2025-12-25 11:45:00',
      read: false,
      conversationId: 'emp1-caf6',
    },
    {
      id: 3,
      senderId: 2,
      senderName: 'Jane Smith',
      senderEmail: 'jane@company.com',
      senderRole: 'employee',
      receiverId: 1,
      receiverName: 'John Doe',
      receiverEmail: 'john@company.com',
      receiverRole: 'employee',
      content: 'Hey John, did you see the attendance report?',
      timestamp: '2025-12-25 10:15:00',
      read: false,
      conversationId: 'emp1-emp2',
    },
    {
      id: 4,
      senderId: 1,
      senderName: 'John Doe',
      senderEmail: 'john@company.com',
      senderRole: 'employee',
      receiverId: 2,
      receiverName: 'Jane Smith',
      receiverEmail: 'jane@company.com',
      receiverRole: 'employee',
      content: 'Yes, I did! Great numbers this month.',
      timestamp: '2025-12-25 10:20:00',
      read: true,
      conversationId: 'emp1-emp2',
    },
    {
      id: 5,
      senderId: 5,
      senderName: 'Admin User',
      senderEmail: 'admin@company.com',
      senderRole: 'admin',
      receiverId: 1,
      receiverName: 'John Doe',
      receiverEmail: 'john@company.com',
      receiverRole: 'employee',
      content: 'Please submit your performance review by end of week.',
      timestamp: '2025-12-25 09:30:00',
      read: true,
      conversationId: 'emp1-admin5',
    },
    {
      id: 6,
      senderId: 3,
      senderName: 'Mike Johnson',
      senderEmail: 'mike@company.com',
      senderRole: 'employee',
      receiverId: 7,
      receiverName: 'Tech Support',
      receiverEmail: 'tech@company.com',
      receiverRole: 'technician',
      content: 'I have an issue with my email access. Can you help?',
      timestamp: '2025-12-25 14:15:00',
      read: true,
      conversationId: 'emp3-tech7',
    },
    {
      id: 7,
      senderId: 7,
      senderName: 'Tech Support',
      senderEmail: 'tech@company.com',
      senderRole: 'technician',
      receiverId: 3,
      receiverName: 'Mike Johnson',
      receiverEmail: 'mike@company.com',
      receiverRole: 'employee',
      content: 'Sure! Have you tried resetting your password? Let me know if that helps.',
      timestamp: '2025-12-25 14:20:00',
      read: false,
      conversationId: 'emp3-tech7',
    },
    {
      id: 8,
      senderId: 4,
      senderName: 'Sarah Davis',
      senderEmail: 'sarah@company.com',
      senderRole: 'employee',
      receiverId: 7,
      receiverName: 'Tech Support',
      receiverEmail: 'tech@company.com',
      receiverRole: 'technician',
      content: 'Hi, I need to set up my VPN. Where can I find the setup guide?',
      timestamp: '2025-12-24 16:45:00',
      read: true,
      conversationId: 'emp4-tech7',
    },
    {
      id: 9,
      senderId: 7,
      senderName: 'Tech Support',
      senderEmail: 'tech@company.com',
      senderRole: 'technician',
      receiverId: 4,
      receiverName: 'Sarah Davis',
      receiverEmail: 'sarah@company.com',
      receiverRole: 'employee',
      content: 'Hi Sarah! You can find the VPN setup guide on our internal wiki. I can send you the link.',
      timestamp: '2025-12-24 17:00:00',
      read: true,
      conversationId: 'emp4-tech7',
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">Please log in to access Messages</p>
          <Link href="/login" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Filter out current user from available contacts
  const availableContacts = systemUsers.filter(u => u.id !== user.id);

  const getConversationParticipants = () => {
    const participants = new Map<string, { id: number; name: string; email: string; role: string; unreadCount: number }>();

    messages.forEach(msg => {
      const isReceiver = msg.receiverId === user.id;
      const otherUser = isReceiver
        ? { id: msg.senderId, name: msg.senderName, email: msg.senderEmail, role: msg.senderRole }
        : { id: msg.receiverId, name: msg.receiverName, email: msg.receiverEmail, role: msg.receiverRole };

      if (!participants.has(msg.conversationId)) {
        participants.set(msg.conversationId, {
          ...otherUser,
          unreadCount: 0,
        });
      }

      if (isReceiver && !msg.read) {
        const conv = participants.get(msg.conversationId);
        if (conv) conv.unreadCount++;
      }
    });

    return Array.from(participants.entries())
      .sort((a, b) => {
        const aLastMsg = messages.filter(m => m.conversationId === a[0]).sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime())[0];
        const bLastMsg = messages.filter(m => m.conversationId === b[0]).sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime())[0];
        return new Date(bLastMsg?.timestamp || 0).getTime() - new Date(aLastMsg?.timestamp || 0).getTime();
      })
      .filter(([_, participant]) => 
        participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const getConversationMessages = (conversationId: string) => {
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const startConversation = (contactUser: SystemUser) => {
    // Create a conversation ID (alphabetically sorted to ensure consistency)
    const conversationId = user.id! < contactUser.id 
      ? `user${user.id}-user${contactUser.id}`
      : `user${contactUser.id}-user${user.id}`;
    
    setSelectedConversation(conversationId);
    setShowUserList(false);
    markAsRead(conversationId);
  };

  const sendMessage = () => {
    if (!messageContent.trim() || !selectedConversation) return;

    const conversationMessages = getConversationMessages(selectedConversation);
    const lastMsg = conversationMessages[conversationMessages.length - 1];

    // Determine receiver
    let receiverId: number;
    let receiverName: string;
    let receiverEmail: string;
    let receiverRole: string;

    if (lastMsg) {
      // Reply in existing conversation
      receiverId = lastMsg.senderId === user.id ? lastMsg.receiverId : lastMsg.senderId;
      receiverName = lastMsg.senderId === user.id ? lastMsg.senderName : lastMsg.receiverName;
      receiverEmail = lastMsg.senderId === user.id ? lastMsg.senderEmail : lastMsg.receiverEmail;
      receiverRole = lastMsg.senderId === user.id ? lastMsg.senderRole : lastMsg.receiverRole;
    } else {
      // New conversation - extract from ID
      const parts = selectedConversation.split('-');
      const otherUserId = parseInt(parts[0] === `user${user.id}` ? parts[1].replace('user', '') : parts[0].replace('user', ''));
      const otherUser = systemUsers.find(u => u.id === otherUserId);
      if (!otherUser) return;
      receiverId = otherUser.id;
      receiverName = otherUser.name;
      receiverEmail = otherUser.email;
      receiverRole = otherUser.role;
    }

    const newMessage: Message = {
      id: Math.max(...messages.map(m => m.id), 0) + 1,
      senderId: user.id!,
      senderName: `${user.first_name} ${user.last_name}`,
      senderEmail: user.email,
      senderRole: user.role || 'employee',
      receiverId,
      receiverName,
      receiverEmail,
      receiverRole,
      content: messageContent,
      timestamp: new Date().toLocaleString(),
      read: false,
      conversationId: selectedConversation,
    };

    setMessages([...messages, newMessage]);
    setMessageContent('');
  };

  const markAsRead = (conversationId: string) => {
    setMessages(messages.map(msg =>
      msg.conversationId === conversationId && msg.receiverId === user.id
        ? { ...msg, read: true }
        : msg
    ));
  };

  const participants = getConversationParticipants();
  const unreadCount = messages.filter(m => m.receiverId === user.id && !m.read).length;

  const roleEmojis: Record<string, string> = {
    'employee': '👤',
    'admin': '🔐',
    'cafeteria_worker': '🍽️',
    'technician': '🔧',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">💬 Messages</h1>
        <p className="text-gray-600 mb-8">
          {unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen-minus-200">
          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <button
                onClick={() => setShowUserList(!showUserList)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition"
              >
                {showUserList ? '✕ Close' : '+ New Message'}
              </button>
            </div>

            {/* User List for New Conversations */}
            {showUserList && (
              <div className="flex-1 overflow-y-auto border-b bg-blue-50">
                <p className="px-4 py-2 text-xs font-semibold text-gray-600">Select a user to message:</p>
                {availableContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => startConversation(contact)}
                    className="w-full text-left p-4 hover:bg-blue-100 transition border-b flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        <span>{roleEmojis[contact.role] || '👤'}</span>
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-600">{contact.email}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {contact.role === 'admin' && '🔐 Administrator'}
                        {contact.role === 'employee' && '👤 Employee'}
                        {contact.role === 'cafeteria_worker' && '🍽️ Cafeteria Worker'}
                        {contact.role === 'technician' && '🔧 Tech Support'}
                      </p>
                    </div>
                    <span className="text-blue-600">→</span>
                  </button>
                ))}
              </div>
            )}

            {/* Existing Conversations */}
            {!showUserList && (
              <>
                {participants.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 text-center">No conversations yet</p>
                      <button
                        onClick={() => setShowUserList(true)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                      >
                        Start a conversation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {participants.map(([conversationId, participant]) => (
                      <button
                        key={conversationId}
                        onClick={() => {
                          setSelectedConversation(conversationId);
                          markAsRead(conversationId);
                        }}
                        className={`w-full text-left p-4 border-b hover:bg-gray-50 transition flex items-start justify-between ${
                          selectedConversation === conversationId ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 flex items-center gap-2">
                            <span>{roleEmojis[participant.role] || '👤'}</span>
                            {participant.name}
                          </p>
                          <p className="text-xs text-gray-600">{participant.email}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {participant.role === 'admin' && '🔐 Administrator'}
                            {participant.role === 'employee' && '👤 Employee'}
                            {participant.role === 'cafeteria_worker' && '🍽️ Cafeteria Worker'}
                            {participant.role === 'technician' && '🔧 Tech Support'}
                          </p>
                        </div>
                        {participant.unreadCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                            {participant.unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
              {/* Header */}
              {(() => {
                const participant = participants.find(([id]) => id === selectedConversation)?.[1];
                return participant ? (
                  <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>{roleEmojis[participant.role] || '👤'}</span>
                        {participant.name}
                      </h2>
                      <p className="text-blue-100 text-sm">{participant.email}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {getConversationMessages(selectedConversation).map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-300'
                      }`}
                    >
                      {msg.senderId !== user.id && (
                        <p className="text-xs font-semibold mb-1 opacity-75">{msg.senderName}</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageContent.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl text-gray-500 mb-2">👋</p>
                <p className="text-gray-600">Select a conversation or start a new message</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
