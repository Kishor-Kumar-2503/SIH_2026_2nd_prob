import math
from statistics import stdev

from freight_forecasting import (
    forecast_freight,
    forecast_from_rates
)

from freight_preprocessing import (
    get_clean_freight_data
)


# ============================================================
# BACKTEST METRICS
# ============================================================

def calculate_backtest_metrics(actuals, predictions):
    """
    Calculate MAE, RMSE and MAPE.
    """

    if not actuals or not predictions:
        return {
            "MAE": 0.0,
            "RMSE": 0.0,
            "MAPE": 0.0
        }

    errors = []

    for actual, prediction in zip(
        actuals,
        predictions
    ):
        errors.append(
            float(actual) - float(prediction)
        )

    mae = sum(
        abs(error)
        for error in errors
    ) / len(errors)

    rmse = math.sqrt(
        sum(
            error ** 2
            for error in errors
        ) / len(errors)
    )

    percentage_errors = []

    for actual, prediction in zip(
        actuals,
        predictions
    ):
        if float(actual) != 0:
            percentage_errors.append(
                abs(
                    (float(actual) - float(prediction))
                    / float(actual)
                ) * 100
            )

    if percentage_errors:
        mape = sum(
            percentage_errors
        ) / len(percentage_errors)
    else:
        mape = 0.0

    return {
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "MAPE": round(mape, 4)
    }


# ============================================================
# ERROR UNCERTAINTY
# ============================================================

def calculate_error_uncertainty(
    errors,
    rmse
):
    """
    Estimate forecast uncertainty.

    If there is only one backtest error, standard deviation
    cannot provide a useful estimate. In that case RMSE is
    used as a fallback uncertainty measure.
    """

    if len(errors) >= 2:

        try:
            error_std = stdev(errors)
        except Exception:
            error_std = 0.0

    else:
        error_std = 0.0

    # With very small datasets, standard deviation can be zero.
    # Use RMSE as a practical fallback.
    if error_std <= 0:
        error_std = rmse

    return round(
        max(error_std, 0.0),
        4
    )


# ============================================================
# ROLLING BACKTEST
# ============================================================

def rolling_backtest(rates):
    """
    Perform a simple rolling one-step-ahead backtest.

    Minimum training size = 4 observations.
    """

    actuals = []
    predictions = []
    errors = []

    minimum_training_size = 4

    if len(rates) <= minimum_training_size:
        return {
            "actuals": [],
            "predictions": [],
            "errors": [],
            "metrics": {
                "MAE": 0.0,
                "RMSE": 0.0,
                "MAPE": 0.0
            }
        }

    for index in range(
        minimum_training_size,
        len(rates)
    ):

        training_rates = rates[:index]

        # Predict exactly one step ahead.
        forecast = forecast_from_rates(
            training_rates,
            forecast_periods=1,
            recent_periods=12
        )

        if not forecast:
            continue

        prediction = float(
            forecast[0]["rate"]
        )

        actual = float(
            rates[index]
        )

        actuals.append(actual)
        predictions.append(prediction)

        errors.append(
            actual - prediction
        )

    metrics = calculate_backtest_metrics(
        actuals,
        predictions
    )

    return {
        "actuals": actuals,
        "predictions": predictions,
        "errors": errors,
        "metrics": metrics
    }


# ============================================================
# MAIN UNCERTAINTY FORECAST
# ============================================================

