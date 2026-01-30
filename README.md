# SecureID Uploader

Secure file upload system that stores files directly in MongoDB using GridFS. No files are stored on the server filesystem.

## Features

- ✅ Upload files up to 100MB
- ✅ Files stored in MongoDB GridFS (chunked storage)
- ✅ No filesystem storage
- ✅ Vercel compatible
- ✅ Drag & drop upload
- ✅ Multiple file upload
- ✅ File categorization
- ✅ View/Download files

## Quick Start (Local)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB URI
nano .env

# Start server
npm start
```

Open http://localhost:5000

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/secureiduploader.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Select the `server` folder as the **Root Directory**

### Step 3: Configure Environment Variables

In Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/secureiduploader?retryWrites=true&w=majority` |
| `NODE_ENV` | `production` |
| `MAX_FILE_SIZE` | `104857600` |

### Step 4: Deploy

Click **Deploy**. Your app will be live at `https://your-project.vercel.app`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `PORT` | Server port (local only) | 5000 |
| `NODE_ENV` | Environment | development |
| `MAX_FILE_SIZE` | Max file size in bytes | 104857600 (100MB) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/files` | Get all files |
| `GET` | `/api/files/:id` | Get file info |
| `GET` | `/api/files/:id/download` | Download file |
| `GET` | `/api/files/:id/view` | View file |
| `GET` | `/api/files/category/:cat` | Get by category |
| `POST` | `/api/files/upload` | Upload single file |
| `POST` | `/api/files/upload-multiple` | Upload multiple files |
| `DELETE` | `/api/files/:id` | Delete file |

---

## MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Whitelist IP `0.0.0.0/0` (for Vercel)
5. Get connection string

---

## File Structure

```
server/
├── config/
│   ├── db.js          # MongoDB connection
│   └── gridfs.js      # GridFS configuration
├── controllers/
│   └── fileController.js
├── middleware/
│   └── upload.js      # Multer config
├── models/
│   └── File.js        # File schema
├── routes/
│   └── fileRoutes.js
├── public/
│   └── index.html     # Web interface
├── server.js          # Entry point
├── vercel.json        # Vercel config
├── package.json
└── .env.example
```

---

## Important Notes for Vercel

1. **Serverless Functions**: Each request is a new function instance
2. **Connection Caching**: MongoDB connections are cached between requests
3. **Timeout**: Max 60 seconds per request (Vercel Hobby plan)
4. **File Size**: Works with files up to ~50MB reliably on Vercel
5. **Memory**: Limited to 1024MB on Hobby plan

---

## License

MIT
