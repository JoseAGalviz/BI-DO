// Run once to configure CORS on the DO Spaces bucket so browsers can PUT directly.
// Usage: node setup-cors.js
require('dotenv').config();
const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: process.env.DO_ENDPOINT,
  region: process.env.DO_REGION,
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY,
    secretAccessKey: process.env.DO_SECRET_KEY,
  },
  forcePathStyle: false,
});

async function main() {
  await s3.send(new PutBucketCorsCommand({
    Bucket: process.env.DO_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET', 'PUT', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }));
  console.log('CORS configured on', process.env.DO_BUCKET);

  const { CORSRules } = await s3.send(new GetBucketCorsCommand({ Bucket: process.env.DO_BUCKET }));
  console.log('Active rules:', JSON.stringify(CORSRules, null, 2));
}

main().catch((err) => { console.error(err.message); process.exit(1); });
