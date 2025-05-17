import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeCanvas } from 'qrcode.react';

const API_URL = "http://localhost:5000/residents/view";

function List() {
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]); // State for filtered residents
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Fetching residents...");

    axios.get(API_URL)
      .then((response) => {
        console.log("Residents fetched:", response.data);
        setResidents(response.data);
        setFilteredResidents(response.data); // Initialize filtered residents
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching residents:", error);
        setLoading(false);
      });
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase().trim().replace(/\s+/g, '');
    setSearchTerm(e.target.value);
  
    if (value === "") {
      setFilteredResidents(residents);
    } else {
      setFilteredResidents(
        residents.filter(resident =>
          Object.values(resident).some(attr => {
            if (typeof attr === 'string' || typeof attr === 'number') {
              const attrValue = attr.toString().toLowerCase().replace(/\s+/g, '');
              return attrValue === value; // only exact match!
            }
            return false;
          })
        )
      );
    }
  };


  const handleDownloadQr = (residentId) => {
    const canvas = document.getElementById(`qr-code-${residentId}`);
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `resident-${residentId}-qr.png`;
    link.click();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="list">
      <h2>Resident List</h2>

      {/* Search Input */}
      <div className="search" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search residents"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            padding: '10px',
            width: '300px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <table className = "emp-list" border="1">
        <thead>
          <tr>
            <th>QR Code</th>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Employment Status</th>
            <th>Civil Status</th>
            <th>Address</th>
            <th>Contact</th>
            <th>Household Number</th>
          </tr>
        </thead>
        <tbody>
          {filteredResidents.length > 0 ? (
            filteredResidents.map((resident) => (
              <tr key={resident._id}>
                <td>
                  <QRCodeCanvas
                    id={`qr-code-${resident.id}`}
                    value={`http://192.168.68.66:3000/residents/${resident.id}`} // Frontend route
                    size={120}
                  />
                  <br />
                  <button
                    onClick={() => handleDownloadQr(resident.id)}
                    style={{
                      marginTop: '5px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Download QR
                  </button>
                </td>
                <td>{resident.id}</td>
                <td>{resident.name}</td>
                <td>{resident.age}</td>
                <td>{resident.gender}</td>
                <td>{resident.employmentStatus}</td>
                <td>{resident.civilStatus}</td>
                <td>{resident.address}</td>
                <td>{resident.contact}</td>
                <td>{resident.householdNumber}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10">No residents found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default List;
