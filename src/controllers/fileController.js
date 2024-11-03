// Import necessary modules
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

exports.uploadFile = async (req, res) => {
    try {
        const { originalname, buffer } = req.file;
        const uniqueKey = `${Date.now()}-${uuidv4()}-${originalname}`;
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: uniqueKey,
            Body: buffer
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        console.log(req.user,"User")
        await prisma.file.create({
            data: {
                filename: uniqueKey,
                userId: 1
            }
        });
        res.status(201).json({
            message : 'File uploaded successfully'
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send('Error uploading file');
    }
};

// Download file function
exports.downloadFile = async (req, res) => {
    try {
        const file = await prisma.file.findUnique({
            where: { id: +req.params.fileId },
        });

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: file.filename,
        };

        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);

        await prisma.file.update({
            where: { id: file.id },
            data: { downloadCount: { increment: 1 } },
        });

        res.attachment(file.filename);
        data.Body.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading file');
    }
};

exports.getAllFilesWithId = async (req, res) => {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
        };
        const command = new ListObjectsV2Command(params);
        const data = await s3Client.send(command);
        const filesWithId = [];

            for (const s3File of data.Contents) {
            
                const fileRecords = await prisma.file.findMany({
                    where: {
                        filename: s3File.Key
                    },
                    select: {
                        id: true
                    },
                });
                console.log(fileRecords,"File Records")
                const fileId = fileRecords.length > 0 ? fileRecords[0].id : null;
    
                filesWithId.push({
                    fileId: fileId,
                    Key: s3File.Key,
                    LastModified: s3File.LastModified,
                    Size: s3File.Size,
                });
            }

        console.log(filesWithId,": Files ")
        res.status(200).json(filesWithId);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).send('Error fetching files');
    }
};

exports.getTotalDownloads = async (req, res) => {
    try {
        const files = await prisma.file.findMany({
            orderBy: {
                downloadCount: 'desc',
            },
            select: {
                filename: true,
                downloadCount: true,
            },
        });

        res.status(200).json(files);
    } catch (error) {
        console.error('Error fetching total downloads:', error);
        res.status(500).send('Error fetching total downloads');
    }
};
