/**
 * Firebase Admin SDK Configuration
 * 
 * SECURITY NOTE: This module initializes the Firebase Admin SDK with
 * application default credentials. In production, ensure the service
 * account has minimal required permissions:
 * - Firebase Admin SDK Administrator (for Auth)
 * - Cloud Datastore User (for Firestore triggers)
 */

import { initializeApp, App, getApps } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only once
let app: App;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp();
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Configure Firestore settings for consistency
db.settings({
  ignoreUndefinedProperties: false,
});

export { app, auth, db };
