import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/residents/qr';

function ResidentInfo() {
  const { id } = useParams(); // Get the resident ID from the URL
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const response = await axios.get(`${API_URL}/${id}`);
        setResident(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching resident info:', error);
        setLoading(false);
      }
    };

    fetchResident();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!resident) {
    return <div>Resident not found</div>;
  }

  return (
    <div className="resident-info">
      <h1>Resident Information</h1>
      <p><strong>ID:</strong> {resident.id}</p>
      <p><strong>Name:</strong> {resident.name}</p>
      <p><strong>Age:</strong> {resident.age}</p>
      <p><strong>Gender:</strong> {resident.gender}</p>
      <p><strong>Employment Status:</strong> {resident.employmentStatus}</p>
      <p><strong>Civil Status:</strong> {resident.civilStatus}</p>
      <p><strong>Address:</strong> {resident.address}</p>
      <p><strong>Contact:</strong> {resident.contact}</p>
      <p><strong>Household Number:</strong> {resident.householdNumber}</p>
    </div>
  );
}

export default ResidentInfo;