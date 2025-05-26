import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalIncome: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });
  const [chartData, setChartData] = useState(null);
  const [statusData, setStatusData] = useState(null);

  // Status options
  const statusOptions = [
    "Order Placed",
    "Packing",
    "Shipped",
    "Out for delivery",
    "Delivered"
  ];

  // Status colors for visual consistency with Orders page
  const statusColors = {
    "Order Placed": "#3b82f6", // blue
    "Packing": "#eab308", // yellow
    "Shipped": "#8b5cf6", // purple
    "Out for delivery": "#f97316", // orange
    "Delivered": "#22c55e" // green
  };

  const fetchOrders = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } });
      if (response.data.success) {
        const ordersData = response.data.orders;
        setOrders(ordersData);
        processData(ordersData);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders data');
    } finally {
      setLoading(false);
    }
  };

  const processData = (ordersData) => {
    if (!ordersData.length) return;
    
    // Filter orders based on date range
    const filteredOrders = filterOrdersByDateRange(ordersData);
    
    // Calculate basic stats
    const totalOrders = filteredOrders.length;
    const totalIncome = filteredOrders.reduce((sum, order) => sum + order.amount, 0);
    const avgOrderValue = totalOrders ? (totalIncome / totalOrders).toFixed(2) : 0;
    const pendingOrders = filteredOrders.filter(order => order.status !== "Delivered").length;
    const deliveredOrders = filteredOrders.filter(order => order.status === "Delivered").length;
    
    setStats({
      totalOrders,
      totalIncome,
      avgOrderValue,
      pendingOrders,
      deliveredOrders
    });
    
    // Prepare chart data
    prepareChartData(filteredOrders);
    prepareStatusData(filteredOrders);
  };

  const filterOrdersByDateRange = (ordersData) => {
    let start, end;
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        end = new Date(now);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        end = new Date(now);
        break;
      case 'year':
        start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        end = new Date(now);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        } else {
          // Default to all orders if custom dates not set
          return ordersData;
        }
        break;
      default:
        // Default to all orders
        return ordersData;
    }
    
    return ordersData.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= start && orderDate <= end;
    });
  };

  const prepareChartData = (filteredOrders) => {
    // Group orders by date
    const ordersByDate = {};
    const incomeByDate = {};
    
    // Sort orders by date
    filteredOrders.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Format date based on range
    let dateFormat;
    if (dateRange === 'week') {
      dateFormat = { weekday: 'short' }; // e.g., "Mon"
    } else if (dateRange === 'month') {
      dateFormat = { month: 'short', day: 'numeric' }; // e.g., "Jan 15"
    } else {
      dateFormat = { month: 'short', year: 'numeric' }; // e.g., "Jan 2023"
    }
    
    // Group data by date
    filteredOrders.forEach(order => {
      const dateStr = new Date(order.date).toLocaleDateString('en-US', dateFormat);
      
      if (!ordersByDate[dateStr]) {
        ordersByDate[dateStr] = 0;
        incomeByDate[dateStr] = 0;
      }
      
      ordersByDate[dateStr]++;
      incomeByDate[dateStr] += order.amount;
    });
    
    // Convert to chart format
    const labels = Object.keys(ordersByDate);
    const orderCounts = Object.values(ordersByDate);
    const incomeCounts = Object.values(incomeByDate);
    
    setChartData({
      labels,
      datasets: [
        {
          label: 'Orders',
          data: orderCounts,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Income',
          data: incomeCounts,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    });
  };

  const prepareStatusData = (filteredOrders) => {
    // Count orders by status
    const countByStatus = {};
    statusOptions.forEach(status => {
      countByStatus[status] = 0;
    });
    
    filteredOrders.forEach(order => {
      if (countByStatus[order.status] !== undefined) {
        countByStatus[order.status]++;
      }
    });
    
    setStatusData({
      labels: statusOptions,
      datasets: [
        {
          label: 'Orders by Status',
          data: Object.values(countByStatus),
          backgroundColor: statusOptions.map(status => statusColors[status]),
          borderWidth: 1
        }
      ]
    });
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    
    // If switching to a preset, clear custom dates
    if (range !== 'custom') {
      setStartDate('');
      setEndDate('');
    } else {
      // If switching to custom and no dates set, default to last 30 days
      if (!startDate || !endDate) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
      }
    }
  };

  const applyCustomDateFilter = () => {
    if (startDate && endDate) {
      processData(orders);
    } else {
      toast.warning('Please select both start and end dates');
    }
  };

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Re-process data when date range changes
  useEffect(() => {
    if (orders.length) {
      processData(orders);
    }
  }, [dateRange]);

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Orders & Income Over Time',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Orders'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Income'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Orders by Status',
      },
    },
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Dashboard</h3>
      
      {/* Date Range Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h4 className="text-md font-medium mb-4">Date Range</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleDateRangeChange('week')}
            className={`px-3 py-1 text-sm rounded ${
              dateRange === 'week' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('month')}
            className={`px-3 py-1 text-sm rounded ${
              dateRange === 'month' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('year')}
            className={`px-3 py-1 text-sm rounded ${
              dateRange === 'year' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Last Year
          </button>
          <button
            onClick={() => handleDateRangeChange('custom')}
            className={`px-3 py-1 text-sm rounded ${
              dateRange === 'custom' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
        </div>
        
        {dateRange === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
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
            <div className="flex-1">
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
            <div className="flex items-end">
              <button
                onClick={applyCustomDateFilter}
                className="px-4 py-2 bg-black text-white rounded text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading dashboard data...</div>
      ) : (
        <>
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h4 className="text-sm text-gray-500 uppercase font-medium">Total Orders</h4>
              <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
              <p className="text-sm text-gray-500 mt-1">
                {dateRange === 'week' ? 'Last 7 days' : 
                 dateRange === 'month' ? 'Last 30 days' : 
                 dateRange === 'year' ? 'Last year' : 'Custom range'}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <h4 className="text-sm text-gray-500 uppercase font-medium">Total Income</h4>
              <p className="text-3xl font-bold mt-2">{currency}{stats.totalIncome.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Avg. {currency}{stats.avgOrderValue} per order
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
              <h4 className="text-sm text-gray-500 uppercase font-medium">Pending Orders</h4>
              <p className="text-3xl font-bold mt-2">{stats.pendingOrders}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalOrders ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0}% of total orders
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <h4 className="text-sm text-gray-500 uppercase font-medium">Delivered Orders</h4>
              <p className="text-3xl font-bold mt-2">{stats.deliveredOrders}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalOrders ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}% of total orders
              </p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-md font-medium mb-4">Orders & Income Trends</h4>
              {chartData ? (
                <Line options={chartOptions} data={chartData} height={300} />
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-gray-50">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-md font-medium mb-4">Orders by Status</h4>
              {statusData ? (
                <Bar options={barOptions} data={statusData} height={300} />
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-gray-50">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Orders */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium">Recent Orders</h4>
              <a href="/orders" className="text-sm text-blue-600 hover:underline">View All</a>
            </div>
            
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {order.address.firstName} {order.address.lastName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(order.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {currency}{order.amount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "Order Placed" ? "bg-blue-100 text-blue-800" :
                              order.status === "Packing" ? "bg-yellow-100 text-yellow-800" :
                              order.status === "Shipped" ? "bg-purple-100 text-purple-800" :
                              order.status === "Out for delivery" ? "bg-orange-100 text-orange-800" :
                              "bg-green-100 text-green-800" // Delivered
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No recent orders</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 