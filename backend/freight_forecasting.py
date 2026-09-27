from statistics import mean

from freight_preprocessing import get_clean_freight_data


# ============================================================
# LINEAR TREND CALCULATION
# ============================================================

def calculate_linear_trend(rates):
    """
    Calculate a simple least-squares linear trend.

    Parameters
    ----------
    rates : list[float]
        Historical freight rates.

    Returns
    -------
    slope : float
        Rate of change per observation.

    intercept : float
        Regression intercept.
    """

    n = len(rates)

    if n < 2:
        if n == 1:
            return 0.0, rates[0]

        return 0.0, 0.0

    x_values = list(range(n))
    y_values = rates

    x_mean = mean(x_values)
    y_mean = mean(y_values)

    numerator = sum(
        (x - x_mean) * (y - y_mean)
        for x, y in zip(x_values, y_values)
    )

    denominator = sum(
        (x - x_mean) ** 2
        for x in x_values
    )

    if denominator == 0:
        return 0.0, y_mean

    slope = numerator / denominator

    intercept = y_mean - (
        slope * x_mean
    )

    return slope, intercept


# ============================================================
# FORECAST FROM A RATE SERIES
# ============================================================

def forecast_from_rates(
    rates,
    forecast_periods=1,
    recent_periods=12
):
    """
    Generate forecasts from an already prepared
    historical rate series.

    This function is used both by the main forecast
    and by the rolling backtest.

    Keeping the same calculation in both places ensures
    that the backtest evaluates the exact same model
    that is used for the real forecast.
    """

    if not rates:
        return []

    recent_rates = rates[-recent_periods:]

    # If there is only one usable observation,
    # simply repeat that rate.
    if len(recent_rates) < 2:
        return [
            {
                "week": f"W{period + 1}",
                "rate": round(recent_rates[-1], 2)
            }
            for period in range(forecast_periods)
        ]

    recent_average = mean(recent_rates)

    slope, intercept = calculate_linear_trend(
        recent_rates
    )

    forecasts = []

    start_index = len(recent_rates)

    for period in range(forecast_periods):

        future_index = (
            start_index + period
        )

        trend_prediction = (
            intercept
            + slope * future_index
        )

        # Blend the trend with the recent average.
        # This reduces extreme jumps when the dataset
        # is small.
        predicted_rate = (
            0.7 * trend_prediction
            + 0.3 * recent_average
        )

        # Freight rate cannot be negative.
        predicted_rate = max(
            predicted_rate,
            0
        )

        forecasts.append(
            {
                "week": f"W{period + 1}",
                "rate": round(
                    predicted_rate,
                    2
                )
            }
        )

    return forecasts


# ============================================================
# MAIN FREIGHT FORECAST
# ============================================================

def forecast_freight(
    forecast_periods=6,
    recent_periods=12
):
    """
    Generate a freight-rate forecast.

    Model:

        Historical observations
                ↓
        Recent observations
                ↓
        Linear trend
                ↓
        Recent average
                ↓
        Blended forecast
    """

    data = get_clean_freight_data()

    if data["status"] != "success":
        return data

    time_series = data["time_series"]

    # Minimum number of observations required
    # for a meaningful forecast.
    if len(time_series) < 4:
        return {
            "status": "error",
            "message": (
                "Not enough historical observations "
                "for forecasting."
            )
        }

    rates = [
        float(item["rate"])
        for item in time_series
    ]

    recent_rates = rates[-recent_periods:]

    recent_average = mean(
        recent_rates
    )

    slope, intercept = calculate_linear_trend(
        recent_rates
    )

    forecasts = forecast_from_rates(
        rates,
        forecast_periods=forecast_periods,
        recent_periods=recent_periods
    )

    # ========================================================
    # TREND CLASSIFICATION
    # ========================================================

    if slope > 0.02:
        trend = "RISING"

    elif slope < -0.02:
        trend = "FALLING"

    else:
        trend = "STABLE"

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "status": "success",

        "model": (
            "Linear Trend + Recent Average"
        ),

        "commodity": (
            data["commodity"]
        ),

        "currency": (
            data["currency"]
        ),

        "unit": (
            data["unit"]
        ),

        "historical_observations": (
            len(rates)
        ),

        "recent_periods_used": (
            len(recent_rates)
        ),

        "latest_rate": round(
            rates[-1],
            2
        ),

        "recent_average": round(
            recent_average,
            2
        ),

        "trend_slope": round(
            slope,
            4
        ),

        "trend": trend,

        "forecast_horizon": (
            forecast_periods
        ),

        "forecast": forecasts
    }


# ============================================================
# TEST FORECASTING ENGINE
# ============================================================

if __name__ == "__main__":

    result = forecast_freight(
        forecast_periods=6,
        recent_periods=12
    )

    print()
    print("===================================")
    print("FREIGHT FORECASTING ENGINE")
    print("===================================")

    print(
        "Status:",
        result["status"]
    )

    if result["status"] == "success":

        print(
            "Model:",
            result["model"]
        )

        print(
            "Historical observations:",
            result["historical_observations"]
        )

        print(
            "Recent observations used:",
            result["recent_periods_used"]
        )

        print(
            "Latest rate:",
            result["latest_rate"]
        )

        print(
            "Recent average:",
            result["recent_average"]
        )

        print(
            "Trend slope:",
            result["trend_slope"]
        )

        print(
            "Trend:",
            result["trend"]
        )

        print()

        print("6-WEEK FORECAST")
        print("-----------------------------------")

        for item in result["forecast"]:

            print(
                item["week"],
                "->",
                item["rate"],
                "USD/tonne"
            )

    else:

        print(
            "Error:",
            result["message"]
        )