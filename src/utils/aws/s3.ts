export function getS3FileUrl(
    bucketName: string,
    region: string,
    path: string,
): string {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${path}`;
}
