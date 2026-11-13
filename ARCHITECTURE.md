# CollabDocs – System Architecture

## 1. Project Overview

CollabDocs is a lightweight collaborative document editor inspired by Google Docs. It allows authenticated users to create, rename, edit, import, save, and share documents through a web application.

**Live application:** https://collabdocs-ch7lyeoyr-rayyan-f37a.vercel.app

**Source code:** https://github.com/RayyanA24/collabdocs

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS |
| Rich-text editor | Tiptap |
| Backend | Next.js API Routes |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Authorization | Supabase Row Level Security |
| Validation | Zod |
| Testing | Vitest |
| Deployment | Vercel |
| Version control | Git and GitHub |

## 3. High-Level Architecture

The application follows a client-server architecture.

1. The browser renders the user interface using Next.js and React.
2. Supabase Auth manages user authentication.
3. Next.js API routes handle document operations and sharing requests.
4. Supabase PostgreSQL stores document and sharing information.
5. Row Level Security policies enforce database access permissions.
6. Vercel hosts the deployed Next.js application.

## 4. Main Components

### Frontend

- AuthForm: Handles user authentication.
- DocumentList: Displays owned and shared documents.
- Editor: Provides rich-text editing functionality.
- NewDocumentActions: Provides document creation and import actions.
- SharePanel: Handles document sharing.
- SignOutButton: Handles user sign-out.

### Backend

The application uses Next.js API routes:

- `POST /api/documents` – Create a document.
- `GET /api/documents` – Retrieve accessible documents.
- `GET /api/documents/[id]` – Retrieve a document.
- `PATCH /api/documents/[id]` – Update document information and content.
- `DELETE /api/documents/[id]` – Delete a document.
- `/api/documents/[id]/shares` – Manage document sharing.
- `/api/documents/import` – Import supported text or Markdown files.

## 5. Database Design

The Supabase database contains three primary tables.

### profiles

Stores user profile information associated with authenticated Supabase users.

### documents

Stores document information, including:

- Document ID
- Owner ID
- Title
- Document content
- Creation and update timestamps

### document_shares

Stores document-sharing relationships, including:

- Document ID
- Shared user ID
- Access role
- Sharing metadata

The database uses relationships between these tables to associate documents with owners and shared users.

## 6. Authentication and Authorization

Supabase Auth provides user authentication.

The application distinguishes between document owners and users who receive shared access.

Supported sharing roles:

- **Owner:** Manages the document.
- **Editor:** Can edit a shared document.
- **Viewer:** Can access a shared document without editing it.

Authorization is enforced through server-side permission checks and Supabase Row Level Security policies.

## 7. Document Editing and Persistence

Tiptap provides the rich-text editing interface.

Supported formatting includes:

- Bold
- Italic
- Underline
- Headings
- Bullet lists
- Numbered lists

Document changes are saved through the application's document API. The editor supports automatic saving and an explicit Save action.

Document persistence is provided by Supabase PostgreSQL.

## 8. File Import

The application supports importing TXT and Markdown files.

The import endpoint validates incoming files and creates documents from supported file content.

The application applies file-size and content validation before processing imports.

## 9. Deployment

The application is deployed using Vercel.

Supabase provides authentication and database services.

The deployment uses the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The publishable key is used for client-side Supabase access. Database security relies on Row Level Security and server-side authorization checks.

## 10. Testing

The project includes automated tests using Vitest.

Test suites cover:

- Document operations
- Import validation
- Permission logic
- Input validation

Manual testing was also performed on the deployed application, covering authentication, document creation, renaming, rich-text editing, persistence, file import, and sharing.

## 11. Known Limitations and Future Improvements

Potential improvements include:

- Real-time collaborative editing.
- Conflict resolution for simultaneous edits.
- Document version history.
- Comments and presence indicators.
- Additional file import and export formats.
- More extensive automated end-to-end tests.

The current application provides a lightweight document editing and sharing experience rather than full real-time collaboration.