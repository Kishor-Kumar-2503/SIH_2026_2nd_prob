from database import SessionLocal
from models import Port


def seed_ports():
    db = SessionLocal()

    try:
        existing_count = db.query(Port).count()

        if existing_count > 0:
            print(
                f"Port database already contains "
                f"{existing_count} records."
            )
            return

        ports = [
            Port(
                name="Port of Newcastle",
                country="Australia",
                cargo="Coking Coal",
                draft="16.2 m",
                status="Operational",
            ),

            Port(
                name="Port of Gladstone",
                country="Australia",
                cargo="Bulk Cargo",
                draft="18.0 m",
                status="Operational",
            ),

            Port(
                name="Paradip Port",
                country="India",
                cargo="Coal / Bulk",
                draft="17.1 m",
                status="Operational",
            ),

            Port(
                name="Visakhapatnam Port",
                country="India",
                cargo="Coking Coal",
                draft="18.1 m",
                status="Operational",
            ),
        ]

        db.add_all(ports)
        db.commit()

        print(
            f"Successfully inserted "
            f"{len(ports)} ports."
        )

    except Exception as error:
        db.rollback()
        print("Error while inserting ports:")
        print(error)

    finally:
        db.close()


if __name__ == "__main__":
    seed_ports()