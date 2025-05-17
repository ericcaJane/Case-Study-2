import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:5000/residents';

function AddResident() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    employmentStatus: '',
    civilStatus: '',
    address: '',
    contact: '',
    householdNumber: '',
    source: 'manual',
  });

  const [showModal, setShowModal] = useState(false);
  const [addedResident, setAddedResident] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(API_URL, formData, { headers: getAuthHeaders() });
      toast.success('Resident and household updated successfully!');
      setAddedResident(response.data.resident);
      setShowModal(true);
      resetForm();
    } catch (error) {
      console.error('Error adding resident:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error('Error adding resident!');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      gender: '',
      employmentStatus: '',
      civilStatus: '',
      address: '',
      contact: '',
      householdNumber: '',
      source: 'manual',
    });
  };

  return (
    <div className="content">
      <h1>Add Resident</h1>

      <div className="form-container">
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
              required
            />

            {/* Gender */}
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Employment Status */}
            <select
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
              required
            >
              <option value="">Select Employment Status</option>
              <option value="Employed">Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Retired">Retired</option>
            </select>

            {/* Civil Status */}
            <select
              name="civilStatus"
              value={formData.civilStatus}
              onChange={handleChange}
              required
            >
              <option value="">Select Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
            />

            {/* Contact */}
            <input
              type="text"
              name="contact"
              placeholder="Contact (11 digits)"
              value={formData.contact}
              onChange={handleChange}
              pattern="[0-9]{11}"
              required
            />

            <input
              type="text"
              name="householdNumber"
              placeholder="Household Number"
              value={formData.householdNumber}
              onChange={handleChange}
              required
            />

            <button type="submit" className="bu">Add Resident</button>
          </div>
        </form>
      </div>

      {/* Modal for Added Resident */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Resident Added</h2>
            {addedResident && (
              <div className="resident-details">
                <p><strong>Name:</strong> {addedResident.name}</p>
                <p><strong>Age:</strong> {addedResident.age}</p>
                <p><strong>Gender:</strong> {addedResident.gender}</p>
                <p><strong>Employment Status:</strong> {addedResident.employmentStatus}</p>
                <p><strong>Civil Status:</strong> {addedResident.civilStatus}</p>
                <p><strong>Address:</strong> {addedResident.address}</p>
                <p><strong>Contact:</strong> {addedResident.contact}</p>
                <p><strong>Household Number:</strong> {addedResident.householdNumber}</p>
              </div>
            )}
            <button onClick={() => setShowModal(false)} className="close-button">Close</button>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default AddResident;
