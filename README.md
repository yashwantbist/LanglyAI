<div align="center">

LanglyAI

AI-powered French learning from A1 to B2

LanglyAI combines a structured CEFR-aligned curriculum with AI-generated explanations, bilingual examples, speaking practice, translation, progress tracking, and subscription-based access.



Live Demo · Report an Issue · View Source

</div>



Overview

LanglyAI is a full-stack language-learning platform built to help learners progress through French levels A1, A2, B1, and B2 using a guided curriculum rather than an unstructured chatbot experience.

The platform provides a 120-lesson learning path with AI-generated bilingual content, examples, exercises, quizzes, speech features, translations, progress tracking, authentication, and paid subscription access.

The project was built as an end-to-end production application, including:

Product design and frontend development

REST API and database design

AI content generation and validation

Authentication and subscription management

Third-party API integrations

Docker containerization

AWS cloud deployment

Test-gated CI/CD and scheduled health monitoring

Why I Built It

Many language-learning products fall into one of two categories:

Static lessons with limited personalization or interaction

Open-ended AI chat experiences without a structured learning path

LanglyAI combines the strengths of both. Learners follow a clear CEFR-aligned curriculum while receiving AI-generated explanations, bilingual examples, speaking support, exercises, and progress tracking.

Core Features

Structured French Curriculum

120 lessons across A1, A2, B1, and B2

Daily lesson sequence with level-based navigation

Protected access based on the learner's subscription plan

Bilingual French and English learning content

AI-Generated Lessons

OpenAI-powered lesson generation

CEFR-level prompting for appropriate vocabulary and complexity

Structured explanations, key points, examples, exercises, quizzes, and tips

JSON Schema output enforcement

AJV validation before AI-generated content is saved

Prompt versioning to support safe content regeneration

Speech and Translation

ElevenLabs text-to-speech for listening practice

ElevenLabs speech-to-text for spoken responses

Google Translate integration for contextual translation

Audio processing through the backend to keep API credentials private

Learner Progress

Lesson completion tracking

Score, accuracy, and time-spent fields

Level-specific progress retrieval

Persistent learner progress stored in MongoDB

Authentication and Account Security

Email and password registration

Secure password hashing with bcrypt

JWT-based authentication

Google OAuth login

Protected frontend routes

Password reset emails through AWS SES

Subscription Management

Stripe Checkout integration

Webhook-based subscription synchronization

FREE, A1, A2, B1, and B2 access levels

Subscription status and billing-period persistence

Route-level entitlement checks

System Architecture

