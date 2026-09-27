from fastapi import FastAPI, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import math
import csv
import io
from sqlalchemy.orm import Session

from database import SessionLocal, get_db

from models import (
    Vessel,
    Port,
    FreightObservation,
    FreightForecast,
    Shipment,
    CharterDecision,
    DecisionAudit,
)

from freight_forecasting import forecast_freight
from freight_uncertainty import generate_uncertainty_forecast
from procurement_engine import calculate_procurement_decision


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(title="Charter Compass API")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class ShipmentRequest(BaseModel):
    origin: str = "Australia"
    destination: str = "East Coast India"
    commodity: str = "Coking Coal"
    quantity: int = 500000


class LandedCostRequest(BaseModel):
    cargo_quantity: float = 500000
    fob_price: float = 100
    freight_rate: float = 27.4
    port_charges: float = 500000
    demurrage: float = 200000
    financing_cost: float = 300000
    charter_cost: float = 0
    recommended_vessel: str = "Not selected"


class ProcurementDecisionRequest(BaseModel):
    cargo_quantity: float = 500000
    fob_price: float = 100
    port_charges: float = 500000
    demurrage: float = 200000
    financing_cost: float = 300000
    partial_ratio: float = 0.50


# ============================================================
# LEGACY DEMO FREIGHT FORECAST
# ============================================================
# Kept for compatibility.
# The actual /api/freight endpoint now uses the
# forecasting engine below.

