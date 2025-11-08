# Agent Directives - Sub-Agent Files

This directory contains modular agent directives for different concerns of the platform.

## Purpose

Instead of one massive 3700+ line specification file, we've split directives into focused, manageable files. This helps agents:
- Focus on relevant requirements for their task
- Avoid information overload
- Find specific guidance quickly
- Reduce confusion from unrelated context

## Files

### Core Architecture
- **architecture.md** - System architecture, data model, database schema, tech stack decisions
- **operations.md** - Deployment, Docker, monitoring, backups, health checks

### Development
- **api-specs.md** - REST API endpoints, request/response contracts, validation rules
- **frontend.md** - UI/UX requirements, components, player features
- **workers.md** - Background jobs, media processing pipeline, queue configuration

### Quality & Standards
- **code-quality.md** - Code standards, anti-BS guardrails, patterns, file organization
- **testing.md** - Test requirements, patterns, coverage targets, acceptance criteria
- **security.md** - Security requirements, authentication, authorization, vulnerability prevention

### Business Logic
- **economics.md** - Payment system, contribution model, artist payouts, charity integration

## How to Use

**For Development Tasks:**
1. Read `agents.md` in root for overview and task mapping
2. Consult 2-3 relevant directive files based on your task
3. Follow patterns and requirements strictly
4. Update development log in root `agents.md` when done

**Example Task Flows:**

Adding a new API endpoint:
1. Read `api-specs.md` for REST conventions
2. Read `security.md` for auth requirements
3. Read `testing.md` for test requirements
4. Implement endpoint + tests
5. Log work in root agents.md

Fixing a security issue:
1. Read `security.md` for requirements
2. Read `code-quality.md` for patterns
3. Read `testing.md` for security test patterns
4. Fix issue + add tests
5. Log work in root agents.md

Adding a worker job:
1. Read `workers.md` for job patterns
2. Read `architecture.md` for queue config
3. Read `testing.md` for worker tests
4. Implement job + tests
5. Log work in root agents.md

## Maintenance

When updating directives:
- Keep files focused and under 500 lines where possible
- Cross-reference related files when needed
- Update root agents.md if adding new files
- Maintain consistency across all directive files

## Original Spec

The original comprehensive 3700-line spec is preserved in `agents.md.backup` for reference.
