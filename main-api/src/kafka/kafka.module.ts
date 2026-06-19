import { Global, Module } from '@nestjs/common';
import { KafkaProducer } from './kafka.producer';

@Global()
@Module({
  providers: [KafkaProducer],
  exports: [KafkaProducer],
})
export class KafkaModule {}
