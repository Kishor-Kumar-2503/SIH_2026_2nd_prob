import { useEffect, useState } from "react";

function DecisionAudit() {
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuditData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/audit");

      if (!response.ok) {
        throw new Error("Failed to fetch audit records.");
      }

      const data = await response.json();

      setAuditEntries(data.audits || []);
      setError("");
      setLoading(false);
    } catch (err) {
      console.error("Audit API error:", err);
      setError("Unable to load audit records.");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchAuditData();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAuditData();
    }, 30000);

    // Cleanup when leaving the page
    return () => clearInterval(interval);
  }, []);

  const latestDecision = auditEntries[0];

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCost = (cost) => {
    if (cost === null || cost === undefined) {
      return "—";
    }

    return `$${Number(cost).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) {
      return "—";
    }

    return `${Number(score).toFixed(1)}%`;
  };

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">

        <div>
          <span className="eyebrow">
            DECISION AUDIT
          </span>

          <h1>
            Decision History
          </h1>

          <p>
            Review system recommendations, decision factors and audit records.
          </p>
        </div>

        <div className="status-badge">
          <span className="status-dot"></span>
          AUDIT SYSTEM ONLINE
        </div>

      </div>


      {/* SUMMARY */}
      <div className="forecast-grid">

        <div className="card">

          <span className="card-label">
            DECISIONS LOGGED
          </span>

          <h2>
            {loading ? "..." : auditEntries.length}
          </h2>

          <p>
            Charter decisions recorded by the system.
          </p>

        </div>


        <div className="card">

          <span className="card-label">
            CURRENT DECISION
          </span>

          <h2>
            {loading
              ? "..."
              : latestDecision
                ? latestDecision.decision_id
                : "—"}
          </h2>

          <p>
            Latest recommendation under evaluation.
          </p>

        </div>


        <div className="card">

          <span className="card-label">
            AUDIT STATUS
          </span>

          <h2 className="trend-up">
            {error ? "ERROR" : "VERIFIED"}
          </h2>

          <p>
            {error
              ? "Unable to connect to audit database."
              : "Decision inputs are available for review."}
          </p>

        </div>

      </div>


      {/* ERROR */}
      {error && (
        <div className="card">

          <p>
            {error}
          </p>

        </div>
      )}


      {/* LOADING */}
      {loading && (
        <div className="card">

          <p>
            Loading audit records from database...
          </p>

        </div>
      )}


      {/* CURRENT DECISION */}
      {!loading && latestDecision && (
        <div className="card">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                LATEST DECISION
              </span>

              <h2>
                Charter {latestDecision.recommended_vessel}
              </h2>

            </div>

            <div className="forecast-change">
              {latestDecision.decision_id}
            </div>

          </div>


          <p>
            {latestDecision.explanation ||
              `The decision engine selected ${latestDecision.recommended_vessel} based on the evaluated vessel, cost, capacity, time and operational risk factors.`}
          </p>


          {/* FACTOR GRID */}
          <div className="audit-factors">

            <div className="audit-factor">

              <span>
                COST
              </span>

              <strong>
                35%
              </strong>

              <small>
                Charter cost contribution
              </small>

            </div>


            <div className="audit-factor">

              <span>
                TIME
              </span>

              <strong>
                25%
              </strong>

              <small>
                Voyage duration contribution
              </small>

            </div>


            <div className="audit-factor">

              <span>
                CAPACITY
              </span>

              <strong>
                25%
              </strong>

              <small>
                Cargo compatibility
              </small>

            </div>


            <div className="audit-factor">

              <span>
                RISK
              </span>

              <strong>
                15%
              </strong>

              <small>
                Operational risk factor
              </small>

            </div>

          </div>

        </div>
      )}


      {/* DECISION EXPLANATION */}
      {!loading && latestDecision && (
        <div className="card">

          <span className="eyebrow">
            DECISION EXPLANATION
          </span>

          <h2>
            Why {latestDecision.recommended_vessel}?
          </h2>


          <div className="audit-list">

            <div className="audit-row">

              <div>

                <strong>
                  Decision Score
                </strong>

                <p>
                  Overall decision score recorded by the
                  decision engine.
                </p>

              </div>

              <span className="audit-score">
                {formatScore(latestDecision.decision_score)}
              </span>

            </div>


            <div className="audit-row">

              <div>

                <strong>
                  Recommended Vessel
                </strong>

                <p>
                  {latestDecision.recommended_vessel}
                  was selected by the charter decision engine.
                </p>

              </div>

              <span className="audit-score">
                SELECTED
              </span>

            </div>


            <div className="audit-row">

              <div>

                <strong>
                  Decision Type
                </strong>

                <p>
                  {latestDecision.decision_type ||
                    "Charter Decision"}
                </p>

              </div>

              <span className="audit-score">
                CHARTER
              </span>

            </div>


            <div className="audit-row">

              <div>

                <strong>
                  Decision Status
                </strong>

                <p>
                  Current audit status recorded in the
                  database.
                </p>

              </div>

              <span className="audit-score">
                {latestDecision.decision_status ||
                  "RECORDED"}
              </span>

            </div>

          </div>

        </div>
      )}


      {/* AUDIT TABLE */}
      {!loading && (
        <div className="card">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                AUDIT LOG
              </span>

              <h2>
                Decision Records
              </h2>

            </div>

            <div className="forecast-change">
              {auditEntries.length} RECORDS
            </div>

          </div>


          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    DECISION ID
                  </th>

                  <th>
                    DATE
                  </th>

                  <th>
                    SHIPMENT
                  </th>

                  <th>
                    VESSEL
                  </th>

                  <th>
                    EST. COST
                  </th>

                  <th>
                    SCORE
                  </th>

                  <th>
                    STATUS
                  </th>

                </tr>

              </thead>


              <tbody>

                {auditEntries.length === 0 ? (

                  <tr>

                    <td colSpan="7">
                      No audit records found.
                    </td>

                  </tr>

                ) : (

                  auditEntries.map((entry) => (

                    <tr key={entry.id}>

                      <td>
                        <strong>
                          {entry.decision_id}
                        </strong>
                      </td>


                      <td>
                        {formatDate(entry.created_at)}
                      </td>


                      <td>
                        {entry.shipment_route || "—"}
                      </td>


                      <td>
                        {entry.recommended_vessel || "—"}
                      </td>


                      <td>
                        {formatCost(entry.charter_cost)}
                      </td>


                      <td>
                        <strong className="trend-up">
                          {formatScore(entry.decision_score)}
                        </strong>
                      </td>


                      <td>
                        <span className="status-available">
                          {entry.decision_status || "Recorded"}
                        </span>
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  );
}

export default DecisionAudit;