def generate_uncertainty_forecast(
    commodity="Coking Coal",
    forecast_periods=6
):
    """
    Generate the freight forecast together with
    uncertainty bands.

    Output format is intentionally aligned with
    main.py /api/freight.
    """

    # --------------------------------------------------------
    # LOAD CLEAN FREIGHT DATA
    # --------------------------------------------------------

    data = get_clean_freight_data()

    if data.get("status") != "success":

        return {
            "status": "error",
            "message": data.get(
                "message",
                "Unable to load freight data."
            )
        }

    # --------------------------------------------------------
    # EXTRACT RATES
    # --------------------------------------------------------

    time_series = data.get(
        "time_series",
        []
    )

    if not time_series:

        return {
            "status": "error",
            "message": "No freight observations available."
        }

    rates = []

    for observation in time_series:

        # Each time_series item should look like:
        #
        # {
        #     "date": "...",
        #     "rate": 22.05
        # }

        if isinstance(
            observation,
            dict
        ):

            rates.append(
                float(
                    observation["rate"]
                )
            )

        else:

            # Safety fallback if preprocessing ever
            # returns plain numeric values.
            rates.append(
                float(observation)
            )

    # --------------------------------------------------------
    # MINIMUM DATA CHECK
    # --------------------------------------------------------

    if len(rates) < 4:

        return {
            "status": "error",
            "message": (
                "Not enough historical observations "
                "for forecasting."
            )
        }

    # --------------------------------------------------------
    # RUN THE SAME FORECAST ENGINE
    # --------------------------------------------------------

    forecast_result = forecast_freight(
        forecast_periods=forecast_periods,
        recent_periods=12
    )

    if forecast_result.get("status") != "success":

        return {
            "status": "error",
            "message": forecast_result.get(
                "message",
                "Freight forecasting failed."
            )
        }

    # --------------------------------------------------------
    # ROLLING BACKTEST
    # --------------------------------------------------------

    backtest = rolling_backtest(
        rates
    )

    metrics = backtest["metrics"]

    errors = backtest["errors"]

    # --------------------------------------------------------
    # UNCERTAINTY
    # --------------------------------------------------------

    error_std = calculate_error_uncertainty(
        errors,
        metrics["RMSE"]
    )

    # --------------------------------------------------------
    # BUILD FORECAST WITH UNCERTAINTY BANDS
    # --------------------------------------------------------

    forecast = []

    raw_forecast = forecast_result.get(
        "forecast",
        []
    )

    for index, item in enumerate(
        raw_forecast
    ):

        forecast_rate = float(
            item["rate"]
        )

        # Increase uncertainty slightly further
        # into the forecast horizon.
        multiplier = (
            1.0 + (0.10 * index)
        )

        uncertainty = (
            error_std * multiplier
        )

        lower_bound = max(
            forecast_rate - uncertainty,
            0
        )

        upper_bound = (
            forecast_rate + uncertainty
        )

        forecast.append(
            {
                "week": item["week"],

                "forecast": round(
                    forecast_rate,
                    2
                ),

                "lower_bound": round(
                    lower_bound,
                    2
                ),

                "upper_bound": round(
                    upper_bound,
                    2
                ),

                "uncertainty": round(
                    uncertainty,
                    2
                )
            }
        )

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {
        "status": "success",

        "commodity": forecast_result[
            "commodity"
        ],

        "currency": forecast_result[
            "currency"
        ],

        "unit": forecast_result[
            "unit"
        ],

        "latest_rate": forecast_result[
            "latest_rate"
        ],

        "recent_average": forecast_result[
            "recent_average"
        ],

        "trend_slope": forecast_result[
            "trend_slope"
        ],

        "trend": forecast_result[
            "trend"
        ],

        "model": forecast_result[
            "model"
        ],

        "historical_observations": forecast_result[
            "historical_observations"
        ],

        "recent_periods_used": forecast_result[
            "recent_periods_used"
        ],

        "forecast_horizon": forecast_result[
            "forecast_horizon"
        ],

        "forecast": forecast,

        "backtest_metrics": metrics,

        "error_standard_deviation": error_std,

        "backtest_observations": len(
            errors
        ),

        "uncertainty_method": (
            "Rolling backtest error "
            "with RMSE fallback"
        )
    }


# ============================================================
# TEST UNCERTAINTY ENGINE
# ============================================================

if __name__ == "__main__":

    result = generate_uncertainty_forecast(
        commodity="Coking Coal",
        forecast_periods=6
    )

    print()
    print("===================================")
    print("FREIGHT UNCERTAINTY ENGINE")
    print("===================================")

    print(
        "Status:",
        result["status"]
    )

    if result["status"] == "success":

        print(
            "Latest rate:",
            result["latest_rate"]
        )

        print(
            "Trend:",
            result["trend"]
        )

        print(
            "Model:",
            result["model"]
        )

        print(
            "Historical observations:",
            result["historical_observations"]
        )

        print(
            "Backtest observations:",
            result["backtest_observations"]
        )

        print(
            "MAE:",
            result["backtest_metrics"]["MAE"]
        )

        print(
            "RMSE:",
            result["backtest_metrics"]["RMSE"]
        )

        print(
            "MAPE:",
            result["backtest_metrics"]["MAPE"]
        )

        print(
            "Error standard deviation:",
            result["error_standard_deviation"]
        )

        print()
        print("6-WEEK FORECAST")
        print("-----------------------------------")

        for item in result["forecast"]:

            print(
                item["week"],
                "->",
                item["forecast"],
                "±",
                item["uncertainty"],
                "USD/tonne"
            )

    else:

        print(
            "Error:",
            result["message"]
        )