import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
  
  // Status options for filter
  const statusOptions = [
    "Order Placed",
    "Packing",
    "Shipped",
    "Out for delivery",
    "Delivered"
  ];

  const fetchAllOrders = async () => {
    if (!token) {
      return null;
    }

    setLoading(true);
    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (response.data.success) {
        const ordersData = response.data.orders.reverse();
        setAllOrders(ordersData);
        setOrders(ordersData);
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false);
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(backendUrl + '/api/order/status', { orderId, status: event.target.value }, { headers: { token } })
      if (response.data.success) {
        await fetchAllOrders()
      }
    } catch (error) {
      console.log(error)
      toast.error(response.data.message)
    }
  }

  const applyFilters = () => {
    let filteredOrders = [...allOrders];

    // Apply date filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });
    }

    // Apply status filter
    if (statusFilter) {
      filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    });

    setOrders(filteredOrders);
  }

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setOrders([...allOrders].sort((a, b) => {
      return sortOrder === 'asc'
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }));
  }

  const handleQuickDateFilter = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    let startDateValue = new Date(today);
    const endDateValue = new Date(today);
    
    // Set end date to end of today
    endDateValue.setHours(23, 59, 59, 999);
    
    switch (filter) {
      case 'today':
        // startDateValue is already set to today
        break;
      case 'yesterday':
        startDateValue.setDate(today.getDate() - 1);
        endDateValue.setDate(today.getDate() - 1);
        break;
      case 'last7':
        startDateValue.setDate(today.getDate() - 6); // 7 days including today
        break;
      case 'last30':
        startDateValue.setDate(today.getDate() - 29); // 30 days including today
        break;
      case 'thisMonth':
        startDateValue.setDate(1); // First day of current month
        break;
      default:
        return;
    }
    
    // Format dates for input fields
    setStartDate(startDateValue.toISOString().split('T')[0]);
    setEndDate(endDateValue.toISOString().split('T')[0]);
    
    // Apply the filters with new date range
    setTimeout(() => {
      applyFilters();
    }, 0);
  }

  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    
    // Re-sort the current orders
    setOrders(prevOrders => {
      return [...prevOrders].sort((a, b) => {
        return newSortOrder === 'asc'
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      });
    });
  }

  // Apply filters whenever the filter states or sort order changes
  useEffect(() => {
    if (allOrders.length > 0) {
      applyFilters();
    }
  }, [sortOrder]);

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Order Management</h3>
      
      {/* Status summary */}
      {!loading && allOrders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {statusOptions.map((status, index) => {
            const count = allOrders.filter(order => order.status === status).length;
            return (
              <div 
                key={index} 
                className="bg-white p-3 rounded-lg shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ 
                  borderLeftColor: 
                    status === "Order Placed" ? "#3b82f6" : // blue
                    status === "Packing" ? "#eab308" : // yellow
                    status === "Shipped" ? "#8b5cf6" : // purple
                    status === "Out for delivery" ? "#f97316" : // orange
                    "#22c55e" // green - Delivered
                }}
                onClick={() => {
                  setStatusFilter(status);
                  applyFilters();
                }}
              >
                <div className="text-gray-500 text-xs uppercase font-medium">{status}</div>
                <div className="text-2xl font-bold mt-1">{count}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((count / allOrders.length) * 100)}% of orders
                </div>
              </div>
            );
          })}
          <div 
            className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-gray-400 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setStatusFilter('');
              applyFilters();
            }}
          >
            <div className="text-gray-500 text-xs uppercase font-medium">All Orders</div>
            <div className="text-2xl font-bold mt-1">{allOrders.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              100% of orders
            </div>
          </div>
        </div>
      )}
      
      {/* Filter section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h4 className="text-md font-medium mb-4">Filter Orders</h4>
        
        {/* Quick date filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Date Filters
          </label>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleQuickDateFilter('today')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Today
            </button>
            <button 
              onClick={() => handleQuickDateFilter('yesterday')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Yesterday
            </button>
            <button 
              onClick={() => handleQuickDateFilter('last7')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => handleQuickDateFilter('last30')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Last 30 Days
            </button>
            <button 
              onClick={() => handleQuickDateFilter('thisMonth')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              This Month
            </button>
          </div>
        </div>
        
        {/* Custom date and status filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status, index) => (
                <option key={index} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 rounded text-sm"
          >
            Reset
          </button>
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-black text-white rounded text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Order sorting and summary */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Showing {orders.length} of {allOrders.length} orders
        </div>
        <button 
          onClick={toggleSortOrder}
          className="flex items-center text-sm text-gray-700 px-2 py-1 border rounded"
        >
          Sort by Date 
          <span className="ml-1">
            {sortOrder === 'desc' ? '↓ (Newest first)' : '↑ (Oldest first)'}
          </span>
        </button>
      </div>
      
      {/* Orders list */}
      {loading ? (
        <div className="text-center py-8">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded">
          No orders match the selected filters
        </div>
      ) : (
        <div>
          {orders.map((order, index) => (
            <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700' key={index}>
              <img className='w-12' src={assets.parcel_icon} alt="" />
              <div>
                <div>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> </p>
                    }
                    else {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> ,</p>
                    }
                  })}
                </div>
                <p className='mt-3 mb-2 font-medium'>{order.address.firstName + " " + order.address.lastName}</p>
                <div>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p>{order.address.phone}</p>
              </div>
              <div>
                <p className='text-sm sm:text-[15px]'>Items: {order.items.length}</p>
                <p className='mt-3'>Method: {order.paymentMethod}</p>
                <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
                <p>Date: {new Date(order.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</p>
              </div>
              <p className='text-sm sm:text-[15px]'>{currency}{order.amount}</p>
              <div>
                <div className="flex items-center mb-2">
                  <span 
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      order.status === "Order Placed" ? "bg-blue-500" :
                      order.status === "Packing" ? "bg-yellow-500" :
                      order.status === "Shipped" ? "bg-purple-500" :
                      order.status === "Out for delivery" ? "bg-orange-500" :
                      "bg-green-500" // Delivered
                    }`}
                  ></span>
                  <span className="text-xs font-medium text-gray-500">
                    Current Status
                  </span>
                </div>
                <select onChange={(event) => statusHandler(event, order._id)} value={order.status} className='w-full p-2 font-semibold'>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders