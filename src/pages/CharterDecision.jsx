import { useState } from "react";

function CharterDecision() {
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Shipment inputs
  const [origin, setOrigin] = useState("Australia");
  const [destination, setDestination] =
    useState("East Coast India");
  const [commodity, setCommodity] =
    useState("Coking Coal");
  const [quantity, setQuantity] =
    useState(500000);

  const API_URL = "http://127.0.0.1:8000";

  // =========================================================
  // FETCH CHARTER DECISION
  // =========================================================

  const fetchDecision = async () => {
    try {
      setLoading(true);
      setError("");

      const shipmentData = {
        origin: origin,
        destination: destination,
        commodity: commodity,
        quantity: Number(quantity),
      };

      console.log(
        "Sending shipment:",
        shipmentData
      );

      const response = await fetch(
        `${API_URL}/api/charter-decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(shipmentData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Backend error:",
          errorText
        );

        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Charter Decision API:",
        data
      );

      setDecision(data);

    } catch (err) {
      console.error(
        "Decision Engine Error:",
        err
      );

      setError(
        "Unable to connect to the decision engine."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading && !decision) {
    return (
      <div className="page">

        <div className="page-header">

          <div>

            <span className="eyebrow">
              CHARTER DECISION
            </span>

            <h1>
              Charter Recommendation
            </h1>

            <p>
              Connecting to the AI decision engine...
            </p>

          </div>

          <div className="status-badge">

            <span className="status-dot"></span>

            ENGINE CONNECTING

          </div>

        </div>


        <div className="card">

          <h2>
            Loading decision engine...
          </h2>

          <p>
            Fetching vessel options and calculating
            the recommended charter strategy.
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error && !decision) {
    return (
      <div className="page">

        <div className="page-header">

          <div>

            <span className="eyebrow">
              CHARTER DECISION
            </span>

            <h1>
              Charter Recommendation
            </h1>

            <p>
              Evaluate vessel options and identify
              the most suitable charter strategy.
            </p>

          </div>

          <div className="status-badge">

            <span className="status-dot"></span>

            ENGINE OFFLINE

          </div>

        </div>


        <div className="card">

          <h2>
            Decision Engine Unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            className="save-button"
            onClick={fetchDecision}
            style={{
              marginTop: "20px",
            }}
          >
            Retry Connection
          </button>

        </div>

      </div>
    );
  }

  const recommended =
    decision?.recommended_vessel;

  const factors =
    decision?.factors;

  const freight =
    decision?.freight;

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>

          <span className="eyebrow">
            CHARTER DECISION
          </span>

          <h1>
            Charter Recommendation
          </h1>

          <p>
            Evaluate vessel options and identify the
            most suitable charter strategy.
          </p>

        </div>


        <div className="status-badge">

          <span className="status-dot"></span>

          DECISION ENGINE ONLINE

        </div>

      </div>


      {/* =====================================================
          SHIPMENT CONFIGURATION
      ====================================================== */}

      <div className="card">

        <span className="eyebrow">
          SHIPMENT CONFIGURATION
        </span>

        <h2>
          Configure Shipment
        </h2>

        <p>
          Enter the shipment details to run the
          charter decision engine.
        </p>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginTop: "24px",
          }}
        >

          {/* ORIGIN */}

          <div>

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              ORIGIN
            </label>

            <input
              type="text"
              value={origin}
              onChange={(e) =>
                setOrigin(e.target.value)
              }
              placeholder="Australia"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #26384d",
                background: "#0d1827",
                color: "#ffffff",
                boxSizing: "border-box",
              }}
            />

          </div>


          {/* DESTINATION */}

          <div>

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              DESTINATION
            </label>

            <input
              type="text"
              value={destination}
              onChange={(e) =>
                setDestination(e.target.value)
              }
              placeholder="East Coast India"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #26384d",
                background: "#0d1827",
                color: "#ffffff",
                boxSizing: "border-box",
              }}
            />

          </div>


          {/* COMMODITY */}

          <div>

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              COMMODITY
            </label>

            <input
              type="text"
              value={commodity}
              onChange={(e) =>
                setCommodity(e.target.value)
              }
              placeholder="Coking Coal"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #26384d",
                background: "#0d1827",
                color: "#ffffff",
                boxSizing: "border-box",
              }}
            />

          </div>


          {/* CARGO QUANTITY */}

          <div>

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              CARGO QUANTITY (TONNES)
            </label>

            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              min="1"
              placeholder="500000"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #26384d",
                background: "#0d1827",
                color: "#ffffff",
                boxSizing: "border-box",
              }}
            />

          </div>

        </div>


        {/* RUN ENGINE */}

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >

          <button
            className="save-button"
            onClick={fetchDecision}
            disabled={loading}
          >
            {loading
              ? "Running Engine..."
              : "Run Decision Engine"}
          </button>

        </div>

      </div>


      {/* =====================================================
          SHIPMENT PROFILE
      ====================================================== */}

      <div className="card">

        <span className="eyebrow">
          SHIPMENT PROFILE
        </span>

        <h2>

          {decision?.shipment?.origin ||
            "Australia"}

          {" → "}

          {decision?.shipment?.destination ||
            "East Coast India"}

        </h2>

        <p>

          {decision?.shipment?.quantity?.toLocaleString() ||
            "500,000"}

          {" "}
          tonnes ·{" "}

          {decision?.shipment?.commodity ||
            "Coking Coal"}

          {" · Bulk Cargo"}

        </p>

      </div>


      {/* =====================================================
          FREIGHT INTELLIGENCE
      ====================================================== */}

      <div className="card">

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              FREIGHT INTELLIGENCE
            </span>

            <h2>
              Market Freight Outlook
            </h2>

          </div>

          <div className="forecast-change">
            {freight?.confidence ||
              "Medium"} CONFIDENCE
          </div>

        </div>


        <div className="forecast-grid">


          {/* CURRENT RATE */}

          <div className="card">

            <span className="card-label">
              CURRENT FREIGHT RATE
            </span>

            <h2>

              $
              {Number(
                freight?.current_rate || 0
              ).toFixed(2)}

            </h2>

            <p>
              Per {freight?.unit || "tonne"}
            </p>

          </div>


          {/* TREND */}

          <div className="card">

            <span className="card-label">
              MARKET TREND
            </span>

            <h2
              style={{
                color:
                  freight?.trend === "RISING"
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            >

              {freight?.trend === "RISING"
                ? "↑ "
                : "→ "}

              {freight?.trend ||
                "UNKNOWN"}

            </h2>

            <p>
              Forecast market direction
            </p>

          </div>


          {/* FORECAST RANGE */}

          <div className="card">

            <span className="card-label">
              FORECAST RANGE
            </span>

            <h2>

              $
              {freight?.forecast_range?.min ||
                0}

              {" – "}

              $
              {freight?.forecast_range?.max ||
                0}

            </h2>

            <p>
              Expected freight range
            </p>

          </div>

        </div>


        {/* WEEKLY FORECAST */}

        <div
          style={{
            marginTop: "25px",
          }}
        >

          <span className="card-label">
            6-WEEK FREIGHT FORECAST
          </span>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(6, 1fr)",
              gap: "10px",
              marginTop: "15px",
            }}
          >

            {freight?.forecast?.map(
              (item) => (

                <div
                  key={item.week}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "#0d1827",
                    textAlign: "center",
                    border:
                      "1px solid #26384d",
                  }}
                >

                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  >
                    {item.week}
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    ${item.rate.toFixed(2)}
                  </strong>

                </div>

              )
            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="forecast-grid">


        {/* RECOMMENDED VESSEL */}

        <div className="card">

          <span className="card-label">
            RECOMMENDED VESSEL
          </span>

          <h2>

            {recommended?.name ||
              recommended?.type ||
              "Panamax"}

          </h2>

          <p>

            {recommended?.capacity ||
              "65,000 DWT"}

            {" "}capacity

          </p>

        </div>


        {/* ESTIMATED COST */}

        <div className="card">

          <span className="card-label">
            EST. VOYAGE COST
          </span>

          <h2>

            $

            {Number(
              recommended?.charter_cost || 0
            ).toLocaleString()}

          </h2>

          <p>
            Based on estimated charter duration
          </p>

        </div>


        {/* SUITABILITY */}

        <div className="card">

          <span className="card-label">
            SUITABILITY
          </span>

          <h2
            style={{
              color: "#22c55e",
            }}
          >

            {recommended?.overall_score || 0}%

          </h2>

          <p>
            Decision engine suitability score
          </p>

        </div>

      </div>


      {/* =====================================================
          VESSEL ANALYSIS
      ====================================================== */}

      <div className="card">

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              VESSEL ANALYSIS
            </span>

            <h2>
              Available Vessel Options
            </h2>

          </div>

          <div className="forecast-change">

            {decision?.all_options?.length || 0}

            {" "}
            OPTIONS

          </div>

        </div>


        <div className="forecast-grid">

          {decision?.all_options?.map(
            (vessel) => {

              const isRecommended =
                vessel.name ===
                recommended?.name;

              return (

                <div
                  className="card"
                  key={vessel.name}
                  style={{
                    border: isRecommended
                      ? "1px solid #20b9f3"
                      : undefined,

                    cursor: "default",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                    }}
                  >

                    <h2>
                      {vessel.name ||
                        vessel.type}
                    </h2>

                    {isRecommended && (

                      <span
                        className="eyebrow"
                        style={{
                          color: "#20b9f3",
                        }}
                      >
                        RECOMMENDED
                      </span>

                    )}

                  </div>


                  <p>
                    Capacity:{" "}
                    {vessel.capacity ||
                      "N/A"}
                  </p>


                  <p>
                    Daily hire: $

                    {Number(
                      vessel.daily_rate || 0
                    ).toLocaleString()}

                  </p>


                  <p>
                    Voyage:{" "}
                    {vessel.voyage_days ||
                      "N/A"}{" "}
                    days
                  </p>


                  <p>
                    Loads required:{" "}
                    {vessel.loads_required ||
                      1}
                  </p>


                  {/* SCORE BAR */}

                  <div
                    style={{
                      marginTop: "18px",
                      height: "7px",
                      background:
                        "#17263a",
                      borderRadius:
                        "10px",
                      overflow:
                        "hidden",
                    }}
                  >

                    <div
                      style={{
                        width: `${
                          vessel.overall_score ||
                          0
                        }%`,

                        height: "100%",

                        background:
                          "#20b9f3",

                        borderRadius:
                          "10px",
                      }}
                    />

                  </div>


                  <p>
                    Suitability:{" "}
                    {vessel.overall_score ||
                      0}%
                  </p>

                </div>

              );

            }
          )}

        </div>

      </div>


      {/* =====================================================
          DECISION ENGINE
      ====================================================== */}

      <div className="card">

        <span className="eyebrow">
          DECISION ENGINE
        </span>

        <h2>
          Charter Strategy Analysis
        </h2>

        <p>
          The system evaluates vessel capacity,
          voyage duration, charter cost and cargo
          requirements.
        </p>


        <div className="forecast-grid">


          {/* COST */}

          <div className="card">

            <span className="card-label">
              COST FACTOR
            </span>

            <h2>
              {factors?.cost || 35}%
            </h2>

            <p>
              Charter cost contribution
            </p>

          </div>


          {/* TIME */}

          <div className="card">

            <span className="card-label">
              TIME FACTOR
            </span>

            <h2>
              {factors?.time || 25}%
            </h2>

            <p>
              Voyage duration contribution
            </p>

          </div>


          {/* CAPACITY */}

          <div className="card">

            <span className="card-label">
              CAPACITY
            </span>

            <h2>
              {factors?.capacity || 25}%
            </h2>

            <p>
              Cargo compatibility
            </p>

          </div>


          {/* RISK */}

          <div className="card">

            <span className="card-label">
              RISK
            </span>

            <h2>
              {factors?.risk || 15}%
            </h2>

            <p>
              Operational risk factor
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          SYSTEM RECOMMENDATION
      ====================================================== */}

      <div
        className="card"
        style={{
          border: "1px solid #20b9f3",
        }}
      >

        <span className="eyebrow">
          SYSTEM RECOMMENDATION
        </span>

        <h2>

          Charter{" "}

          {recommended?.type ||
            recommended?.name ||
            "Panamax"}

        </h2>

        <p>

          Based on the current shipment profile,
          freight outlook and vessel analysis, the
          decision engine identifies the{" "}

          {recommended?.type ||
            recommended?.name ||
            "Panamax"}

          {" "}
          option as the selected strategy for
          evaluation.

        </p>


        <div className="forecast-grid">


          {/* COST */}

          <div className="card">

            <span className="card-label">
              ESTIMATED COST
            </span>

            <h2>

              $

              {Number(
                recommended?.charter_cost || 0
              ).toLocaleString()}

            </h2>

          </div>


          {/* DURATION */}

          <div className="card">

            <span className="card-label">
              VOYAGE DURATION
            </span>

            <h2>

              {recommended?.voyage_days ||
                0}

              {" "}
              days

            </h2>

          </div>


          {/* SUITABILITY */}

          <div className="card">

            <span className="card-label">
              SUITABILITY
            </span>

            <h2
              style={{
                color: "#22c55e",
              }}
            >

              {recommended?.overall_score ||
                0}%

            </h2>

          </div>

        </div>

      </div>


      {/* =====================================================
          REFRESH
      ====================================================== */}

      <div className="settings-actions">

        <button
          className="save-button"
          onClick={fetchDecision}
          disabled={loading}
        >

          {loading
            ? "Refreshing..."
            : "Refresh Decision"}

        </button>

      </div>


      {/* ERROR AFTER REFRESH */}

      {error && decision && (

        <div
          className="card"
          style={{
            marginTop: "15px",
          }}
        >

          <p
            style={{
              color: "#ff6b6b",
              margin: 0,
            }}
          >
            {error}
          </p>

        </div>

      )}

    </div>
  );
}

export default CharterDecision;
