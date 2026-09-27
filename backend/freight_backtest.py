from statistics import mean
from math import sqrt

from freight_preprocessing import get_clean_freight_data
from freight_forecasting import calculate_linear_trend


def calculate_forecast(
    historical_rates,
    forecast_periods=1,
    recent_periods=12
):
    """
    Generate forecasts using only the historical data
    available at that point in time.
    """

    if len(historical_rates) < recent_periods:
        return []

    recent_rates = historical_rates[-recent_periods:]

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

        predicted_rate = (
            0.7 * trend_prediction
            + 0.3 * recent_average
        )

        predicted_rate = max(
            predicted_rate,
            0
        )

        forecasts.append(
            predicted_rate
        )

    return forecasts


def calculate_mae(actual, predicted):
    """
    Mean Absolute Error
    """

    errors = []

    for actual_value, predicted_value in zip(
        actual,
        predicted
    ):

        errors.append(
            abs(
                actual_value
                - predicted_value
            )
        )

    if not errors:
        return 0

    return mean(errors)


def calculate_rmse(actual, predicted):
    """
    Root Mean Squared Error
    """

    squared_errors = []

    for actual_value, predicted_value in zip(
        actual,
        predicted
    ):

        error = (
            actual_value
            - predicted_value
        )

        squared_errors.append(
            error ** 2
        )

    if not squared_errors:
        return 0

    return sqrt(
        mean(squared_errors)
    )


def calculate_mape(actual, predicted):
    """
    Mean Absolute Percentage Error
    """

    percentage_errors = []

    for actual_value, predicted_value in zip(
        actual,
        predicted
    ):

        if actual_value == 0:
            continue

        error = abs(
            (
                actual_value
                - predicted_value
            )
            / actual_value
        ) * 100

        percentage_errors.append(error)

    if not percentage_errors:
        return 0

    return mean(percentage_errors)


def run_backtest():

    # =================================================
    # Load cleaned historical data
    # =================================================

    data = get_clean_freight_data()

    if data["status"] != "success":

        return {
            "status": "error",
            "message": data["message"]
        }

    rates = [
        float(item["rate"])
        for item in data["time_series"]
    ]

    dates = [
        item["date"]
        for item in data["time_series"]
    ]

    # =================================================
    # Backtest configuration
    # =================================================

    recent_periods = 12

    minimum_training_size = 18

    actual_values = []

    predicted_values = []

    test_results = []

    # =================================================
    # Walk-forward testing
    # =================================================

    for test_index in range(
        minimum_training_size,
        len(rates)
    ):

        training_data = rates[:test_index]

        actual_value = rates[test_index]

        prediction = calculate_forecast(
            training_data,
            forecast_periods=1,
            recent_periods=recent_periods
        )

        if not prediction:
            continue

        predicted_value = prediction[0]

        actual_values.append(
            actual_value
        )

        predicted_values.append(
            predicted_value
        )

        test_results.append({
            "date": dates[test_index],
            "actual": round(
                actual_value,
                2
            ),
            "predicted": round(
                predicted_value,
                2
            ),
            "error": round(
                abs(
                    actual_value
                    - predicted_value
                ),
                2
            )
        })

    # =================================================
    # Calculate performance metrics
    # =================================================

    mae = calculate_mae(
        actual_values,
        predicted_values
    )

    rmse = calculate_rmse(
        actual_values,
        predicted_values
    )

    mape = calculate_mape(
        actual_values,
        predicted_values
    )

    return {

        "status": "success",

        "model": "Linear Trend + Recent Average",

        "training_window": recent_periods,

        "test_observations": len(
            actual_values
        ),

        "metrics": {

            "MAE": round(
                mae,
                4
            ),

            "RMSE": round(
                rmse,
                4
            ),

            "MAPE": round(
                mape,
                2
            )
        },

        "test_results": test_results
    }


# =====================================================
# RUN BACKTEST
# =====================================================

if __name__ == "__main__":

    result = run_backtest()

    print()
    print("===================================")
    print("FREIGHT FORECAST MODEL BACKTEST")
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
            "Training window:",
            result["training_window"],
            "weeks"
        )

        print(
            "Test observations:",
            result["test_observations"]
        )

        print()
        print("MODEL PERFORMANCE")
        print("-----------------------------------")

        print(
            "MAE:",
            result["metrics"]["MAE"]
        )

        print(
            "RMSE:",
            result["metrics"]["RMSE"]
        )

        print(
            "MAPE:",
            result["metrics"]["MAPE"],
            "%"
        )

        print()
        print("WALK-FORWARD TEST RESULTS")
        print("-----------------------------------")

        for item in result["test_results"]:

            print(
                item["date"],
                "| Actual:",
                item["actual"],
                "| Predicted:",
                item["predicted"],
                "| Error:",
                item["error"]
            )

    else:

        print(
            "Error:",
            result["message"]
        )