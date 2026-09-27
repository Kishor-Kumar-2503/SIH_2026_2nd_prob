import { useEffect, useState } from "react";

function VesselPorts() {
  const [vessels, setVessels] = useState([]);
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [vesselsResponse, portsResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/vessels"),
        fetch("http://127.0.0.1:8000/api/ports"),
      ]);

      if (!vesselsResponse.ok || !portsResponse.ok) {
        throw new Error("Failed to fetch backend data");
      }

      const vesselsData = await vesselsResponse.json();
      const portsData = await portsResponse.json();

      setVessels(vesselsData.vessels);
      setPorts(portsData.ports);

      setLastUpdated(
        vesselsData.last_updated || portsData.last_updated
      );
    } catch (err) {
      console.error("Vessel & Port API error:", err);
      setError("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  const availableVessels = vessels.filter(
    (vessel) => vessel.status === "Available"
  ).length;

  if (loading && vessels.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <span className="eyebrow">VESSEL & PORTS</span>
            <h1>Fleet & Port Network</h1>
            <p>Connecting to the backend...</p>
          </div>

          <div className="status-badge">
            <span className="status-dot"></span>
            CONNECTING
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">VESSEL & PORTS</span>

          <h1>Fleet & Port Network</h1>

          <p>
            Monitor vessel availability, cargo capacity and port compatibility.
          </p>
        </div>

        <div className="status-badge">
          <span className="status-dot"></span>
          NETWORK ONLINE
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <p style={{ color: "#ff6b6b", margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="forecast-grid">

        <div className="card">
          <span className="card-label">
            AVAILABLE VESSELS
          </span>

          <h2>{availableVessels}</h2>

          <p>
            Vessels currently available for charter.
          </p>
        </div>

        <div className="card">
          <span className="card-label">
            PORTS MONITORED
          </span>

          <h2>{ports.length}</h2>

          <p>
            Ports available within the decision network.
          </p>
        </div>

        <div className="card">
          <span className="card-label">
            CARGO TYPE
          </span>

          <h2>Coking Coal</h2>

          <p>
            Primary cargo under evaluation.
          </p>
        </div>

      </div>

      {/* VESSEL TABLE */}
      <div className="card">

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              VESSEL DATABASE
            </span>

            <h2>
              Available Vessel Options
            </h2>
          </div>

          <div className="forecast-change">
            {vessels.length} VESSELS
          </div>

        </div>

        <div className="table-container">

          <table className="data-table">

            <thead>
              <tr>
                <th>VESSEL</th>
                <th>TYPE</th>
                <th>CAPACITY</th>
                <th>LOCATION</th>
                <th>CHARTER RATE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>

              {vessels.map((vessel) => (

                <tr key={vessel.name}>

                  <td>
                    <strong>
                      {vessel.name}
                    </strong>
                  </td>

                  <td>
                    {vessel.type}
                  </td>

                  <td>
                    {vessel.capacity}
                  </td>

                  <td>
                    {vessel.location}
                  </td>

                  <td>
                    ${vessel.daily_rate.toLocaleString()}/day
                  </td>

                  <td>

                    <span
                      className={
                        vessel.status === "Available"
                          ? "status-available"
                          : "status-transit"
                      }
                    >
                      {vessel.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* PORT NETWORK */}
      <div className="card">

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              PORT NETWORK
            </span>

            <h2>
              Monitored Ports
            </h2>
          </div>

          <div className="forecast-change">
            AU → INDIA
          </div>

        </div>

        <div className="table-container">

          <table className="data-table">

            <thead>

              <tr>
                <th>PORT</th>
                <th>COUNTRY</th>
                <th>CARGO</th>
                <th>MAX DRAFT</th>
                <th>STATUS</th>
              </tr>

            </thead>

            <tbody>

              {ports.map((port) => (

                <tr key={port.name}>

                  <td>
                    <strong>
                      {port.name}
                    </strong>
                  </td>

                  <td>
                    {port.country}
                  </td>

                  <td>
                    {port.cargo}
                  </td>

                  <td>
                    {port.draft}
                  </td>

                  <td>

                    <span className="status-available">
                      {port.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* ROUTE PROFILE */}
      <div className="card route-card">

        <span className="eyebrow">
          ACTIVE ROUTE
        </span>

        <h2>
          Australia → East Coast India
        </h2>

        <p>
          Primary logistics corridor for the current coking coal shipment.
        </p>

        <div className="route-flow">

          <div className="route-point">

            <span className="route-dot"></span>

            <div>
              <strong>Australia</strong>
              <small>Loading Region</small>
            </div>

          </div>

          <div className="route-line"></div>

          <div className="route-point">

            <span className="route-dot"></span>

            <div>
              <strong>East Coast India</strong>
              <small>Discharge Region</small>
            </div>

          </div>

        </div>

      </div>

      {/* LAST UPDATE */}
      <div className="card">

        <span className="card-label">
          LAST DATA UPDATE
        </span>

        <h2>
          {lastUpdated
            ? new Date(lastUpdated).toLocaleTimeString()
            : "Waiting..."
          }
        </h2>

        <p>
          Vessel and port data automatically refreshed from the backend.
        </p>

      </div>

    </div>
  );
}

export default VesselPorts;