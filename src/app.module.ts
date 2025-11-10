import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseCoreConfig } from "./config/database.config";
import { StrapiModule } from "./modules/strapi/strapi.module";
import { HeroContentModule } from "./modules/hero-content/hero-content.module";
import { SitemapModule } from "./modules/sitemap/sitemap.module";
import { SeoMetaModule } from "./modules/seo-meta/seo-meta.module";
import { TimeZoneModule } from './modules/time-zone/time-zone.module';
import { TimeZonesModule } from './modules/time-zones/time-zones.module';
import { CountriesModule } from './modules/countries/countries.module';
import { AboutContentModule } from "./modules/about-content/about-content.module";
import { BecomeContentModule } from "./modules/become-content/become-content.module";
import { faqContentModule } from "./modules/faq-content/faq-content.module";
import { AboutPageTopModule } from "./modules/about-page-top/about-page-top.module";
import { AboutPageRestModule } from "./modules/about-page-rest/about-page-rest.module";
import { AmbassPageTopModule } from "./modules/ambass-page-top/ambass-page-top.module";
import { AmbassPageRestModule } from "./modules/ambass-page-rest/ambass-page-rest.module";
import { AmbassadorsModule } from "./modules/ambassadors/ambassadors.module";
import { TextModule } from "./modules/text/text.module";
import { AmbassadorsListModule } from "./modules/ambassadors-list/ambassadors-list.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { AuthModule } from './modules/auth/auth.module';
import { UserScheduleModule  } from './modules/user-schedule/user-schedule.module';
import { CountriesLightModule } from './modules/countries-light/countries-light.module';
import { UserModule  } from './modules/user/user.module';
import { ProfilePageModule  } from './modules/profile-page/profile-page.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseCoreConfig),
    AuthModule,
    StrapiModule,
    SeoMetaModule,
    SitemapModule,
    HeroContentModule,
    TimeZoneModule,
    TimeZonesModule,
    CountriesModule,
    AboutContentModule,
    BecomeContentModule,
    faqContentModule,
    SeoMetaModule,
    AboutPageTopModule,
    AboutPageRestModule,
    AmbassPageTopModule,
    AmbassPageRestModule,
    AmbassadorsModule,
    TextModule,
    AmbassadorsListModule,
    ContactsModule,
    UserScheduleModule,
    CountriesLightModule,
    UserModule,
    ProfilePageModule,
  ],
})
export class AppModule {}
