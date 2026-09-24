# SkillShare API Postman Tests

This directory contains the automated Postman API test suite for the SkillShare application.

## Prerequisites
- **PostgreSQL** must be running locally (`localhost:5432`).
- **Backend Application** must be running.

## Backend Startup
From the `skillshare-backend` directory, run:
```bash
./mvnw spring-boot:run
```

## How to use in Postman
1. Open Postman.
2. Click **Import** and select both:
   - `SkillShare-API.postman_collection.json`
   - `SkillShare-Local.postman_environment.json`
3. Ensure the environment dropdown in the top right is set to **SkillShare-Local**.
4. You can run individual requests, or run the entire collection using the **Runner**.

## How to run using Newman (CLI)
You can run this suite headlessly in your terminal. This is excellent for regression testing.

Ensure Newman is installed globally:
```bash
npm install -g newman
```

Run the suite:
```bash
newman run qa/postman/SkillShare-API.postman_collection.json -e qa/postman/SkillShare-Local.postman_environment.json
```

## Optional: HTML Reporting
For a highly professional HTML report (great for university presentations):

1. Install the reporter:
```bash
npm install -g newman-reporter-htmlextra
```
2. Run with the reporter:
```bash
newman run qa/postman/SkillShare-API.postman_collection.json \
  -e qa/postman/SkillShare-Local.postman_environment.json \
  -r cli,htmlextra \
  --reporter-htmlextra-export qa/postman/reports/report.html
```
3. Open `qa/postman/reports/report.html` in your browser.

## Test Data & Variables Behavior
- **Dynamic Emails:** To prevent "Email is already taken!" errors on consecutive runs, the pre-request scripts generate dynamic email addresses (`mentor_<timestamp>@test.com`).
- **Dynamic Skill/Availability/Session IDs:** Instead of relying on hardcoded Database IDs, the tests extract real IDs from the creation responses and pass them to subsequent requests via Collection Variables.
- **Date/Time Handling:** The availability creation script automatically generates a local timestamp (in `YYYY-MM-DDTHH:mm:ss` format) starting precisely 5 minutes in the future to safely satisfy backend rules.

## Completion Lifecycle Behavior
- **Early Completion Supported:** The backend supports marking an accepted session as `COMPLETED` prior to its scheduled end time. The completion request succeeds with `HTTP 200 OK`.
- **Automated Validation:** The `07 Completion Lifecycle` tests in the Postman collection validate this behavior directly during automated Newman runs without requiring manual wait delays.


## What should NOT be committed
- Do not commit the generated `reports/` directory.
- Do not commit production secrets (e.g., if you ever create a `SkillShare-Prod.postman_environment.json`).
