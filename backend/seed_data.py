from database import SessionLocal
from models import Vessel


def seed_vessels():
    db = SessionLocal()

    try:
        # Check whether vessels already exist
        existing_count = db.query(Vessel).count()

        if existing_count > 0:
            print(
                f"Vessel database already contains "
                f"{existing_count} records."
            )
            return

        vessels = [
            Vessel(
                name="Pacific Trader",
                vessel_type="Panamax",
                capacity=65000,
                location="Gladstone, Australia",
                daily_rate=18500,
                status="Available",
            ),

            Vessel(
                name="Ocean Horizon",
                vessel_type="Capesize",
                capacity=175000,
                location="Newcastle, Australia",
                daily_rate=26800,
                status="Available",
            ),

            Vessel(
                name="Eastern Star",
                vessel_type="Supramax",
                capacity=55000,
                location="Singapore",
                daily_rate=15200,
                status="In Transit",
            ),

            Vessel(
                name="Blue Meridian",
                vessel_type="Panamax",
                capacity=72000,
                location="Visakhapatnam, India",
                daily_rate=19400,
                status="Available",
            ),
        ]

        db.add_all(vessels)
        db.commit()

        print(
            f"Successfully inserted "
            f"{len(vessels)} vessels."
        )

    except Exception as error:
        db.rollback()
        print(
            "Error while inserting vessels:"
        )
        print(error)

    finally:
        db.close()


if __name__ == "__main__":
    seed_vessels()