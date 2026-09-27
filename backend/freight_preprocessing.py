from statistics import mean

from database import SessionLocal
from models import FreightObservation


def get_clean_freight_data():
    """
    Load freight observations from the database,
    clean them, validate them, and prepare
    a chronological time series for forecasting.
    """

    db = SessionLocal()

    try:
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

        if not observations:
            return {
                "status": "error",
                "message": "No freight observations found."
            }

        # =================================================
        # 1. Convert database records
        # =================================================

        raw_data = []

        for observation in observations:
            raw_data.append({
                "date": observation.observation_time,
                "rate": observation.rate,
                "source": observation.source or "Unknown"
            })

        # =================================================
        # 2. Sort chronologically
        # =================================================

        raw_data.sort(
            key=lambda item: item["date"]
        )

        # =================================================
        # 3. Data-quality checks
        # =================================================

        validation_errors = []
        warnings = []

        # -------------------------------------------------
        # Check missing dates / rates
        # -------------------------------------------------

        for index, item in enumerate(raw_data):

            if item["date"] is None:
                validation_errors.append({
                    "type": "missing_date",
                    "index": index
                })

            if item["rate"] is None:
                validation_errors.append({
                    "type": "missing_rate",
                    "index": index
                })

        # -------------------------------------------------
        # Check invalid freight rates
        # -------------------------------------------------

        for index, item in enumerate(raw_data):

            rate = item["rate"]

            if rate is not None:

                if rate < 0:
                    validation_errors.append({
                        "type": "negative_rate",
                        "index": index,
                        "rate": rate
                    })

                elif rate == 0:
                    warnings.append({
                        "type": "zero_rate",
                        "index": index,
                        "rate": rate
                    })

        # =================================================
        # 4. Detect duplicate timestamps
        # =================================================

        duplicate_dates = []

        seen_dates = set()

        for item in raw_data:

            date_key = item["date"]

            if date_key in seen_dates:
                duplicate_dates.append(
                    date_key.isoformat()
                )
            else:
                seen_dates.add(date_key)

        if duplicate_dates:
            warnings.append({
                "type": "duplicate_timestamp",
                "count": len(duplicate_dates),
                "dates": duplicate_dates
            })

        # =================================================
        # 5. Remove duplicate timestamps
        # =================================================

        cleaned = []

        seen_dates = set()

        for item in raw_data:

            date_key = item["date"]

            if date_key in seen_dates:
                continue

            seen_dates.add(date_key)
            cleaned.append(item)

        # =================================================
        # 6. Remove records with missing values
        # =================================================

        cleaned = [
            item
            for item in cleaned
            if item["date"] is not None
            and item["rate"] is not None
        ]

        # =================================================
        # 7. Check weekly gaps
        # =================================================

        missing_weeks = []

        for i in range(1, len(cleaned)):

            previous_date = cleaned[i - 1]["date"]
            current_date = cleaned[i]["date"]

            difference_days = (
                current_date - previous_date
            ).days

            if difference_days > 7:

                missing_weeks.append({
                    "after": previous_date.isoformat(),
                    "before": current_date.isoformat(),
                    "gap_days": difference_days
                })

        if missing_weeks:
            warnings.append({
                "type": "missing_week",
                "count": len(missing_weeks)
            })

        # =================================================
        # 8. Extract rates
        # =================================================

        rates = [
            float(item["rate"])
            for item in cleaned
        ]

        if not rates:
            return {
                "status": "error",
                "message": "No valid freight rates remain after cleaning."
            }

        # =================================================
        # 9. Calculate statistics
        # =================================================

        minimum_rate = min(rates)
        maximum_rate = max(rates)
        average_rate = mean(rates)
        latest_rate = rates[-1]

        first_rate = rates[0]

        if first_rate != 0:

            movement_percentage = (
                (latest_rate - first_rate)
                / first_rate
            ) * 100

        else:

            movement_percentage = 0

        # =================================================
        # 10. Source statistics
        # =================================================

        source_counts = {}

        for item in cleaned:

            source = item["source"]

            if source not in source_counts:
                source_counts[source] = 0

            source_counts[source] += 1

        # =================================================
        # 11. Prepare clean time series
        # =================================================

        time_series = []

        for item in cleaned:

            time_series.append({
                "date": item["date"].isoformat(),
                "rate": float(item["rate"])
            })

        # =================================================
        # 12. Final validation status
        # =================================================

        if validation_errors:
            validation_status = "FAILED"
        elif warnings:
            validation_status = "PASSED_WITH_WARNINGS"
        else:
            validation_status = "PASSED"

        # =================================================
        # 13. Return cleaned dataset
        # =================================================

        return {

            "status": "success",

            "validation_status": validation_status,

            "commodity": "Coking Coal",

            "currency": "USD",

            "unit": "tonne",

            "raw_observations": len(raw_data),

            "clean_observations": len(cleaned),

            "removed_observations": (
                len(raw_data) - len(cleaned)
            ),

            "statistics": {

                "minimum": round(
                    minimum_rate,
                    2
                ),

                "maximum": round(
                    maximum_rate,
                    2
                ),

                "average": round(
                    average_rate,
                    2
                ),

                "latest": round(
                    latest_rate,
                    2
                ),

                "movement_percentage": round(
                    movement_percentage,
                    2
                )
            },

            "source_counts": source_counts,

            "validation_errors": validation_errors,

            "warnings": warnings,

            "missing_weeks": missing_weeks,

            "time_series": time_series
        }

    finally:
        db.close()


# =====================================================
# TEST THE PREPROCESSING MODULE
# =====================================================

if __name__ == "__main__":

    result = get_clean_freight_data()

    print()
    print("===================================")
    print("FREIGHT DATA QUALITY CHECK")
    print("===================================")

    print(
        "Status:",
        result["status"]
    )

    if result["status"] == "success":

        print(
            "Validation:",
            result["validation_status"]
        )

        print(
            "Raw observations:",
            result["raw_observations"]
        )

        print(
            "Clean observations:",
            result["clean_observations"]
        )

        print(
            "Removed observations:",
            result["removed_observations"]
        )

        print()
        print("Statistics")
        print("-----------------------------------")

        print(
            "Minimum:",
            result["statistics"]["minimum"]
        )

        print(
            "Maximum:",
            result["statistics"]["maximum"]
        )

        print(
            "Average:",
            result["statistics"]["average"]
        )

        print(
            "Latest:",
            result["statistics"]["latest"]
        )

        print(
            "Movement:",
            result["statistics"]["movement_percentage"],
            "%"
        )

        print()
        print("Sources")
        print("-----------------------------------")

        print(
            result["source_counts"]
        )

        print()
        print("Validation Errors")
        print("-----------------------------------")

        if result["validation_errors"]:

            for error in result["validation_errors"]:
                print(error)

        else:

            print("None")

        print()
        print("Warnings")
        print("-----------------------------------")

        if result["warnings"]:

            for warning in result["warnings"]:
                print(warning)

        else:

            print("None")

        print()
        print("Missing Weekly Gaps")
        print("-----------------------------------")

        if result["missing_weeks"]:

            for gap in result["missing_weeks"]:
                print(gap)

        else:

            print("None")

        print()
        print("===================================")