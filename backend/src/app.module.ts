import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { StudentProfileModule } from './student-profile/student-profile.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { AmenitiesModule } from './amenities/amenities.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { VibeAnalysisModule } from './vibe-analysis/vibe-analysis.module.js';
import { RolesModule } from './roles/roles.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { PropertyTypesModule } from './property-types/property-types.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'uhome',
      password: 'uhome',
      database: 'uhome',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    StudentProfileModule,
    PropertiesModule,
    AmenitiesModule,
    ReviewsModule,
    VibeAnalysisModule,
    RolesModule,
    PermissionsModule,
    FavoritesModule,
    PropertyTypesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
