import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./QrDetails.css"; // Import the CSS file for styling

const QrDetails = () => {
  const { id } = useParams();
  const [resident, setResident] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://192.168.175.150:5000/residents/qr/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Resident not found");
        }
        return response.json();
      })
      .then((data) => setResident(data))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!resident) {
    return <div className="loading-message">Loading...</div>;
  }

  return (
    <div className="qr-details-container">
      <div className="qr-details-card">
        <h1>Resident Details</h1>
        <p><strong>ID:</strong> {resident.id}</p>
        <p><strong>Name:</strong> {resident.name}</p>
      </div>
    </div>
  );
};

export default QrDetails;