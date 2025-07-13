# RiskCreditPredictor
Risk Credit Predictor App
Deskripsi Projek
Aplikasi "Risk Credit Predictor" adalah web yang dirancang untuk membantu pengguna memprediksi risiko kredit mereka berdasarkan beberapa faktor keuangan dan demografi. Selain memberikan prediksi risiko (Tinggi atau Rendah), aplikasi ini juga menawarkan saran keuangan yang dipersonalisasi dan rencana peningkatan kredit yang dihasilkan oleh model AI (Gemini API) untuk membantu pengguna mengelola kesehatan finansial mereka. Aplikasi ini memiliki antarmuka yang bersih, modern, dan responsif, memastikan pengalaman pengguna yang lancar di berbagai perangkat.

Teknologi yang Digunakan

/Frontend/

React: Pustaka JavaScript untuk membangun antarmuka pengguna yang interaktif.

Tailwind CSS: Kerangka kerja CSS utility-first untuk styling yang cepat dan responsif.

Framer Motion: Pustaka animasi untuk React yang digunakan untuk transisi UI yang halus dan menarik.

/Data Handling & Export/

XLSX: Pustaka untuk membaca dan menulis file Excel.

jsPDF & jspdf-autotable: Pustaka untuk menghasilkan dokumen PDF dari data tabel.

/AI/LLM/

Gemini API (gemini-2.0-flash): Digunakan untuk menghasilkan saran keuangan dan rencana peningkatan kredit yang dipersonalisasi.

/Fitur/
Login Pengguna: Pengguna dapat login dengan detail pribadi mereka (Nama, NIK, Tanggal Lahir, Domisili). Validasi input NIK (16 digit angka) dan Domisili (hanya huruf) diterapkan menggunakan ekspresi reguler.

Prediksi Risiko Kredit: Memprediksi risiko kredit (Tinggi atau Rendah) berdasarkan usia, penghasilan, jumlah pinjaman, dan riwayat kredit.

Saran Keuangan Berbasis AI: Setelah prediksi risiko, pengguna dapat meminta saran keuangan yang dipersonalisasi dalam Bahasa Indonesia, yang dihasilkan oleh Gemini API.

Rencana Peningkatan Kredit Berbasis AI: Jika risiko kredit diprediksi tinggi, pengguna dapat meminta rencana langkah-demi-langkah untuk meningkatkan profil kredit mereka, juga dihasilkan oleh Gemini API.

Riwayat Prediksi: Menyimpan dan menampilkan riwayat semua prediksi yang dibuat oleh pengguna.

Ekspor Data: Pengguna dapat mengekspor riwayat prediksi mereka ke format Excel (.xlsx) atau PDF (.pdf).

Antarmuka Responsif: Tata letak aplikasi menyesuaikan diri dengan mulus di berbagai ukuran layar (ponsel, tablet, desktop) berkat Tailwind CSS.

Animasi UI: Menggunakan Framer Motion untuk animasi yang halus pada elemen UI, seperti transisi masuk dan indikator pemuatan.

Indikator Pemuatan: Animasi spinner ditampilkan pada tombol saat panggilan API AI sedang berlangsung, memberikan umpan balik visual kepada pengguna.

/Instruksi Penyiapan/
Klon Repositori:

git clone https://github.com/siaveronica/credit-predictor-app.git
cd credit-predictor-app

/Penjelasan Dukungan AI/
Aplikasi ini memanfaatkan Gemini API (khususnya model gemini-2.0-flash) untuk menyediakan fungsionalitas AI yang cerdas:

Saran Keuangan: Ketika pengguna meminta saran keuangan, aplikasi mengirimkan profil kredit mereka (usia, pendapatan, pinjaman, riwayat kredit, dan hasil prediksi risiko) sebagai prompt ke Gemini API. Model AI kemudian menganalisis informasi ini dan menghasilkan nasihat keuangan yang ringkas dan relevan, disesuaikan dengan situasi risiko pengguna.

Rencana Peningkatan Kredit: Untuk pengguna dengan risiko kredit tinggi, aplikasi mengirimkan prompt serupa yang meminta rencana tindakan langkah-demi-langkah untuk meningkatkan profil kredit mereka. Gemini API merespons dengan saran praktis tentang pengelolaan utang, peningkatan riwayat kredit, dan perencanaan keuangan.
