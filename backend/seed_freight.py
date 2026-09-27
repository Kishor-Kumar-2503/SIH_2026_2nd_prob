from database import SessionLocal
from models import FreightObservation, FreightForecast


def seed_freight():

    db = SessionLocal()

    try:

        # Check whether freight data already exists
        observation_count = db.query(FreightObservation).count()
        forecast_count = db.query(FreightForecast).count()

        if observation_count > 0 or forecast_count > 0:

            print(
                f"Freight database already contains "
                f"{observation_count} observations and "
                f"{forecast_count} forecasts."
            )

            return

        # =====================================================
        # CURRENT FREIGHT OBSERVATION
        # =====================================================

        observation = FreightObservation(
            commodity="Coking Coal",
            rate=27.40,
            currency="USD",
            unit="tonne",
            source="Demo Market Data"
        )

        db.add(observation)

        # =====================================================
        # FREIGHT FORECAST
        # =====================================================

        forecasts = [

            FreightForecast(
                commodity="Coking Coal",
                week="W1",
                rate=27.40,
                confidence="Medium",
                trend="RISING"
            ),

            FreightForecast(
                commodity="Coking Coal",
                week="W2",
                rate=27.80,
                confidence="Medium",
                trend="RISING"
            ),

            FreightForecast(
                commodity="Coking Coal",
                week="W3",
                rate=28.20,
                confidence="Medium",
                trend="RISING"
            ),

            FreightForecast(
                commodity="Coking Coal",
                week="W4",
                rate=28.70,
                confidence="Medium",
                trend="RISING"
            ),

            FreightForecast(
                commodity="Coking Coal",
                week="W5",
                rate=29.10,
                confidence="Medium",
                trend="RISING"
            ),

            FreightForecast(
                commodity="Coking Coal",
                week="W6",
                rate=29.80,
                confidence="Medium",
                trend="RISING"
            ),
        ]

        db.add_all(forecasts)

        db.commit()

        print("Successfully inserted freight data.")
        print("Observation records:", 1)
        print("Forecast records:", len(forecasts))

    except Exception as error:

        db.rollback()

        print("Error while inserting freight data:")
        print(error)

    finally:

        db.close()


if __name__ == "__main__":
    seed_freight()