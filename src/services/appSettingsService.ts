
import { 
  doc,
  onSnapshot,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/firebase";

const SETTINGS_COLLECTION = "app_settings";
const MAIN_SETTINGS_DOC = "main_settings";

interface AppSettings {
    bankTransferBalance?: number;
}

const settingsDocRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);

export function listenToAppSettings(callback: (settings: AppSettings | null) => void) {
  return onSnapshot(settingsDocRef, (snapshot) => {
    if (snapshot.exists()) {
        callback(snapshot.data() as AppSettings);
    } else {
        // Document doesn't exist, maybe create it with default values
        console.log("App settings document not found. You might want to create it.");
        callback(null);
    }
  }, (error) => {
    console.error("Error listening to app settings: ", error);
  });
}

export async function updateBankTransfer(newValue: number): Promise<void> {
  try {
    // Using setDoc with merge:true will create the document if it doesn't exist,
    // or update it if it does. This is safer than using updateDoc directly.
    await setDoc(settingsDocRef, { bankTransferBalance: newValue }, { merge: true });
  } catch (e) {
    console.error("Error updating bank transfer balance: ", e);
    // Optionally re-throw the error or handle it as needed
    throw e;
  }
}
