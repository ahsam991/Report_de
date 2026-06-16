# PLAN.md

# V2 Technologies ( Report De )

## Project Overview

V2 Technologies ( Report De ) is a web-based SQL Report Query Generator Platform.

The system allows users to upload Excel, XLSX, XLS, and CSV files and automatically generate SQL report queries based on predefined templates.

Users do not need SQL knowledge.

The platform reads uploaded files, extracts values, maps variables, and generates SQL queries while preserving template formatting.

---

# Primary Objectives

* Read Excel files completely
* Read CSV files completely
* Support large datasets
* Generate SQL automatically
* Preserve SQL formatting
* Support multiple report templates
* Support bulk query generation
* Deploy on Vercel

---

# MVP Scope

## File Upload

Supported Formats:

* XLSX
* XLS
* CSV

Requirements:

* Drag & Drop
* File Picker
* File Validation
* Upload Status
* File Metadata

---

## Excel Processing

Requirements:

* Read all sheets
* Sheet selector
* Detect headers
* Parse rows
* Parse columns
* Ignore empty rows
* Trim spaces
* Preserve values

Support:

* Text
* Number
* Date
* Mixed values

---

## Column Mapping

Auto Mapping:

Campaign ID → id

Campaign Slug → slug

Agent Alias → alias

Manual Mapping Support Required.

Persist mapping in local storage.

---

## Template Engine

Template Format:

```sql
SELECT *
FROM campaign_table
WHERE campaign_id='{{id}}'
AND slug='{{slug}}'
AND report_date='{{date}}';
```

Requirements:

* Detect placeholders
* Validate placeholders
* Replace placeholders
* Preserve formatting

---

## Default Reports

### Daily Raw Report

Template to be provided by administrator.

### Live Observation Report

Template to be provided by administrator.

### Call Checkback Report

Template to be provided by administrator.

---

## Query Generation

Workflow:

Upload File

↓

Parse Data

↓

Map Variables

↓

Select Date

↓

Select Report

↓

Generate Queries

↓

Preview Queries

↓

Copy / Download

---

## Query Preview

Features:

* Syntax Highlighting
* Copy Query
* Copy All Queries
* Expand/Collapse
* Search
* Filter

---

## Export

Export Format:

queries.sql

Structure:

```sql
-- Daily Raw Report

QUERY

QUERY

-- Live Observation Report

QUERY

QUERY
```

---

# UI Pages

## Dashboard

Overview statistics.

## Generate Reports

Main query generation page.

## Templates

Template management.

## History

Recent activities.

## Settings

Application settings.

## About

Product information.

---

# Local Storage

Store:

* Templates
* Settings
* Column Mappings
* Query History
* Recent Upload Metadata

---

# Performance Goals

Minimum:

* 5000 rows
* 300+ generated queries

Target:

* No browser freezing
* Fast parsing
* Fast rendering

Use:

* Memoization
* Virtualized Lists
* Lazy Rendering

---

# Security Rules

* Never execute SQL
* Generate text only
* Sanitize user values
* Prevent XSS
* Prevent template injection

---

# Branding

Company:

V2 Technologies

Application:

Report De

Full Name:

V2 Technologies ( Report De )

Tagline:

Upload Excel → Generate Reports Instantly

Footer:

© 2026 V2 Technologies. All Rights Reserved.

---

# Technology Stack

Frontend:

* Next.js 15
* TypeScript
* Tailwind CSS
* shadcn/ui

Libraries:

* xlsx
* papaparse
* react-hook-form
* zod
* date-fns
* lucide-react

Hosting:

* Vercel

Storage:

* Local Storage

Future:

* Supabase
* PostgreSQL

---

# Folder Structure

```text
src/
├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── utils/
├── types/
├── data/
├── config/
├── public/
```

---

# Core Modules

## File Reader

Responsibilities:

* Read XLSX
* Read XLS
* Read CSV

---

## Excel Parser

Responsibilities:

* Parse sheets
* Parse rows
* Parse headers

---

## Mapping Engine

Responsibilities:

* Auto mapping
* Manual mapping

---

## Template Engine

Responsibilities:

* Detect variables
* Replace variables
* Validate variables

---

## Query Generator

Responsibilities:

* Generate SQL
* Preserve formatting

---

## Export Engine

Responsibilities:

* Export SQL
* Download SQL

---

# Future Roadmap

Phase 2:

* Authentication
* User Accounts
* Role Management

Phase 3:

* Supabase Integration
* PostgreSQL Storage

Phase 4:

* API Access
* Audit Logs
* Cloud Templates

Phase 5:

* AI Template Builder
* Smart Variable Detection
* Query Recommendations

---

# Success Criteria

The project is considered complete when:

✅ Excel files can be uploaded

✅ CSV files can be uploaded

✅ All rows are parsed correctly

✅ Variables are mapped correctly

✅ SQL templates are preserved

✅ Queries are generated automatically

✅ Queries can be copied

✅ Queries can be downloaded

✅ Templates can be managed

✅ Application deploys successfully on Vercel

✅ Application works without backend for MVP
