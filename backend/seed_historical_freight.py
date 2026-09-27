from datetime import datetime, timedelta
import math

from database import SessionLocal
from models import FreightObservation


def seed_historical_freight():
    db = SessionLocal()

    try:
        # Prevent duplicate synthetic data
        existing = (
            db.query(FreightObservation)
            .filter(
                FreightObservation.source == "Synthetic Test Data"
            )
            .count()
        )

        if existing > 0:
            print(
                f"Synthetic historical freight data already exists "
                f"({existing} records)."
            )
            return

        # Start of the historical test period
        start_date = datetime(2026, 1, 2)

        observations = []

        # Generate 39 weekly observations
        for week in range(39):

            observation_date = start_date + timedelta(
                weeks=week
            )

            # Synthetic freight-rate pattern
            #
            # Base trend:
            # gradually increases over time
            trend = 24.2 + (week * 0.075)

            # Small repeating market movement
            seasonal = 0.45 * math.sin(week / 2.5)

            # Additional market variation
            variation = 0.18 * math.sin(week * 1.7)

            rate = trend + seasonal + variation

            # Round to 2 decimal places
            rate = round(rate, 2)

            observation = FreightObservation(
                commodity="Coking Coal",
                rate=rate,
                currency="USD",
                unit="tonne",
                source="Synthetic Test Data",
                observation_time=observation_date
            )

            observations.append(observation)

        db.add_all(observations)
        db.commit()

        print(
            f"Successfully inserted "
            f"{len(observations)} historical freight observations."
        )

        print("Commodity: Coking Coal")
        print("Unit: USD/tonne")
        print("Source: Synthetic Test Data")
        print(
            f"Period: {start_date.date()} "
            f"to {observations[-1].observation_time.date()}"
        )

    except Exception as error:
        db.rollback()

        print("Error while inserting historical freight data:")
        print(error)

    finally:
        db.close()


if __name__ == "__main__":
    seed_historical_freight()