flowchart TD
    U[User Browser] --> CF[Cloudflare DNS and TLS]
    CF --> NG[Nginx Frontend Container]

    NG --> SPA[React Single-Page Application]
    NG -->|/api/*| API[Node.js and Express API]

    API --> DB[(MongoDB)]
    API --> AI[OpenAI]
    API --> VOICE[ElevenLabs TTS and STT]
    API --> TRANSLATE[Google Translate]
    API --> STRIPE[Stripe]
    API --> SES[AWS SES]

    GH[GitHub Actions] --> DH[Docker Hub]
    DH --> EC2[AWS EC2]
    EC2 --> NG
    EC2 --> API

    MON[30-Minute Automated Monitoring] --> NG
    MON --> API

Request Flow

The user accesses langlyai.com through Cloudflare.

Nginx serves the compiled React application.

Requests beginning with /api are reverse-proxied to the Express backend.

The backend applies validation, authentication, subscription access rules, and business logic.

MongoDB stores users, lessons, progress, plans, and subscriptions.

External AI, voice, translation, payment, and email services are accessed only through the backend.

Clean Architecture

LanglyAI currently uses a modular layered architecture within a full-stack monorepo.

Presentation Layer

Located in frontend/app/src.

Responsibilities:

React pages and reusable components

Routing and protected routes

Authentication state

Lesson rendering

User interactions and API requests

API Layer

Located in backend/routes.

Responsibilities:

HTTP endpoints

Input handling

Status codes and API responses

Coordination between middleware, models, and external services

Primary route modules:

authroutes.js

lessonroutes.js

striperoutes.js

voiceroutes.js

translateroutes.js

Application and Domain Layer

Located across backend/middleware, curriculum data, validation schemas, and route-level services.

Responsibilities:

Authentication rules

Subscription entitlement checks

Curriculum lookup

AI prompt construction

AI-output validation

Progress updates

Subscription synchronization

Data Layer

Located in backend/models and backend/config/database.js.

Responsibilities:

MongoDB connection management

Mongoose schemas

Persistent user, lesson, progress, plan, and subscription data

Integration Layer

External services are isolated behind backend routes and configuration modules:

OpenAI for lesson generation

ElevenLabs for text-to-speech and speech-to-text

Google Translate for translations

Stripe for payments and subscriptions

Google OAuth for social authentication

AWS SES for transactional email

Infrastructure Layer

Docker images for frontend and backend

Nginx for static hosting and API reverse proxying

Docker Compose for container orchestration

Docker Hub for image storage

AWS EC2 for application hosting

Cloudflare for domain routing and edge TLS

GitHub Actions for CI/CD and scheduled monitoring

Repository Structure

LanglyAI/
├── .github/
│   └── workflows/
│       ├── test.yml            # Tests, build, E2E, and Docker validation
│       ├── deploy.yml          # Test-gated image push and EC2 deployment
│       └── monitor.yml         # Scheduled production health checks
├── backend/
│   ├── config/                 # Database, OAuth, and AWS SES configuration
│   ├── data/                   # Curriculum, blueprints, and JSON schemas
│   ├── evaluation/             # Deterministic AI-output evaluation
│   ├── middleware/             # Authentication and subscription access
│   ├── models/                 # Mongoose data models
│   ├── routes/                 # REST API modules
│   ├── tests/                  # Vitest, Supertest, AI, and performance tests
│   ├── app.js                  # Testable Express application
│   ├── Dockerfile
│   ├── package.json
│   └── server.js               # Database connection and HTTP startup
├── docs/
│   └── testing/                # Phase 6 QA evidence and release checklist
├── frontend/
│   └── app/
│       ├── e2e/                # Playwright browser tests
│       ├── public/
│       ├── src/
│       │   ├── Components/
│       │   ├── Context/
│       │   └── Pages/
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── playwright.config.js
│       └── package.json
├── docker-compose.yml
└── README.md

Technology Stack

Area

Tools

Frontend

React, React Router, Axios, Tailwind CSS, React Markdown

Backend

Node.js, Express, JavaScript ES Modules

Database

MongoDB, Mongoose

AI

OpenAI, structured JSON output, prompt versioning

Validation

AJV, JSON Schema

Voice

ElevenLabs Text-to-Speech and Speech-to-Text

Translation

Google Cloud Translation API

Authentication

JWT, bcrypt, Passport, Google OAuth 2.0

Payments

Stripe Checkout, subscription synchronization, Stripe Webhooks

Email

AWS Simple Email Service

Infrastructure

AWS EC2, Docker, Docker Compose, Nginx, Cloudflare

Testing

Vitest, Supertest, React Testing Library, jest-axe, Playwright, Autocannon

CI/CD

GitHub Actions, Docker Buildx, Docker Hub, SSH deployment

Monitoring

Scheduled GitHub Actions health checks every 30 minutes

AI Lesson Generation Pipeline

sequenceDiagram
    participant Learner
    participant React
    participant API as Express API
    participant DB as MongoDB
    participant OpenAI
    participant AJV

    Learner->>React: Open lesson
    React->>API: GET /api/lessons/:level/:dayNumber
    API->>DB: Find lesson and generated content

    alt Valid current content exists
        DB-->>API: Stored lesson
    else Content is missing or outdated
        API->>OpenAI: Generate CEFR-aligned structured lesson
        OpenAI-->>API: JSON response
        API->>AJV: Validate against lesson schema
        AJV-->>API: Validation result
        API->>DB: Save validated content and prompt version
    end

    API-->>React: Lesson response
    React-->>Learner: Render lesson and exercises

Important reliability decisions:

AI output is requested as structured JSON instead of unrestricted text.

AJV validates the response before persistence.

Prompt versions are stored with generated content.

Lessons can be regenerated when the content schema or prompt changes.

External API keys remain on the server.

Deployment and CI/CD

Every push to the main branch starts the deployment workflow.

Pull request or branch push
   ↓
Backend tests, coverage, and performance smoke
   ↓
Frontend tests and production build
   ↓
Playwright browser tests
   ↓
Validate backend and frontend Docker builds without pushing
   ↓
Merge or push to main
   ↓
Run the same reusable test workflow again
   ↓
Build and push Docker images to Docker Hub
   ↓
Copy Docker Compose configuration to AWS EC2
   ↓
Connect to EC2 through SSH
   ↓
Pull latest images and restart containers
   ↓
Run frontend and backend health checks
   ↓
Remove unused Docker images

Production Containers

Frontend: Multi-stage React build served by Nginx on port 80

Backend: Node.js 20 and Express API on port 5000

Nginx: Serves the SPA and proxies /api/* requests to the backend container

Docker Compose: Waits for the backend health check before starting the frontend and manages restart policies, environment files, networking, and health checks

Deployment Gate

The reusable workflow in .github/workflows/test.yml must succeed before the build-and-push job in deploy.yml can run. A failure in backend tests, frontend tests, the production build, Playwright, performance smoke testing, or either Docker build stops deployment.

The Docker validation job builds both production images without publishing them. Docker Hub credentials and EC2 credentials are only used later by the deployment workflow.

Monitoring and Cost Management

LanglyAI includes a scheduled GitHub Actions workflow that runs every 30 minutes and checks the frontend and backend health endpoints.

When a scheduled workflow fails, GitHub workflow notifications provide an email-based operational alert so issues can be investigated quickly.

AWS Cost Management can be used separately to review infrastructure spending. Automated cost reports are not currently part of this repository.

Planned monitoring improvements include centralized logs, request metrics, error tracking, uptime history, cloud-cost alerts, and alert severity levels.

Local Development

Prerequisites

Node.js 20

npm

MongoDB or MongoDB Atlas

Accounts and API credentials for the integrations you want to test

1. Clone the Repository

git clone https://github.com/yashwantbist/LanglyAI.git
cd LanglyAI

2. Configure the Backend

cd backend
npm install

Create backend/.env:

PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=use_a_long_random_secret
SESSION_SECRET=use_a_different_long_random_secret

FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000

OPENAI_API_KEY=your_openai_api_key

ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_DEFAULT_VOICE_ID=your_default_voice_id

GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
EMAIL_FROM=no-reply@langlyai.com

Start the backend:

npm run dev

3. Configure the Frontend

Open a second terminal:

cd frontend/app
npm install
npm start

The local applications will normally be available at:

Frontend: http://localhost:3000

Backend: http://localhost:5000

Never commit .env files, private keys, Stripe secrets, AWS credentials, or third-party API keys.

Testing

Install the backend and frontend dependencies once, then run the fast regression suites from the repository root:

npm --prefix backend ci
npm --prefix frontend/app ci
npm test

After Playwright Chromium is installed, run the full automated QA command:

cd frontend/app
npx playwright install --with-deps chromium
cd ../..
npm run test:qa

Run one suite at a time:

npm run test:backend
npm run test:frontend
npm run test:performance
npm run test:e2e

Generate a backend coverage report:

cd backend
npm run test:coverage

Generate frontend coverage:

cd frontend/app
CI=true npm test -- --runInBand --watchAll=false --coverage

Latest Local Test Evidence

The following results were executed successfully on July 31, 2026:

Check

Executed result

Backend Vitest/Supertest suites

61/61 tests passed

Frontend Jest/React Testing Library suites

34/34 tests passed

Backend performance smoke

3,404.8 requests/second, 29 ms p99, 0 errors

Frontend production build

Passed with two existing React Hook warnings

Backend statement coverage

69.69%

Frontend statement coverage

38.34%

These numbers describe a specific local execution, not a permanent badge or guarantee. GitHub Actions reruns the applicable checks for each candidate change.

The current suites and test assets cover:

API health, CORS, 404 responses, and request validation

JWT authentication and subscription-level authorization

Authentication context, login, signup, OAuth, and password-reset boundaries

Dashboard entitlements, progress, pricing, navigation, and protected routes

Authentication-page accessibility

Health-endpoint performance

Mocked Stripe, OpenAI, translation, voice, and email boundaries

Offline AI schema, bilingual completeness, content-length, and injection-leakage checks

Playwright browser E2E scenarios

Tests use isolated environment values and mocked data access. They do not call MongoDB, Stripe, OpenAI, AWS SES, ElevenLabs, or Google Translate.

Live AI evaluation is opt-in and billable. It is excluded from npm test and must not be reported as passed unless it is explicitly executed with approved credentials, pricing inputs, and thresholds.

GitHub Actions runs backend coverage, frontend tests/build, performance, Playwright, and non-publishing Docker builds for pull requests. The production deployment workflow calls the same reusable workflow and will not publish or deploy images unless all required jobs pass.

The complete Phase 6 strategy, cases, traceability, data plan, actual results, coverage, AI evaluation plan, bug template, and release checklist are available in docs/testing.

Main API Areas

Base Route

Purpose

/api/auth

Registration, login, profile, Google OAuth, and password management

/api/lessons

Curriculum, AI lesson generation, and progress tracking

/api/voice

Text-to-speech and speech-to-text

/api/translate

Translation requests

/api/stripe

Checkout, plan retrieval, subscription synchronization, and webhooks

Known Quality Gaps

The token-based password-reset frontend currently needs to be separated from the authenticated change-password form.

Frontend statement coverage is below the proposed 70% release target.

Stripe and authentication backend routes remain below the proposed 80% critical-route coverage target.

Live MongoDB and third-party provider integration tests have not been executed as part of the deterministic suite.

Live AI accuracy, relevance, hallucination, safety, bias, latency, cost, and adversarial evaluation remain release work.

Existing React Hook dependency warnings remain in Dashboard.jsx and Lesson.jsx.

Dependency-audit findings require triage before an unconditional production-readiness sign-off.

Roadmap: What Comes Next

Next Priority: AI Evaluation and Quality Dashboard

The next major feature is an evaluation pipeline that will automatically assess generated lessons for:

CEFR-level alignment

Factual and grammatical accuracy

French and English meaning consistency

Duplicate or overly similar content

Required-section completeness

Exercise and quiz validity

Learner completion, score, and accuracy signals

The evaluation results will be shown in an internal quality dashboard and used to identify weak lessons, compare prompt versions, and improve future generation.

Product Roadmap

Build the AI lesson evaluation and QA pipeline

Add an internal content-quality and prompt-performance dashboard

Add pronunciation scoring and targeted speaking feedback

Introduce adaptive lesson recommendations based on learner performance

Add spaced repetition for vocabulary and grammar review

Add teacher or administrator content-review workflows

Improve accessibility and keyboard navigation

Add authenticated end-to-end tests for registration, lessons, and Stripe test-mode flows

Add centralized logging, error tracking, and performance metrics

Add Redis caching and background job processing for AI generation

Add rollback and zero-downtime deployment support

Evaluate Kubernetes or AWS ECS as usage grows

Engineering Lessons Demonstrated

LanglyAI is more than an API wrapper. The project demonstrates experience with:

Turning a product idea into a deployed full-stack application

Designing REST APIs and MongoDB data models

Building reliable AI-generation workflows with schemas and validation

Managing authentication and subscription-based access

Integrating payment, email, voice, translation, and OAuth providers

Debugging CORS, Nginx, Docker, Stripe webhook, and cloud-deployment issues

Building automated CI/CD and production-monitoring workflows

Managing cloud costs and operational reliability

Iterating from rough prototype to a maintainable production system

Author

Yashwant Bist

Portfolio: yashwant-bist.netlify.app

LinkedIn: linkedin.com/in/yashwant-bist

GitHub: github.com/yashwantbist

