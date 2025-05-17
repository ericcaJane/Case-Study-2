import React, { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./main.css";
import jsQR from "jsqr";

const QrScanner = () => {
  const [scanResult, setScanResult] = useState("");
  const [error, setError] = useState("");
  const [residentDetails, setResidentDetails] = useState(null); // State to store resident details
  const [mode, setMode] = useState("scan"); // "scan" or "upload"
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null); // Store the codeReader instance

  useEffect(() => {
    if (mode === "scan") {
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader; // Save the instance for cleanup
      console.log("Initializing QR Scanner...");

      codeReader
        .decodeFromVideoDevice(null, videoRef.current, (result, err) => {
          if (result) {
            console.log("QR Code Result:", result.getText());
            handleScanResult(result.getText());
            toast.success("QR Code scanned successfully!");
          }
          if (err) {
            console.error("QR Scanner Error:", err);
          }
        })
        .catch((err) => {
          console.error("Error initializing QR scanner:", err);
          setError("Failed to initialize QR scanner.");
        });

      return () => {
        // Stop the video stream when the component unmounts
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop()); // Stop all tracks
          videoRef.current.srcObject = null; // Clear the video source
        }
      };
    }
  }, [mode]);

  const handleScanResult = (url) => {
    setScanResult(url);

    // Extract the resident ID from the URL
    const residentId = url.split("/").pop();
    fetchResidentDetails(residentId);
  };

  const fetchResidentDetails = async (residentId) => {
    try {
      const response = await fetch(`http://localhost:5000/residents/qr/${residentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch resident details.");
      }
      const data = await response.json();
      setResidentDetails(data); // Store the resident details in state
      setIsModalOpen(true); // Open the modal
    } catch (err) {
      console.error("Error fetching resident details:", err);
      setError("Failed to fetch resident details. Please try again.");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError("No file selected. Please upload a valid QR code image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

        if (qrCode) {
          handleScanResult(qrCode.data);
          toast.success("QR Code scanned successfully!");
        } else {
          console.error("Failed to decode QR code.");
          setError("Failed to decode QR code. Please try again.");
        }
      };
    };

    reader.readAsDataURL(file);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResidentDetails(null); // Clear resident details when modal is closed
  };

  return (
    <div className="qr-scanner-container">
      <h1>QR Code Scanner</h1>
      <div className="qr-mode-toggle">
        <button
          className={mode === "scan" ? "active" : ""}
          onClick={() => setMode("scan")}
        >
          Scan QR Code
        </button>
        <button
          className={mode === "upload" ? "active" : ""}
          onClick={() => setMode("upload")}
        >
          Upload QR Code
        </button>
      </div>
      {mode === "scan" && (
        <div className="qr-scanner">
          <video ref={videoRef} style={{ width: "100%" }} autoPlay muted />
        </div>
      )}
      {mode === "upload" && (
        <div className="qr-upload">
          <h3>Upload QR Code</h3>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
        </div>
      )}
      {scanResult && (
        <div className="scan-result">
          <h3>Scan Result:</h3>
          <p>{scanResult}</p>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {/* Modal for Resident Details */}
      {isModalOpen && residentDetails && (
        <div className="mod">
          <div className="mod-content">
            <h3>Resident Details</h3>
            <p><strong>ID:</strong> {residentDetails.id}</p>
            <p><strong>Name:</strong> {residentDetails.name}</p>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrScanner;