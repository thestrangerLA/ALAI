/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ກຳນົດໃຫ້ເປັນ Static Export ສຳລັບ GitHub Pages
  images: {
    unoptimized: true, // ຈຳເປັນສຳລັບ Static Export
  },
  trailingSlash: true, // ຊ່ວຍໃຫ້ການເຂົ້າເຖິງ URL ໃນ Static Hosting ມີຄວາມສະຖຽນຂຶ້ນ
};

export default nextConfig;
