'use client';

import { useState } from 'react';

export default function Performance() {
  const [selectedReview, setSelectedReview] = useState<null | number>(null);
  const [reviews, setReviews] = useState([
    { id: 1, name: 'John Doe', rating: 4.5, feedback: 'Excellent technical skills and leadership', category: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', rating: 4.8, feedback: 'Outstanding project management and communication', category: 'Project Manager' },
    { id: 3, name: 'Mike Johnson', rating: 4.2, feedback: 'Good HR management, needs improvement in strategic planning', category: 'HR Manager' },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    rating: 4,
    feedback: '',
  });

  const handleViewReview = (id: number) => {
    setSelectedReview(id);
    setEditingId(null);
  };

  const handleEditReview = (id: number) => {
    const review = reviews.find(r => r.id === id);
    if (review) {
      setFormData({
        name: review.name,
        category: review.category,
        rating: review.rating,
        feedback: review.feedback,
      });
      setEditingId(id);
      setShowAddForm(false);
      setSelectedReview(null);
    }
  };

  const handleAddNewReview = () => {
    setShowAddForm(!showAddForm);
    setEditingId(null);
    setSelectedReview(null);
    if (!showAddForm) {
      setFormData({ name: '', category: '', rating: 4, feedback: '' });
    }
  };

  const handleSaveReview = () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.feedback.trim()) {
      alert('❌ Please fill in all fields');
      return;
    }

    if (editingId) {
      // Update existing review
      setReviews(
        reviews.map(r =>
          r.id === editingId
            ? { ...r, ...formData }
            : r
        )
      );
      setEditingId(null);
      alert('✓ Review updated successfully');
    } else {
      // Add new review
      setReviews([
        ...reviews,
        {
          id: Math.max(...reviews.map(r => r.id), 0) + 1,
          ...formData,
          rating: parseFloat(String(formData.rating)),
        },
      ]);
      setShowAddForm(false);
      alert('✓ Review added successfully');
    }
    setFormData({ name: '', category: '', rating: 4, feedback: '' });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', category: '', rating: 4, feedback: '' });
  };

  const handleDeleteReview = (id: number, name: string) => {
    if (confirm(`Delete review for "${name}"? This action cannot be undone.`)) {
      setReviews(reviews.filter(r => r.id !== id));
      setSelectedReview(null);
      setEditingId(null);
      alert(`✓ Review for "${name}" deleted successfully`);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Performance Reviews</h1>
        <p className="text-gray-600 mt-2">Manage employee performance and evaluations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Review List</h2>
            <button 
              onClick={handleAddNewReview}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium">
              {showAddForm ? '✕ Cancel' : '+ New Review'}
            </button>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingId) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Edit Review' : 'Add New Review'}</h3>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                  <textarea
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={3}
                  ></textarea>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveReview}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  {editingId ? 'Save Changes' : 'Add Review'}
                </button>
                <button
                  onClick={handleCancelForm}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition">
                <div>
                  <p className="font-semibold text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-600">{review.rating}/5 ⭐</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleViewReview(review.id)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditReview(review.id)}
                    className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition font-medium text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteReview(review.id, review.name)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Review' : 'Review Details'}
          </h2>
          {selectedReview ? (
            <>
              {reviews.find(r => r.id === selectedReview) && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee</p>
                    <p className="font-semibold text-gray-900">{reviews.find(r => r.id === selectedReview)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{reviews.find(r => r.id === selectedReview)?.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-semibold text-gray-900">{reviews.find(r => r.id === selectedReview)?.rating}/5 ⭐</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Feedback</p>
                    <p className="font-semibold text-gray-900 text-sm">{reviews.find(r => r.id === selectedReview)?.feedback}</p>
                  </div>
                </div>
              )}
              <button 
                onClick={() => setSelectedReview(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition font-medium"
              >
                Clear Selection
              </button>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">Select a review to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
