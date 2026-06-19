import 'dotenv/config';
import express from 'express';
import { Kafka } from 'kafkajs';
import mongoose from 'mongoose';
import { join } from 'path';
import { processImage } from './image-processor';
import { Course, Lesson } from './models';

interface ImageJob {
  entityType: 'course' | 'lesson';
  entityId: string;
  courseId: string;
  inputFilename: string;
  outputFilename: string;
  imageUrl: string;
}

const port = Number(process.env.PORT ?? 3001);
const storageDir = process.env.STORAGE_DIR ?? join(process.cwd(), 'storage');
const mongoUri =
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/eduplatform';
const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

async function updateStatus(job: ImageJob) {
  if (job.entityType === 'course') {
    await Course.updateOne(
      { _id: job.entityId, 'coverImage.url': job.imageUrl },
      { $set: { 'coverImage.status': 'ready' } },
    );
    return;
  }

  await Lesson.updateOne(
    { _id: job.entityId, 'images.url': job.imageUrl },
    { $set: { 'images.$.status': 'ready' } },
  );
}

async function bootstrap() {
  await mongoose.connect(mongoUri);

  const kafka = new Kafka({ clientId: 'image-worker', brokers });
  const consumer = kafka.consumer({ groupId: 'image-workers' });
  const producer = kafka.producer();
  await Promise.all([consumer.connect(), producer.connect()]);
  await consumer.subscribe({ topic: 'image.uploaded', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const job = JSON.parse(message.value.toString()) as ImageJob;
      await processImage(storageDir, job.inputFilename, job.outputFilename);
      await updateStatus(job);
      await producer.send({
        topic: 'image.processed',
        messages: [
          {
            key: job.entityId,
            value: JSON.stringify({
              entityType: job.entityType,
              entityId: job.entityId,
              courseId: job.courseId,
              imageUrl: job.imageUrl,
              processedAt: new Date().toISOString(),
            }),
          },
        ],
      });
    },
  });

  const app = express();
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.listen(port, '0.0.0.0', () => {
    console.log(`Image worker health endpoint listening on ${port}`);
  });

  const shutdown = async () => {
    await Promise.all([
      consumer.disconnect(),
      producer.disconnect(),
      mongoose.disconnect(),
    ]);
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((error) => {
  console.error('Image worker failed to start', error);
  process.exit(1);
});
