import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import {
  productionFirebaseConfig,
} from "../../../firebaseProjectConfig.js";

const app = getApps().length
  ? getApp()
  : initializeApp(productionFirebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
