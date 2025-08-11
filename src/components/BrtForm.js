import React, { useState } from 'react';
import axios from 'axios';

function BrtForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    reserved_amount: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const presetAmounts = [
    { label: 'BRT ONE', amount: 20 },
    { label: 'BRT ALPINE', amount: 50 },
    { label: 'BRT TWO', amount: 100 }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handlePresetClick = (amount) => {
    setFormData({ reserved_amount: amount.toString() });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/brts', formData);
      if (response.data.success) {
        alert(`BRT created successfully! Code: ${response.data.data.brt_code}`);
        setFormData({ reserved_amount: '' });
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to create BRT. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brt-form">
      <h2>Create New BRT</h2>
      
      <div className="preset-buttons">
        <h3>Quick Select:</h3>
        {presetAmounts.map(preset => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset.amount)}
            className="preset-btn"
          >
            {preset.label} - {preset.amount} BLU
          </button>
        ))}
      </div>

      {errors.general && <div className="error-message">{errors.general}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reserved_amount">Reserved Amount (BLU)</label>
          <input
            type="number"
            id="reserved_amount"
            name="reserved_amount"
            value={formData.reserved_amount}
            onChange={handleChange}
            required
            min="1"
            max="1000000"
            step="0.01"
            placeholder="Enter amount of Blume Coins to reserve"
          />
          {errors.reserved_amount && <span className="error">{errors.reserved_amount[0]}</span>}
        </div>

        <div className="form-info">
          <p>
            <strong>Note:</strong> Each BRT represents a reserved right to acquire Blume Coins at a future date.
          </p>
          <p>
            Minimum: 1 BLU | Maximum: 1,000,000 BLU
          </p>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating BRT...' : 'Create BRT'}
        </button>
      </form>
    </div>
  );
}

export default BrtForm;