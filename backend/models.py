from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
)

from datetime import datetime

from database import Base


# =========================================================
# VESSEL MODEL
# =========================================================

class Vessel(Base):

    __tablename__ = "vessels"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    vessel_type = Column(
        String,
        nullable=False
    )

    capacity = Column(
        Float,
        nullable=False
    )

    location = Column(
        String,
        nullable=True
    )

    daily_rate = Column(
        Float,
        nullable=True
    )

    status = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# PORT MODEL
# =========================================================

class Port(Base):

    __tablename__ = "ports"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    country = Column(
        String,
        nullable=False
    )

    cargo = Column(
        String,
        nullable=True
    )

    draft = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# FREIGHT OBSERVATION MODEL
# =========================================================

class FreightObservation(Base):

    __tablename__ = "freight_observations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    commodity = Column(
        String,
        nullable=False
    )

    rate = Column(
        Float,
        nullable=False
    )

    currency = Column(
        String,
        default="USD"
    )

    unit = Column(
        String,
        default="tonne"
    )

    source = Column(
        String,
        nullable=True
    )

    observation_time = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# FREIGHT FORECAST MODEL
# =========================================================

class FreightForecast(Base):

    __tablename__ = "freight_forecasts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    commodity = Column(
        String,
        nullable=False
    )

    week = Column(
        String,
        nullable=False
    )

    rate = Column(
        Float,
        nullable=False
    )

    confidence = Column(
        String,
        nullable=True
    )

    trend = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# SHIPMENT MODEL
# =========================================================

class Shipment(Base):

    __tablename__ = "shipments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    origin = Column(
        String,
        nullable=False
    )

    destination = Column(
        String,
        nullable=False
    )

    commodity = Column(
        String,
        nullable=False
    )

    quantity = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# CHARTER DECISION MODEL
# =========================================================

class CharterDecision(Base):

    __tablename__ = "charter_decisions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    shipment_id = Column(
        Integer,
        nullable=True
    )

    recommended_vessel = Column(
        String,
        nullable=False
    )

    charter_cost = Column(
        Float,
        nullable=True
    )

    overall_score = Column(
        Float,
        nullable=True
    )

    cost_score = Column(
        Float,
        nullable=True
    )

    time_score = Column(
        Float,
        nullable=True
    )

    capacity_score = Column(
        Float,
        nullable=True
    )

    risk_score = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# LANDED COST MODEL
# =========================================================

class LandedCostRecord(Base):

    __tablename__ = "landed_cost_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    shipment_id = Column(
        Integer,
        nullable=True
    )

    cargo_quantity = Column(
        Float,
        nullable=False
    )

    fob_price = Column(
        Float,
        nullable=False
    )

    freight_rate = Column(
        Float,
        nullable=False
    )

    port_charges = Column(
        Float,
        nullable=False
    )

    demurrage = Column(
        Float,
        nullable=False
    )

    financing_cost = Column(
        Float,
        nullable=False
    )

    total_landed_cost = Column(
        Float,
        nullable=False
    )

    landed_cost_per_tonne = Column(
        Float,
        nullable=False
    )

    charter_cost = Column(
        Float,
        nullable=True
    )

    all_in_decision_cost = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# DECISION AUDIT MODEL
# =========================================================

class DecisionAudit(Base):

    __tablename__ = "decision_audits"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        String,
        nullable=False
    )

    shipment_route = Column(
        String,
        nullable=True
    )

    recommended_vessel = Column(
        String,
        nullable=True
    )

    decision_type = Column(
        String,
        nullable=True
    )

    decision_status = Column(
        String,
        nullable=True
    )

    decision_score = Column(
        Float,
        nullable=True
    )

    explanation = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )