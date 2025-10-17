// Ambil container utama dari index.html
const container = document.getElementById('main-container');

// --- UTILITY FUNCTIONS (Disalin dari kode Anda) ---

// Fungsi untuk memformat angka menjadi format mata uang Rupiah
function formatRupiah(angka) {
    if (!angka) return '0';
    // Gunakan regex yang sedikit berbeda karena data JSON dari fetch akan berupa string
    const numberString = String(angka).replace(/[^,\d]/g, '').toString(); 
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
        const separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
    return 'Rp ' + rupiah;
}

// Fungsi untuk mendapatkan class warna status
function getStatusClass(pelaksanaan) {
    switch (pelaksanaan.toLowerCase()) {
        case 'belum terlaksana':
            return 'status-belum';
        case 'onprogres':
            return 'status-onprogres';
        case 'berproses':
            return 'status-berproses';
        case 'selesai':
            return 'status-selesai';
        default:
            return '';
    }
}

// Fungsi untuk toggle Kartu OPD
function toggleOPD(cardElement) {
    const container = cardElement.querySelector('.kegiatan-container');
    
    if (container.style.display === 'block') {
        container.style.display = 'none';
        cardElement.classList.remove('expanded');
    } else {
        container.style.display = 'block';
        cardElement.classList.add('expanded');
    }
}


// --- FUNGSI UTAMA: FETCH DAN RENDER DATA ---

async function fetchAndRenderData() {
    try {
        // PENTING: Gunakan path relatif. Pastikan data_progres.json ada di folder yang SAMA.
        const response = await fetch('data_progres.json'); 
        
        if (!response.ok) {
            // Memberikan pesan error yang lebih jelas jika gagal
            throw new Error(`Gagal memuat file data_progres.json. Status: ${response.status}. Cek Case Sensitivity nama file di GitHub.`);
        }

        // Data yang diambil dari JSON
        const dataProgres = await response.json(); 

        // Hapus konten lama
        container.innerHTML = ''; 

        // 1. Render Kartu OPD Utama
        dataProgres.forEach(opd => {
            const opdCard = document.createElement('div');
            opdCard.className = 'opd-card';
            opdCard.setAttribute('data-opd', opd.opd);
            
            const totalKegiatan = opd.kegiatan.length;
            const formattedPagu = formatRupiah(opd.pagu_total);

            opdCard.innerHTML = `
                <div class="opd-header">
                    <div class="opd-info">
                        <div class="opd-emoji">${opd.emoji}</div>
                        <div class="opd-text">
                            <div class="opd-title">${opd.opd}</div>
                            <div class="opd-detail-info">
                                <b>Total Anggaran : </b><span>${formattedPagu}</span><br>
                                <b>Jumlah Kegiatan : </b><span>${totalKegiatan}</span>
                            </div>
                        </div>
                    </div>
                    <span class="material-icons toggle-icon">expand_more</span>
                </div>
                <div class="kegiatan-container" id="kegiatan-${opd.opd.replace(/\s/g, '-')}-container">
                </div>
            `;
            container.appendChild(opdCard);

            // 2. Tambahkan Event Listener untuk Toggle OPD
            opdCard.addEventListener('click', (e) => {
                if (e.target.closest('.kegiatan-container')) {
                    return; 
                }
                if (e.target.tagName !== 'A' && e.target.parentElement.tagName !== 'A') {
                    toggleOPD(opdCard);
                }
            });

            // 3. Render Kartu Kegiatan
            const kegiatanContainer = opdCard.querySelector('.kegiatan-container');
            renderKegiatan(kegiatanContainer, opd.kegiatan);
        });

    } catch (error) {
        console.error("Gagal mengambil atau merender data:", error);
        container.innerHTML = `<p style="color:red; text-align:center; font-weight:bold;">Gagal memuat data! (${error.message})</p>`;
    }
}


// Fungsi untuk render Kartu Kegiatan
function renderKegiatan(containerElement, kegiatanData) {
    kegiatanData.forEach(kegiatan => {
        const kegiatanCard = document.createElement('div');
        kegiatanCard.className = 'kegiatan-card';
        
        const formattedPagu = formatRupiah(kegiatan.pagu);
        const statusClass = getStatusClass(kegiatan.pelaksanaan); 

        kegiatanCard.innerHTML = `
            <div class="kegiatan-header">
                <div class="kegiatan-title">${kegiatan.no}. ${kegiatan.nama}</div>
                <span class="material-icons toggle-icon">expand_more</span>
            </div>
            <div class="kegiatan-detail">
                <p><b>Anggaran : </b><span>${formattedPagu}</span></p>
                <p><b>Bobot : </b><span>${kegiatan.bobot}%</span></p>

                <div class="status-container">
                    <b>Pelaksanaan : </b>&nbsp; 
                    <div class="status-dot ${statusClass}"></div>
                    <strong>${kegiatan.pelaksanaan}</strong>
                </div>
                
                <p><b>Realisasi Keuangan :</b> <span>${kegiatan.realisasi_keuangan}%</span></p>
                <div class="progress-bar-container progress-keuangan">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${kegiatan.realisasi_keuangan}%;"></div>
                    </div>
                </div>

                <p><b>Realisasi Fisik :</b> <span>${kegiatan.realisasi_fisik}%</span></p>
                <div class="progress-bar-container progress-fisik">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${kegiatan.realisasi_fisik}%;"></div>
                    </div>
                </div>
                
                <p><strong>Keterangan:</strong> ${kegiatan.keterangan || '-'}</p>
                <p><strong>Rencana Aksi:</strong> ${kegiatan.rencana_aksi || '-'}</p>
                
                <a href="${kegiatan.link_pdf}" class="pdf-button" target="_blank">LIHAT LAPORAN PDF</a>
            </div>
        `;
        containerElement.appendChild(kegiatanCard);
        
        const headerElement = kegiatanCard.querySelector('.kegiatan-header');
        const detailElement = kegiatanCard.querySelector('.kegiatan-detail');

        // Tambahkan Event Listener KHUSUS pada header kegiatan
        headerElement.addEventListener('click', (e) => {
            e.stopPropagation(); 
            kegiatanCard.classList.toggle('expanded');
            
            if (kegiatanCard.classList.contains('expanded')) {
                detailElement.style.display = 'block'; 
            } else {
                detailElement.style.display = 'none';  
            }
        });

        // Event listener pada seluruh kartu untuk mencegah klik di luar header mengganggu bubbling
        kegiatanCard.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.parentElement.tagName === 'A') {
                e.stopPropagation();
            } else if (e.target.closest('.kegiatan-header')) {
                return;
            } else {
                e.stopPropagation();
            }
        });
    });
}

// Panggil fungsi utama untuk memulai rendering saat app.js dimuat

fetchAndRenderData();
