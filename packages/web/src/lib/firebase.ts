import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

function requiredEnvironmentValue(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required to use Firebase Authentication.`);
  }

  return value;
}

export function getFirebaseAuth() {
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: requiredEnvironmentValue(
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ),
      authDomain: requiredEnvironmentValue(
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      ),
      projectId: requiredEnvironmentValue(
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ),
      appId: requiredEnvironmentValue(
        'NEXT_PUBLIC_FIREBASE_APP_ID',
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      ),
    });

  return getAuth(app);
}
