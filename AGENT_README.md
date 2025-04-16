# GeneSoft Core API - AI Agent Workspace Platform

## Overview
GeneSoft Core API is a platform service that enables users to develop projects using AI agent workspaces. Users can interact with AI through prompts, and the AI will handle the development process. The platform uses Supabase as the main database and authentication provider, with all user projects stored in GitHub repositories.

## Architecture

### Core Modules

#### 1. Project Module (`@project`)
- **Purpose**: Manages project data and information created by users
- **Key Components**:
  - `project.service.ts`: Core business logic for project management
  - `project-db-manager.service.ts`: Database operations and management
  - `project.controller.ts`: API endpoints for project operations
  - `project.module.ts`: Module configuration and dependencies
- **Features**:
  - Project creation and management
  - Project metadata handling
  - Project lifecycle management
  - Integration with other modules

#### 2. Supabase Module (`@supabase`)
- **Purpose**: Provides Supabase integration and database operations
- **Key Components**:
  - `supabase.service.ts`: Core Supabase operations and utilities
  - `supabase.controller.ts`: API endpoints for Supabase operations
  - `supabase.module.ts`: Module configuration
- **Features**:
  - Database operations
  - Authentication management
  - Data persistence
  - Real-time subscriptions

#### 3. Organization Module (`@organization`)
- **Purpose**: Manages organizational structure and project ownership
- **Key Components**:
  - `organization.service.ts`: Organization management logic
  - `organization.controller.ts`: API endpoints for organization operations
  - `organization.module.ts`: Module configuration
- **Features**:
  - Organization management
  - Team and member management
  - Access control
  - Project ownership tracking

#### 4. LLM Module (`@llm`)
- **Purpose**: Processes AI prompts and manages AI interactions
- **Key Components**:
  - `llm.service.ts`: AI processing and prompt management
  - `llm.controller.ts`: API endpoints for LLM operations
  - `llm.module.ts`: Module configuration
- **Features**:
  - AI prompt processing
  - Response generation
  - Feedback integration
  - Natural language understanding

#### 5. Development Module (`@development`)
- **Purpose**: Manages development tasks and iterations
- **Key Components**:
  - `development.service.ts`: Core development workflow logic
  - `development.controller.ts`: API endpoints for development operations
  - `development.module.ts`: Module configuration
- **Features**:
  - Task management
  - Iteration tracking
  - Status monitoring
  - Feedback integration
  - Development workflow automation

## Module Interactions
1. User creates a project through the Project module
2. Organization module manages project ownership and access
3. User interacts with AI through LLM module
4. Development module creates and manages tasks
5. Supabase module handles data persistence
6. All project code is stored in GitHub repositories

## Technology Stack
- **Backend**: NestJS
- **Database**: Supabase
- **Version Control**: GitHub
- **Authentication**: Supabase Auth
- **AI Integration**: Custom LLM Implementation

## Project Structure
```
src/modules/
├── project/           # Project management
├── supabase/         # Supabase integration
├── organization/     # Organization management
├── llm/             # AI processing
└── development/     # Development workflow
```