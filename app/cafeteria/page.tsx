'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData, Order } from '@/context/DataContext';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  quantity?: number;
}

export default function Cafeteria() {
  const { user } = useAuth();
  const { orders, setOrders } = useData();

  // Menu items with availability status
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, name: 'Biryani', description: 'Fragrant rice with spices', price: 150, category: 'Main Course', available: true },
    { id: 2, name: 'Butter Chicken', description: 'Creamy tomato-based curry', price: 180, category: 'Main Course', available: true },
    { id: 3, name: 'Paneer Tikka', description: 'Grilled cottage cheese', price: 120, category: 'Appetizer', available: true },
    { id: 4, name: 'Tandoori Chicken', description: 'Clay oven roasted chicken', price: 160, category: 'Main Course', available: false },
    { id: 5, name: 'Samosa', description: 'Crispy fried pastry', price: 30, category: 'Snacks', available: true },
    { id: 6, name: 'Naan', description: 'Soft Indian bread', price: 40, category: 'Bread', available: true },
    { id: 7, name: 'Mango Lassi', description: 'Yogurt-based mango drink', price: 50, category: 'Beverages', available: true },
    { id: 8, name: 'Masala Chai', description: 'Spiced tea', price: 25, category: 'Beverages', available: false },
  ]);

  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, category: 'Main Course', available: true });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: string[] = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const handleAddMenuItem = () => {
    if (newItem.name.trim() && newItem.price > 0) {
      const maxId = Math.max(...menuItems.map(m => m.id), 0);
      setMenuItems([...menuItems, { ...newItem, id: maxId + 1 }]);
      setNewItem({ name: '', description: '', price: 0, category: 'Main Course', available: true });
      setShowItemForm(false);
      alert('✓ Menu item added successfully');
    } else {
      alert('❌ Please fill in all required fields');
    }
  };

  const toggleItemAvailability = (id: number) => {
    setMenuItems(menuItems.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ));
  };

  const updateOrderStatus = (orderId: number, newStatus: Order['status']) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const deleteMenuItem = (id: number) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      setMenuItems(menuItems.filter(item => item.id !== id));
      alert('✓ Menu item deleted');
    }
  };

  // Check access
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">Please log in to access Cafeteria</p>
          <Link href="/login" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === 'employee') {
    return <EmployeeOrderingView menuItems={menuItems} orders={orders} user={user} setOrders={setOrders} />;
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

  // Cafeteria Worker / Admin View
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-800 mb-2">🍽️ Cafeteria Management</h1>
          <p className="text-gray-600">Manage menu items and process orders</p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-4 mb-8 border-b">
          <button className="px-4 py-2 border-b-2 border-orange-500 font-semibold text-orange-700">Menu Items</button>
          <Link href="/cafeteria-orders" className="px-4 py-2 text-gray-600 hover:text-orange-700">Orders ({orders.length})</Link>
        </div>

        {/* Add Menu Item Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <button
            onClick={() => setShowItemForm(!showItemForm)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
          >
            {showItemForm ? '✕ Cancel' : '+ Add Menu Item'}
          </button>

          {showItemForm && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              />
              <input
                type="text"
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                <option value="Main Course">Main Course</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Snacks">Snacks</option>
                <option value="Bread">Bread</option>
                <option value="Beverages">Beverages</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.available}
                    onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Available</span>
                </label>
              </div>
              <button
                onClick={handleAddMenuItem}
                className="col-span-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Save Menu Item
              </button>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className={`rounded-lg shadow-md p-6 transition ${item.available ? 'bg-white' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                  <p className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded w-fit mt-1">{item.category}</p>
                </div>
                <span className={`text-2xl font-bold ${item.available ? 'text-orange-600' : 'text-gray-400'}`}>₹{item.price}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleItemAvailability(item.id)}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    item.available
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.available ? '❌ Mark Unavailable' : '✓ Mark Available'}
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No menu items found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Employee Ordering View Component
function EmployeeOrderingView({ menuItems, orders, user, setOrders }: any) {
  const [cart, setCart] = useState<{ menuItemId: number; itemName: string; quantity: number; price: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  const categories: string[] = ['all', ...Array.from(new Set(menuItems.map((item: MenuItem) => item.category))) as string[]];

  const filteredItems = useMemo(() => {
    return menuItems.filter((item: MenuItem) => {
      if (!item.available) return false;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(c => c.menuItemId === item.id);
    if (existingItem) {
      setCart(cart.map(c =>
        c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { menuItemId: item.id, itemName: item.name, quantity: 1, price: item.price }]);
    }
  };

  const removeFromCart = (menuItemId: number) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      setCart(cart.map(item =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      ));
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrder = () => {
    if (cart.length === 0) {
      alert('❌ Please add items to cart');
      return;
    }
    if (!pickupTime.trim()) {
      alert('❌ Please specify a pickup time');
      return;
    }

    const itemNames = cart.map(item => `${item.itemName} (x${item.quantity})`).join(', ');

    const newOrder: Order = {
      id: Math.max(...orders.map((o: Order) => o.id), 0) + 1,
      employeeName: `${user.first_name} ${user.last_name}`,
      employeeEmail: user.email,
      items: cart.map(item => ({ menuItemId: item.menuItemId, itemName: item.itemName, quantity: item.quantity })),
      totalPrice,
      status: 'picked-up',
      orderDate: new Date().toISOString().split('T')[0],
      pickupTime,
      notes: `Cafeteria Order: ${itemNames}${notes ? ' | ' + notes : ''}`,
    };

    setOrders([...orders, newOrder]);
    setCart([]);
    setNotes('');
    setPickupTime('');
    alert('✓ Order placed successfully! Amount will be deducted from your salary.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">🍽️ Order Food</h1>
        <p className="text-gray-600 mb-8">Browse menu and place your order</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item: MenuItem) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                  <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                  <p className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded w-fit my-2">{item.category}</p>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-600">₹{item.price}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🛒 Cart</h2>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.menuItemId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-800">{item.itemName}</p>
                          <p className="text-xs text-gray-600">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="ml-2 text-red-600 hover:text-red-800 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <textarea
                      placeholder="Special requests (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      rows={2}
                    />
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Total Items: <span className="font-bold text-blue-700">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></p>
                      <p className="text-lg font-bold text-blue-800 mt-2">₹{totalPrice}</p>
                    </div>
                    <button
                      onClick={placeOrder}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg transition"
                    >
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
