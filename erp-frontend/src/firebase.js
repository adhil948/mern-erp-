import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBQEM-drtjrT_IET-FE_kKxAl7OERwiaI0",
  authDomain: "test-1fa48.firebaseapp.com",
  projectId: "test-1fa48",
  // ...other config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
