'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface TicketReply {
  id: number;
  author: string;
  role: 'user' | 'technician';
  content: string;
  timestamp: string;
}

interface SupportTicket {
  id: number;
  name: string;
  email: string;
  category: 'technical' | 'account' | 'billing' | 'general';
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  replies?: TicketReply[];
}

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@company.com',
      category: 'technical',
      subject: 'Login issues with email verification',
      message: 'Unable to access attendance page after email verification',
      status: 'in-progress',
      createdDate: '2025-12-25',
      priority: 'high',
      replies: [
        {
          id: 1,
          author: 'Support Team',
          role: 'technician',
          content: 'Thank you for reporting this issue. We are investigating the email verification problem. Can you please confirm which email you used for registration?',
          timestamp: '2025-12-25 10:30:00',
        },
        {
          id: 2,
          author: 'John Doe',
          role: 'user',
          content: 'I used john@company.com for registration. The verification link seems to have expired.',
          timestamp: '2025-12-25 11:00:00',
        },
        {
          id: 3,
          author: 'Support Team',
          role: 'technician',
          content: 'We\'ve identified the issue and sent you a new verification link. Please check your email and click the link within 24 hours.',
          timestamp: '2025-12-25 11:45:00',
        },
      ],
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@company.com',
      category: 'account',
      subject: 'Account setup help',
      message: 'Need assistance setting up my account profile',
      status: 'open',
      createdDate: '2025-12-24',
      priority: 'medium',
      replies: [],
    },
  ]);

  const [formData, setFormData] = useState({
    name: user ? `${user.first_name} ${user.last_name}` : '',
    email: user?.email || '',
    category: 'general' as const,
    subject: '',
    message: '',
    priority: 'medium' as const,
  });

  const [showForm, setShowForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const statusColors: Record<SupportTicket['status'], string> = {
    'open': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-300',
    'resolved': 'bg-green-100 text-green-700 border-green-300',
    'closed': 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const priorityColors: Record<SupportTicket['priority'], string> = {
    'low': 'bg-blue-100 text-blue-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700',
  };

  const statusEmojis: Record<SupportTicket['status'], string> = {
    'open': '🔴',
    'in-progress': '🟡',
    'resolved': '✓',
    'closed': '⭕',
  };

  const categoryEmojis: Record<SupportTicket['category'], string> = {
    'technical': '🔧',
    'account': '👤',
    'billing': '💳',
    'general': '❓',
  };

  const handleSubmitTicket = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      alert('❌ Please fill in all required fields');
      return;
    }

    const newTicket: SupportTicket = {
      id: Math.max(...tickets.map(t => t.id), 0) + 1,
      name: formData.name,
      email: formData.email,
      category: formData.category,
      subject: formData.subject,
      message: formData.message,
      status: 'open',
      createdDate: new Date().toISOString().split('T')[0],
      priority: formData.priority,
    };

    setTickets([newTicket, ...tickets]);
    setFormData({
      name: user ? `${user.first_name} ${user.last_name}` : '',
      email: user?.email || '',
      category: 'general',
      subject: '',
      message: '',
      priority: 'medium',
    });
    setShowForm(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
    alert('✓ Support ticket submitted successfully!');
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !selectedTicket) return;

    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const newReply: TicketReply = {
          id: (ticket.replies?.length || 0) + 1,
          author: user?.role === 'admin' ? 'Support Team' : `${user?.first_name} ${user?.last_name}`,
          role: user?.role === 'admin' ? 'technician' : 'user',
          content: replyContent,
          timestamp: new Date().toLocaleString(),
        };
        return {
          ...ticket,
          replies: [...(ticket.replies || []), newReply],
          status: user?.role === 'admin' ? 'in-progress' : ticket.status,
        };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
    setReplyContent('');
    alert('✓ Reply posted successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-blue-800 mb-2">🆘 Support Center</h1>
          <p className="text-gray-600">Get help and submit support tickets</p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-8 rounded">
            <p className="text-green-700 font-semibold">✓ Your ticket has been submitted successfully!</p>
            <p className="text-green-600 text-sm mt-1">Our support team will respond shortly.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Options */}
          <div className="space-y-4">
            {/* New Ticket Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg transition flex items-center justify-center gap-2"
            >
              {showForm ? '✕ Close' : '+ New Ticket'}
            </button>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">📚 Quick Help</h3>
              <div className="space-y-3">
                <a href="#faq" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-semibold transition">
                  📖 FAQ
                </a>
                <a href="#email-verification" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-semibold transition">
                  📧 Email Verification Help
                </a>
                <a href="#account-help" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-semibold transition">
                  👤 Account Help
                </a>
                <a href="#cafeteria-help" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-semibold transition">
                  🍽️ Cafeteria System Help
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">☎️ Direct Contact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 font-semibold">Email</p>
                  <a href="mailto:support@company.com" className="text-blue-600 hover:text-blue-700">
                    support@company.com
                  </a>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold">Phone</p>
                  <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700">
                    +1 (234) 567-890
                  </a>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold">Response Time</p>
                  <p className="text-gray-700">24-48 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Support Form */}
            {showForm && (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Support Ticket</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General Question</option>
                        <option value="technical">Technical Issue</option>
                        <option value="account">Account Issue</option>
                        <option value="billing">Billing Issue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your issue in detail..."
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleSubmitTicket}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition"
                  >
                    Submit Ticket
                  </button>
                </div>
              </div>
            )}

            {/* Tickets List */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Support Tickets</h2>

              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No support tickets yet</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                  >
                    Create Your First Ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{categoryEmojis[ticket.category]}</span>
                            <h3 className="font-bold text-lg text-gray-800">{ticket.subject}</h3>
                          </div>
                          <p className="text-sm text-gray-600">Ticket #{ticket.id} • {ticket.createdDate}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[ticket.status]}`}>
                            {statusEmojis[ticket.status]} {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[ticket.priority]}`}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{ticket.message}</p>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">{ticket.email}</p>
                        <button 
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ticket Details Modal */}
            {selectedTicket && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedTicket.subject}</h2>
                        <p className="text-sm text-gray-600">Ticket #{selectedTicket.id}</p>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4 mb-6 pb-6 border-b">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">STATUS</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block mt-1 ${statusColors[selectedTicket.status]}`}>
                            {statusEmojis[selectedTicket.status]} {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">PRIORITY</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block mt-1 ${priorityColors[selectedTicket.priority]}`}>
                            {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">CATEGORY</p>
                          <p className="text-sm mt-1 text-gray-800">{categoryEmojis[selectedTicket.category]} {selectedTicket.category.charAt(0).toUpperCase() + selectedTicket.category.slice(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">DATE CREATED</p>
                          <p className="text-sm mt-1 text-gray-800">{selectedTicket.createdDate}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 font-semibold">SUBMITTED BY</p>
                        <p className="text-sm mt-1 text-gray-800">{selectedTicket.name}</p>
                        <a href={`mailto:${selectedTicket.email}`} className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block">
                          {selectedTicket.email}
                        </a>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-xs text-gray-600 font-semibold mb-2">FULL MESSAGE</p>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                        <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.message}</p>
                      </div>
                    </div>

                    {/* Replies Section */}
                    <div className="mb-6 border-t pt-4">
                      <p className="text-xs text-gray-600 font-semibold mb-3">CONVERSATION ({selectedTicket.replies?.length || 0})</p>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                          selectedTicket.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`p-3 rounded-lg ${
                                reply.role === 'technician'
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-semibold text-gray-800">
                                  {reply.author}
                                  <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                                    reply.role === 'technician'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {reply.role === 'technician' ? '🔧 Support Team' : '👤 User'}
                                  </span>
                                </p>
                                <span className="text-xs text-gray-500">{reply.timestamp}</span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No replies yet. Add the first response below.</p>
                        )}
                      </div>
                    </div>

                    {/* Reply Input Section */}
                    <div className="mb-6 border-t pt-4">
                      <p className="text-xs text-gray-600 font-semibold mb-2">ADD REPLY</p>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Enter your response to this ticket..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                        rows={3}
                      />
                      <button
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim()}
                        className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
                      >
                        Post Reply
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 mt-8" id="faq">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">❓ Frequently Asked Questions</h2>

              <div className="space-y-6">
                <div id="email-verification">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">📧 How do I verify my email?</h3>
                  <p className="text-gray-700">
                    After registration, check your email inbox for a verification link. Click the link within 24 hours to verify your email address.
                    If you don't receive the email, check your spam folder or request a new verification link.
                  </p>
                </div>

                <div id="account-help">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">👤 I forgot my password. What should I do?</h3>
                  <p className="text-gray-700">
                    Click "Forgot Password" on the login page. You'll receive an email with instructions to reset your password.
                    Make sure to check your spam folder if you don't see the email.
                  </p>
                </div>

                <div id="cafeteria-help">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">🍽️ How do I order food from the cafeteria?</h3>
                  <p className="text-gray-700">
                    1. Log in to your account and go to "Order Food" in the sidebar<br />
                    2. Browse available menu items<br />
                    3. Add items to your cart<br />
                    4. Specify your pickup time<br />
                    5. Click "Place Order" to confirm
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">How do I message the cafeteria worker?</h3>
                  <p className="text-gray-700">
                    Go to "Messages" in the sidebar. Select a cafeteria worker from the conversation list or start a new conversation.
                    Type your message and click "Send".
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">What should I do if I can't sign into attendance?</h3>
                  <p className="text-gray-700">
                    Make sure your email is verified first. If you see a warning about email verification, click "Verify Email Now" button.
                    If you still have issues, submit a support ticket with details about the error message you're seeing.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">How long does it take to get support?</h3>
                  <p className="text-gray-700">
                    We aim to respond to all support tickets within 24-48 hours. Urgent priority tickets receive priority handling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
