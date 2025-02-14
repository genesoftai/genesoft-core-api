import { registerAs } from "@nestjs/config";

export default registerAs("aws", () => ({
    awsAccessKey: process.env.AWS_ACCESS_KEY,
    awsSecretKey: process.env.AWS_SECRET_KEY,
    awsS3BucketName: process.env.AWS_S3_BUCKET_NAME,
    awsRegion: process.env.AWS_REGION,
    awsS3CustomerBucketName: process.env.AWS_S3_CUSTOMER_BUCKET_NAME,
}));
