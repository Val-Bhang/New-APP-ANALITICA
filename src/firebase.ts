import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { SpectrumRecord } from './types/spectrum';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const isProd = import.meta.env.PROD;
  const currentAuthUser = auth.currentUser;

  // In production, do not log or expose raw UID or email in console logs to protect privacy
  const authInfo = {
    userId: isProd
      ? (currentAuthUser?.uid ? '[REDACTED]' : null)
      : (currentAuthUser?.uid ?? null),
    email: isProd
      ? (currentAuthUser?.email ? '[REDACTED]' : null)
      : (currentAuthUser?.email ?? null),
    emailVerified: currentAuthUser?.emailVerified ?? null,
    isAnonymous: currentAuthUser?.isAnonymous ?? null,
    tenantId: currentAuthUser?.tenantId ?? null,
    providerInfo:
      currentAuthUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: isProd ? (p.email ? '[REDACTED]' : null) : (p.email ?? null),
      })) || [],
  };

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo,
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline or connecting.');
      return false;
    }
    // Document might simply not exist, which still proves connection reached server
    return true;
  }
}

// Auth actions
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Error during Google sign in:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Firestore operations for spectrums
const SPECTRUMS_COLLECTION = 'spectrums';

export function subscribeToUserSpectrums(
  userId: string,
  onData: (spectrums: SpectrumRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, SPECTRUMS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: SpectrumRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as SpectrumRecord);
      });
      onData(records);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.LIST, SPECTRUMS_COLLECTION);
    }
  );
}

export async function saveSpectrumToFirestore(
  record: Omit<SpectrumRecord, 'isReference'> & { isReference?: boolean }
): Promise<void> {
  const docPath = `${SPECTRUMS_COLLECTION}/${record.id}`;
  try {
    const docRef = doc(db, SPECTRUMS_COLLECTION, record.id);
    // Sanitize payload: strip isReference and omit any undefined properties
    const sanitizedPayload: Record<string, any> = {};
    for (const [key, val] of Object.entries(record)) {
      if (key !== 'isReference' && val !== undefined) {
        sanitizedPayload[key] = val;
      }
    }
    await setDoc(docRef, sanitizedPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteSpectrumFromFirestore(recordId: string): Promise<void> {
  const docPath = `${SPECTRUMS_COLLECTION}/${recordId}`;
  try {
    const docRef = doc(db, SPECTRUMS_COLLECTION, recordId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