def get_freight_forecast():

    forecast = [
        {"week": "W1", "rate": 27.4},
        {"week": "W2", "rate": 27.8},
        {"week": "W3", "rate": 28.2},
        {"week": "W4", "rate": 28.7},
        {"week": "W5", "rate": 29.1},
        {"week": "W6", "rate": 29.8},
    ]

    return {
        "commodity": "Coking Coal",
        "currency": "USD",
        "unit": "tonne",
        "current_rate": 27.40,
        "forecast_range": {
            "min": 29,
            "max": 31,
        },
        "trend": "RISING",
        "confidence": "Medium",
        "horizon_weeks": 6,
        "forecast": forecast,
        "last_updated": datetime.now().isoformat(),
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health_check():

    return {
        "status": "online",
        "system": "Charter Compass",
    }


# ============================================================
# FREIGHT API
# ============================================================
# NEW:
# Uses the actual forecasting engine and uncertainty engine.
#
# Historical DB
#      ↓
# preprocessing
#      ↓
# forecasting
#      ↓
# uncertainty
#      ↓
# /api/freight
# ============================================================

@app.get("/api/freight")
def get_freight():

    try:

        result = generate_uncertainty_forecast()

        if result.get("status") != "success":

            return {
                "error": result.get(
                    "message",
                    "Freight forecasting failed"
                )
            }

        forecast_data = []

        for item in result["forecast"]:

            forecast_data.append(
                {
                    "week": item["week"],
                    "rate": item["forecast"],
                    "lower_bound": item["lower_bound"],
                    "upper_bound": item["upper_bound"],
                    "uncertainty": item["uncertainty"],
                }
            )

        rates = [
            item["forecast"]
            for item in result["forecast"]
        ]

        return {

            "commodity":
                result["commodity"],

            "currency":
                result["currency"],

            "unit":
                result["unit"],

            "current_rate":
                result["latest_rate"],

            "forecast_range": {
                "min": min(rates),
                "max": max(rates),
            },

            "trend":
                result["trend"],

            "confidence":
                "Model-based",

            "horizon_weeks":
                len(forecast_data),

            "forecast":
                forecast_data,

            "model":
                result["model"],

            "backtest_metrics":
                result["backtest_metrics"],

            "error_standard_deviation":
                result["error_standard_deviation"],

            "last_updated":
                datetime.now().isoformat(),
        }

    except Exception as error:

        return {
            "error":
                f"Freight forecasting error: {str(error)}"
        }


# ============================================================
# HISTORICAL FREIGHT API
# ============================================================

@app.get("/api/freight/history")
def get_freight_history(
    db: Session = Depends(get_db)
):

    observations = (
        db.query(FreightObservation)
        .filter(
            FreightObservation.commodity == "Coking Coal"
        )
        .order_by(
            FreightObservation.observation_time.asc()
        )
        .all()
    )

    return {
        "commodity": "Coking Coal",
        "currency": "USD",
        "unit": "tonne",

        "observations": [

            {
                "date":
                    observation.observation_time.isoformat(),

                "rate":
                    observation.rate,

                "source":
                    observation.source,
            }

            for observation in observations
        ],

        "total":
            len(observations),
    }


# ============================================================
# FREIGHT CSV IMPORT API
# ============================================================

@app.post("/api/freight/import")
async def import_freight_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import Coking Coal freight observations from a CSV file.

    Required columns:
        date,rate,source
    """

    try:
        if not file.filename or not file.filename.lower().endswith(".csv"):
            return {
                "status": "error",
                "message": "Only CSV files are supported."
            }

        contents = await file.read()
        text_content = contents.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text_content))

        if not reader.fieldnames:
            return {
                "status": "error",
                "message": "CSV file has no header row."
            }

        reader.fieldnames = [
            column.strip().lower()
            for column in reader.fieldnames
        ]

        required_columns = {"date", "rate", "source"}
        missing_columns = required_columns - set(reader.fieldnames)

        if missing_columns:
            return {
                "status": "error",
                "message": (
                    "Missing required columns: "
                    + ", ".join(sorted(missing_columns))
                )
            }

        imported = 0
        skipped = 0
        errors = []

        for row_number, row in enumerate(reader, start=2):
            try:
                normalized_row = {
                    str(key).strip().lower(): (
                        value.strip()
                        if isinstance(value, str)
                        else value
                    )
                    for key, value in row.items()
                }

                date_value = normalized_row.get("date")
                rate_value = normalized_row.get("rate")
                source_value = normalized_row.get("source") or "CSV Import"

                if not date_value:
                    raise ValueError("Missing date.")
                if rate_value in (None, ""):
                    raise ValueError("Missing rate.")

                try:
                    observation_time = datetime.fromisoformat(str(date_value))
                except ValueError:
                    observation_time = datetime.strptime(
                        str(date_value), "%Y-%m-%d"
                    )

                rate = float(rate_value)

                if rate < 0:
                    raise ValueError("Freight rate cannot be negative.")

                existing = (
                    db.query(FreightObservation)
                    .filter(
                        FreightObservation.commodity == "Coking Coal",
                        FreightObservation.observation_time == observation_time
                    )
                    .first()
                )

                if existing:
                    skipped += 1
                    continue

                db.add(
                    FreightObservation(
                        commodity="Coking Coal",
                        rate=rate,
                        currency="USD",
                        unit="tonne",
                        source=str(source_value),
                        observation_time=observation_time
                    )
                )
                imported += 1

            except Exception as row_error:
                skipped += 1
                errors.append({
                    "row": row_number,
                    "error": str(row_error)
                })

        db.commit()

        return {
            "status": "success",
            "filename": file.filename,
            "imported": imported,
            "skipped": skipped,
            "errors": errors,
            "message": (
                f"Successfully imported {imported} "
                f"freight observations."
            )
        }

    except UnicodeDecodeError:
        db.rollback()
        return {
            "status": "error",
            "message": (
                "Unable to read CSV. Please save the file as UTF-8 CSV."
            )
        }

    except Exception as error:
        db.rollback()
        return {
            "status": "error",
            "message": str(error)
        }


# ============================================================
# FREIGHT DATA RESET API
# ============================================================

@app.post("/api/freight/reset")
def reset_freight_data(
    confirm: bool = False,
    db: Session = Depends(get_db)
):
    """
    Clear all stored Coking Coal freight observations.

    This is intended for prototype data replacement:
        1. Call this endpoint with confirm=true.
        2. Upload the clean real-data CSV using /api/freight/import.
    """

    if not confirm:
        return {
            "status": "error",
            "message": (
                "Reset not performed. Set the query parameter "
                "confirm=true to permanently clear Coking Coal "
                "freight observations."
            )
        }

    try:
        deleted = (
            db.query(FreightObservation)
            .filter(FreightObservation.commodity == "Coking Coal")
            .delete(synchronize_session=False)
        )

        db.commit()

        return {
            "status": "success",
            "deleted": deleted,
            "message": (
                f"Cleared {deleted} Coking Coal freight observations. "
                "The database is ready for clean real-data import."
            )
        }

    except Exception as error:
        db.rollback()

        return {
            "status": "error",
            "message": str(error)
        }


# ============================================================
# VESSEL API
# ============================================================

@app.get("/api/vessels")
def get_vessels():

    db = SessionLocal()

    try:

        vessels = (
            db.query(Vessel)
            .order_by(Vessel.id)
            .all()
        )

        vessel_data = []

        for vessel in vessels:

            vessel_data.append(
                {
                    "id":
                        vessel.id,

                    "name":
                        vessel.name,

                    "type":
                        vessel.vessel_type,

                    "capacity":
                        f"{int(vessel.capacity):,} DWT",

                    "location":
                        vessel.location,

                    "daily_rate":
                        vessel.daily_rate,

                    "status":
                        vessel.status,
                }
            )

        return {

            "vessels":
                vessel_data,

            "total":
                len(vessel_data),

            "last_updated":
                datetime.now().isoformat(),
        }

    finally:

        db.close()


# ============================================================
# PORT API
# ============================================================

@app.get("/api/ports")
def get_ports():

    db = SessionLocal()

    try:

        ports = (
            db.query(Port)
            .order_by(Port.id)
            .all()
        )

        port_data = []

        for port in ports:

            port_data.append(
                {
                    "id":
                        port.id,

                    "name":
                        port.name,

                    "country":
                        port.country,

                    "cargo":
                        port.cargo,

                    "draft":
                        port.draft,

                    "status":
                        port.status,
                }
            )

        return {

            "ports":
                port_data,

            "total":
                len(port_data),

            "last_updated":
                datetime.now().isoformat(),
        }

    finally:

        db.close()


# ============================================================
# DECISION AUDIT API
# ============================================================

@app.get("/api/audit")
def get_audit():

    db = SessionLocal()

    try:

        audits = (
            db.query(DecisionAudit)
            .order_by(
                DecisionAudit.created_at.desc()
            )
            .all()
        )

        audit_data = []

        for audit in audits:

            charter_cost = None

            # ------------------------------------------------
            # Find matching CharterDecision
            # ------------------------------------------------

            if audit.decision_id:

                try:

                    decision_number = int(
                        audit.decision_id.replace(
                            "DEC-",
                            ""
                        )
                    )

                    decision = (
                        db.query(CharterDecision)
                        .filter(
                            CharterDecision.id ==
                            decision_number
                        )
                        .first()
                    )

                    if decision:

                        charter_cost = (
                            decision.charter_cost
                        )

                except ValueError:

                    charter_cost = None

            # ------------------------------------------------
            # Add enriched audit record
            # ------------------------------------------------

            audit_data.append(
                {
                    "id":
                        audit.id,

                    "decision_id":
                        audit.decision_id,

                    "shipment_route":
                        audit.shipment_route,

                    "recommended_vessel":
                        audit.recommended_vessel,

                    "decision_type":
                        audit.decision_type,

                    "decision_status":
                        audit.decision_status,

                    "decision_score":
                        audit.decision_score,

                    "charter_cost":
                        charter_cost,

                    "explanation":
                        audit.explanation,

                    "created_at":
                        audit.created_at.isoformat()
                        if audit.created_at
                        else None,
                }
            )

        return {

            "audits":
                audit_data,

            "total":
                len(audit_data),

            "last_updated":
                datetime.now().isoformat(),
        }

    finally:

        db.close()


# ============================================================
# DECISION AUDIT RESET API
# ============================================================

@app.post("/api/audit/reset")
def reset_audit_data(
    confirm: bool = False,
    db: Session = Depends(get_db)
):
    """
    Clear decision audit history, charter decisions,
    and shipments without touching freight, vessel,
    or port data.
    """

    if not confirm:
        return {
            "status": "error",
            "message": (
                "Reset not performed. Set confirm=true "
                "to permanently clear decision history."
            )
        }

    try:
        deleted_audits = db.query(DecisionAudit).delete(
            synchronize_session=False
        )

        deleted_decisions = db.query(CharterDecision).delete(
            synchronize_session=False
        )

        deleted_shipments = db.query(Shipment).delete(
            synchronize_session=False
        )

        db.commit()

        return {
            "status": "success",
            "deleted_audits": deleted_audits,
            "deleted_charter_decisions": deleted_decisions,
            "deleted_shipments": deleted_shipments,
            "message": (
                "Decision history has been cleared. "
                "Freight, vessel and port data were not modified."
            )
        }

    except Exception as error:
        db.rollback()

        return {
            "status": "error",
            "message": str(error)
        }


# ============================================================
# LANDED COST
# ============================================================

@app.post("/api/landed-cost")
def calculate_landed_cost(
    request: LandedCostRequest
):
    """Compare market-freight and vessel-charter landed-cost scenarios.

    Market scenario:
        FOB + market freight + port/demurrage + financing

    Charter scenario:
        FOB + charter transport + port/demurrage + financing

    This avoids double-counting transportation by keeping market freight
    and charter transport as alternative scenarios rather than adding them.
    """

    cargo_quantity = max(float(request.cargo_quantity), 1)
    fob_cost = cargo_quantity * float(request.fob_price)
    market_freight_cost = cargo_quantity * float(request.freight_rate)
    operational_cost = float(request.port_charges) + float(request.demurrage)
    financing_cost = float(request.financing_cost)
    charter_cost = max(float(request.charter_cost), 0)

    market_landed_cost = (
        fob_cost +
        market_freight_cost +
        operational_cost +
        financing_cost
    )

    charter_all_in_cost = (
        fob_cost +
        charter_cost +
        operational_cost +
        financing_cost
    )

    market_cost_per_tonne = market_landed_cost / cargo_quantity
    charter_cost_per_tonne = charter_all_in_cost / cargo_quantity

    cost_difference = market_landed_cost - charter_all_in_cost
    cost_difference_per_tonne = market_cost_per_tonne - charter_cost_per_tonne

    if charter_cost <= 0:
        decision = "Market Freight"
        decision_reason = "No charter cost was supplied, so the market-freight scenario is used as the reference."
    elif cost_difference > 0:
        decision = "Charter"
        decision_reason = "The calculated charter scenario has a lower all-in cost than the market-freight scenario."
    elif cost_difference < 0:
        decision = "Market Freight"
        decision_reason = "The market-freight scenario has a lower landed cost than the calculated charter scenario."
    else:
        decision = "Equivalent"
        decision_reason = "Both transportation scenarios have the same calculated all-in cost."

    return {
        "inputs": {
            "cargo_quantity": request.cargo_quantity,
            "fob_price": request.fob_price,
            "freight_rate": request.freight_rate,
            "port_charges": request.port_charges,
            "demurrage": request.demurrage,
            "financing_cost": request.financing_cost,
            "charter_cost": request.charter_cost,
            "recommended_vessel": request.recommended_vessel,
        },
        "procurementCost": round(fob_cost, 2),
        "freightCost": round(market_freight_cost, 2),
        "operationalCost": round(operational_cost, 2),
        "financingCost": round(financing_cost, 2),
        "totalLandedCost": round(market_landed_cost, 2),
        "landedCostPerTonne": round(market_cost_per_tonne, 2),
        "charterCost": round(charter_cost, 2),
        "recommendedVessel": request.recommended_vessel,
        "allInDecisionCost": round(charter_all_in_cost, 2),
        "allInCostPerTonne": round(charter_cost_per_tonne, 2),
        "scenarios": {
            "market_freight": {
                "transport_type": "Market Freight",
                "freight_rate": round(float(request.freight_rate), 4),
                "freight_cost": round(market_freight_cost, 2),
                "total_cost": round(market_landed_cost, 2),
                "cost_per_tonne": round(market_cost_per_tonne, 2),
            },
            "charter": {
                "transport_type": "Vessel Charter",
                "vessel": request.recommended_vessel,
                "charter_cost": round(charter_cost, 2),
                "total_cost": round(charter_all_in_cost, 2),
                "cost_per_tonne": round(charter_cost_per_tonne, 2),
            },
        },
        "comparison": {
            "decision": decision,
            "difference": round(cost_difference, 2),
            "difference_per_tonne": round(cost_difference_per_tonne, 2),
            "decision_reason": decision_reason,
        },
        "last_updated": datetime.now().isoformat(),
    }




# ============================================================
# PROCUREMENT DECISION ENGINE
# ============================================================

@app.post("/api/procurement-decision")
def procurement_decision(
    request: ProcurementDecisionRequest
):
    """
    Compare procurement timing scenarios using the current freight
    rate, model forecast, forecast uncertainty, and the recommended
    vessel charter option.

    Scenarios:
        BUY NOW  - current freight rate
        WAIT     - final forecast freight rate
        PARTIAL  - split between current and final forecast
        RISK-ADJUSTED WAIT - final forecast + max uncertainty
    """

    try:

        # ----------------------------------------------------
        # 1. GET MODEL-BASED FREIGHT FORECAST
        # ----------------------------------------------------

        freight = get_freight()

        if not isinstance(freight, dict) or "error" in freight:
            return {
                "status": "error",
                "error": "Freight forecasting data is not available"
            }

        forecast = freight.get("forecast", [])

        if not forecast:
            return {
                "status": "error",
                "error": "No freight forecast values are available"
            }

        current_freight_rate = float(
            freight.get("current_rate", 0)
        )

        # ----------------------------------------------------
        # 2. GET CURRENT CHARTER DECISION
        # ----------------------------------------------------
        # We reuse the existing charter engine so procurement
        # and chartering remain based on the same vessel data,
        # freight forecast and shipment quantity.

        charter_request = ShipmentRequest(
            origin="Australia",
            destination="East Coast India",
            commodity="Coking Coal",
            quantity=int(request.cargo_quantity),
        )

        charter = _calculate_charter_decision(
            charter_request,
            persist_records=False,
        )

        if not isinstance(charter, dict) or "error" in charter:
            return {
                "status": "error",
                "error": (
                    charter.get("error", "Charter decision failed")
                    if isinstance(charter, dict)
                    else "Charter decision failed"
                )
            }

        recommended_vessel = charter.get(
            "recommended_vessel",
            {}
        )

        charter_cost = float(
            recommended_vessel.get(
                "charter_cost",
                0
            )
        )

        vessel_name = recommended_vessel.get(
            "name",
            "Not selected"
        )

        # ----------------------------------------------------
        # 3. RUN PROCUREMENT ENGINE
        # ----------------------------------------------------

        decision = calculate_procurement_decision(
            quantity=request.cargo_quantity,
            fob_price=request.fob_price,
            current_freight_rate=current_freight_rate,
            forecast=forecast,
            port_charges=request.port_charges,
            demurrage=request.demurrage,
            financing_cost=request.financing_cost,
            charter_cost=charter_cost,
            recommended_vessel=vessel_name,
            partial_ratio=request.partial_ratio,
        )

        # ----------------------------------------------------
        # 4. RETURN PROCUREMENT ANALYSIS
        # ----------------------------------------------------

        return {
            "status": "success",

            "inputs": {
                "cargo_quantity": request.cargo_quantity,
                "fob_price": request.fob_price,
                "port_charges": request.port_charges,
                "demurrage": request.demurrage,
                "financing_cost": request.financing_cost,
                "partial_ratio": request.partial_ratio,
            },

            "procurement": decision,

            "freight": {
                "current_rate": freight.get("current_rate"),
                "forecast_range": freight.get("forecast_range"),
                "trend": freight.get("trend"),
                "confidence": freight.get("confidence"),
                "horizon_weeks": freight.get("horizon_weeks"),
                "forecast": freight.get("forecast", []),
                "model": freight.get("model"),
                "backtest_metrics": freight.get(
                    "backtest_metrics",
                    {}
                ),
                "error_standard_deviation": freight.get(
                    "error_standard_deviation"
                ),
            },

            "charter": {
                "recommended_vessel": vessel_name,
                "charter_cost": charter_cost,
                "overall_score": recommended_vessel.get(
                    "overall_score",
                    0
                ),
                "loads_required": recommended_vessel.get(
                    "loads_required",
                    0
                ),
                "voyage_days": recommended_vessel.get(
                    "voyage_days",
                    0
                ),
            },

            "last_updated": datetime.now().isoformat(),
        }

    except Exception as error:

        return {
            "status": "error",
            "error": str(error),
        }


# ============================================================
# CHARTER DECISION ENGINE
# ============================================================

@app.post("/api/charter-decision")
def charter_decision(
    shipment: ShipmentRequest
):
    return _calculate_charter_decision(
        shipment,
        persist_records=True,
    )


def _calculate_charter_decision(
    shipment: ShipmentRequest,
    persist_records: bool = True,
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # 1. VALIDATE CARGO
        # ----------------------------------------------------

        cargo_quantity = max(float(shipment.quantity), 1)

        # ----------------------------------------------------
        # 2. SAVE SHIPMENT (only for a standalone charter request)
        # ----------------------------------------------------

        shipment_id = None

        if persist_records:
            new_shipment = Shipment(
                origin=shipment.origin,
                destination=shipment.destination,
                commodity=shipment.commodity,
                quantity=cargo_quantity,
            )

            db.add(new_shipment)
            db.flush()

            shipment_id = new_shipment.id

        # ----------------------------------------------------
        # 3. GET MODEL-BASED FREIGHT FORECAST
        # ----------------------------------------------------

        freight = get_freight()

        if not isinstance(freight, dict) or "error" in freight:
            db.rollback()
            return {
                "error": "Freight forecasting data is not available"
            }

        forecast_items = freight.get("forecast", [])

        if not forecast_items:
            db.rollback()
            return {
                "error": "No freight forecast values are available"
            }

        current_freight_rate = float(
            freight.get("current_rate", 0)
        )

        first_forecast = forecast_items[0]
        last_forecast = forecast_items[-1]

        first_forecast_rate = float(
            first_forecast.get("rate", current_freight_rate)
        )

        last_forecast_rate = float(
            last_forecast.get("rate", current_freight_rate)
        )

        forecast_uncertainties = [
            float(item.get("uncertainty", 0) or 0)
            for item in forecast_items
        ]

        average_uncertainty = (
            sum(forecast_uncertainties) /
            len(forecast_uncertainties)
            if forecast_uncertainties
            else 0
        )

        max_uncertainty = max(
            forecast_uncertainties,
            default=0
        )

        forecast_movement_pct = (
            ((last_forecast_rate - current_freight_rate)
             / current_freight_rate) * 100
            if current_freight_rate > 0
            else 0
        )

        # The forecast is shared across the vessel options.
        # Freight exposure is therefore reported separately and
        # used as a market-risk input rather than pretending it
        # changes the physical charter cost of every vessel.
        market_uncertainty_pct = (
            (average_uncertainty / current_freight_rate) * 100
            if current_freight_rate > 0
            else 0
        )

        # ----------------------------------------------------
        # 4. GET AVAILABLE VESSELS FROM DATABASE
        # ----------------------------------------------------

        vessel_records = (
            db.query(Vessel)
            .filter(Vessel.status == "Available")
            .order_by(Vessel.id)
            .all()
        )

        if not vessel_records:
            db.rollback()
            return {
                "error": "No available vessels found"
            }

        # ----------------------------------------------------
        # 5. ESTIMATED VOYAGE DAYS
        # ----------------------------------------------------
        # These are planning assumptions for the current prototype.
        # They are kept in one place so they can later be replaced
        # by route/port distance and AIS-derived voyage estimates.

        voyage_days_by_type = {
            "Panamax": 28,
            "Capesize": 24,
            "Supramax": 31,
        }

        # ----------------------------------------------------
        # 6. SUPPORT FUNCTIONS FOR THE DECISION MODEL
        # ----------------------------------------------------

        def location_score(location):
            """Planning score based on the vessel's current location.

            This is deliberately transparent and heuristic for the
            prototype. It can later be replaced with an AIS/ETA model.
            """

            location_text = (location or "").lower()

            if "visakhapatnam" in location_text:
                return 95.0

            if "singapore" in location_text:
                return 85.0

            if "newcastle" in location_text:
                return 78.0

            if "gladstone" in location_text:
                return 75.0

            return 70.0

        def utilization_score(utilization_ratio, loads_required):
            """Score how efficiently the vessel capacity is used."""

            if loads_required <= 1:
                # Close to full utilization is preferred, but a
                # small underfill should not be punished severely.
                score = min(utilization_ratio * 100, 100)
                return max(score, 60.0)

            # Multiple voyages increase execution complexity.
            score = (100 / loads_required)
            return max(min(score, 100.0), 10.0)

        def risk_score_for_vessel(
            location_risk_score,
            capacity_score,
            loads_required,
            market_uncertainty_percentage,
        ):
            """Calculate a transparent risk score from model inputs.

            Higher is better / lower operational risk.
            """

            voyage_execution_score = max(
                100 - ((loads_required - 1) * 18),
                30
            )

            # Market uncertainty is a shared market condition, while
            # voyage count and location differentiate vessel options.
            market_score = max(
                100 - (market_uncertainty_percentage * 8),
                50
            )

            score = (
                location_risk_score * 0.35
                + capacity_score * 0.25
                + voyage_execution_score * 0.20
                + market_score * 0.20
            )

            return max(min(score, 100.0), 0.0)

        # ----------------------------------------------------
        # 7. PREPARE VESSEL DATA
        # ----------------------------------------------------

        vessels = []

        for vessel in vessel_records:

            voyage_days = voyage_days_by_type.get(
                vessel.vessel_type,
                30
            )

            vessels.append(
                {
                    "id": vessel.id,
                    "name": vessel.name,
                    "vessel_type": vessel.vessel_type,
                    "capacity": float(vessel.capacity),
                    "daily_rate": float(vessel.daily_rate or 0),
                    "voyage_days": voyage_days,
                    "location": vessel.location,
                    "status": vessel.status,
                }
            )

        # ----------------------------------------------------
        # 8. SCORE EACH VESSEL
        # ----------------------------------------------------

        results = []

        for vessel in vessels:

            capacity = vessel["capacity"]
            daily_rate = vessel["daily_rate"]
            voyage_days = vessel["voyage_days"]

            if capacity <= 0:
                continue

            # ------------------------------------------------
            # LOADS REQUIRED
            # ------------------------------------------------

            loads_required = math.ceil(
                cargo_quantity / capacity
            )

            # ------------------------------------------------
            # CAPACITY UTILIZATION
            # ------------------------------------------------

            total_available_capacity = (
                capacity * loads_required
            )

            capacity_utilization = (
                cargo_quantity /
                total_available_capacity
            ) * 100

            utilization_ratio = (
                cargo_quantity /
                capacity
            )

            # ------------------------------------------------
            # CHARTER COST
            # ------------------------------------------------

            single_voyage_cost = (
                daily_rate * voyage_days
            )

            charter_cost = (
                single_voyage_cost * loads_required
            )

            charter_cost_per_tonne = (
                charter_cost / cargo_quantity
                if cargo_quantity > 0
                else 0
            )

            # ------------------------------------------------
            # CAPACITY SCORE
            # ------------------------------------------------

            capacity_score = utilization_score(
                utilization_ratio,
                loads_required
            )

            # ------------------------------------------------
            # COST SCORE
            # ------------------------------------------------
            # Compare all currently available vessels against the
            # most expensive calculated charter option instead of
            # using a hard-coded market ceiling.

            # Cost score is calculated after all vessel costs are known.
            # Temporary placeholder; normalized below.
            cost_score = 0

            # ------------------------------------------------
            # TIME SCORE
            # ------------------------------------------------

            max_voyage_days = max(
                item["voyage_days"]
                for item in vessels
            )

            base_time_score = (
                1 - (
                    voyage_days /
                    max_voyage_days
                )
            ) * 100 if max_voyage_days > 0 else 0

            if loads_required > 1:
                time_score = (
                    base_time_score /
                    loads_required
                )
            else:
                time_score = base_time_score

            time_score = max(
                min(time_score, 100),
                0
            )

            # ------------------------------------------------
            # LOCATION / EXECUTION RISK
            # ------------------------------------------------

            location_score_value = location_score(
                vessel["location"]
            )

            risk_score = risk_score_for_vessel(
                location_score_value,
                capacity_score,
                loads_required,
                market_uncertainty_pct,
            )

            results.append(
                {
                    "id": vessel["id"],
                    "name": vessel["name"],
                    "vessel_type": vessel["vessel_type"],
                    "capacity": vessel["capacity"],
                    "daily_rate": vessel["daily_rate"],
                    "voyage_days": voyage_days,
                    "location": vessel["location"],
                    "status": vessel["status"],
                    "loads_required": loads_required,
                    "capacity_utilization": round(
                        capacity_utilization,
                        1
                    ),
                    "single_voyage_cost": round(
                        single_voyage_cost,
                        2
                    ),
                    "charter_cost": round(
                        charter_cost,
                        2
                    ),
                    "charter_cost_per_tonne": round(
                        charter_cost_per_tonne,
                        4
                    ),
                    "cost_score": cost_score,
                    "time_score": round(
                        time_score,
                        1
                    ),
                    "capacity_score": round(
                        capacity_score,
                        1
                    ),
                    "location_score": round(
                        location_score_value,
                        1
                    ),
                    "risk_score": round(
                        risk_score,
                        1
                    ),
                    "freight_rate_used": round(
                        current_freight_rate,
                        2
                    ),
                    "forecast_rate": round(
                        first_forecast_rate,
                        2
                    ),
                    "forecast_uncertainty": round(
                        max_uncertainty,
                        2
                    ),
                }
            )

        if not results:
            db.rollback()
            return {
                "error": "No valid vessel records available for scoring"
            }

        # ----------------------------------------------------
        # 9. NORMALIZE COST SCORES
        # ----------------------------------------------------

        charter_costs = [
            item["charter_cost"]
            for item in results
        ]

        min_charter_cost = min(charter_costs)
        max_charter_cost = max(charter_costs)

        if max_charter_cost == min_charter_cost:
            for item in results:
                item["cost_score"] = 100.0
        else:
            for item in results:
                item["cost_score"] = round(
                    (
                        (max_charter_cost - item["charter_cost"])
                        /
                        (max_charter_cost - min_charter_cost)
                    ) * 100,
                    1
                )

        # ----------------------------------------------------
        # 10. OVERALL SCORE
        # ----------------------------------------------------

        for item in results:

            item["overall_score"] = round(
                item["cost_score"] * 0.35
                + item["time_score"] * 0.25
                + item["capacity_score"] * 0.25
                + item["risk_score"] * 0.15,
                1
            )

            # ------------------------------------------------
            # VESSEL EXPLANATION
            # ------------------------------------------------

            item["explanation"] = (
                f"{item['name']} was evaluated as a "
                f"{item['vessel_type']} vessel with "
                f"{int(item['capacity']):,} DWT capacity. "
                f"The shipment requires "
                f"{item['loads_required']} voyage(s), "
                f"with an estimated charter cost of "
                f"${item['charter_cost']:,.0f}. "
                f"Capacity utilization is "
                f"{item['capacity_utilization']:.1f}%, "
                f"while the model-based risk score is "
                f"{item['risk_score']:.1f}. "
                f"The overall score is "
                f"{item['overall_score']:.1f}, based on "
                f"cost, time, capacity and risk factors."
            )

        # ----------------------------------------------------
        # 11. SELECT BEST SCORING OPTION
        # ----------------------------------------------------

        results.sort(
            key=lambda vessel: vessel["overall_score"],
            reverse=True
        )

        recommended = results[0]

        # ----------------------------------------------------
        # 12. RECOMMENDATION EXPLANATION
        # ----------------------------------------------------

        recommendation_reason = (
            f"{recommended['name']} achieved the highest "
            f"overall score of {recommended['overall_score']:.1f} "
            f"among the currently available vessels. "
            f"It requires {recommended['loads_required']} "
            f"voyage(s), has an estimated charter cost of "
            f"${recommended['charter_cost']:,.0f}, and provides "
            f"{recommended['capacity_utilization']:.1f}% capacity "
            f"utilization. The current freight rate is "
            f"${current_freight_rate:.2f}/tonne and the first "
            f"forecast is ${first_forecast_rate:.2f}/tonne with "
            f"an uncertainty of ±${max_uncertainty:.2f}/tonne."
        )

        # ----------------------------------------------------
        # 13. SAVE CHARTER DECISION + AUDIT (standalone only)
        # ----------------------------------------------------

        decision = None
        audit_decision_id = None

        if persist_records:
            decision = CharterDecision(
                shipment_id=shipment_id,
                recommended_vessel=recommended["name"],
                charter_cost=recommended["charter_cost"],
                overall_score=recommended["overall_score"],
                cost_score=recommended["cost_score"],
                time_score=recommended["time_score"],
                capacity_score=recommended["capacity_score"],
                risk_score=recommended["risk_score"],
            )

            db.add(decision)
            db.flush()

            # ------------------------------------------------
            # 14. CREATE DECISION AUDIT RECORD
            # ------------------------------------------------

            audit_decision_id = (
                f"DEC-{decision.id:03d}"
            )

            shipment_route = (
                f"{shipment.origin} → "
                f"{shipment.destination}"
            )

            audit_explanation = (
                f"Charter decision generated for "
                f"{shipment.quantity:,} tonnes of "
                f"{shipment.commodity}. "
                f"{recommended['name']} was selected with "
                f"an overall score of "
                f"{recommended['overall_score']:.1f}. "
                f"Estimated charter cost: "
                f"${recommended['charter_cost']:,.0f}. "
                f"Required voyages: "
                f"{recommended['loads_required']}. "
                f"Current freight rate: "
                f"${current_freight_rate:.2f}/tonne. "
                f"First forecast rate: "
                f"${first_forecast_rate:.2f}/tonne. "
                f"Forecast uncertainty: "
                f"±${max_uncertainty:.2f}/tonne. "
                f"Average forecast uncertainty: "
                f"±${average_uncertainty:.2f}/tonne."
            )

            audit_record = DecisionAudit(
                decision_id=audit_decision_id,
                shipment_route=shipment_route,
                recommended_vessel=recommended["name"],
                decision_type="Charter Decision",
                decision_status="Generated",
                decision_score=recommended["overall_score"],
                explanation=audit_explanation,
            )

            db.add(audit_record)

            # ------------------------------------------------
            # 15. COMMIT EVERYTHING
            # ------------------------------------------------

            db.commit()

        # ----------------------------------------------------
        # 16. RETURN DECISION
        # ----------------------------------------------------

        return {
            "shipment_id": shipment_id,
            "decision_id": decision.id if decision else None,
            "audit_id": audit_decision_id,
            "shipment": {
                "origin": shipment.origin,
                "destination": shipment.destination,
                "commodity": shipment.commodity,
                "quantity": shipment.quantity,
            },
            "freight": {
                "current_rate": current_freight_rate,
                "currency": freight["currency"],
                "unit": freight["unit"],
                "trend": freight["trend"],
                "confidence": freight["confidence"],
                "forecast_range": freight["forecast_range"],
                "forecast": freight["forecast"],
                "model": freight.get("model"),
                "backtest_metrics": freight.get(
                    "backtest_metrics",
                    {}
                ),
                "error_standard_deviation": freight.get(
                    "error_standard_deviation",
                    0
                ),
                "average_uncertainty": round(
                    average_uncertainty,
                    2
                ),
                "max_uncertainty": round(
                    max_uncertainty,
                    2
                ),
                "forecast_movement_pct": round(
                    forecast_movement_pct,
                    2
                ),
            },
            "factors": {
                "cost": 35,
                "time": 25,
                "capacity": 25,
                "risk": 15,
            },
            "decision_method": (
                "Database vessel data + model-based freight "
                "forecast + uncertainty-aware risk scoring"
            ),
            "records_persisted": persist_records,
            "recommended_vessel": recommended,
            "recommendation_reason": recommendation_reason,
            "all_options": results,
            "last_updated": datetime.now().isoformat(),
        }

    except Exception as error:

        db.rollback()

        return {
            "error": str(error)
        }

    finally:
        db.close()
