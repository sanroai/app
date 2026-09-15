import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [AiModule],
  controllers: [ChatController],
  providers: [],
})
export class ChatModule {}