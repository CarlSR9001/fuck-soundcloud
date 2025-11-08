# Agent Directives - Modular Structure

> **IMPORTANT:** This project uses a modular agent directive system. The full specification has been split into focused, manageable files in the `agents/` directory. This prevents agents from being overwhelmed by a single massive specification document.

## Overview

This is a self-hosted music platform (SoundCloud-class) with artist-first features, full media control, and no fake stubs. Every feature is real, tested, and production-ready.

## Core Principles

* **Artist-first:** Liner notes, stems, credits, versions, and context are first-class features
* **Own your media:** Files live on your VPS (MinIO S3), no mystery CDNs
* **No pretend dev:** Every endpoint has real effects - files exist, DB rows written, streams play
* **Performance over polish:** HLS/Opus streaming, fast search, good caching
* **Full automation:** No time estimates, just actionable todos and continuous improvement

## Modular Agent System

**Why Modular?**
- Single large specs cause agents to get confused and miss details
- Focused directives improve task completion quality
- Easier to maintain and update specific concerns
- Better separation of concerns matches development workflow

**Directory Structure:**
```
agents/
├── architecture.md      - System architecture, data model, tech stack
├── api-specs.md         - REST API endpoints, contracts, validation
├── security.md          - Security requirements, auth, authorization
├── testing.md           - Test requirements, patterns, coverage targets
├── frontend.md          - UI/UX requirements, components, player
├── workers.md           - Background jobs, media processing, queues
├── code-quality.md      - Code standards, anti-BS guardrails, patterns
├── economics.md         - Payment system, contributions, payouts
└── operations.md        - Deployment, monitoring, backups, ops
```

## How to Use This System

### For Coding Agents

1. **Always start** by reading the relevant agent directive(s) for your task
2. **Check multiple files** if your task spans concerns (e.g., API + Security)
3. **Follow the patterns** defined in code-quality.md
4. **Update the development log** at the bottom of THIS file after completing work

### Task-to-Agent Mapping

| Task Type | Read These Directives |
|-----------|----------------------|
| Adding API endpoint | `api-specs.md`, `security.md`, `testing.md` |
| Database schema change | `architecture.md`, `testing.md` |
| Authentication/Authorization | `security.md`, `api-specs.md` |
| Media processing | `workers.md`, `architecture.md` |
| Frontend feature | `frontend.md`, `api-specs.md` |
| Payment/economics | `economics.md`, `security.md` |
| Code review/refactor | `code-quality.md`, `testing.md` |
| Deployment/ops | `operations.md`, `architecture.md` |

### For Review Agents

When performing code reviews, consult:
- **Security reviews:** `security.md` + `api-specs.md`
- **Performance reviews:** `architecture.md` + `workers.md`
- **API design reviews:** `api-specs.md` + `code-quality.md`
- **Test coverage reviews:** `testing.md` + `code-quality.md`

## Current Production Readiness: 4.2/10 ❌

**Critical Blockers:**
- Broken admin authorization (see todos)
- Missing transaction management
- 13% test coverage
- No rate limiting on auth
- Multiple security vulnerabilities

See the todo list for all 45+ actionable items to reach production readiness.

## Quick Reference

**Tech Stack:**
- Frontend: Next.js 15 (TypeScript)
- Backend: NestJS (TypeScript)
- Database: PostgreSQL 15 + Redis 7
- Storage: MinIO S3
- Media: FFmpeg, audiowaveform
- Containers: Docker Compose

**Key Patterns:**
- All endpoints require explicit authentication guards
- All multi-step operations use database transactions
- All user input must be validated and sanitized
- All services must have 80%+ test coverage
- All APIs follow REST conventions with versioning

## Development Log Format

When logging work, use this format:

```markdown
### [YYYY-MM-DD HH:MM] - Agent: [agent-name] - Task: [brief description]

**What was done:**
- Specific changes made
- Files modified

**Testing:**
- Tests added/updated
- Manual verification performed

**Related todos completed:**
- [ ] Todo item 1
- [ ] Todo item 2

**Notes:**
- Any important decisions or trade-offs
- Follow-up work needed
```

---

## Development Log

### [2025-11-08 00:00] - Multiple agents - Full codebase review

**What was done:**
- Comprehensive multi-pass code review using 5 specialized agents
- Security review: 24 issues found (6 critical, 6 high, 9 medium, 3 low)
- Performance review: N+1 queries, caching gaps, missing pagination
- Architecture review: Code quality issues, type safety, duplication
- Testing review: 13% coverage, 217 tests needed
- API design review: Validation gaps, documentation missing

**Critical findings:**
- Broken admin authorization (JWT payload missing is_admin field)
- No transaction management for multi-step operations
- Only 3/23 services have tests
- Hardcoded JWT secret defaults
- Multiple security vulnerabilities

**Action taken:**
- Created modular agents/ directory structure
- Split agents.md into focused sub-agent directive files
- Added 45+ actionable todos covering all priority issues

**Related todos:**
- All todos added from review findings

**Notes:**
- Full automation approach - no time estimates, just continuous fixes
- Next: Start tackling critical security blockers

### [2025-11-08 14:30] - Agent: shared-types-worker-setup

**What was done:**
- Set up shared types package for API/worker communication
- Created job types for transcode, waveform, fingerprint, distribution
- Implemented worker infrastructure with BullMQ
- Added FFmpeg service for media processing

**Testing:**
- Worker unit tests added
- Integration tests for job processing

**Notes:**
- Clean separation between API and worker concerns
- Ready for additional job types

### [2025-11-08 04:30] - Agent: docker-infrastructure-setup

**What was done:**
- Created Docker Compose setup for all services
- Configured PostgreSQL, Redis, MinIO containers
- Set up persistent volumes and networking
- Added health checks for all services

**Testing:**
- Verified all containers start successfully
- Tested database migrations
- Confirmed storage bucket creation

**Notes:**
- Dev/prod parity achieved
- Easy to spin up full environment

---

## Navigation

**Start here:** Read this file first, then dive into relevant `agents/*.md` files based on your task.

**Need help?** Check `agents/code-quality.md` for patterns and anti-patterns.

**Doing a review?** See task-to-agent mapping above.

**Full spec preserved:** Original comprehensive spec backed up to `agents.md.backup` for reference.
