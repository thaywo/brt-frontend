import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/statistics');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="error">Failed to load statistics</div>;
  }

  // Prepare data for charts
  const dailyChartData = stats.daily_stats.map(day => ({
    date: new Date(day.date).toLocaleDateString(),
    count: day.count,
    amount: parseFloat(day.total_amount)
  })).reverse();

  return (
    <div className="dashboard">
      <h2>BRT Analytics Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total BRTs</h3>
          <div className="stat-value">{stats.total_brts}</div>
        </div>
        
        <div className="stat-card">
          <h3>Active BRTs</h3>
          <div className="stat-value active">{stats.active_brts}</div>
        </div>
        
        <div className="stat-card">
          <h3>Expired BRTs</h3>
          <div className="stat-value expired">{stats.expired_brts}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Reserved BLU</h3>
          <div className="stat-value">{parseFloat(stats.total_reserved_amount).toLocaleString()} BLU</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h3>Daily BRT Creation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="BRTs Created" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Daily Reserved Amount Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#82ca9d" name="Reserved BLU" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="summary-section">
        <h3>Summary</h3>
        <p>
          The BRT system currently has <strong>{stats.total_brts}</strong> total tickets, 
          with <strong>{stats.active_brts}</strong> active and <strong>{stats.expired_brts}</strong> expired.
        </p>
        <p>
          Total reserved amount: <strong>{parseFloat(stats.total_reserved_amount).toLocaleString()} BLU</strong>
        </p>
        {stats.active_brts > 0 && (
          <p>
            Average reserved amount per active BRT: <strong>
              {(parseFloat(stats.total_reserved_amount) / stats.active_brts).toFixed(2)} BLU
            </strong>
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;