'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData, Order } from '@/context/DataContext';
import Link from 'next/link';

export default function CafeteriaOrders() {
  const { user } = useAuth();
  const { orders, updateOrder, deleteOrder, setOrders } = useData();

  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeEmail: '',
    itemName: '',
    quantity: 1,
    totalPrice: 0,
    pickupTime: '',
    notes: '',
  });

  const statuses: Order['status'][] = ['pending', 'preparing', 'ready', 'picked-up', 'cancelled'];
  const statusColors: Record<Order['status'], string> = {
    'pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'preparing': 'bg-blue-100 text-blue-700 border-blue-300',
    'ready': 'bg-green-100 text-green-700 border-green-300',
    'picked-up': 'bg-gray-100 text-gray-700 border-gray-300',
    'cancelled': 'bg-red-100 text-red-700 border-red-300',
  };

  const statusEmojis: Record<Order['status'], string> = {
    'pending': '⏳',
    'preparing': '👨‍🍳',
    'ready': '✓',
    'picked-up': '🎉',
    'cancelled': '✕',
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const updateOrderStatus = (orderId: number, newStatus: Order['status']) => {
    updateOrder(orderId, { status: newStatus });
    setSelectedOrder(null);
  };

  const cancelOrder = (orderId: number) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      updateOrderStatus(orderId, 'cancelled');
      alert('✓ Order cancelled');
    }
  };

  const handleAddOrder = () => {
    if (!formData.employeeName || !formData.employeeEmail || !formData.itemName || !formData.totalPrice) {
      alert('❌ Please fill in all required fields');
      return;
    }

    const newOrder: Order = {
      id: Math.max(...orders.map(o => o.id), 0) + 1,
      employeeName: formData.employeeName,
      employeeEmail: formData.employeeEmail,
      items: [{ menuItemId: Math.random(), itemName: formData.itemName, quantity: formData.quantity }],
      totalPrice: formData.totalPrice,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      pickupTime: formData.pickupTime,
      notes: formData.notes,
    };

    setOrders([...orders, newOrder]);
    setFormData({ employeeName: '', employeeEmail: '', itemName: '', quantity: 1, totalPrice: 0, pickupTime: '', notes: '' });
    setShowAddForm(false);
    alert('✓ Order added successfully');
  };

  const handleEditOrder = (order: Order) => {
    setFormData({
      employeeName: order.employeeName,
      employeeEmail: order.employeeEmail,
      itemName: order.items[0]?.itemName || '',
      quantity: order.items[0]?.quantity || 1,
      totalPrice: order.totalPrice,
      pickupTime: order.pickupTime || '',
      notes: order.notes || '',
    });
    setEditingId(order.id);
    setShowAddForm(true);
  };

  const handleSaveOrder = () => {
    if (!formData.employeeName || !formData.employeeEmail || !formData.itemName || !formData.totalPrice) {
      alert('❌ Please fill in all required fields');
      return;
    }

    if (editingId !== null) {
      updateOrder(editingId, {
        employeeName: formData.employeeName,
        employeeEmail: formData.employeeEmail,
        items: [{ menuItemId: Math.random(), itemName: formData.itemName, quantity: formData.quantity }],
        totalPrice: formData.totalPrice,
        pickupTime: formData.pickupTime,
        notes: formData.notes,
      });
    }
    setFormData({ employeeName: '', employeeEmail: '', itemName: '', quantity: 1, totalPrice: 0, pickupTime: '', notes: '' });
    setEditingId(null);
    setShowAddForm(false);
    setSelectedOrder(null);
    alert('✓ Order updated successfully');
  };

  const handleDeleteOrder = (orderId: number, name: string) => {
    if (confirm(`Delete order for "${name}"? This action cannot be undone.`)) {
      deleteOrder(orderId);
      setSelectedOrder(null);
      alert('✓ Order deleted successfully');
    }
  };

  // Check access
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">Please log in to access Orders</p>
          <Link href="/login" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'cafeteria_worker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-700">Access Denied</p>
          <p className="text-gray-600 mt-2">Only cafeteria workers and admins can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-orange-800 mb-2">📋 Order Management</h1>
            <p className="text-gray-600">Track and manage customer orders</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingId(null);
                setFormData({ employeeName: '', employeeEmail: '', itemName: '', quantity: 1, totalPrice: 0, pickupTime: '', notes: '' });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              {showAddForm ? '✕ Cancel' : '+ Add Order'}
            </button>
            <Link href="/cafeteria" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">
              ← Back to Menu
            </Link>
          </div>
        </div>

        {/* Add/Edit Order Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-green-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingId ? '✏️ Edit Order' : '➕ Add New Order'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Name *</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  placeholder="Enter employee name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Email *</label>
                <input
                  type="email"
                  value={formData.employeeEmail}
                  onChange={(e) => setFormData({ ...formData, employeeEmail: e.target.value })}
                  placeholder="employee@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g., Biryani"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Time</label>
                <input
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Special Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requests or notes..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={editingId ? handleSaveOrder : handleAddOrder}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition"
              >
                {editingId ? '💾 Save Changes' : '✓ Add Order'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ employeeName: '', employeeEmail: '', itemName: '', quantity: 1, totalPrice: 0, pickupTime: '', notes: '' });
                }}
                className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{orders.length}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
          <div className="bg-yellow-100 rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{orders.filter(o => o.status === 'pending').length}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="bg-blue-100 rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{orders.filter(o => o.status === 'preparing').length}</p>
            <p className="text-sm text-gray-600">Preparing</p>
          </div>
          <div className="bg-green-100 rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{orders.filter(o => o.status === 'ready').length}</p>
            <p className="text-sm text-gray-600">Ready</p>
          </div>
          <div className="bg-gray-100 rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">₹{orders.reduce((sum, o) => sum + o.totalPrice, 0)}</p>
            <p className="text-sm text-gray-600">Revenue</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${filterStatus === 'all' ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border-2 border-orange-600'}`}
          >
            All Orders
          </button>
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${filterStatus === status ? `${statusColors[status]} border-2` : 'bg-white border-2 border-gray-300'}`}
            >
              {statusEmojis[status]} {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No orders with this status</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition hover:shadow-lg ${selectedOrder?.id === order.id ? 'ring-2 ring-orange-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600">{order.employeeName} • {order.employeeEmail}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-semibold text-sm border-2 ${statusColors[order.status]}`}>
                      {statusEmojis[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    {order.items.map(item => (
                      <div key={item.menuItemId} className="flex justify-between text-sm text-gray-700">
                        <span>{item.quantity}x {item.itemName}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Total: <span className="font-bold text-lg text-orange-600">₹{order.totalPrice}</span></p>
                      {order.pickupTime && <p className="text-xs text-gray-600 mt-1">Pickup: {order.pickupTime}</p>}
                    </div>
                    <p className="text-xs text-gray-500">{order.orderDate}</p>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOrder(order);
                        setShowAddForm(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(order.id, order.employeeName);
                      }}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Details Panel */}
          {selectedOrder && (
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Details</h2>

              <div className="space-y-3 mb-6 pb-6 border-b">
                <div>
                  <p className="text-xs text-gray-600">Order ID</p>
                  <p className="font-bold text-lg text-orange-600">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Customer</p>
                  <p className="font-semibold">{selectedOrder.employeeName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.employeeEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Order Date</p>
                  <p className="font-semibold">{selectedOrder.orderDate}</p>
                </div>
                {selectedOrder.pickupTime && (
                  <div>
                    <p className="text-xs text-gray-600">Pickup Time</p>
                    <p className="font-semibold text-blue-600">{selectedOrder.pickupTime}</p>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div>
                    <p className="text-xs text-gray-600">Special Requests</p>
                    <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="mb-6 pb-6 border-b">
                <p className="text-sm font-semibold text-gray-700 mb-3">Items Ordered:</p>
                {selectedOrder.items.map(item => (
                  <div key={item.menuItemId} className="flex justify-between text-sm py-2 border-b last:border-b-0">
                    <span>{item.quantity}x {item.itemName}</span>
                  </div>
                ))}
              </div>

              <div className="mb-6 pb-6 border-b">
                <p className="text-lg font-bold text-gray-800">Total: ₹{selectedOrder.totalPrice}</p>
              </div>

              {/* Status Update Buttons */}
              <div className="space-y-2">
                {selectedOrder.status !== 'picked-up' && selectedOrder.status !== 'cancelled' && (
                  <>
                    {selectedOrder.status !== 'pending' && selectedOrder.status !== 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                      >
                        ✓ Mark as Ready
                      </button>
                    )}
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        👨‍🍳 Start Preparing
                      </button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'picked-up')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                      >
                        🎉 Mark as Picked Up
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => cancelOrder(selectedOrder.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  ✕ Cancel Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
