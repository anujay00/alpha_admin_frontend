import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/review/all`, {
        headers: { token }
      });
      
      if (response.data.success) {
        console.log("Reviews from API:", response.data.reviews);
        setReviews(response.data.reviews);
      } else {
        toast.error(response.data.message || 'Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${backendUrl}/api/review/delete/${reviewId}`, {
        headers: { token },
        data: { isAdmin: true }
      });
      
      if (response.data.success) {
        toast.success('Review deleted successfully');
        setReviews(reviews.filter(review => review._id !== reviewId));
      } else {
        toast.error(response.data.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Error deleting review');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and sort reviews
  const filteredReviews = reviews.filter(review => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (review.user?.name && review.user.name.toLowerCase().includes(searchLower)) ||
      (review.product?.name && review.product.name.toLowerCase().includes(searchLower)) ||
      review.comment.toLowerCase().includes(searchLower)
    );
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'rating') {
      return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
    } else if (sortBy === 'productName') {
      const nameA = (a.product?.name || '').toLowerCase();
      const nameB = (b.product?.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortBy === 'userName') {
      const nameA = (a.user?.name || '').toLowerCase();
      const nameB = (b.user?.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
    return 0;
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Review Management</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by user, product, or review text..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 border rounded-md"
        />
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading reviews...</div>
      ) : sortedReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No reviews match your search criteria' : 'No reviews available'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('userName')}
                    className="flex items-center"
                  >
                    User
                    {sortBy === 'userName' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('productName')}
                    className="flex items-center"
                  >
                    Product
                    {sortBy === 'productName' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('rating')}
                    className="flex items-center"
                  >
                    Rating
                    {sortBy === 'rating' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center"
                  >
                    Date
                    {sortBy === 'date' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedReviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {review.user?.name || 'Unknown User'}
                    <div className="text-xs text-gray-500">
                      {review.user?.email || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {review.product?.name || 'Unknown Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{review.rating}/5</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs overflow-hidden text-ellipsis">
                      {review.comment}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(review.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {review.image ? (
                      <div>
                        <div className="flex flex-col gap-2">
                          <a 
                            href={review.image} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Image
                          </a>
                          <img 
                            src={review.image.replace(/^http:/, 'https:')} 
                            alt="Review" 
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              console.error("Error loading image:", review.image);
                              if (!e.target.dataset.retried) {
                                e.target.dataset.retried = "true";
                                // Try without transformation parameters
                                const baseUrl = review.image.split('/upload/')[0] + '/upload/' + 
                                              review.image.split('/upload/')[1].split('/').pop();
                                e.target.src = baseUrl;
                              } else {
                                e.target.style.display = 'none';
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reviews; 