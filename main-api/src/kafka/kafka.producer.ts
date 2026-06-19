import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private readonly producer: Producer;
  private readonly consumer: Consumer;
  private connected = false;

  constructor(
    config: ConfigService,
    private readonly cache: CacheService,
  ) {
    const brokers = config
      .get<string>('KAFKA_BROKERS', 'localhost:9092')
      .split(',');
    const kafka = new Kafka({ clientId: 'main-api', brokers });
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({ groupId: 'main-api-image-events' });
  }

  async onModuleInit() {
    try {
      await Promise.all([this.producer.connect(), this.consumer.connect()]);
      await this.consumer.subscribe({
        topic: 'image.processed',
        fromBeginning: false,
      });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;
          const event = JSON.parse(message.value.toString()) as {
            courseId?: string;
          };
          if (event.courseId) {
            await this.cache.del('courses:all', `course:${event.courseId}`);
          }
        },
      });
      this.connected = true;
    } catch (error) {
      this.logger.warn(`Kafka unavailable: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await Promise.all([
        this.producer.disconnect(),
        this.consumer.disconnect(),
      ]);
    }
  }

  async send(topic: string, payload: Record<string, unknown>) {
    if (!this.connected) {
      throw new ServiceUnavailableException('Image processing is unavailable');
    }
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }
}
