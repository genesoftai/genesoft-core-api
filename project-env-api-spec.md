# Project Environment Variables API Specification

## Base URL
`/api/projects/:projectId/envs`

## Authentication
All endpoints require authentication using JWT token in the Authorization header:
`Authorization: Bearer <jwt_token>`

## Endpoints

### 1. Create Environment Variable
**Endpoint:** `POST /projects/:projectId/envs`

**URL Parameters:**
- `projectId` (string, required): The ID of the project

**Request Body:**
```json
{
  "key": "DATABASE_URL",
  "value": "postgresql://user:password@localhost:5432/db",
  "isSecret": true
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "DATABASE_URL",
  "value": "postgresql://user:password@localhost:5432/db",
  "isSecret": true,
  "createdAt": "2023-04-15T12:00:00.000Z",
  "updatedAt": "2023-04-15T12:00:00.000Z",
  "projectId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 2. List Environment Variables
**Endpoint:** `GET /projects/:projectId/envs`

**URL Parameters:**
- `projectId` (string, required): The ID of the project

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "key": "DATABASE_URL",
    "value": "**********",
    "isSecret": true,
    "createdAt": "2023-04-15T12:00:00.000Z",
    "updatedAt": "2023-04-15T12:00:00.000Z",
    "projectId": "123e4567-e89b-12d3-a456-426614174000"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "key": "API_URL",
    "value": "https://api.example.com",
    "isSecret": false,
    "createdAt": "2023-04-15T12:01:00.000Z",
    "updatedAt": "2023-04-15T12:01:00.000Z",
    "projectId": "123e4567-e89b-12d3-a456-426614174000"
  }
]
```

**Note:** Secret values are masked with asterisks in the list view.

### 3. Get Environment Variable
**Endpoint:** `GET /projects/:projectId/envs/:id`

**URL Parameters:**
- `projectId` (string, required): The ID of the project
- `id` (string, required): The ID of the environment variable

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "DATABASE_URL",
  "value": "postgresql://user:password@localhost:5432/db",
  "isSecret": true,
  "createdAt": "2023-04-15T12:00:00.000Z",
  "updatedAt": "2023-04-15T12:00:00.000Z",
  "projectId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 4. Update Environment Variable
**Endpoint:** `PUT /projects/:projectId/envs/:id`

**URL Parameters:**
- `projectId` (string, required): The ID of the project
- `id` (string, required): The ID of the environment variable

**Request Body:**
```json
{
  "value": "postgresql://user:newpassword@localhost:5432/db",
  "isSecret": true
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "DATABASE_URL",
  "value": "postgresql://user:newpassword@localhost:5432/db",
  "isSecret": true,
  "createdAt": "2023-04-15T12:00:00.000Z",
  "updatedAt": "2023-04-15T12:05:00.000Z",
  "projectId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 5. Delete Environment Variable
**Endpoint:** `DELETE /projects/:projectId/envs/:id`

**URL Parameters:**
- `projectId` (string, required): The ID of the project
- `id` (string, required): The ID of the environment variable

**Response (204 No Content):**
Empty response with status code 204.

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["key must be a string", "value must be a string"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Environment variable with id 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Data Types

### CreateProjectEnvDto
```typescript
{
  key: string;       // Required: The environment variable key
  value: string;     // Required: The environment variable value
  isSecret?: boolean; // Optional: Whether the value is secret (default: false)
}
```

### UpdateProjectEnvDto
```typescript
{
  value?: string;    // Optional: The new environment variable value
  isSecret?: boolean; // Optional: Whether the value is secret
}
```

### ProjectEnvResponseDto
```typescript
{
  id: string;        // The unique identifier of the environment variable
  key: string;       // The environment variable key
  value: string;     // The environment variable value (masked for secrets in list view)
  isSecret: boolean; // Whether the value is secret
  createdAt: Date;   // When the environment variable was created
  updatedAt: Date;   // When the environment variable was last updated
  projectId: string; // The ID of the project this environment variable belongs to
}
```

## Implementation Notes

1. All environment variable values are encrypted at rest using AES-256-GCM
2. Secret values are masked in list views but fully visible in detail views
3. The API requires authentication for all endpoints
4. All timestamps are in ISO 8601 format
5. All IDs are UUIDs 