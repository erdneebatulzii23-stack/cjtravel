require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
const port = process.env.PORT || 8080;

// 1. Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 2. Database Connection
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
} else {
    console.log("Warning: DATABASE_URL not set. Database features will fail.");
}

// 3. Storage Connection
let s3Client = null;
if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
}

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
  res.send('CJ Travel Backend is running!');
});

app.post('/api/upload-url', async (req, res) => {
  if (!s3Client) {
      return res.status(503).json({ error: 'Storage not configured.' });
  }
  try {
    const { fileName, fileType } = req.body;
    const uniqueFileName = `uploads/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
      ACL: 'public-read'
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Handle Public URL formatting (ensure https://)
    let publicBase = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
    if (!publicBase.startsWith('http')) {
        publicBase = `https://${publicBase}`;
    }
    
    const fileUrl = `${publicBase}/${uniqueFileName}`;
    res.json({ uploadUrl: url, fileUrl: fileUrl });
  } catch (error) {
    console.error('Storage Error:', error);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

// --- DIGITAL OCEAN STATIC FILE SERVING ---

// Determine the correct path relative to the root of the project
// Assuming server is started via "node backend/server.js" from root
const clientDistPath = path.join(process.cwd(), 'dist/client');

console.log(`Checking for static files at: ${clientDistPath}`);

if (fs.existsSync(clientDistPath)) {
    console.log('Static files directory found.');
    app.use(express.static(clientDistPath));
} else {
    console.error(`ERROR: Static files directory NOT found at ${clientDistPath}`);
    // Log directory contents to help debug
    try {
        console.log('Contents of root:', fs.readdirSync(process.cwd()));
        if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
            console.log('Contents of dist:', fs.readdirSync(path.join(process.cwd(), 'dist')));
        }
    } catch (e) {
        console.error('Error listing directories:', e);
    }
}

// Catch-all route: For any request not starting with /api
app.get('*', (req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <h1>Application Not Built</h1>
            <p>The backend is running, but the frontend files are missing.</p>
            <p>Expected path: ${indexPath}</p>
            <p>Please check the Build Logs in DigitalOcean.</p>
        `);
    }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
