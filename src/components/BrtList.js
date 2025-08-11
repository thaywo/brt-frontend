import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BrtList() {
  const [brts, setBrts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchBrts();
  }, []);

  const fetchBrts = async () => {
    try {
      const response = await axios.get('/brts');
      setBrts(response.data.data);
    } catch (error) {
      console.error('Error fetching BRTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brt) => {
    setEditingId(brt.id);
    setEditForm({
      reserved_amount: brt.reserved_amount,
      status: brt.status
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdate = async (id) => {
    try {
      const response = await axios.put(`/brts/${id}`, editForm);
      if (response.data.success) {
        setBrts(brts.map(brt => 
          brt.id === id ? response.data.data : brt
        ));
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      console.error('Error updating BRT:', error);
      alert('Failed to update BRT');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this BRT?')) {
      return;
    }

    try {
      const response = await axios.delete(`/brts/${id}`);
      if (response.data.success) {
        setBrts(brts.filter(brt => brt.id !== id));
      }
    } catch (error) {
      console.error('Error deleting BRT:', error);
      alert('Failed to delete BRT');
    }
  };

  if (loading) {
    return <div className="loading">Loading BRTs...</div>;
  }

  if (brts.length === 0) {
    return (
      <div className="empty-state">
        <h3>No BRTs found</h3>
        <p>Create your first BRT to get started!</p>
      </div>
    );
  }

  return (
    <div className="brt-list">
      <h2>My BRTs</h2>
      <table>
        <thead>
          <tr>
            <th>BRT Code</th>
            <th>Reserved Amount (BLU)</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {brts.map(brt => (
            <tr key={brt.id}>
              <td>{brt.brt_code}</td>
              <td>
                {editingId === brt.id ? (
                  <input
                    type="number"
                    name="reserved_amount"
                    value={editForm.reserved_amount}
                    onChange={handleEditChange}
                    min="1"
                    max="1000000"
                  />
                ) : (
                  `${brt.reserved_amount} BLU`
                )}
              </td>
              <td>
                {editingId === brt.id ? (
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                ) : (
                  <span className={`status ${brt.status}`}>{brt.status}</span>
                )}
              </td>
              <td>{new Date(brt.created_at).toLocaleDateString()}</td>
              <td>
                {editingId === brt.id ? (
                  <>
                    <button onClick={() => handleUpdate(brt.id)} className="btn-save">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="btn-cancel">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(brt)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(brt.id)} className="btn-delete">
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BrtList;