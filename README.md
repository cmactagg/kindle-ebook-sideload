# Kindle Ebook Sideload

A minimal web application for sideloading ebooks to Kindle devices. Built with Node.js, Express, and MongoDB, designed to work with Kindle's basic web browser.

## Features

- Upload ebooks (any file format, max 100MB)
- Download ebooks with a simple click
- Organize ebooks into folders
- Delete ebooks and folders
- Maximum of 20 ebooks at a time
- Security: blocks executable and script files
- Minimal UI optimized for Kindle's e-ink browser

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with GridFS for file storage
- **Templates**: EJS (server-side rendering)
- **Hosting**: Railway

## Deployment to Railway

### 1. Create a new project on Railway

1. Go to [Railway](https://railway.app/) and create a new project
2. Connect your GitHub repository

### 2. Add MongoDB

1. In your Railway project, click "New" → "Database" → "MongoDB"
2. This will create a MongoDB instance and automatically set the `MONGO_URL` environment variable

### 3. Deploy

Railway will automatically:
- Detect the Node.js project
- Install dependencies via `npm install`
- Start the app using the `Procfile` command

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URL` | MongoDB connection string (auto-set by Railway) | Yes |
| `PORT` | Server port (auto-set by Railway) | Yes |
| `NODE_ENV` | Environment mode (`production`) | Optional |

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd kindle-ebook-sideload
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your MongoDB connection string:
   ```
   MONGO_URL=mongodb://localhost:27017/kindle-ebooks
   PORT=3000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 in your browser

## Usage

### Uploading Ebooks

1. Click "Upload" in the navigation
2. Select a file (max 100MB)
3. Optionally choose a folder
4. Click "Upload"

### Downloading Ebooks

1. Click on any ebook title to download it
2. The file will download with its original filename

### Managing Folders

1. Create a folder from the home page
2. Click on a folder to view its contents
3. Move ebooks between folders using the dropdown
4. Delete empty folders from the folder view

### Deleting Ebooks

1. Click "Delete" next to any ebook
2. Confirm the deletion

## File Security

The following file types are blocked for security:
- Executables: `.exe`, `.msi`, `.dll`, `.bat`, `.cmd`, `.sh`, etc.
- Scripts: `.js`, `.py`, `.php`, `.rb`, `.pl`, etc.
- Web files: `.html`, `.htm`, `.svg`, `.xml`, etc.
- Macros: `.docm`, `.xlsm`, `.pptm`, etc.

## Limits

- Maximum 20 ebooks at any time
- Maximum file size: 100 MB per file
- Folders must be empty before deletion

## License

MIT
