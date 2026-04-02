import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # Create user
        print("Registering...")
        res = await client.post("http://localhost:8000/api/auth/register", json={
            "email": "test456@test.com", "username": "test456", "password": "password",
            "first_name": "Test", "last_name": "User"
        })
        print(res.status_code, res.text)
        
        # Login
        print("Logging in...")
        res = await client.post("http://localhost:8000/api/auth/token", data={
            "username": "test456", "password": "password"
        })
        print(res.status_code, res.text)
        token = res.json().get("access_token")
        
        # Create org
        print("Creating org...")
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.post("http://localhost:8000/api/organisations/", json={
            "name": "Test Org 456", "slug": "test-org-456", "org_type": "NGO", "country": "US", "sector": "Other"
        }, headers=headers)
        print(res.status_code, res.text)
        try:
            org_id = res.json().get("id")
        except:
            org_id = 1
        
        # Get members
        print(f"Getting members for org {org_id}...")
        res = await client.get(f"http://localhost:8000/api/organisations/{org_id}/members/", headers=headers)
        print("Status code:", res.status_code)
        print("Headers:", res.headers)
        print("Response payload:", repr(res.text))

asyncio.run(test())
