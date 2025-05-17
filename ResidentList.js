import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import 'react-toastify/dist/ReactToastify.css';
import { AiOutlineSearch, AiOutlineUpload, AiOutlineClose } from 'react-icons/ai';
import { QRCodeCanvas } from 'qrcode.react';

const API_URL = 'http://localhost:5000/residents';

function ResidentList() {
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [backupModal, setBackupModal] = useState(false); // State for backup modal
  const [editModal, setEditModal] = useState(false);
  const [currentResident, setCurrentResident] = useState(null);
  const [qrModal, setQrModal] = useState(false); // State for QR modal
  const [qrResidentId, setQrResidentId] = useState(''); // Resident ID for QR
  const [showQrCode, setShowQrCode] = useState(false); // State to control QR code visibility
  const fileInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await axios.get(API_URL, { headers: getAuthHeaders() });
      setResidents(response.data);
      setFilteredResidents(response.data);
    } catch (error) {
      toast.error("Unauthorized! Please log in.");
    }
  };

  const handleBackup = async () => {
    try {
      const response = await axios.get(`${API_URL}/backup`, {
        headers: getAuthHeaders(),
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `resident-backup-${Date.now()}.csv`);
      toast.success("Backup downloaded successfully!");
      setBackupModal(false); // Close the modal after successful download
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error("Failed to download backup.");
    }
  };

  const handleEdit = (resident) => {
    setCurrentResident(resident);
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    setCurrentResident({ ...currentResident, [e.target.name]: e.target.value });
  };

  const handleUpdateResident = async () => {
    try {
      await axios.put(`${API_URL}/${currentResident._id}`, currentResident, { headers: getAuthHeaders() });
      toast.success('Resident updated!');
      fetchResidents();
      setEditModal(false);
    } catch (error) {
      toast.error('Error updating resident!');
    }
  };

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

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
      toast.success('Resident deleted!');
      fetchResidents();
    } catch {
      toast.error('Error deleting resident!');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",  
        },
      });

      toast.success(response.data.message);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchResidents();
      setShowModal(false);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message); // Show error message for duplicates
      } else {
        toast.error("Error uploading file");
      }
    }
  };

  const handleQrSubmit = () => {
    if (!qrResidentId) {
      toast.error("Please enter a Resident ID.");
      return;
    }

    // Check if the Resident ID exists in the list
    const residentExists = residents.some((resident) => resident.id === qrResidentId);
    if (!residentExists) {
      toast.error("Resident ID not found.");
      return;
    }

    setShowQrCode(true); // Show the QR code after clicking the button
    toast.success("QR Code generated!");
  };

  const handleDownloadQr = (residentId) => {
    const canvas = document.getElementById(`qr-code-${residentId}`);
    if (!canvas) {
      toast.error("QR Code not found.");
      return;
    }

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `resident-${residentId}-qr.png`;
    link.click();
  };

  return (
    <div className="view">
      <h1>Resident List</h1>

      <div className="table-actions">
        <button className="upload-csv-button" onClick={() => setShowModal(true)}>
          <AiOutlineUpload className="upload-icon" /> Upload CSV
        </button>

        <button className="backup-csv-button" onClick={() => setBackupModal(true)}>
          📥 Backup CSV
        </button>

        <button className="qr-info-button" onClick={() => setQrModal(true)}>
          Get QR Info
        </button>

        <div className="search-container">
          <AiOutlineSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search residents"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="resident-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Employment Status</th>
              <th>Civil Status</th>
              <th>Address</th>
              <th>Contact</th>
              <th>Household No.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResidents.map((resident) => (
              <tr key={resident._id}>
                <td>{resident.id}</td>
                <td>{resident.name}</td>
                <td>{resident.age}</td>
                <td>{resident.gender}</td>
                <td>{resident.employmentStatus}</td>
                <td>{resident.civilStatus}</td>
                <td>{resident.address}</td>
                <td>{resident.contact}</td>
                <td>{resident.householdNumber}</td>
                <td className="action-buttons">
                  <button className="edit-btn" onClick={() => handleEdit(resident)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(resident._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Upload CSV</h2>
            <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} className="csv-input" />
            <button onClick={handleFileUpload} className="upload-button">Upload</button>
            <button onClick={() => setShowModal(false)} className="close-button">X</button>
          </div>
        </div>
      )}

      {editModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AiOutlineClose
              className="close-icon"
              onClick={() => setEditModal(false)}
            />
            <h2>Edit Resident</h2>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={currentResident.name}
                onChange={handleEditChange}
                required
              />
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={currentResident.age}
                onChange={handleEditChange}
                required
              />
              <select
                name="gender"
                value={currentResident.gender}
                onChange={handleEditChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select
                name="employmentStatus"
                value={currentResident.employmentStatus}
                onChange={handleEditChange}
                required
              >
                <option value="">Select Employment Status</option>
                <option value="Employed">Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Retired">Retired</option>
              </select>
              <select
                name="civilStatus"
                value={currentResident.civilStatus}
                onChange={handleEditChange}
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
                value={currentResident.address}
                onChange={handleEditChange}
                required
              />
              <input
                type="text"
                name="contact"
                placeholder="Contact (11 digits)"
                value={currentResident.contact}
                onChange={handleEditChange}
                pattern="[0-9]{11}"
                required
              />
              <input
                type="text"
                name="householdNumber"
                placeholder="Household Number"
                value={currentResident.householdNumber}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleUpdateResident} className="save-button">
                Save
              </button>
              <button onClick={() => setEditModal(false)} className="cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="overlay">
          <div className="mcontent">
            <AiOutlineClose
              className="close"
              onClick={() => {
                setQrModal(false);
                setShowQrCode(false); // Reset QR code visibility when modal is closed
                setQrResidentId(''); // Clear the Resident ID field
              }}
            />
            <h2>Generate QR Code</h2>
      {!showQrCode && (
        <>
         <input
            type="text"
            placeholder="Enter Resident ID"
            value={qrResidentId}
            onChange={(e) => setQrResidentId(e.target.value.trim().toLowerCase())}
            className="qr-input"
          />

          <button onClick={handleQrSubmit} className="generate-qr-button">
            Generate QR
          </button>
        </>
      )}
      {showQrCode && (
        <div className="qr-container">
          {residents
            .filter((resident) => resident.id === qrResidentId)
            .map((resident) => (
              <div key={resident.id}>
                <QRCodeCanvas
                  id={`qr-code-${resident.id}`} // Ensure the id matches the resident's ID
                  value={`http://192.168.175.150:3000/residents/${resident.id}`} // Frontend route
                  size={180}
                />
                <button
                  onClick={() => handleDownloadQr(resident.id)} // Pass the resident's ID to the function
                  className="download-qr-button"
                >
                  Download QR
                </button>
                <button
                  onClick={() => {
                    setShowQrCode(false);
                    setQrResidentId('');
                  }}
                  className="generate-qr-button"
                >
                  Type Another QR Code
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  </div>
      )}

      {/* Backup Modal */}
      {backupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AiOutlineClose
              className="close-icon"
              onClick={() => setBackupModal(false)}
            />
            <h2>Confirm Backup</h2>
            <p>Are you sure you want to download the backup CSV?</p>
            <div className="modal-actions">
              <button className="confirm-button" onClick={handleBackup}>
                Yes, Download
              </button>
              <button
                className="cancel-button"
                onClick={() => setBackupModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default ResidentList;