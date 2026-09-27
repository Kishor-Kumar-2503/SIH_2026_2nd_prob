import { useState } from "react";
import Sidebar from "./sidebar/Sidebar";
import Dashboard from "./pages/Dashboard";
import LandedCost from "./pages/LandedCost";
import FreightForecast from "./pages/FreightForecast";
import CharterDecision from "./pages/CharterDecision";
import VesselPorts from "./pages/VesselPorts";
import DecisionAudit from "./pages/DecisionAudit";
import SystemSettings from "./pages/SystemSettings";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="app">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main-content">

        {activePage === "dashboard" && <Dashboard setActivePage={setActivePage} />}
        {activePage === "procurement" && <LandedCost />}
        {activePage === "freight-forecast" && (
          <FreightForecast setActivePage={setActivePage} />
        )}
        {activePage === "chartering" && <CharterDecision />}
        {activePage === "ports" && <VesselPorts />}
        {activePage === "audit" && <DecisionAudit />}
        {activePage === "settings" && <SystemSettings />}

        {activePage !== "dashboard" && 
        activePage !== "procurement" && 
        activePage !== "freight-forecast" && 
        activePage !== "chartering" && 
        activePage !== "ports" && 
        activePage !== "audit" && 
        activePage !== "settings" && (
          <div className="coming-soon">
            <span>MODULE</span>
            <h1>
              {activePage.replace("-", " ")}
            </h1>

            <p>
              This module will be connected to the decision engine.
            </p>
          </div>
        )}

      </main>

    </div>
  );
}

export default App;