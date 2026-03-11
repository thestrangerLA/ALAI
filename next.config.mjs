/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // ໝາຍເຫດ: ຫາກທ່ານ Deploy ໄປຫາ GitHub Pages ທີ່ບໍ່ແມ່ນ Custom Domain
  // ທ່ານອາດຈະຕ້ອງກຳນົດ basePath ເປັນຊື່ Repository ຂອງທ່ານ ເຊັ່ນ:
  // basePath: '/ALAI',
};

export default nextConfig;
