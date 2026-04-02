"""Create a demo user for testing the Kashana app."""
import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, text
from app.database import async_session_factory, engine, Base, create_tables
from app.models.contacts import User
import app.models  # noqa: F401 - register all models
from app.auth.utils import get_password_hash


DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo1234"
DEMO_EMAIL = "demo@kashana.dev"


async def create_demo_user():
    async with async_session_factory() as db:
        # Check if user already exists
        result = await db.execute(select(User).where(User.username == DEMO_USERNAME))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"User '{DEMO_USERNAME}' already exists (id={existing.id}). Updating password...")
            existing.password = get_password_hash(DEMO_PASSWORD)
            existing.is_staff = True
            existing.is_active = True
            await db.commit()
            print(f"Password updated. Login with: {DEMO_USERNAME} / {DEMO_PASSWORD}")
            return

        user = User(
            username=DEMO_USERNAME,
            password=get_password_hash(DEMO_PASSWORD),
            email=DEMO_EMAIL,
            first_name="Demo",
            last_name="User",
            is_staff=True,
            is_superuser=False,
            is_active=True,
            date_joined="2026-03-27",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f"Created demo user (id={user.id})")
        print(f"Login with: {DEMO_USERNAME} / {DEMO_PASSWORD}")


async def create_demo_logframe():
    """Create a sample logframe with some data if none exists."""
    async with async_session_factory() as db:
        from app.models.logframe import Logframe, Rating, Result, Indicator, SubIndicator, Activity, Column, RiskRating, Period, StatusCode, BudgetLine
        from app.models.appconf import Settings

        result = await db.execute(select(Logframe))
        existing = result.scalars().all()

        if existing:
            print(f"Found {len(existing)} existing logframe(s): {[lf.name for lf in existing]}")
            return

        # Create a sample logframe
        lf = Logframe(name="Demo Logframe - Education Programme")
        db.add(lf)
        await db.commit()
        await db.refresh(lf)
        print(f"Created logframe: '{lf.name}' (id={lf.id})")

        # Settings
        settings = Settings(
            logframe_id=lf.id,
            name="Demo Logframe - Education Programme",
            description="A demonstration logframe for testing the Kashana application.",
            start_month=4,
            start_year=2025,
            end_year=2027,
            n_periods=4,
            currency="USD",
        )
        db.add(settings)

        # Columns (target, baseline, actual)
        cols = []
        for name in ["Baseline", "Target", "Actual"]:
            c = Column(name=name, logframe_id=lf.id)
            db.add(c)
            cols.append(c)
        await db.commit()
        for c in cols:
            await db.refresh(c)

        # Ratings (colored status dots for results)
        rating_data = [
            ("On Track", "#16a34a"),
            ("Caution", "#f59e0b"),
            ("Off Track", "#dc2626"),
            ("Not Rated", "#9ca3af"),
        ]
        ratings = []
        for name, color in rating_data:
            r = Rating(name=name, color=color, logframe_id=lf.id)
            db.add(r)
            ratings.append(r)
        await db.commit()
        for r in ratings:
            await db.refresh(r)

        # Risk ratings
        for name in ["Low", "Medium", "High"]:
            db.add(RiskRating(name=name, logframe_id=lf.id))

        # Status codes
        for name, desc in [("On Track", "Progress is as planned"), ("Delayed", "Behind schedule"), ("At Risk", "May not achieve targets")]:
            db.add(StatusCode(name=name, description=desc, logframe_id=lf.id))

        # Periods
        periods = []
        for i, (sm, sy, em, ey) in enumerate([
            (4, 2025, 6, 2025), (7, 2025, 9, 2025),
            (10, 2025, 12, 2025), (1, 2026, 3, 2026),
        ]):
            p = Period(start_month=sm, start_year=sy, end_month=em, end_year=ey, logframe_id=lf.id)
            db.add(p)
            periods.append(p)
        await db.commit()

        # Impact level result
        r1 = Result(name="Improved educational outcomes for target communities", order=1, level=1, logframe_id=lf.id)
        db.add(r1)
        await db.commit()
        await db.refresh(r1)

        # Outcome level result
        r2 = Result(name="Increased school enrollment and attendance", order=2, level=2, logframe_id=lf.id)
        db.add(r2)
        await db.commit()
        await db.refresh(r2)

        # Output level results
        r3 = Result(name="School infrastructure improved", order=3, level=3, logframe_id=lf.id, parent_id=r2.id)
        r4 = Result(name="Teachers trained in modern methods", order=4, level=3, logframe_id=lf.id, parent_id=r2.id)
        db.add_all([r3, r4])
        await db.commit()
        await db.refresh(r3)
        await db.refresh(r4)

        # Assign ratings to some results
        r1.rating_id = ratings[0].id  # On Track
        r2.rating_id = ratings[1].id  # Caution
        r3.rating_id = ratings[0].id  # On Track
        r4.rating_id = ratings[2].id  # Off Track
        await db.commit()

        # Indicators for r2
        i1 = Indicator(name="% increase in enrollment", order=1, result_id=r2.id, source_of_verification="School records")
        db.add(i1)
        await db.commit()
        await db.refresh(i1)

        # Default subindicator
        si1 = SubIndicator(name="Girls enrollment", order=1, indicator_id=i1.id)
        si2 = SubIndicator(name="Boys enrollment", order=2, indicator_id=i1.id)
        db.add_all([si1, si2])

        # Indicators for r3
        i2 = Indicator(name="Number of classrooms renovated", order=1, result_id=r3.id, source_of_verification="Site inspection reports")
        db.add(i2)
        await db.commit()
        await db.refresh(i2)
        si3 = SubIndicator(name="Primary classrooms", order=1, indicator_id=i2.id)
        db.add(si3)

        # Indicators for r4
        i3 = Indicator(name="Number of teachers completing training", order=1, result_id=r4.id, source_of_verification="Training certificates")
        db.add(i3)
        await db.commit()
        await db.refresh(i3)
        si4 = SubIndicator(name="Female teachers", order=1, indicator_id=i3.id)
        si5 = SubIndicator(name="Male teachers", order=2, indicator_id=i3.id)
        db.add_all([si4, si5])

        # Activities for r3
        a1 = Activity(name="Renovate 10 primary school classrooms", order=1, result_id=r3.id)
        a2 = Activity(name="Install water and sanitation facilities", order=2, result_id=r3.id)
        db.add_all([a1, a2])
        await db.commit()
        await db.refresh(a1)
        await db.refresh(a2)

        # Budget lines
        db.add(BudgetLine(name="Construction materials", amount=50000.0, activity_id=a1.id))
        db.add(BudgetLine(name="Labor costs", amount=30000.0, activity_id=a1.id))
        db.add(BudgetLine(name="WASH facilities", amount=25000.0, activity_id=a2.id))

        # Activities for r4
        a3 = Activity(name="Conduct 5-day teacher training workshops", order=1, result_id=r4.id)
        db.add(a3)
        await db.commit()
        await db.refresh(a3)
        db.add(BudgetLine(name="Workshop costs", amount=15000.0, activity_id=a3.id))
        db.add(BudgetLine(name="Training materials", amount=5000.0, activity_id=a3.id))

        await db.commit()
        print("Created sample results, indicators, activities, and budget lines.")


async def main():
    # Create all tables
    await create_tables()
    print("Database tables created.")

    await create_demo_user()
    await create_demo_logframe()
    print("\nReady! Open http://localhost:5173 and login with: demo / demo1234")


if __name__ == "__main__":
    asyncio.run(main())
