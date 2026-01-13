# Cloud Storage Setup Guide for Modular Gunworks

This guide explains how to set up cloud image storage for your admin system.

## Option 1: AWS S3 (Recommended for E-commerce)

**Pros:**
- Most popular for e-commerce
- Excellent performance and reliability
- Scales from 0 to millions of images
- Integrates well with CDNs
- Pay only for what you use (~$0.023 per GB storage/month)

**Setup Steps:**

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Sign up for free tier (includes 5GB free storage for 12 months)
3. Create an IAM user with S3 permissions

### Step 2: Create S3 Bucket
```bash
# Via AWS CLI (install from: https://aws.amazon.com/cli/)
aws s3 mb s3://modular-gunworks-products --region us-east-1
```

### Step 3: Install AWS SDK
```bash
npm install aws-sdk
```

### Step 4: Add to admin.js
```javascript
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Upload function
async function uploadToS3(fileBuffer, filename, category) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `products/${category}/${filename}`,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.Location);
    });
  });
}
```

### Step 5: Set Environment Variables
Create a `.env` file:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=modular-gunworks-products
```

## Option 2: Google Cloud Storage

**Pros:**
- Good integration with Google services
- Competitive pricing
- Free tier: 5GB storage
- Excellent for global distribution

**Setup:**
1. Create Google Cloud account: https://cloud.google.com
2. Create a Storage bucket
3. Install Google Cloud SDK: `npm install @google-cloud/storage`
4. Set up service account credentials

## Option 3: Firebase Storage

**Pros:**
- Easiest to set up
- Real-time database integration
- Google-backed
- Free tier: 5GB storage

**Setup:**
1. Go to https://firebase.google.com
2. Create a new project
3. Enable Storage
4. Get your credentials
5. Install: `npm install firebase-admin`

## Option 4: Cloudinary (SaaS)

**Pros:**
- Auto image optimization
- Built-in CDN
- Image transformations
- Free plan: 10GB/month

**Setup:**
1. Sign up: https://cloudinary.com
2. Get API key
3. Install: `npm install cloudinary`

---

## Implementation in Admin System

### Update admin.js

Replace the current image upload handler with cloud storage:

```javascript
// ROUTES: IMAGE UPLOAD (with S3)
app.post('/api/images/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { category, sku } = req.body;
    const filename = `${sku || Date.now()}.jpg`;
    
    // Upload to S3
    const s3Url = await uploadToS3(
      req.file.buffer,
      filename,
      category || 'products'
    );

    // Update product with image URL
    if (sku) {
      const categories = ['ammunition', 'guns', 'optics', 'magazines', 'gun-parts', 'gear', 'reloading', 'survival'];
      for (const cat of categories) {
        try {
          const filePath = path.join(DATA_DIR, `${cat}-data.json`);
          const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          const product = data.products.find(p => p.sku === sku);
          
          if (product) {
            product.image = s3Url;
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }
    }

    res.json({
      success: true,
      imageUrl: s3Url,
      message: 'Image uploaded to cloud successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Update admin.html

```html
<div id="image-result" style="display: none;"></div>

<!-- Results will show cloud URL -->
```

---

## Cost Comparison

| Service | Storage Cost | Transfer Cost | Free Tier |
|---------|-------------|---------------|-----------|
| AWS S3 | $0.023/GB | $0.09/GB | 5GB/year |
| Google Cloud | $0.020/GB | $0.12/GB | 5GB/month |
| Firebase | $0.018/GB | Free | 5GB/month |
| Cloudinary | Included | Included | 10GB/month |

---

## Recommended Setup for Modular Gunworks

**For 81,000 products with images (assume 300KB avg):**
- Total storage: ~24GB
- Monthly storage cost (AWS S3): ~$0.55
- Monthly transfer cost: ~$2.16
- **Total: ~$2.71/month**

**Recommendation:** Start with AWS S3 free tier. When you exceed 5GB, upgrade to paid. At your scale, S3 is cheapest and most reliable.

---

## Quick Start: Using S3 with Current Admin

1. **Install AWS SDK:**
   ```bash
   npm install aws-sdk
   ```

2. **Create `.env` file:**
   ```
   AWS_ACCESS_KEY_ID=your_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_here
   S3_BUCKET_NAME=modular-gunworks-products
   ```

3. **Update admin.js** to use the uploadToS3 function above

4. **Restart admin server:**
   ```bash
   node admin.js
   ```

That's it! Images will now upload to AWS S3 automatically.

---

## Questions?

- AWS S3 Help: https://docs.aws.amazon.com/s3/
- Firebase Docs: https://firebase.google.com/docs/storage
- Google Cloud: https://cloud.google.com/storage/docs

