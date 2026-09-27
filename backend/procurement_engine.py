"""
Procurement Decision Engine
---------------------------

Transparent prototype timing engine for bulk cargo procurement.

The engine compares:
1. BUY NOW  - procurement using the current market freight rate.
2. WAIT     - procurement using the final forecast freight rate.
3. PARTIAL  - split procurement between current and forecast periods.

The timing signal is based on forecast movement relative to the model's
uncertainty. It is deliberately transparent and should be treated as a
decision-support signal, not a guarantee of future freight prices.
"""

from typing import Any, Dict, List


def _money(value: float) -> float:
    return round(float(value), 2)


def _rate(value: float) -> float:
    return round(float(value), 4)


def _scenario(
    quantity: float,
    fob_price: float,
    freight_rate: float,
    port_charges: float,
    demurrage: float,
    financing_cost: float,
) -> Dict[str, float]:
    quantity = max(float(quantity), 1.0)
    freight_rate = max(float(freight_rate), 0.0)

    procurement_cost = quantity * float(fob_price)
    freight_cost = quantity * freight_rate
    operational_cost = float(port_charges) + float(demurrage)
    financing = float(financing_cost)

    total = (
        procurement_cost
        + freight_cost
        + operational_cost
        + financing
    )

    return {
        "procurement_cost": _money(procurement_cost),
        "freight_cost": _money(freight_cost),
        "operational_cost": _money(operational_cost),
        "financing_cost": _money(financing),
        "total_cost": _money(total),
        "cost_per_tonne": _money(total / quantity),
        "freight_rate": _rate(freight_rate),
    }


