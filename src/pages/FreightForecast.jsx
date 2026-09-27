import { useEffect, useState } from "react";

function FreightForecast() {
  const [freightData, setFreightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchFreight();
  }, []);

  const fetchFreight = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/freight`);

      if (!response.ok) {
        throw new Error("Failed to fetch freight data");
      }

      const data = await response.json();

      console.log("Freight API:", data);

      setFreightData(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to connect to the freight forecasting service."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <span className="eyebrow">FREIGHT FORECAST</span>

            <h1>Rate Forecast</h1>

            <p>
              AI-assisted prediction of future freight rates and
              market movement.
            </p>
          </div>

          <div className="status-badge">
            <span className="status-dot"></span>
            MODEL CONNECTING
          </div>
        </div>

        <div className="card">
          <h2>Loading forecast...</h2>

          <p>
            Fetching the latest freight forecast from the backend.
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <span className="eyebrow">FREIGHT FORECAST</span>

            <h1>Rate Forecast</h1>

            <p>
              AI-assisted prediction of future freight rates and
              market movement.
            </p>
          </div>

          <div className="status-badge">
            <span className="status-dot"></span>
            MODEL OFFLINE
          </div>
        </div>

        <div className="card">
          <h2>Forecast Service Unavailable</h2>

          <p>{error}</p>

          <button
            className="save-button"
            onClick={fetchFreight}
            style={{ marginTop: "20px" }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- DATA ---------------- */

  const forecast = freightData?.forecast || [];

  const currentRate = freightData?.current_rate || 0;

  const forecastMin =
    freightData?.forecast_range?.min || 0;

  const forecastMax =
    freightData?.forecast_range?.max || 0;

  const trend = freightData?.trend || "UNKNOWN";

  const confidence =
    freightData?.confidence || "Unknown";

  const horizon =
    freightData?.horizon_weeks || forecast.length;

  const commodity =
    freightData?.commodity || "Coking Coal";

  const model =
    freightData?.model || "Unknown";

  const backtestMetrics =
    freightData?.backtest_metrics || {};

  const mae = backtestMetrics?.MAE;

  const rmse = backtestMetrics?.RMSE;

  const mape = backtestMetrics?.MAPE;

  const errorStandardDeviation =
    freightData?.error_standard_deviation;

  /* ---------------- MOVEMENT ---------------- */

  const firstRate =
    forecast.length > 0
      ? forecast[0].rate
      : currentRate;

  const lastRate =
    forecast.length > 0
      ? forecast[forecast.length - 1].rate
      : currentRate;

  const movement =
    firstRate > 0
      ? ((lastRate - firstRate) / firstRate) * 100
      : 0;

  /* ---------------- CHART SCALE ---------------- */

  const allRates = forecast.flatMap((item) =>
    [
      Number(item.rate),
      Number(item.lower_bound),
      Number(item.upper_bound),
    ].filter((value) => Number.isFinite(value))
  );

  const chartMax =
    allRates.length > 0
      ? Math.max(...allRates)
      : currentRate;

  const chartMin =
    allRates.length > 0
      ? Math.min(...allRates)
      : currentRate;

  const chartRange =
    chartMax - chartMin || 1;

  return (
    <div className="page">

      {/* ---------------- HEADER ---------------- */}

      <div className="page-header">
        <div>
          <span className="eyebrow">
            FREIGHT FORECAST
          </span>

          <h1>Rate Forecast</h1>

          <p>
            AI-assisted prediction of future freight rates and
            market movement.
          </p>
        </div>

        <div className="status-badge">
          <span className="status-dot"></span>
          MODEL ONLINE
        </div>
      </div>

      {/* ---------------- SUMMARY CARDS ---------------- */}

      <div className="forecast-grid">

        {/* CURRENT FREIGHT */}

        <div className="card">
          <span className="card-label">
            CURRENT FREIGHT
          </span>

          <h2>
            ${Number(currentRate).toFixed(2)}

            <span style={{ fontSize: "14px" }}>
              /t
            </span>
          </h2>

          <p>
            Latest observed freight rate
          </p>
        </div>

        {/* FORECAST RANGE */}

        <div className="card">
          <span className="card-label">
            FORECAST RANGE
          </span>

          <h2>
            ${Number(forecastMin).toFixed(2)} – $
            {Number(forecastMax).toFixed(2)}

            <span style={{ fontSize: "14px" }}>
              /t
            </span>
          </h2>

          <p>
            Expected rate over forecast horizon
          </p>
        </div>

        {/* MARKET TREND */}

        <div className="card">
          <span className="card-label">
            MARKET TREND
          </span>

          <h2
            style={{
              color:
                trend === "RISING"
                  ? "#22c55e"
                  : trend === "FALLING"
                  ? "#ef4444"
                  : "#20b9f3",
            }}
          >
            {trend}{" "}
            {trend === "RISING"
              ? "↗"
              : trend === "FALLING"
              ? "↘"
              : "→"}
          </h2>

          <p>
            Expected change in freight pressure
          </p>
        </div>
      </div>

      {/* ---------------- FORECAST CHART ---------------- */}

      <div className="card">

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              PREDICTED MOVEMENT
            </span>

            <h2>
              Freight Rate Forecast
            </h2>
          </div>

          <div className="forecast-change">
            {movement >= 0 ? "+" : ""}
            {movement.toFixed(1)}%
          </div>
        </div>

        <div className="chart">

          {forecast.map((item) => {

            const rate = Number(item.rate);

            const lowerBound =
              Number(item.lower_bound);

            const upperBound =
              Number(item.upper_bound);

            const height =
              30 +
              ((rate - chartMin) / chartRange) * 60;

            return (
              <div
                className="forecast-bar-container"
                key={item.week}
              >

                {/* Forecast value */}

                <div className="forecast-value">
                  ${rate.toFixed(2)}
                </div>

                {/* Uncertainty information */}

                {Number.isFinite(lowerBound) &&
                  Number.isFinite(upperBound) && (
                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.65,
                        marginBottom: "5px",
                      }}
                    >
                      ${lowerBound.toFixed(2)} – $
                      {upperBound.toFixed(2)}
                    </div>
                  )}

                <div
                  className="forecast-bar"
                  style={{
                    height: `${height}%`,
                  }}
                ></div>

                <div className="forecast-week">
                  {item.week}
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* ---------------- FORECAST DETAILS ---------------- */}

      <div className="forecast-grid">

        {/* HORIZON */}

        <div className="card">
          <span className="card-label">
            FORECAST HORIZON
          </span>

          <h2>
            {horizon} Weeks
          </h2>

          <p>
            Prediction window used by the model.
          </p>
        </div>

        {/* COMMODITY */}

        <div className="card">
          <span className="card-label">
            COMMODITY
          </span>

          <h2>
            {commodity}
          </h2>

          <p>
            Bulk cargo under evaluation.
          </p>
        </div>

        {/* MODEL */}

        <div className="card">
          <span className="card-label">
            FORECAST MODEL
          </span>

          <h2>
            {model}
          </h2>

          <p>
            Model currently used for rate prediction.
          </p>
        </div>

        {/* CONFIDENCE */}

        <div className="card">
          <span className="card-label">
            CONFIDENCE
          </span>

          <h2>
            {confidence}
          </h2>

          <p>
            Forecast confidence based on available data.
          </p>
        </div>
      </div>

      {/* ---------------- UNCERTAINTY ---------------- */}

      <div className="card">

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              FORECAST UNCERTAINTY
            </span>

            <h2>
              Expected Rate Range
            </h2>
          </div>

          <div className="forecast-change">
            ±
            {Number(errorStandardDeviation || 0).toFixed(2)}
          </div>
        </div>

        <p style={{ marginBottom: "20px" }}>
          The model provides an expected rate together with
          an uncertainty range for each forecast week.
        </p>

        <div className="forecast-grid">

          {forecast.map((item) => (
            <div
              className="card"
              key={`uncertainty-${item.week}`}
            >

              <span className="card-label">
                {item.week}
              </span>

              <h2>
                ${Number(item.rate).toFixed(2)}
                <span
                  style={{
                    fontSize: "13px",
                    opacity: 0.65,
                  }}
                >
                  /t
                </span>
              </h2>

              <p>
                Expected range
              </p>

              <strong>
                ${Number(item.lower_bound).toFixed(2)}
                {" – "}
                ${Number(item.upper_bound).toFixed(2)}
              </strong>

              <p style={{ marginTop: "8px" }}>
                Uncertainty: ±
                {Number(item.uncertainty).toFixed(2)}
              </p>

            </div>
          ))}

        </div>
      </div>

      {/* ---------------- MODEL PERFORMANCE ---------------- */}

      <div className="card">

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              MODEL VALIDATION
            </span>

            <h2>
              Backtest Performance
            </h2>
          </div>

        </div>

        <p style={{ marginBottom: "20px" }}>
          Historical walk-forward testing is used to
          measure how closely the forecasting model
          predicted previously observed freight rates.
        </p>

        <div className="forecast-grid">

          {/* MAE */}

          <div className="card">
            <span className="card-label">
              MAE
            </span>

            <h2>
              {mae !== undefined
                ? Number(mae).toFixed(4)
                : "N/A"}
            </h2>

            <p>
              Mean Absolute Error
            </p>
          </div>

          {/* RMSE */}

          <div className="card">
            <span className="card-label">
              RMSE
            </span>

            <h2>
              {rmse !== undefined
                ? Number(rmse).toFixed(4)
                : "N/A"}
            </h2>

            <p>
              Root Mean Squared Error
            </p>
          </div>

          {/* MAPE */}

          <div className="card">
            <span className="card-label">
              MAPE
            </span>

            <h2>
              {mape !== undefined
                ? `${Number(mape).toFixed(2)}%`
                : "N/A"}
            </h2>

            <p>
              Mean Absolute Percentage Error
            </p>
          </div>

          {/* ERROR STD */}

          <div className="card">
            <span className="card-label">
              ERROR STD
            </span>

            <h2>
              {errorStandardDeviation !== undefined
                ? Number(
                    errorStandardDeviation
                  ).toFixed(4)
                : "N/A"}
            </h2>

            <p>
              Historical forecast error variation
            </p>
          </div>

        </div>
      </div>

      {/* ---------------- FORECAST TABLE ---------------- */}

      <div className="card">

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              FORECAST DATA
            </span>

            <h2>
              Weekly Forecast
            </h2>
          </div>

        </div>

        <div
          style={{
            overflowX: "auto",
          }}
        >

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "15px",
            }}
          >

            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                  }}
                >
                  Week
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                  }}
                >
                  Forecast
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                  }}
                >
                  Lower Bound
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                  }}
                >
                  Upper Bound
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                  }}
                >
                  Uncertainty
                </th>
              </tr>
            </thead>

            <tbody>

              {forecast.map((item) => (
                <tr key={`table-${item.week}`}>

                  <td
                    style={{
                      padding: "12px",
                    }}
                  >
                    {item.week}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                    }}
                  >
                    $
                    {Number(item.rate).toFixed(2)}
                    /t
                  </td>

                  <td
                    style={{
                      padding: "12px",
                    }}
                  >
                    $
                    {Number(
                      item.lower_bound
                    ).toFixed(2)}
                    /t
                  </td>

                  <td
                    style={{
                      padding: "12px",
                    }}
                  >
                    $
                    {Number(
                      item.upper_bound
                    ).toFixed(2)}
                    /t
                  </td>

                  <td
                    style={{
                      padding: "12px",
                    }}
                  >
                    ±
                    {Number(
                      item.uncertainty
                    ).toFixed(2)}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      </div>

      {/* ---------------- LAST UPDATE ---------------- */}

      <div className="forecast-grid">

        <div className="card">

          <span className="card-label">
            LAST DATA UPDATE
          </span>

          <h2>
            {freightData?.last_updated
              ? new Date(
                  freightData.last_updated
                ).toLocaleTimeString()
              : "Unknown"}
          </h2>

          <p>
            Latest response received from the backend.
          </p>

        </div>

        <div className="card">

          <span className="card-label">
            DATA SOURCE
          </span>

          <h2>
            Backend Forecast Engine
          </h2>

          <p>
            Forecast generated from the available
            freight observation history.
          </p>

        </div>

      </div>

      {/* ---------------- REFRESH ---------------- */}

      <div className="settings-actions">

        <button
          className="save-button"
          onClick={fetchFreight}
        >
          Refresh Forecast
        </button>

      </div>

    </div>
  );
}

export default FreightForecast;