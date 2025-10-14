

import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
  getDocs
} from "firebase/firestore";
import type { StockItem } from "@/lib/types";
import { initializeFirebase } from "@/firebase";

const { firestore } = initializeFirebase();
const stockCollectionRef = collection(firestore, "inventory");

const initialProductNames = [
  "ຢ່າງໃນB IRC 100*1", "ສະເຕີເວບ125 KPH 10*1", "ສະເຕີເວບ110i GN5 10*1", "ສະເຕີsy w110i ດຳ 10*1", 
  "ໂຊກອັບຫນ້າ5*1 ດິສ +ກາບ", "ໂຊກອັບຫລັງ10*1 ສີເລືອງ ປອນ", "ຫມໍ້ໄຟດີໂອ 10*1", "ບາງຈາກ super4T plus 0.8L 24*1", 
  "ຄາລເທັກ HAVOLIN EZY 4T 0.8L 12*1", "ຄາລເທັກ HAVOLIN EZY 4T 1L 12*1", "ຄາລເທັກ auto super ເມຕິກ 4T 0.8L 12*1", 
  "ຍາງchaoyang ວິງ 80/90-14", "ເບາະເດັກ ເວບ100s", "ສະເຕີTwan-wa14-36 20*1 w100", "4t honda ນ້ຳມັນເຄື່ອງຝາຟ້າ 12*0.8L", 
  "4t honda ນ້ຳມັນເຄື່ອງຝາແດງ 12*0.7L", "PKT ຍາງນອກ 110/90-12 TL172", "PKT ຍາງນອກ 100/90-12 ML172", 
  "PKT ຍາງນອກ 120/70-14 ML172", "PKT ຍາງນອກ 130/70-13 ML172", "PKT ຍາງນອກ 110/70-13 ML172", 
  "PKTຍາງນອກ 90/90-14 ML172 ສີດຳ", "3A ກະຕາ w110i", "3A ກະຕາ w125", "ຍາງໃນ IRC 2.25-17( 60*1)", 
  "ຍາງໃນ IRC 2.50-17( 60*1)", "honda coolant ນ້ຳຢາຫມໍ່ນ້ຳ 24*0.5L", "ລາງ120x17", "ແກນໂຊກ", "ແຜ່ນສາກ", 
  "ສາຍນ້ຳມັນ", "ສາຍທຸກໂຕ", "ຫມໍ້ໄຟbig max", "ຂາເກຍ", "ປອກເລ້ງ", "ເບກເຫລັກ", "ຢ່າງຢຽບຫນ້າ", "ຟານ້ຳມັນ", 
  "ດີສເບກ", "ກໍ່ໄຟ6ກໍ່", "ຢາງດຸ້ມ", "ໄດສະຕາດເວບ100s", "ໄດສະຕາດຄິກ", "ຂໍກອງອາກາດເວບ100s", "ຫົວທຽນ ngk 10*1", 
  "ບັງໂສ້", "ຂໍຕໍທໍ່", "ຕາຫນ້າ ທ/ດ", "ເຕົາດິດລຸ້ມ", "ຂາຢຽບເບກ", "ຂາຢຽບຂາງ", "ຂາສະຕາດ", "ໂສ້ນ້ອຍ", 
  "ເຟືອງໄມ", "ເຟືືອງສະຕາດຄິກ", "ຕີນເປັດ", "ກໍ່ະເດືອນວ້າວ110/125", "ນ່າກາກຫນ້າ", "ບັງຕົມຫນ້າ", "ບັງແຈ", 
  "ນ່່າກາກຫນ້າຫລັງ", "ບັງລົມໃນ", "ບັງລົົມນອກ", "ບັງຕົມຫລັງ", "ຕາທ້າຍ", "ລາງປາ", "ປ້ຳນ້ຳ", "ຈານດິສເວບ100", 
  "CDI", "ສະວິດເວບ100ໄຟລ້ຽວ,ແກ່,ເປີດປິດ,ສ/ຕ, ຕ/ສູງ", "ລູກກິ່ງ-ກົດ", "ຊຸດໄຟໃຫ່ຍ", "ສາຍໄຟກອງເບາະ", "ເເກ", 
  "ສະວິິດຄິກ ໄຟລ້ຽວ ສ/ຕ ຕຳ/ສູງ ແກ່", "ຝາອັດນ້ຳມັນ", "ປັບ", "ຫົວລ້ວຍ", "ຫົວລ້ວຍເວບ100", "ເສັ້ນເສີ", 
  "ທໍ່ນ້ຳຄິກ", "ປັດຫົວສີດ", "ປັດພີວ", "ລູກປືນຄໍ່", "ຊຸຸດຊາມຫນ້າ", "ຊຸດລໍຄັດສາຍພານ", "ຫົວນົກກະຈອກ", "ຊຸດຄາດ", 
  "ຢາງຫນ້າລາຍໂນວ້າ", "ຢາງຫລັງລາຍໂນວ້າ", "ຢາງຫນ້າລາຍເວບ100 irc", "ຢາງຫລັງລາຍເວບ100 irc", "ຢາງ90/90-14irc", 
  "ຢາງ80/90-14 irc", "ສາຍພານ", "ແຜ່ນຄາດ", "ສະປີ້ງ10*1", "ຊິ້ນສົກອັບນອກ+ໃນ10*1", "ຊິ້ນຈັນໄຟ10*1", 
  "ນ້ຳມັນເຄື່ອງພາວເວີວັນ 0.92L 6*1", "ດິສເບກ ຫນ້າເວບໄອ 10*1", "ນ້ຳມັນເຄື່ອງພາວເວີວັນ 4T 1L 12*1", 
  "ນ້ຳມັນເຄືອງແອ້ກຖີບ 4T 0.8L 12*1", "ດິສເບກ pcx 10*1 ຫນ້າ", "ຂາເກຍເວບ100", "ແກນລໍ່ຫນ້າ", "ແກນລໍ່ຫລັງ", 
  "ປັ້ມລີນ", "ກະແຈໃຫ່ຍ ເວບ 100 ດີ", "ກະແຈນ້ອຍ ເວບ 100 ດີ", "ດິ້ວ11x175", "ດິ້ວ11x184", "ດິ້ວ9x175", 
  "ກະແຈເວບ ໄອ 4ສາຍ", "ກະແຈເວບ ໄອ ລຸ້ນໄຫມ່", "ຊ້ວງນ້ອຍເວບ100", "ຊ້ວງໃຫ່ຍເວບ100", "ຊ້ວງຝາຄາດເວບ100", 
  "ຊ້ວງກໍ່ໄຟ", "ລາງ140", "ລາງ160", "ສະເຕີຮອນດ້າ ເວບ110", "ສະເຕີຮອນດ້າ ເວບ100", "ດິສເບກ ຫນ້້າຄີກ", 
  "ດິສເບກ ຫນ້າເວບ100", "ດິສເບກ ZM", "ດິ້ສpcx 150", "ດິ້ສ pcx160", "ດິ້ສ MSX", "ດິ້ສເບກ ເວບ110", 
  "ດີສເບກຫລັງ ຄິກ", "ດີສເບກຫລັັງ ເວບ100", "ດິສເບກຫລັງເວບ100 coco", "ຊ້ວງຝາສູບເວບ100", "ຫມໍ້ເຕັ້ນ", 
  "ຫມໍ້ເຕັ້ນ ແຕ່ງ", "ດິ້ສເບກ ຟີໂນເກົ່າ", "ດິ້ສເບກ ຟີໂນໄຫມ່", "ລູກຕຸ້ມPCX 150", "ລູກຕຸ້ມPCX 160", 
  "ລູກຕຸ້ມຄີກ125", "ຊຸດຄາດໃຫ່ຍເວບ110", "ຊຸດຄາດໃຫ່ຍເວບ100", "ຊຸດຄາດໃຫ່ຍເວບ100 ດີ", "ຫນ່ວຍຕາຫນ້າແທ້", 
  "ດອກຕາເວບ100", "ດອກຕາLEDກັບສີເລືອງ", "ຕຳບົ້ວຫນ້າດີສ", "ຕຳບົ້ວຫນ້າກາບ", "ຕຳບົ້ວຫລັງເວບ100", 
  "ຝາເບກຫນ້າເວບ100", "ຝາເບກຫລັງເວບ100", "ເຕົ້າເບກເທີ່ງເວບ100", "ດຸ້ມສະເຕີເວບ100", "ດຸ້ມສະເຕີເວບ110", 
  "ແວນດີ ເວບ100", "ແວນSM", "ແວນຄິກ ປີ12", "ແວນຄິກ ປີ18", "ນ້ຳມັນເຄືອງ3000 plus 20*0.8L", 
  "ນ້ຳມັນເຄືອງ300 plus 20*1L", "ນ້ຳມັນເຄືອງscooter gear 80w90 0.120ml *48", "ນ້ຳມັນເຄືອງscooter power 12*1L", 
  "ນ້ຳມັນເຄືອງscooter power 20*0.8L", "ນ້ຳມັນເຄືອງscooter gear plus 48*0.120", "ສົກອັບຫລັງHDທຳມະດາ", 
  "ສະເຕີw100+125ໃສ່ໄດ້Tubເຫລືອງ", "ຫົວທຽນA7 HD 10*1", "ແກນດັນໂຊ້ນ້ອຍkB", "ຈານໂສ້ງນ້ອຍKB48 90", 
  "ເຫັກກົດKB", "ປຸ່ມໄນເບກKB", "ສາຍດິດKB", "ສາຍໄມດິດKB", "ລູກລວຍKB", "ໂສລິງKB", "ຢາງດັນ", "ສະຫັດຕີນເປັດKB", 
  "ລູກຢາງເຟືອງປຳ120KB", "ລູກຢາງເຟືອງປຳ125KB", "ບຸດວາວKB", "ຂອບປາຍກະດູນ", "ສະປີງຂາສະຕາດw110i", 
  "ຟິວw100", "ຟິິວ110", "ສະປີງຂາສະຕາດw110", "ເຕົ້ົາດິດລຸ່ມຂ້າບິນ", "ມື້ຈັບຫົວຫມໍ້ໄຟ", "ຂອບປາຍໄທເທ", 
  "ດອກໄຟລ້ຽວLBD", "ໄຟເບີກຟິວ", "ມີສົກ", "ຂໍຕໍ່ກະດຳ", "ຄໍໂທດສົຄໍຕ່ສົກຫລັງ", "ຄໍໍຕໍ່ສົກ", "ຕາຫນ່າງດອງ", 
  "ກະແຈw125ຄໍສັ້ນ", "ກະແຈwsຄໍຍາວ", "ດອກວາວKB", "ນອດຝາອັດກໍ້ໄຟ", "ຫມໍ້ກອງ125", "ຄະບິວw100HD", 
  "ເຕົາດິດເທິງມ້າບິີນ", "ເຕົາດິດລຸຸ່ມw100-i", "ເຕົາດິດລຸຸ່ມ125", "ສະປີງໄຟເບກດິດ", "ສະເຕີຫນ້າມ້າບິນ", 
  "ຫົວທຽນເທນ່າF5", "ຢາງນອກ80/90TUB", "ຢາງນອກ225TUB 15/5", "ຢາງນອກ70/100TUB", "ຢາງນອກ250TUB", 
  "ເບາະw125", "ເບາະw110", "ຄະບິິວHDກັບດຳ", "ລູກປືນ6301-6203KB", "ລູກປື້ນ6201 tub", "ລູກປື້ນ62000 ກາແຂ້", 
  "ລູກປື້ນ63000 ກາແຂ້", "ລູກປື້ນ62000tub ຂຽວ", "ຫມໍ່ໄຟຕຳGS", "ຫມໍ່ໄຟ9A", "ຫມໍ່ໄຟສູງGS", "ກອງເຕີດີສ", 
  "ກອງເຕີກາບ", "ດີວ", "ເຊື່ອສູບ100", "ເຊື່ອສູບ110", "ຝາກອງເຕີ", "ໃສ້ກອງKzr", "ໃສ້ກອງk16", "ໃສ້ກອງw100s", 
  "ໃສ້ກອງclick110(Kvb)", "ໃສ້ກອງscoopyເກົ່າ(kyt )", "ໃສ້ກອງk97", "ໃສ້ກອງpcx160 k1z", "ໃສ້ກອງfinoເກົ່າ", 
  "ໃສ້ກອງfinoຫົວຊີດ", "ໃສ້ກອງຈີອໍໂນ", "ໃສ້ກອງw110i led", "ໃສ້ກອງscoopy2023", "ໃສ້ກອງແກນຟີລາໂນ", 
  "ໃສ້ກອງຟີລາໂນໄຮບິດ", "ໃສ້ກອງw110i ເກົ່າ", "ສາຍພານKarenແທ້", "ສາຍພານk35", "ສາຍພານclick110 kvb", 
  "ສາຍພານpcx160", "ສາຍພານk97", "ສາຍພານk44", "ສາຍພານສະກຸບປີໄຫມ່", "ສາຍພານຟີໂນເກົ່າ", "ສາຍພານຟີໂຮຫົວສີດ", 
  "ສາຍພານຈິອໍໂນ", "ສະກອດດຳ", "ເຫລັກກັນຮ້ອນ", "ຊຸດກ້ອາຄາດ ທ/ດ", "ດອກໄຟ2ດອກ", "ປັກສາມຂາ ເວບ100", 
  "ດອກຕາLED ສີຂາວ", "ຢາງໃນIRC2.25-17 ສີແດງ ທ/ດ 100*1", "ດອກໄຟລ້ຽວ100*1", "ກອງແອ້ດຊັງ", "ບຸູດເສົ່າເສືຶອ", 
  "ໂຊກອັບຫນ້າ5*1", "ໂຊກອັບຫລັງ10*1", "ຫມໍ້ໄຟດີໂອ 10*1", "4t honda ນ້ຳມັນເຄື່ອງຝາຟ້າ 12*0.8L", 
  "4t honda ນ້ຳມັນເຄື່ອງຝາແດງ 12*0.7L", "ຫາງປາ", "ເກຍ", "ສະວິິດຄິກ", "ປັດ", "ຜ້າຫຸ້ມເບາະ", "ຊິນຈັນໄຟ10*1", 
  "ນ້ຳມັນເຄືອງແອ້ກຖີບ 4T 0.8L", "ດິສເບກ ຫນ້້າຄີກ", "ກີບຫົວຫມໍ້ໄຟ"
];