def calculate_procurement_decision(
    quantity: float,
    fob_price: float,
    current_freight_rate: float,
    forecast: List[Dict[str, Any]],
    port_charges: float = 0.0,
    demurrage: float = 0.0,
    financing_cost: float = 0.0,
    charter_cost: float = 0.0,
    recommended_vessel: str = "Not selected",
    partial_ratio: float = 0.50,
) -> Dict[str, Any]:

    quantity = max(float(quantity), 1.0)
    partial_ratio = min(max(float(partial_ratio), 0.0), 1.0)

    if not forecast:
        raise ValueError("No forecast values are available.")

    forecast_rates = [
        float(item.get("rate", 0.0))
        for item in forecast
        if item.get("rate") is not None
    ]

    if not forecast_rates:
        raise ValueError("Forecast contains no usable freight rates.")

    uncertainty_values = [
        float(item.get("uncertainty", 0.0) or 0.0)
        for item in forecast
    ]

    current_rate = float(current_freight_rate)
    final_rate = forecast_rates[-1]

    average_uncertainty = (
        sum(uncertainty_values) / len(uncertainty_values)
        if uncertainty_values
        else 0.0
    )

    max_uncertainty = max(
        uncertainty_values,
        default=0.0,
    )

    forecast_delta = final_rate - current_rate
    forecast_delta_pct = (
        (forecast_delta / current_rate) * 100
        if current_rate > 0
        else 0.0
    )

    # ---------------------------------------------------------
    # Scenario costs
    # ---------------------------------------------------------

    buy_now = _scenario(
        quantity,
        fob_price,
        current_rate,
        port_charges,
        demurrage,
        financing_cost,
    )

    wait = _scenario(
        quantity,
        fob_price,
        final_rate,
        port_charges,
        demurrage,
        financing_cost,
    )

    partial_quantity_now = quantity * partial_ratio
    partial_quantity_later = quantity - partial_quantity_now

    partial_now = _scenario(
        partial_quantity_now,
        fob_price,
        current_rate,
        port_charges * partial_ratio,
        demurrage * partial_ratio,
        financing_cost * partial_ratio,
    )

    partial_later = _scenario(
        partial_quantity_later,
        fob_price,
        final_rate,
        port_charges * (1 - partial_ratio),
        demurrage * (1 - partial_ratio),
        financing_cost * (1 - partial_ratio),
    )

    partial_total = {
        "procurement_cost": _money(
            partial_now["procurement_cost"]
            + partial_later["procurement_cost"]
        ),
        "freight_cost": _money(
            partial_now["freight_cost"]
            + partial_later["freight_cost"]
        ),
        "operational_cost": _money(
            partial_now["operational_cost"]
            + partial_later["operational_cost"]
        ),
        "financing_cost": _money(
            partial_now["financing_cost"]
            + partial_later["financing_cost"]
        ),
    }

    partial_total["total_cost"] = _money(
        partial_total["procurement_cost"]
        + partial_total["freight_cost"]
        + partial_total["operational_cost"]
        + partial_total["financing_cost"]
    )

    partial_total["cost_per_tonne"] = _money(
        partial_total["total_cost"] / quantity
    )

    partial_weighted_rate = (
        current_rate * partial_ratio
        + final_rate * (1 - partial_ratio)
    )

    # ---------------------------------------------------------
    # Risk-adjusted waiting view
    # ---------------------------------------------------------
    # This is intentionally displayed separately from the base
    # WAIT scenario. It shows what the final forecast would look
    # like after adding one maximum forecast uncertainty unit.

    risk_adjusted_rate = final_rate + max_uncertainty

    risk_adjusted_wait = _scenario(
        quantity,
        fob_price,
        risk_adjusted_rate,
        port_charges,
        demurrage,
        financing_cost,
    )

    # ---------------------------------------------------------
    # Transparent timing signal
    # ---------------------------------------------------------
    #
    # Compare the forecast movement with the largest model
    # uncertainty. This prevents a tiny forecast movement from
    # being presented as a strong timing signal.
    #
    # BUY_NOW:
    #   forecast increase is greater than uncertainty.
    #
    # WAIT:
    #   forecast decrease is greater than uncertainty.
    #
    # PARTIAL:
    #   movement is within the uncertainty band.

    decision_threshold = max_uncertainty

    if forecast_delta > decision_threshold:
        signal = "BUY_NOW"
        signal_label = "Buy Now"
        signal_reason = (
            "The final forecast rate is above the current rate by "
            f"${forecast_delta:.2f}/tonne, which is greater than "
            f"the maximum model uncertainty of ±${max_uncertainty:.2f}/tonne."
        )
    elif forecast_delta < -decision_threshold:
        signal = "WAIT"
        signal_label = "Wait"
        signal_reason = (
            "The final forecast rate is below the current rate by "
            f"${abs(forecast_delta):.2f}/tonne, which is greater than "
            f"the maximum model uncertainty of ±${max_uncertainty:.2f}/tonne."
        )
    else:
        signal = "PARTIAL"
        signal_label = "Partial Procurement"
        signal_reason = (
            "The forecast movement is within the model uncertainty range. "
            "A split procurement scenario reduces dependence on a single "
            "timing assumption."
        )

    # ---------------------------------------------------------
    # Charter context
    # ---------------------------------------------------------

    charter_cost = max(float(charter_cost), 0.0)

    charter_all_in = (
        quantity * float(fob_price)
        + charter_cost
        + float(port_charges)
        + float(demurrage)
        + float(financing_cost)
    )

    charter_cost_per_tonne = charter_all_in / quantity

    charter_vs_buy_now_difference = (
        buy_now["total_cost"] - charter_all_in
    )

    return {
        "decision": {
            "signal": signal,
            "label": signal_label,
            "reason": signal_reason,
            "threshold_used": _rate(decision_threshold),
            "method": (
                "Forecast movement compared with maximum model uncertainty"
            ),
        },
        "market": {
            "current_freight_rate": _rate(current_rate),
            "final_forecast_rate": _rate(final_rate),
            "forecast_delta": _rate(forecast_delta),
            "forecast_delta_pct": _rate(forecast_delta_pct),
            "average_uncertainty": _rate(average_uncertainty),
            "max_uncertainty": _rate(max_uncertainty),
            "horizon_weeks": len(forecast_rates),
        },
        "scenarios": {
            "buy_now": {
                **buy_now,
                "quantity": _money(quantity),
                "timing": "Current market",
            },
            "wait": {
                **wait,
                "quantity": _money(quantity),
                "timing": "Final forecast week",
            },
            "partial": {
                **partial_total,
                "quantity": _money(quantity),
                "quantity_now": _money(partial_quantity_now),
                "quantity_later": _money(partial_quantity_later),
                "partial_ratio": _rate(partial_ratio),
                "weighted_freight_rate": _rate(partial_weighted_rate),
                "timing": "Split between current and final forecast",
            },
            "risk_adjusted_wait": {
                **risk_adjusted_wait,
                "quantity": _money(quantity),
                "freight_rate_basis": "Final forecast + max uncertainty",
                "timing": "Risk-adjusted final forecast",
            },
        },
        "charter_context": {
            "recommended_vessel": recommended_vessel,
            "charter_cost": _money(charter_cost),
            "all_in_cost": _money(charter_all_in),
            "all_in_cost_per_tonne": _money(charter_cost_per_tonne),
            "difference_vs_buy_now": _money(
                charter_vs_buy_now_difference
            ),
            "difference_vs_buy_now_per_tonne": _money(
                charter_vs_buy_now_difference / quantity
            ),
        },
        "last_updated": __import__("datetime").datetime.now().isoformat(),
    }
