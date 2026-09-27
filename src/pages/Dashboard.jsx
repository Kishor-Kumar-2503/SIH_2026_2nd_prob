import {
  ArrowUpRight,
  Ship,
  Package,
  CircleDollarSign,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const freightData = [
  { week: "W1", rate: 27.4 },
  { week: "W2", rate: 27.8 },
  { week: "W3", rate: 28.2 },
  { week: "W4", rate: 28.7 },
  { week: "W5", rate: 29.1 },
  { week: "W6", rate: 29.8 },
  { week: "W7", rate: 30.4 },
];

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">
          <Icon size={19} />
        </div>

        <span className="stat-label">{label}</span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-detail">{detail}</div>
    </div>
  );
}

function Dashboard({ setActivePage }) {
  return (
    <div className="dashboard">

      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <div className="eyebrow">
            <Activity size={13} />
            FREIGHT INTELLIGENCE
          </div>

          <h1>Charter Command Center</h1>

          <p>
            Forecast, evaluate and optimize bulk cargo movements.
          </p>
        </div>

        <div className="live-status">
          <span className="live-dot"></span>
          DATA SYSTEM ONLINE
        </div>
      </div>


      {/* ROUTE */}

      <div className="route-bar">
        <div className="route-location">
          <span>ORIGIN</span>
          <strong>Australia</strong>
        </div>

        <div className="route-line">
          <div className="route-dash"></div>
          <Ship size={18} />
          <div className="route-dash"></div>
        </div>

        <div className="route-location destination">
          <span>DESTINATION</span>
          <strong>East Coast India</strong>
        </div>
      </div>


      {/* STAT CARDS */}

      <div className="stats-grid">

        <StatCard
          icon={CircleDollarSign}
          label="CURRENT FREIGHT"
          value="$27.40/t"
          detail="Dry bulk reference"
        />

        <StatCard
          icon={Package}
          label="CARGO REQUIREMENT"
          value="500K t"
          detail="Coking coal"
        />

        <StatCard
          icon={Ship}
          label="PRIMARY VESSEL"
          value="Panamax"
          detail="Port compatible"
        />

        <StatCard
          icon={AlertTriangle}
          label="MARKET RISK"
          value="Medium"
          detail="Volatility elevated"
        />

      </div>


      {/* MAIN GRID */}

      <div className="dashboard-grid">

        {/* FORECAST */}

        <section className="panel forecast-panel">

          <div className="panel-header">
            <div>
              <span className="panel-label">FREIGHT FORECAST</span>
              <h2>Expected Rate Movement</h2>
            </div>

            <div className="forecast-badge">
              <ArrowUpRight size={15} />
              +10.9%
            </div>
          </div>

          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={freightData}>

                <CartesianGrid
                  stroke="rgba(148,163,184,0.08)"
                  vertical={false}
                />

                <XAxis
                  dataKey="week"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  domain={[25, 32]}
                  tickFormatter={(value) => `$${value}`}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f1b2d",
                    border: "1px solid rgba(148,163,184,0.15)",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                  formatter={(value) => [`$${value}/t`, "Freight"]}
                />

                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#07111f",
                    stroke: "#38bdf8",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 6 }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          <div className="forecast-footer">

            <div>
              <span>FORECAST RANGE</span>
              <strong>$29 – $31 / tonne</strong>
            </div>

            <div>
              <span>HORIZON</span>
              <strong>6 weeks</strong>
            </div>

          </div>

        </section>


        {/* MARKET SIGNAL */}

        <section className="panel signal-panel">

          <div className="panel-header">
            <div>
              <span className="panel-label">DECISION SIGNAL</span>
              <h2>Market Outlook</h2>
            </div>
          </div>

          <div className="signal-main">

            <div className="signal-icon">
              <ArrowUpRight size={30} />
            </div>

            <div>
              <span>FREIGHT TREND</span>
              <h3>Rising</h3>
            </div>

          </div>

          <div className="signal-value">
            <span>Expected rate</span>
            <strong>$29–31/t</strong>
          </div>

          <div className="signal-message">
            Forecast indicates increasing freight pressure across
            the evaluated horizon.
          </div>

          <button className="decision-button" onClick={() => setActivePage("chartering")}>
            View Charter Decision
            <ArrowUpRight size={16} />
          </button>

        </section>

      </div>


      {/* BOTTOM GRID */}

      <div className="bottom-grid">

        {/* CARGO */}

        <section className="panel">

          <div className="panel-header">
            <div>
              <span className="panel-label">SHIPMENT</span>
              <h2>Cargo & Route</h2>
            </div>

            <MapPin size={20} />
          </div>

          <div className="shipment-route">

            <div>
              <span>ORIGIN</span>
              <strong>Australia</strong>
            </div>

            <div className="arrow">→</div>

            <div>
              <span>DESTINATION</span>
              <strong>Paradip</strong>
            </div>

          </div>

          <div className="shipment-details">

            <div>
              <span>CARGO</span>
              <strong>500,000 tonnes</strong>
            </div>

            <div>
              <span>COMMODITY</span>
              <strong>Coking Coal</strong>
            </div>

            <div>
              <span>CONTRACT</span>
              <strong>3 Months</strong>
            </div>

          </div>

        </section>


        {/* VESSEL */}

        <section className="panel">

          <div className="panel-header">
            <div>
              <span className="panel-label">FEASIBILITY</span>
              <h2>Vessel Compatibility</h2>
            </div>

            <Ship size={20} />
          </div>

          <div className="vessel-list">

            <div className="vessel-row compatible">
              <div>
                <CheckCircle2 size={18} />
                <strong>Panamax</strong>
              </div>

              <span>Compatible</span>
            </div>

            <div className="vessel-row compatible">
              <div>
                <CheckCircle2 size={18} />
                <strong>Supramax</strong>
              </div>

              <span>Compatible</span>
            </div>

            <div className="vessel-row incompatible">
              <div>
                <XCircle size={18} />
                <strong>Capesize</strong>
              </div>

              <span>Port restricted</span>
            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Dashboard;