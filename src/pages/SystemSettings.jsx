import { useState } from "react";

function SystemSettings() {
  const [settings, setSettings] = useState({
    commodity: "Coking Coal",
    cargo: "500,000",
    forecastHorizon: "6 Weeks",
    autoRefresh: true,
    notifications: true,
    simulationMode: false,
  });

  const [saved, setSaved] = useState(false);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">SYSTEM SETTINGS</span>

          <h1>System Configuration</h1>

          <p>
            Configure forecasting, decision engine and platform preferences.
          </p>
        </div>

        <div className="status-badge">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </div>


      {/* SYSTEM STATUS */}
      <div className="settings-grid">

        <div className="card settings-status-card">
          <span className="card-label">SYSTEM STATUS</span>

          <h2>Operational</h2>

          <p>
            All core platform services are currently running normally.
          </p>

          <div className="system-status-list">

            <div className="system-status-item">
              <div>
                <strong>Decision Engine</strong>
                <small>Charter recommendation service</small>
              </div>

              <span className="online-pill">ONLINE</span>
            </div>

            <div className="system-status-item">
              <div>
                <strong>Forecast Model</strong>
                <small>Freight rate prediction model</small>
              </div>

              <span className="online-pill">ONLINE</span>
            </div>

            <div className="system-status-item">
              <div>
                <strong>Port Network</strong>
                <small>Vessel and port data service</small>
              </div>

              <span className="online-pill">ONLINE</span>
            </div>

            <div className="system-status-item">
              <div>
                <strong>Audit Service</strong>
                <small>Decision history and records</small>
              </div>

              <span className="online-pill">ONLINE</span>
            </div>

          </div>
        </div>


        {/* PLATFORM INFO */}
        <div className="card">
          <span className="card-label">PLATFORM INFORMATION</span>

          <h2>Charter Compass</h2>

          <p>
            AI-assisted bulk shipping decision platform.
          </p>

          <div className="info-list">

            <div>
              <span>Version</span>
              <strong>v0.1</strong>
            </div>

            <div>
              <span>Environment</span>
              <strong>Demo</strong>
            </div>

            <div>
              <span>Model</span>
              <strong>Freight AI</strong>
            </div>

            <div>
              <span>Last Data Sync</span>
              <strong>18 Sep 2026</strong>
            </div>

          </div>
        </div>

      </div>


      {/* FORECAST CONFIGURATION */}
      <div className="card settings-section">

        <div className="section-heading">
          <div>
            <span className="card-label">FORECAST CONFIGURATION</span>

            <h2>Forecast Preferences</h2>

            <p>
              Configure the parameters used by the freight forecasting module.
            </p>
          </div>
        </div>


        <div className="form-grid">

          <div className="form-group">
            <label>Default Commodity</label>

            <select
              value={settings.commodity}
              onChange={(e) =>
                updateSetting("commodity", e.target.value)
              }
            >
              <option>Coking Coal</option>
              <option>Iron Ore</option>
              <option>Thermal Coal</option>
              <option>Grain</option>
            </select>
          </div>


          <div className="form-group">
            <label>Forecast Horizon</label>

            <select
              value={settings.forecastHorizon}
              onChange={(e) =>
                updateSetting("forecastHorizon", e.target.value)
              }
            >
              <option>2 Weeks</option>
              <option>4 Weeks</option>
              <option>6 Weeks</option>
              <option>12 Weeks</option>
            </select>
          </div>

        </div>

      </div>


      {/* SHIPMENT CONFIGURATION */}
      <div className="card settings-section">

        <span className="card-label">SHIPMENT CONFIGURATION</span>

        <h2>Default Shipment</h2>

        <p>
          Define the default shipment profile used by the decision engine.
        </p>


        <div className="form-grid">

          <div className="form-group">
            <label>Cargo Quantity (Tonnes)</label>

            <input
              type="text"
              value={settings.cargo}
              onChange={(e) =>
                updateSetting("cargo", e.target.value)
              }
            />
          </div>


          <div className="form-group">
            <label>Loading Region</label>

            <input
              type="text"
              value="Australia"
              readOnly
            />
          </div>


          <div className="form-group">
            <label>Discharge Region</label>

            <input
              type="text"
              value="East Coast India"
              readOnly
            />
          </div>

        </div>

      </div>


      {/* PLATFORM PREFERENCES */}
      <div className="card settings-section">

        <span className="card-label">PLATFORM PREFERENCES</span>

        <h2>Application Controls</h2>

        <p>
          Manage automated platform behaviour and notifications.
        </p>


        <div className="toggle-list">

          <div className="toggle-row">

            <div>
              <strong>Automatic Data Refresh</strong>

              <small>
                Refresh vessel, port and market data automatically.
              </small>
            </div>

            <button
              className={`toggle ${
                settings.autoRefresh ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "autoRefresh",
                  !settings.autoRefresh
                )
              }
            >
              <span></span>
            </button>

          </div>


          <div className="toggle-row">

            <div>
              <strong>Decision Notifications</strong>

              <small>
                Receive alerts when important decision inputs change.
              </small>
            </div>

            <button
              className={`toggle ${
                settings.notifications ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "notifications",
                  !settings.notifications
                )
              }
            >
              <span></span>
            </button>

          </div>


          <div className="toggle-row">

            <div>
              <strong>Simulation Mode</strong>

              <small>
                Run decisions using simulated shipment data.
              </small>
            </div>

            <button
              className={`toggle ${
                settings.simulationMode ? "active" : ""
              }`}
              onClick={() =>
                updateSetting(
                  "simulationMode",
                  !settings.simulationMode
                )
              }
            >
              <span></span>
            </button>

          </div>

        </div>

      </div>


      {/* SAVE */}
      <div className="settings-actions">

        {saved && (
          <span className="save-message">
            ✓ Configuration saved
          </span>
        )}

        <button
          className="save-button"
          onClick={handleSave}
        >
          Save Configuration
        </button>

      </div>

    </div>
  );
}

export default SystemSettings;