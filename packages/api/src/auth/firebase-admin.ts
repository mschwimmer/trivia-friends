import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export type VerifiedFirebaseIdentity = {
  uid: string;
  email: string | null;
};

function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      'FIREBASE_PROJECT_ID is required to verify authenticated requests.'
    );
  }

  const app =
    getApps()[0] ??
    initializeApp({
      projectId,
    });

  return getAuth(app);
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseIdentity> {
  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);

  if (decodedToken.firebase.sign_in_provider !== 'google.com') {
    throw new Error('The ID token was not issued from Google sign-in.');
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
  };
}
