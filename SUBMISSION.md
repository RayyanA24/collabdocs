# CollabDocs – Assessment Submission

## 1. Project Information

**Project:** CollabDocs – Collaborative Document Editor

**Candidate:** Rayyan Abdullah

**Live Application:** https://collabdocs-ch7lyeoyr-rayyan-f37a.vercel.app

**GitHub Repository:** https://github.com/RayyanA24/collabdocs

**Deployment Platform:** Vercel

## 2. Project Overview

CollabDocs is a lightweight collaborative document editor inspired by Google Docs. It provides authenticated users with an interface to create, rename, edit, import, save, and share documents.

The application uses Next.js, React, TypeScript, Tiptap, and Supabase.

## 3. Implemented Features

- User authentication using Supabase Auth.
- Document creation.
- Document renaming.
- Rich-text editing.
- Bold, italic, underline, and heading formatting.
- Bullet and numbered lists.
- Automatic saving and explicit Save action.
- Document persistence using Supabase PostgreSQL.
- TXT and Markdown import support.
- Document ownership and sharing functionality.
- Viewer and Editor access roles.
- Dashboard displaying owned and shared documents.

## 4. Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Tiptap
- Supabase Auth
- Supabase PostgreSQL
- Zod
- Vitest
- Vercel
- Git and GitHub

## 5. Testing and Verification

The project includes automated tests using Vitest.

The following manual workflows were tested on the deployed application:

- User login.
- Document creation.
- Document renaming.
- Rich-text formatting.
- Document persistence after browser refresh.
- TXT file import.
- Document sharing workflow.

Sharing permissions should be considered verified only to the extent actually tested with a second registered account.

## 6. Project Documentation

The repository includes:

- `README.md` – Project setup and instructions.
- `ARCHITECTURE.md` – System architecture and design.
- `AI_WORKFLOW.md` – AI-assisted development workflow.
- `SUBMISSION.md` – Assessment submission details.

## 7. Deployment

The application is deployed on Vercel and uses Supabase for authentication and persistent database storage.

**Live URL:** https://collabdocs-ch7lyeoyr-rayyan-f37a.vercel.app

## 8. Known Limitations

- Real-time simultaneous collaborative editing is not implemented.
- Concurrent editing may result in last-write-wins behavior.
- Document version history is not implemented.
- Comments and live presence indicators are not implemented.
- Additional file formats can be supported in future improvements.

## 9. Future Improvements

- Real-time collaboration.
- Document version history.
- Comments and presence indicators.
- Additional import and export formats.
- Improved conflict resolution.
- Expanded end-to-end testing.

## 10. Submission Links

**Live Application:** https://collabdocs-ch7lyeoyr-rayyan-f37a.vercel.app

**GitHub Repository:** https://github.com/RayyanA24/collabdocs

**Walkthrough Video:** https://www.loom.com/share/b8f6dfa9e69b4603b935a0c5fafe73c8

**Google Drive Submission Folder:** To be added after creation.

## 11. Final Note

CollabDocs was developed as a lightweight document editing and sharing application. The implementation and testing details above reflect the current project state. Known limitations and future improvements are listed transparently.