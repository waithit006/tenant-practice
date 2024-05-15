import { DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const createDataSourceOptions = (
  configService: ConfigService,
  database: string,
  synchronize = true,
): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: database,
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize,
  extra: {
    max: 10, // จำนวนการเชื่อมต่อสูงสุดใน pool
    min: 2, // จำนวนการเชื่อมต่อขั้นต่ำใน pool
    idleTimeoutMillis: 30000, // เวลารอคอย (ในมิลลิวินาที) ก่อนการเชื่อมต่อใน pool จะถูกปิด
  },
});
