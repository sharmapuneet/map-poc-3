import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import airlineLogo from '../assets/airplane.png';

// Example airports (with prices for demo)
const airports = {
    SYD: { name: "Sydney", coordinates: [-33.8688, 151.2093], price: 0 },
    SIN: { name: "Singapore", coordinates: [1.3521, 103.8198], price: 450 },
    LAX: { name: "Los Angeles", coordinates: [34.0522, -118.2437], price: 900 },
    TYO: { name: "Tokyo", coordinates: [35.6895, 139.6917], price: 700 },
    DXB: { name: "Dubai", coordinates: [25.276987, 55.296249], price: 600 }
  };
  
  // Bearing calculation
  function getBearing(start, end) {
    const [lat1, lon1] = start.map(x => (x * Math.PI) / 180);
    const [lat2, lon2] = end.map(x => (x * Math.PI) / 180);
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }
  
  // Curved arc generator
  function generateArc(from, to, segments = 100) {
    const lat1 = from[0];
    const lng1 = from[1];
    const lat2 = to[0];
    const lng2 = to[1];
    const curve = [];
  
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const lat = lat1 + (lat2 - lat1) * t;
      const lng = lng1 + (lng2 - lng1) * t;
      const offset = Math.sin(Math.PI * t) * 10;
      const curvedLat = lat + offset * 0.1;
      curve.push([curvedLat, lng]);
    }
    return curve;
  }
  
  // Animated airplane marker
  function AirplaneAnimation({ path }) {
    const [position, setPosition] = useState(path[0]);
    const [rotation, setRotation] = useState(0);
    const indexRef = useRef(0);
  
    useEffect(() => {
      indexRef.current = 0;
      setPosition(path[0]);
  
      const interval = setInterval(() => {
        if (indexRef.current < path.length - 1) {
          const nextIndex = indexRef.current + 1;
          const newPos = path[nextIndex];
          const brng = getBearing(path[indexRef.current], newPos);
          setPosition(newPos);
          setRotation(brng);
          indexRef.current = nextIndex;
        } else {
          clearInterval(interval);
        }
      }, 100);
  
      return () => clearInterval(interval);
    }, [path]);
  
    const airplaneIcon = new L.DivIcon({
      html: `<div style="transform: rotate(${rotation}deg)">
               <img src="${airlineLogo}" 
                    style="width:32px;height:32px;" />
             </div>`,
      iconSize: [32, 32],
      className: ""
    });
  
    return <Marker position={position} icon={airplaneIcon}></Marker>;
  }
  
  // Auto-fit map to route
  function FitBounds({ path }) {
    const map = useMap();
    useEffect(() => {
      if (path && path.length > 0) {
        map.fitBounds(path, { padding: [50, 50] });
      }
    }, [path, map]);
    return null;
  }
  
  export default function FlightSearchMap() {
    const [origin, setOrigin] = useState("SYD");
    const [destination, setDestination] = useState("SIN");
    const [route, setRoute] = useState(null);
  
    const buildRoute = (fromCode, toCode) => {
      if (airports[fromCode] && airports[toCode]) {
        const from = airports[fromCode].coordinates;
        const to = airports[toCode].coordinates;
        const curve = generateArc(from, to, 200);
        setRoute({
          from: airports[fromCode],
          to: airports[toCode],
          curve
        });
      }
    };
  
    useEffect(() => {
      if (origin && destination) {
        buildRoute(origin, destination);
      }
    }, [origin, destination]);
  
    return (
      <div style={{ height: "100vh", width: "100vw" }}>
        {/* Flight Search Controls */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          <input
            type="text"
            placeholder="Origin (e.g. SYD)"
            value={origin}
            onChange={e => setOrigin(e.target.value.toUpperCase())}
            style={{ marginRight: "5px" }}
          />
          <input
            type="text"
            placeholder="Destination (e.g. SIN)"
            value={destination}
            onChange={e => setDestination(e.target.value.toUpperCase())}
            style={{ marginRight: "5px" }}
          />
          <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>
            💡 Click any airport marker to set it as destination
          </p>
        </div>
  
        <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
  
          {/* Show all airports */}
          {Object.entries(airports).map(([code, airport]) => (
            <Marker
              key={code}
              position={airport.coordinates}
              eventHandlers={{
                click: () => setDestination(code)
              }}
            >
              <Popup>
                <strong>{airport.name}</strong> ({code}) <br />
                {airport.price > 0 ? `From $${airport.price}` : "Origin"}
                {origin === code && " 🛫"}
                {destination === code && " 🛬"}
              </Popup>
            </Marker>
          ))}
  
          {route && (
            <>
              <FitBounds path={route.curve} />
              <Polyline positions={route.curve} color="blue" weight={3} />
              <AirplaneAnimation path={route.curve} />
            </>
          )}
        </MapContainer>
      </div>
    );
  }