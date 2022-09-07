import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

export const initFireBase = (config: ConfigService) => {
    const adminConfig: ServiceAccount = {
        projectId: config.get<string>('FIREBASE_PROJECT_ID'),
        privateKey: config.get<string>('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
        clientEmail: config.get<string>('FIREBASE_CLIENT_EMAIL'),
    };
    // Initialize the firebase admin app
    admin.initializeApp({
        credential: admin.credential.cert(adminConfig),
        databaseURL: config.get<string>('FIREBASE_DATA_URL'),
    });
};
