"""Create or promote a superuser for the Chauka admin portal.

Usage:
    # Interactive (prompts for details)
    python scripts/create_superuser.py

    # Non-interactive (all flags)
    python scripts/create_superuser.py --username admin --email admin@example.com --password secret123

    # Promote an existing user
    python scripts/create_superuser.py --promote existing_username
"""
import argparse
import asyncio
import getpass
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import async_session_factory, create_tables
from app.models.contacts import User
import app.models  # noqa: F401 - register all models
from app.auth.utils import get_password_hash


async def promote_user(username: str) -> None:
    """Promote an existing user to superuser."""
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            print(f"Error: User '{username}' not found.")
            sys.exit(1)

        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        await db.commit()
        print(f"User '{username}' (id={user.id}) promoted to superuser.")


async def create_superuser(username: str, email: str, password: str) -> None:
    """Create a new superuser account."""
    async with async_session_factory() as db:
        # Check for existing username or email
        result = await db.execute(
            select(User).where((User.username == username) | (User.email == email))
        )
        existing = result.scalar_one_or_none()
        if existing:
            if existing.username == username:
                print(f"Error: Username '{username}' already exists (id={existing.id}).")
                print(f"  To promote this user, run: python scripts/create_superuser.py --promote {username}")
            else:
                print(f"Error: Email '{email}' already in use by '{existing.username}'.")
            sys.exit(1)

        user = User(
            username=username,
            email=email,
            password=get_password_hash(password),
            first_name="",
            last_name="",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f"Superuser '{username}' created (id={user.id}).")
        print(f"Login at /login, then access the admin portal at /admin.")


def prompt_input() -> tuple[str, str, str]:
    """Interactively prompt for username, email, and password."""
    print("Create a Chauka platform superuser\n")

    username = input("Username: ").strip()
    if not username:
        print("Error: Username is required.")
        sys.exit(1)

    email = input("Email: ").strip()
    if not email:
        print("Error: Email is required.")
        sys.exit(1)

    password = getpass.getpass("Password: ")
    if len(password) < 8:
        print("Error: Password must be at least 8 characters.")
        sys.exit(1)

    password_confirm = getpass.getpass("Password (confirm): ")
    if password != password_confirm:
        print("Error: Passwords do not match.")
        sys.exit(1)

    return username, email, password


async def main() -> None:
    parser = argparse.ArgumentParser(description="Create or promote a Chauka superuser.")
    parser.add_argument("--username", help="Username for the new superuser")
    parser.add_argument("--email", help="Email for the new superuser")
    parser.add_argument("--password", help="Password (omit to be prompted securely)")
    parser.add_argument("--promote", metavar="USERNAME", help="Promote an existing user to superuser")
    args = parser.parse_args()

    await create_tables()

    if args.promote:
        await promote_user(args.promote)
        return

    if args.username and args.email:
        password = args.password
        if not password:
            password = getpass.getpass("Password: ")
            if len(password) < 8:
                print("Error: Password must be at least 8 characters.")
                sys.exit(1)
        await create_superuser(args.username, args.email, password)
    else:
        username, email, password = prompt_input()
        await create_superuser(username, email, password)


if __name__ == "__main__":
    asyncio.run(main())
