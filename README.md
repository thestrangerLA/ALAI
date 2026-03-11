# Tour Cost Calculator (Lao Hug)

ລະບົບຄຳນວນຕົ້ນທຶນທົວ ແລະ ຈັດການຂໍ້ມູນການຈອງທົວແບບຄົບວົງຈອນ.

## ຄຸນສົມບັດ (Features)
- ຄຳນວນຕົ້ນທຶນທົວແບບ Real-time.
- ຮອງຮັບ 4 ສະກຸນເງິນຫຼັກ (USD, THB, LAK, CNY).
- ລະບົບປ່ຽນອັດຕາແລກປ່ຽນອັດຕະໂນມັດ ແລະ ຕັ້ງຄ່າມາດຕະຖານໄດ້.
- ແຍກໝວດໝູ່ຄ່າໃຊ້ຈ່າຍ: ທີ່ພັກ, ຂົນສົ່ງ, ປີ້ຍົນ, ອາຫານ, ແລະ ອື່ນໆ.
- ຮອງຮັບການພິມ (Print) ເອກະສານສະຫຼຸບ.
- ເກັບຂໍ້ມູນຢ່າງປອດໄພໃນ Cloud Firestore.

## ເຕັກໂນໂລຊີທີ່ໃຊ້ (Tech Stack)
- **Framework:** Next.js 14 (App Router)
- **Database:** Cloud Firestore
- **Authentication:** Firebase Anonymous Auth
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** Lucide React

## ຂັ້ນຕອນການຕິດຕັ້ງ ແລະ ອັບໂຫຼດໄປ GitHub

ຫາກທ່ານຕ້ອງການອັບໂຫຼດໂຄ້ດນີ້ໄປຫາ Repository ຂອງທ່ານ (`https://github.com/thestrangerLA/lao-hug-calculate.git`), ໃຫ້ເປີດ Terminal ແລ້ວພິມຄຳສັ່ງດັ່ງນີ້:

1. **ຕັ້ງຄ່າ Git ໃນໂຟນເດີໂຄງການ:**
   ```bash
   git init
   ```

2. **ເຊື່ອມຕໍ່ກັບ GitHub ຂອງທ່ານ:**
   ```bash
   git remote add origin https://github.com/thestrangerLA/lao-hug-calculate.git
   ```

3. **ເພີ່ມໄຟລ໌ ແລະ Commit:**
   ```bash
   git add .
   git commit -m "Initial commit: Lao Hug Tour Cost Calculator"
   ```

4. **Push ໂຄ້ດຂຶ້ນໄປ:**
   ```bash
   git branch -M main
   git push -u origin main
   ```

ໝາຍເຫດ: ໂຄງການນີ້ໄດ້ຖືກຕັ້ງຄ່າ GitHub Actions (`.github/workflows/nextjs.yml`) ໄວ້ແລ້ວ ເຊິ່ງມັນຈະທຳການ Deploy ໄປຫາ GitHub Pages ໃຫ້ໂດຍອັດຕະໂນມັດເມື່ອທ່ານ Push ໄປຫາ Branch `main`.