export async function seedInitialData() {
  const q = query(stockCollectionRef);
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("Inventory is empty, seeding initial data...");
    const batch = writeBatch(firestore);
    const uniqueProductNames = [...new Set(initialProductNames)];

    uniqueProductNames.forEach((name, index) => {
      const docRef = doc(stockCollectionRef);
      const partCode = `P${(index + 1).toString().padStart(3, '0')}`;
      const newItem: Omit<StockItem, 'id'> = {
        partCode: partCode,
        partName: name.trim(),
        quantity: 0,
        price: 0,
        costPrice: 0,
        wholesalePrice: 0,
        createdAt: serverTimestamp(),
      };
      batch.set(docRef, newItem);
    });

    try {
      await batch.commit();
      console.log("Initial data seeded successfully.");
    } catch (e) {
      console.error("Error seeding data: ", e);
    }
  } else {
    console.log("Inventory already contains data, skipping seed.");
  }
}

export function listenToStockItems(callback: (items: StockItem[]) => void) {
  const q = query(stockCollectionRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
    callback(items);
  });
}

export async function addStockItem(item: Omit<StockItem, 'id' | 'createdAt'>) {
  try {
    const existingItemQuery = query(stockCollectionRef, where("partCode", "==", item.partCode));
    const existingItemSnapshot = await getDocs(existingItemQuery);

    if (!existingItemSnapshot.empty) {
        console.error("Error: Part code already exists.");
        // Optionally, show a notification to the user
        return;
    }
    await addDoc(stockCollectionRef, { ...item, createdAt: serverTimestamp() });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export async function updateStockItem(id: string, updatedFields: Partial<Omit<StockItem, 'id'>>) {
  const itemDoc = doc(firestore, "inventory", id);
  try {
    await updateDoc(itemDoc, updatedFields);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

export async function deleteStockItem(id: string) {
  const itemDoc = doc(firestore, "inventory", id);
  try {
    await deleteDoc(itemDoc);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}
