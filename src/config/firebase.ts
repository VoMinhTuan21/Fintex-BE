import { ConfigService } from '@nestjs/config';
import { initializeApp } from 'firebase/app';
import { AppConfig } from '../utils/app-config';

// const configService = new ConfigService();

// console.log('api_key', configService.get('FIREBASE_API_KEY'));

const firebaseConfig = {
    apiKey: 'AIzaSyA6vjzKYPUjjMA-LhdUSBc4yzQXOi3kh0A',
    authDomain: 'send-otp-bbe82.firebaseapp.com',
    projectId: 'send-otp-bbe82',
    storageBucket: 'send-otp-bbe82.appspot.com',
    messagingSenderId: '1064574797555',
    appId: '1:1064574797555:web:ac1b0e4e46a533ef055986',
    measurementId: 'G-WREYSDLSNY',
};

export const app = initializeApp(firebaseConfig);
