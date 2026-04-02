# /run-tests — Run the test suite

Run backend tests and/or frontend type-checking.

## Usage
```
/run-tests           ← runs everything
/run-tests backend   ← backend pytest only
/run-tests frontend  ← frontend type-check only
/run-tests <keyword> ← run tests matching keyword
```

## Backend Tests
```bash
cd /Users/macbookpro/projects/chauka/backend

# Full suite
pytest tests/ -v

# Specific file
pytest tests/test_auth.py -v

# Specific keyword
pytest tests/ -v -k "result"

# With coverage
pytest tests/ --cov=app --cov-report=term-missing
```

Tests use:
- `pytest-asyncio` (async test functions with `asyncio_mode = "auto"`)
- `httpx.AsyncClient` for API integration tests
- In-memory SQLite or test database for isolation

### Test file conventions
```
backend/tests/
  conftest.py         # shared fixtures: app, client, db, test_user, auth_headers
  test_auth.py        # login, token, 401 tests
  test_<domain>.py    # CRUD tests for each router
```

## Frontend Type Check
```bash
cd /Users/macbookpro/projects/chauka/frontend
npm run type-check
```

## Frontend Lint
```bash
cd /Users/macbookpro/projects/chauka/frontend
npm run lint
```

## Tip
If tests fail due to missing migration, run:
```bash
cd backend && alembic upgrade head
```
