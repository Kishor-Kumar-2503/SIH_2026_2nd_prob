import { useEffect, useState } from "react";

import {
  Calculator,
  Package,
  Ship,
  CircleDollarSign,
  Landmark,
  Clock3,
  Wallet,
  RefreshCw,
} from "lucide-react";

function LandedCost() {
  // ---------------------------------------------------------
  // INPUTS
  // ---------------------------------------------------------

  const [inputs, setInputs] = useState({
    cargoQuantity: 500000,
    fobPrice: 100,
    freightRate: 27.4,
    portCharges: 500000,
    demurrage: 200000,
    financingCost: 300000,
  });

  // ---------------------------------------------------------
  // LANDED COST RESULT
  // ---------------------------------------------------------

  const [result, setResult] = useState({
    procurementCost: 0,
    freightCost: 0,
    operationalCost: 0,
    financingCost: 0,
    totalLandedCost: 0,
    landedCostPerTonne: 0,
    charterCost: 0,
    recommendedVessel: "Not selected",
    allInDecisionCost: 0,
    allInCostPerTonne: 0,
    scenarios: {
      market_freight: {
        transport_type: "Market Freight",
        freight_rate: 0,
        freight_cost: 0,
        total_cost: 0,
        cost_per_tonne: 0,
      },
      charter: {
        transport_type: "Vessel Charter",
        vessel: "Not selected",
        charter_cost: 0,
        total_cost: 0,
        cost_per_tonne: 0,
      },
    },
    comparison: {
      decision: "Pending",
      difference: 0,
      difference_per_tonne: 0,
      decision_reason: "",
    },
  });

  // ---------------------------------------------------------
  // FREIGHT + CHARTER DATA
  // ---------------------------------------------------------

  const [freightInfo, setFreightInfo] = useState(null);
  const [charterInfo, setCharterInfo] = useState(null);
  const [procurementInfo, setProcurementInfo] = useState(null);

  // ---------------------------------------------------------
  // STATES
  // ---------------------------------------------------------

  const [loading, setLoading] = useState(false);
  const [freightLoading, setFreightLoading] = useState(false);
  const [procurementLoading, setProcurementLoading] = useState(false);

  const [error, setError] = useState("");
  const [freightError, setFreightError] = useState("");
  const [procurementError, setProcurementError] = useState("");

  const API_URL = "http://127.0.0.1:8000";

  // =========================================================
  // FETCH CHARTER DECISION
  // =========================================================

  const fetchCharterDecision = async (
    quantity = inputs.cargoQuantity
  ) => {
    try {
      const shipmentData = {
        origin: "Australia",
        destination: "East Coast India",
        commodity: "Coking Coal",
        quantity: Number(quantity),
      };

      console.log(
        "Requesting charter decision:",
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
          "Charter API error:",
          errorText
        );

        throw new Error(
          `Charter API returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Charter Decision API:",
        data
      );

      setCharterInfo(data);

      return data;
    } catch (err) {
      console.error(
        "Charter Decision Error:",
        err
      );

      setCharterInfo(null);

      return null;
    }
  };

  // =========================================================
  // FETCH PROCUREMENT DECISION
  // =========================================================

  const fetchProcurementDecision = async (
    currentInputs = inputs
  ) => {
    try {
      setProcurementLoading(true);
      setProcurementError("");

      const requestData = {
        cargo_quantity: Number(currentInputs.cargoQuantity),
        fob_price: Number(currentInputs.fobPrice),
        port_charges: Number(currentInputs.portCharges),
        demurrage: Number(currentInputs.demurrage),
        financing_cost: Number(currentInputs.financingCost),
        partial_ratio: 0.5,
      };

      console.log(
        "Requesting procurement decision:",
        requestData
      );

      const response = await fetch(
        `${API_URL}/api/procurement-decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Procurement API error:",
          errorText
        );

        throw new Error(
          `Procurement API returned ${response.status}`
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(
          data.error || "Procurement decision failed."
        );
      }

      console.log(
        "Procurement Decision API:",
        data
      );

      setProcurementInfo(data);

      return data;
    } catch (err) {
      console.error(
        "Procurement Decision Error:",
        err
      );

      setProcurementInfo(null);

      setProcurementError(
        "Unable to load the procurement decision."
      );

      return null;
    } finally {
      setProcurementLoading(false);
    }
  };

  // =========================================================
  // CALCULATE LANDED COST
  // =========================================================

  const calculateCost = async (
    currentInputs,
    currentCharterInfo = charterInfo
  ) => {
    try {
      setLoading(true);
      setError("");

      const recommendedVessel =
        currentCharterInfo?.recommended_vessel;

      const requestData = {
        cargo_quantity: Number(
          currentInputs.cargoQuantity
        ),

        fob_price: Number(
          currentInputs.fobPrice
        ),

        freight_rate: Number(
          currentInputs.freightRate
        ),

        port_charges: Number(
          currentInputs.portCharges
        ),

        demurrage: Number(
          currentInputs.demurrage
        ),

        financing_cost: Number(
          currentInputs.financingCost
        ),

        charter_cost: Number(
          recommendedVessel?.charter_cost || 0
        ),

        recommended_vessel:
          recommendedVessel?.name ||
          "Not selected",
      };

      console.log(
        "Sending landed cost request:",
        requestData
      );

      const response = await fetch(
        `${API_URL}/api/landed-cost`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Landed cost backend error:",
          errorText
        );

        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Landed Cost API:",
        data
      );

      setResult({
        procurementCost:
          data.procurementCost || 0,

        freightCost:
          data.freightCost || 0,

        operationalCost:
          data.operationalCost || 0,

        financingCost:
          data.financingCost || 0,

        totalLandedCost:
          data.totalLandedCost || 0,

        landedCostPerTonne:
          data.landedCostPerTonne || 0,

        charterCost:
          data.charterCost || 0,

        recommendedVessel:
          data.recommendedVessel ||
          "Not selected",

        allInDecisionCost:
          data.allInDecisionCost || 0,

        allInCostPerTonne:
          data.allInCostPerTonne || 0,

        scenarios: {
          market_freight: {
            transport_type:
              data.scenarios?.market_freight?.transport_type ||
              "Market Freight",
            freight_rate:
              data.scenarios?.market_freight?.freight_rate || 0,
            freight_cost:
              data.scenarios?.market_freight?.freight_cost || 0,
            total_cost:
              data.scenarios?.market_freight?.total_cost || 0,
            cost_per_tonne:
              data.scenarios?.market_freight?.cost_per_tonne || 0,
          },
          charter: {
            transport_type:
              data.scenarios?.charter?.transport_type ||
              "Vessel Charter",
            vessel:
              data.scenarios?.charter?.vessel ||
              data.recommendedVessel ||
              "Not selected",
            charter_cost:
              data.scenarios?.charter?.charter_cost ||
              data.charterCost ||
              0,
            total_cost:
              data.scenarios?.charter?.total_cost ||
              data.allInDecisionCost ||
              0,
            cost_per_tonne:
              data.scenarios?.charter?.cost_per_tonne ||
              data.allInCostPerTonne ||
              0,
          },
        },

        comparison: {
          decision:
            data.comparison?.decision || "Pending",
          difference:
            data.comparison?.difference || 0,
          difference_per_tonne:
            data.comparison?.difference_per_tonne || 0,
          decision_reason:
            data.comparison?.decision_reason || "",
        },
      });
    } catch (err) {
      console.error(
        "Landed Cost Error:",
        err
      );

      setError(
        "Unable to connect to the landed cost service."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIALIZE COST ENGINE
  // =========================================================

  const initializeCostEngine = async () => {
    try {
      setFreightLoading(true);
      setFreightError("");

      // -----------------------------------------------------
      // 1. Get freight forecast
      // -----------------------------------------------------

      const freightResponse = await fetch(
        `${API_URL}/api/freight`
      );

      if (!freightResponse.ok) {
        throw new Error(
          `Freight API returned ${freightResponse.status}`
        );
      }

      const freightData =
        await freightResponse.json();

      console.log(
        "Initial Freight API:",
        freightData
      );

      const currentRate =
        Number(freightData.current_rate);

      setFreightInfo(freightData);

      // -----------------------------------------------------
      // 2. Get charter decision
      // -----------------------------------------------------

      const charterData =
        await fetchCharterDecision(
          inputs.cargoQuantity
        );

      // -----------------------------------------------------
      // 3. Update freight input
      // -----------------------------------------------------

      const updatedInputs = {
        ...inputs,
        freightRate: currentRate,
      };

      setInputs(updatedInputs);

      // -----------------------------------------------------
      // 4. Calculate landed cost
      // -----------------------------------------------------

      await calculateCost(
        updatedInputs,
        charterData
      );

      // -----------------------------------------------------
      // 5. Get procurement decision
      // -----------------------------------------------------

      await fetchProcurementDecision(
        updatedInputs
      );
    } catch (err) {
      console.error(
        "Cost Engine Initialization Error:",
        err
      );

      setFreightError(
        "Unable to initialize the cost engine."
      );
    } finally {
      setFreightLoading(false);
    }
  };

  // =========================================================
  // REFRESH FREIGHT RATE
  // =========================================================

  const fetchFreightRate = async () => {
    try {
      setFreightLoading(true);
      setFreightError("");

      const response = await fetch(
        `${API_URL}/api/freight`
      );

      if (!response.ok) {
        throw new Error(
          `Freight API returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Freight Forecast API:",
        data
      );

      const currentRate =
        Number(data.current_rate);

      setFreightInfo(data);

      const updatedInputs = {
        ...inputs,
        freightRate: currentRate,
      };

      setInputs(updatedInputs);

      // Recalculate using the latest freight rate
      // and the current charter decision.
      await calculateCost(
        updatedInputs,
        charterInfo
      );

      await fetchProcurementDecision(
        updatedInputs
      );
    } catch (err) {
      console.error(
        "Freight API Error:",
        err
      );

      setFreightError(
        "Unable to load the latest freight rate."
      );
    } finally {
      setFreightLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    initializeCostEngine();
  }, []);

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  function handleChange(event) {
    const { name, value } = event.target;

    const updatedInputs = {
      ...inputs,
      [name]: Number(value),
    };

    setInputs(updatedInputs);

    // -------------------------------------------------------
    // If cargo quantity changes, the vessel decision needs
    // to be recalculated because vessel loads can change.
    // -------------------------------------------------------

    if (name === "cargoQuantity") {
      fetchCharterDecision(
        Number(value)
      ).then(async (newCharterData) => {
        await calculateCost(
          updatedInputs,
          newCharterData
        );

        await fetchProcurementDecision(
          updatedInputs
        );
      });
    } else {
      // Other cost changes don't require a new vessel
      // decision, but they do affect procurement scenarios.
      calculateCost(
        updatedInputs,
        charterInfo
      ).then(() => {
        fetchProcurementDecision(
          updatedInputs
        );
      });
    }
  }

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  function formatMoney(value) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="calculator-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="calculator-header">

        <div>

          <div className="eyebrow">
            <Calculator size={14} />
            COST ENGINE
          </div>

          <h1>
            Landed Cost Calculator
          </h1>

          <p>
            Calculate the complete delivered cost
            of imported bulk cargo.
          </p>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="calculator-grid">

        <div className="calculator-left-column">
        {/* =================================================
            INPUT PANEL
        ================================================= */}

        <section className="panel calculator-input-panel">

          <div className="panel-header">

            <div>

              <span className="panel-label">
                SHIPMENT PARAMETERS
              </span>

              <h2>
                Cost Inputs
              </h2>

            </div>

          </div>

          <div className="input-grid">

            {/* ---------------------------------------------
                CARGO QUANTITY
            --------------------------------------------- */}

            <div className="input-group">

              <label>
                <Package size={14} />
                Cargo Quantity
              </label>

              <div className="input-wrapper">

                <input
                  type="number"
                  name="cargoQuantity"
                  value={inputs.cargoQuantity}
                  onChange={handleChange}
                  min="1"
                />

                <span>
                  tonnes
                </span>

              </div>

            </div>

            {/* ---------------------------------------------
                FOB PRICE
            --------------------------------------------- */}

            <div className="input-group">

              <label>
                <CircleDollarSign size={14} />
                FOB Price
              </label>

              <div className="input-wrapper">

                <span>
                  $
                </span>

                <input
                  type="number"
                  name="fobPrice"
                  value={inputs.fobPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />

                <span>
                  /t
                </span>

              </div>

            </div>

            {/* ---------------------------------------------
                FREIGHT RATE
            --------------------------------------------- */}

            <div className="input-group">

              <label>
                <Ship size={14} />
                Freight Rate
              </label>

              <div className="input-wrapper">

                <span>
                  $
                </span>

                <input
                  type="number"
                  step="0.1"
                  name="freightRate"
                  value={inputs.freightRate}
                  readOnly
                />

                <span>
                  /t
                </span>

              </div>

              {freightInfo && (
                <div className="freight-source">

                  <span className="status-dot"></span>

                  <span>
                    Live from Freight Forecast
                  </span>

                  <button
                    type="button"
                    onClick={fetchFreightRate}
                    disabled={freightLoading}
                    title="Refresh freight rate"
                  >
                    <RefreshCw
                      size={13}
                      className={
                        freightLoading
                          ? "spin"
                          : ""
                      }
                    />
                  </button>

                </div>
              )}

              {freightError && (
                <div className="freight-error">
                  {freightError}
                </div>
              )}

            </div>

            {/* ---------------------------------------------
                PORT CHARGES
            --------------------------------------------- */}

            <div className="input-group">

              <label>
                <Landmark size={14} />
                Port Charges
              </label>

              <div className="input-wrapper">

                <span>
                  $
                </span>

                <input
                  type="number"
                  name="portCharges"
                  value={inputs.portCharges}
                  onChange={handleChange}
                  min="0"
                />

              </div>

            </div>

            {/* ---------------------------------------------
                DEMURRAGE
            --------------------------------------------- */}

            <div className="input-group">

              <label>
                <Clock3 size={14} />
                Expected Demurrage
              </label>

              <div className="input-wrapper">

                <span>
                  $
                </span>

                <input
                  type="number"
                  name="demurrage"
                  value={inputs.demurrage}
                  onChange={handleChange}
                  min="0"
                />

              </div>

            </div>

            {/* ---------------------------------------------
                FINANCING
            --------------------------------------------- */}

            <div className="input-group">

              <label>
                <Wallet size={14} />
                Financing / Inventory
              </label>

              <div className="input-wrapper">

                <span>
                  $
                </span>

                <input
                  type="number"
                  name="financingCost"
                  value={inputs.financingCost}
                  onChange={handleChange}
                  min="0"
                />

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RESULTS PANEL
        ================================================= */}

          {/* =================================================
              PROCUREMENT DECISION
          ================================================= */}

          {procurementInfo && (
            <div className="decision-summary procurement-decision-panel">

              <div className="decision-summary-header">
                <div>
                  <span className="panel-label">
                    PROCUREMENT INTELLIGENCE
                  </span>

                  <h3>
                    {procurementInfo.procurement?.decision?.label ||
                      "Procurement Decision"}
                  </h3>
                </div>

                <span className="status-badge">
                  {procurementLoading
                    ? "UPDATING"
                    : procurementInfo.procurement?.decision?.signal ||
                      "CONNECTED"}
                </span>
              </div>

              <div className="decision-summary-grid">

                <div>
                  <span>Current Freight</span>
                  <strong>
                    $
                    {Number(
                      procurementInfo.procurement?.market?.current_freight_rate || 0
                    ).toFixed(2)}
                    /t
                  </strong>
                </div>

                <div>
                  <span>Final Forecast</span>
                  <strong>
                    $
                    {Number(
                      procurementInfo.procurement?.market?.final_forecast_rate || 0
                    ).toFixed(2)}
                    /t
                  </strong>
                </div>

                <div>
                  <span>Forecast Movement</span>
                  <strong>
                    {Number(
                      procurementInfo.procurement?.market?.forecast_delta || 0
                    ) >= 0
                      ? "+"
                      : ""}
                    $
                    {Number(
                      procurementInfo.procurement?.market?.forecast_delta || 0
                    ).toFixed(2)}
                    /t
                  </strong>
                </div>

                <div>
                  <span>Max Uncertainty</span>
                  <strong>
                    ±$
                    {Number(
                      procurementInfo.procurement?.market?.max_uncertainty || 0
                    ).toFixed(2)}
                    /t
                  </strong>
                </div>

              </div>

              <p className="decision-reason">
                {procurementInfo.procurement?.decision?.reason ||
                  "Procurement timing signal generated by the decision engine."}
              </p>

            </div>
          )}

          {procurementError && (
            <div className="error-message">
              {procurementError}
            </div>
          )}

          {procurementInfo && (
            <div className="scenario-grid procurement-scenario-grid">

              {/* BUY NOW */}
              <div className="scenario-card">

                <div className="scenario-card-header">
                  <div>
                    <span className="panel-label">
                      SCENARIO 01
                    </span>

                    <h3>Buy Now</h3>
                  </div>

                  <CircleDollarSign size={20} />
                </div>

                <div className="scenario-main-value">
                  {formatMoney(
                    procurementInfo.procurement?.scenarios?.buy_now?.total_cost
                  )}
                </div>

                <div className="scenario-per-tonne">
                  $
                  {Number(
                    procurementInfo.procurement?.scenarios?.buy_now?.cost_per_tonne || 0
                  ).toFixed(2)}
                  / tonne
                </div>

                <div className="scenario-details">
                  <div>
                    <span>Freight Rate</span>
                    <strong>
                      $
                      {Number(
                        procurementInfo.procurement?.scenarios?.buy_now?.freight_rate || 0
                      ).toFixed(2)}
                      /t
                    </strong>
                  </div>

                  <div>
                    <span>Timing</span>
                    <strong>
                      Current market
                    </strong>
                  </div>
                </div>

              </div>

              {/* WAIT */}
              <div className="scenario-card">

                <div className="scenario-card-header">
                  <div>
                    <span className="panel-label">
                      SCENARIO 02
                    </span>

                    <h3>Wait</h3>
                  </div>

                  <Clock3 size={20} />
                </div>

                <div className="scenario-main-value">
                  {formatMoney(
                    procurementInfo.procurement?.scenarios?.wait?.total_cost
                  )}
                </div>

                <div className="scenario-per-tonne">
                  $
                  {Number(
                    procurementInfo.procurement?.scenarios?.wait?.cost_per_tonne || 0
                  ).toFixed(2)}
                  / tonne
                </div>

                <div className="scenario-details">
                  <div>
                    <span>Freight Rate</span>
                    <strong>
                      $
                      {Number(
                        procurementInfo.procurement?.scenarios?.wait?.freight_rate || 0
                      ).toFixed(2)}
                      /t
                    </strong>
                  </div>

                  <div>
                    <span>Timing</span>
                    <strong>
                      Final forecast
                    </strong>
                  </div>
                </div>

              </div>

              {/* PARTIAL */}
              <div className="scenario-card">

                <div className="scenario-card-header">
                  <div>
                    <span className="panel-label">
                      SCENARIO 03
                    </span>

                    <h3>Partial</h3>
                  </div>

                  <Package size={20} />
                </div>

                <div className="scenario-main-value">
                  {formatMoney(
                    procurementInfo.procurement?.scenarios?.partial?.total_cost
                  )}
                </div>

                <div className="scenario-per-tonne">
                  $
                  {Number(
                    procurementInfo.procurement?.scenarios?.partial?.cost_per_tonne || 0
                  ).toFixed(2)}
                  / tonne
                </div>

                <div className="scenario-details">
                  <div>
                    <span>Split</span>
                    <strong>
                      {(
                        Number(
                          procurementInfo.procurement?.scenarios?.partial?.partial_ratio || 0.5
                        ) * 100
                      ).toFixed(0)}
                      /{(
                        100 -
                        Number(
                          procurementInfo.procurement?.scenarios?.partial?.partial_ratio || 0.5
                        ) * 100
                      ).toFixed(0)}
                      %
                    </strong>
                  </div>

                  <div>
                    <span>Timing</span>
                    <strong>
                      Current + later
                    </strong>
                  </div>
                </div>

              </div>

              {/* RISK ADJUSTED WAIT */}
              <div className="scenario-card charter-scenario">

                <div className="scenario-card-header">
                  <div>
                    <span className="panel-label">
                      SCENARIO 04
                    </span>

                    <h3>Risk-Adjusted Wait</h3>
                  </div>

                  <Wallet size={20} />
                </div>

                <div className="scenario-main-value">
                  {formatMoney(
                    procurementInfo.procurement?.scenarios?.risk_adjusted_wait?.total_cost
                  )}
                </div>

                <div className="scenario-per-tonne">
                  $
                  {Number(
                    procurementInfo.procurement?.scenarios?.risk_adjusted_wait?.cost_per_tonne || 0
                  ).toFixed(2)}
                  / tonne
                </div>

                <div className="scenario-details">
                  <div>
                    <span>Rate Basis</span>
                    <strong>
                      Forecast + uncertainty
                    </strong>
                  </div>

                  <div>
                    <span>Timing</span>
                    <strong>
                      Risk-adjusted
                    </strong>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =================================================
              PROCUREMENT + CHARTER CONTEXT
          ================================================= */}

          {procurementInfo?.charter_context && (
            <div className="freight-intelligence">

              <div className="freight-intelligence-header">

                <span>
                  PROCUREMENT + CHARTER CONTEXT
                </span>

                <span className="status-badge">
                  CONNECTED
                </span>

              </div>

              <div className="freight-intelligence-grid">

                <div>
                  <span>Recommended Vessel</span>
                  <strong>
                    {procurementInfo.procurement?.charter_context.recommended_vessel ||
                      "Not selected"}
                  </strong>
                </div>

                <div>
                  <span>Charter Cost</span>
                  <strong>
                    {formatMoney(
                      procurementInfo.procurement?.charter_context.charter_cost
                    )}
                  </strong>
                </div>

                <div>
                  <span>Charter All-In Cost</span>
                  <strong>
                    {formatMoney(
                      procurementInfo.procurement?.charter_context.all_in_cost
                    )}
                  </strong>
                </div>

                <div>
                  <span>Difference vs Buy Now</span>
                  <strong>
                    {formatMoney(
                      procurementInfo.procurement?.charter_context.difference_vs_buy_now
                    )}
                  </strong>
                </div>

              </div>

            </div>
          )}

        </div>

        <section className="panel results-panel">

          <span className="panel-label">
            CALCULATION RESULT
          </span>

          <h2>
            Estimated Landed Cost
          </h2>

          {/* =================================================
              SCENARIO COMPARISON
          ================================================= */}

          <div className="scenario-grid">

            {/* MARKET FREIGHT SCENARIO */}
            <div className="scenario-card">

              <div className="scenario-card-header">
                <div>
                  <span className="panel-label">
                    MARKET SCENARIO
                  </span>

                  <h3>Market Freight</h3>
                </div>

                <Ship size={20} />
              </div>

              <div className="scenario-main-value">
                {loading
                  ? "Calculating..."
                  : formatMoney(
                      result.scenarios.market_freight.total_cost
                    )}
              </div>

              <div className="scenario-per-tonne">
                {loading
                  ? "..."
                  : `$${Number(
                      result.scenarios.market_freight.cost_per_tonne
                    ).toFixed(2)} / tonne`}
              </div>

              <div className="scenario-details">
                <div>
                  <span>Freight Rate</span>
                  <strong>
                    ${Number(
                      result.scenarios.market_freight.freight_rate
                    ).toFixed(2)}/t
                  </strong>
                </div>

                <div>
                  <span>Freight Cost</span>
                  <strong>
                    {formatMoney(
                      result.scenarios.market_freight.freight_cost
                    )}
                  </strong>
                </div>
              </div>

            </div>

            {/* CHARTER SCENARIO */}
            <div className="scenario-card charter-scenario">

              <div className="scenario-card-header">
                <div>
                  <span className="panel-label">
                    CHARTER SCENARIO
                  </span>

                  <h3>Vessel Charter</h3>
                </div>

                <Ship size={20} />
              </div>

              <div className="scenario-main-value">
                {loading
                  ? "Calculating..."
                  : formatMoney(
                      result.scenarios.charter.total_cost
                    )}
              </div>

              <div className="scenario-per-tonne">
                {loading
                  ? "..."
                  : `$${Number(
                      result.scenarios.charter.cost_per_tonne
                    ).toFixed(2)} / tonne`}
              </div>

              <div className="scenario-details">
                <div>
                  <span>Recommended Vessel</span>
                  <strong>
                    {result.scenarios.charter.vessel}
                  </strong>
                </div>

                <div>
                  <span>Charter Cost</span>
                  <strong>
                    {formatMoney(
                      result.scenarios.charter.charter_cost
                    )}
                  </strong>
                </div>
              </div>

            </div>

          </div>

          {/* =================================================
              DECISION SUMMARY
          ================================================= */}

          {charterInfo && (
            <div className="decision-summary">

              <div className="decision-summary-header">
                <div>
                  <span className="panel-label">
                    SCENARIO COMPARISON
                  </span>

                  <h3>
                    {result.comparison.decision} Scenario
                  </h3>
                </div>

                <span className="status-badge">
                  DECISION ENGINE
                </span>
              </div>

              <div className="decision-summary-grid">

                <div>
                  <span>Market Cost / Tonne</span>
                  <strong>
                    $
                    {Number(
                      result.scenarios.market_freight.cost_per_tonne
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Charter Cost / Tonne</span>
                  <strong>
                    $
                    {Number(
                      result.scenarios.charter.cost_per_tonne
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Difference / Tonne</span>
                  <strong>
                    $
                    {Number(
                      result.comparison.difference_per_tonne
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Total Difference</span>
                  <strong>
                    {formatMoney(
                      result.comparison.difference
                    )}
                  </strong>
                </div>

              </div>

              <p className="decision-reason">
                {result.comparison.decision_reason ||
                  "Scenario comparison generated by the landed cost engine."}
              </p>

            </div>
          )}

          {/* =================================================
              COST BREAKDOWN
          ================================================= */}

          <div className="cost-breakdown">

            <div>
              <span>Procurement</span>
              <strong>
                {formatMoney(result.procurementCost)}
              </strong>
            </div>

            <div>
              <span>Market Freight</span>
              <strong>
                {formatMoney(
                  result.scenarios.market_freight.freight_cost
                )}
              </strong>
            </div>

            <div>
              <span>Port + Demurrage</span>
              <strong>
                {formatMoney(result.operationalCost)}
              </strong>
            </div>

            <div>
              <span>Financing</span>
              <strong>
                {formatMoney(result.financingCost)}
              </strong>
            </div>

          </div>

          {/* =================================================
              FREIGHT INTELLIGENCE
          ================================================= */}

          {freightInfo && (
            <div className="freight-intelligence">

              <div className="freight-intelligence-header">

                <span>
                  FREIGHT INTELLIGENCE
                </span>

                <span className="status-badge">
                  {freightInfo.trend}
                </span>

              </div>

              <div className="freight-intelligence-grid">

                <div>
                  <span>Current Rate</span>
                  <strong>
                    $
                    {Number(
                      freightInfo.current_rate
                    ).toFixed(2)}
                    /t
                  </strong>
                </div>

                <div>
                  <span>Forecast Range</span>
                  <strong>
                    $
                    {freightInfo.forecast_range?.min}
                    -
                    $
                    {freightInfo.forecast_range?.max}
                  </strong>
                </div>

                <div>
                  <span>Model</span>
                  <strong>
                    {freightInfo.model || "Model-based"}
                  </strong>
                </div>

                <div>
                  <span>Confidence</span>
                  <strong>
                    {freightInfo.confidence}
                  </strong>
                </div>

              </div>

            </div>
          )}

          {/* =================================================
              CHARTER DECISION
          ================================================= */}

          {charterInfo && (
            <div className="freight-intelligence">

              <div className="freight-intelligence-header">

                <span>
                  CHARTER DECISION
                </span>

                <span className="status-badge">
                  CONNECTED
                </span>

              </div>

              <div className="freight-intelligence-grid">

                <div>
                  <span>Recommended Vessel</span>
                  <strong>
                    {result.recommendedVessel}
                  </strong>
                </div>

                <div>
                  <span>Charter Cost</span>
                  <strong>
                    {formatMoney(result.charterCost)}
                  </strong>
                </div>

                <div>
                  <span>Loads Required</span>
                  <strong>
                    {charterInfo
                      ?.recommended_vessel
                      ?.loads_required ?? "-"}
                  </strong>
                </div>

                <div>
                  <span>Overall Score</span>
                  <strong>
                    {charterInfo
                      ?.recommended_vessel
                      ?.overall_score ?? "-"}
                  </strong>
                </div>

              </div>

            </div>
          )}

          {/* =================================================
              BACKEND STATUS
          ================================================= */}

          <div className="backend-status">

            {loading || procurementLoading
              ? "Calculating via Charter Compass decision backend..."
              : "Freight + Charter + Procurement linked through Charter Compass backend"}

          </div>

        </section>

      </div>

    </div>
  );
}

export default LandedCost;