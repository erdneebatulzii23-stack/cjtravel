import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import pg from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Тохиргоог унших
dotenv.config();

// __dirname-ийг ES Module дээр ашиглах арга
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
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
  if (!s3Client) return res.status(503).json({ error: 'Storage not configured.' });
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
    let publicBase = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
    if (!publicBase.startsWith('http')) publicBase = `https://${publicBase}`;
    const fileUrl = `${publicBase}/${uniqueFileName}`;
    res.json({ uploadUrl: url, fileUrl: fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

// --- FRONTEND SERVING (DIST folder) ---
// Vite build хийсний дараа файлууд 'dist' хавтас руу ордог.
const clientDistPath = path.join(process.cwd(), 'dist');

console.log(`Checking for frontend build at: ${clientDistPath}`);

if (fs.existsSync(clientDistPath)) {
    // Static файлуудыг уншуулах
    app.use(express.static(clientDistPath));
    
    // API-аас бусад бүх хүсэлтийг index.html рүү явуулах (SPA)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    // Хэрэв build хийгдээгүй эсвэл dist байхгүй бол
    console.error('Build folder not found at:', clientDistPath);
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.status(500).send(`
                <h1>Deployment Error</h1>
                <p>Frontend build folder ('dist') not found.</p>
                <p>Make sure you ran 'npm run build' and index.html is in the root.</p>
                <p>Current directory: ${process.cwd()}</p>
            `);
        }
    });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
