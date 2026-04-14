import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [view, setView] = useState('login');
    const [currentUser, setCurrentUser] = useState(null);

    const [authData, setAuthData] = useState({
        isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: ''
    });

    const [profileData, setProfileData] = useState({
        yas: '', kilo: '', boy: '', boyun: '', bel: '', kalca: '', cinsiyet: 'Erkek'
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // YENİ: Dolum Barı (Progress Bar) için state
    const [uploadProgress, setUploadProgress] = useState(0);

    const [activeDays, setActiveDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyLogs, setDailyLogs] = useState([]);

    const gunler = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                yas: currentUser.yas || '', kilo: currentUser.kilo || '', boy: currentUser.boy || '',
                boyun: currentUser.boyun || '', bel: currentUser.bel || '', kalca: currentUser.kalca || '', cinsiyet: currentUser.cinsiyet || 'Erkek'
            });
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser && selectedDate) fetchDailyHistory();
    }, [selectedDate, currentUser]);

    const fetchActiveDays = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/food/${userId}/active-days`);
            setActiveDays(res.data);
        } catch (err) { console.error("Aktif günler çekilemedi:", err); }
    };

    const fetchDailyHistory = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/food/${currentUser.id}/history/${selectedDate}`);
            // YENİ: reverse() fonksiyonu ile en son eklenen analizin en üstte (yukarıda) görünmesini sağlıyoruz!
            setDailyLogs([...res.data].reverse());
        } catch (err) { console.error("Geçmiş çekilemedi:", err); }
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:8080/api/kullanici/login', {
                isim: authData.isim.trim(), sifre: authData.sifre.trim()
            });
            setCurrentUser(res.data);
            fetchActiveDays(res.data.id);
            if (!res.data.yas || !res.data.boy || !res.data.kilo) setView('profile');
            else setView('dashboard');
        } catch (err) { alert("Giriş Başarısız! Kullanıcı adı veya şifre hatalı."); }
    };

    const handleRegister = async () => {
        const { isim, sifre, yas, kilo, boy, cinsiyet, boyun, bel, kalca } = authData;
        if (!isim || !isim.trim()) return alert("Lütfen 'Kullanıcı Adı' alanını doldurun.");
        if (!sifre || !sifre.trim()) return alert("Lütfen 'Şifre' belirleyin.");
        if (!yas) return alert("Lütfen 'Yaş' bilginizi girin.");
        if (!kilo) return alert("Lütfen 'Kilo' bilginizi girin.");
        if (!boy) return alert("Lütfen 'Boy' bilginizi girin.");

        const payload = {
            isim: isim.trim(), sifre: sifre.trim(), yas: parseInt(yas), kilo: parseFloat(kilo), boy: parseFloat(boy),
            cinsiyet: cinsiyet, boyun: boyun ? parseFloat(boyun) : 0, bel: bel ? parseFloat(bel) : 0, kalca: kalca ? parseFloat(kalca) : 0
        };

        try {
            await axios.post('http://localhost:8080/api/kullanici/kayit', payload);
            alert("Hesap başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.");
            setAuthData({ isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: '' });
            setView('login');
        } catch (err) { alert("Kayıt başarısız! Bu kullanıcı adı zaten kullanılıyor olabilir."); }
    };

    const handleProfileUpdate = async () => {
        try {
            const payload = {
                ...profileData, yas: parseInt(profileData.yas) || 0, kilo: parseFloat(profileData.kilo) || 0,
                boy: parseFloat(profileData.boy) || 0, boyun: parseFloat(profileData.boyun) || 0, bel: parseFloat(profileData.bel) || 0, kalca: parseFloat(profileData.kalca) || 0
            };
            const res = await axios.put(`http://localhost:8080/api/kullanici/${currentUser.id}/profil`, payload);
            setCurrentUser(res.data);
            alert("Profil başarıyla güncellendi! Yeni değerlerin hesaplandı.");
            setView('dashboard');
        } catch (err) { alert("Güncelleme sırasında bir hata oluştu."); }
    };

    // YENİ: Dolum Barı Animasyonlu Analiz Fonksiyonu
    const handleAnalyzeFood = async () => {
        if (!selectedFile) return alert("Lütfen fotoğraf seçin!");
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', currentUser.id);

        setIsAnalyzing(true);
        setUploadProgress(0);

        // Sahte ama gerçekçi bir dolum barı animasyonu başlatıyoruz
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) return 90; // İstek bitene kadar %90'da bekler
                return prev + 15; // Her yarım saniyede %15 dolar
            });
        }, 500);

        try {
            const res = await axios.post('http://localhost:8080/api/food/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            clearInterval(progressInterval);
            setUploadProgress(100); // Başarılı olunca anında %100 olur
            setAnalysisResult(res.data);

            fetchActiveDays(currentUser.id);
            fetchDailyHistory();

        } catch (err) {
            clearInterval(progressInterval);
            setUploadProgress(0);
            alert("Analiz hatası.");
        } finally {
            // Barın %100'de biraz durup sonra kaybolması için 1 saniye bekletiyoruz
            setTimeout(() => {
                setIsAnalyzing(false);
                setUploadProgress(0);
                setSelectedFile(null); // Dosyayı temizle
                document.getElementById('fileInput').value = ''; // Inputu temizle
            }, 1000);
        }
    };

    const getDaysInMonth = () => {
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const startingDay = firstDay === 0 ? 6 : firstDay - 1;
        let days = [];
        for (let i = 0; i < startingDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    if (view === 'login' || view === 'register') {
        return (
            <div style={styles.authWrapper}>
                <div style={styles.authContainer}>
                    <h2 style={{color: '#333'}}>{view === 'login' ? 'Diyet Asistanı Giriş' : 'Yeni Kayıt Oluştur'}</h2>

                    <input value={authData.isim} placeholder="Kullanıcı Adı *" onChange={e => setAuthData({...authData, isim: e.target.value})} style={styles.lightInput}/>
                    <input value={authData.sifre} type="password" placeholder="Şifre *" onChange={e => setAuthData({...authData, sifre: e.target.value})} style={styles.lightInput}/>

                    {view === 'register' && (
                        <>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <input value={authData.yas} type="number" placeholder="Yaş *" onChange={e => setAuthData({...authData, yas: e.target.value})} style={styles.lightInput}/>
                                <select value={authData.cinsiyet} onChange={e => setAuthData({...authData, cinsiyet: e.target.value})} style={styles.lightInput}>
                                    <option value="Erkek">Erkek</option>
                                    <option value="Kadın">Kadın</option>
                                </select>
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <input value={authData.kilo} type="number" placeholder="Kilo (kg) *" onChange={e => setAuthData({...authData, kilo: e.target.value})} style={styles.lightInput}/>
                                <input value={authData.boy} type="number" placeholder="Boy (cm) *" onChange={e => setAuthData({...authData, boy: e.target.value})} style={styles.lightInput}/>
                            </div>
                            <p style={{fontSize: '12px', color: '#dc3545', margin: '5px 0', textAlign: 'left'}}>* İşaretli alanlar zorunludur.</p>

                            <hr style={{ borderColor: '#eee', margin: '15px 0' }} />
                            <p style={{fontSize: '13px', color: '#666', marginBottom: '10px', fontWeight: 'bold'}}>İsteğe Bağlı Ölçüler</p>

                            <div style={{display: 'flex', gap: '10px'}}>
                                <input value={authData.boyun} type="number" placeholder="Boyun Çevresi" onChange={e => setAuthData({...authData, boyun: e.target.value})} style={styles.lightInput}/>
                                <input value={authData.bel} type="number" placeholder="Bel Çevresi" onChange={e => setAuthData({...authData, bel: e.target.value})} style={styles.lightInput}/>
                            </div>

                            {authData.cinsiyet === 'Kadın' && (
                                <input value={authData.kalca} type="number" placeholder="Kalça Çevresi (cm)" onChange={e => setAuthData({...authData, kalca: e.target.value})} style={styles.lightInput}/>
                            )}
                        </>
                    )}

                    <button onClick={view === 'login' ? handleLogin : handleRegister} style={styles.lightButton}>
                        {view === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                    </button>
                    <p onClick={() => {
                        setView(view === 'login' ? 'register' : 'login');
                        setAuthData({ isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: '' });
                    }} style={styles.lightLink}>
                        {view === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Geri Dön'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f0f10', color: '#fff', fontFamily: 'Arial' }}>

            <div style={{ width: '350px', backgroundColor: '#1a1a1b', borderRight: '1px solid #333', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: '#28a745', marginBottom: '20px' }}>🥗 Menü</h3>

                <button onClick={() => setView('dashboard')} style={{...styles.navButton, backgroundColor: view === 'dashboard' ? '#28a745' : 'transparent'}}>📊 Dashboard</button>
                <button onClick={() => setView('profile')} style={{...styles.navButton, backgroundColor: view === 'profile' ? '#28a745' : 'transparent', marginBottom: '30px'}}>👤 Profilim</button>

                <hr style={{borderColor: '#333', width: '100%'}}/>

                <h4 style={{ color: '#888', marginTop: '20px' }}>Takvim</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '5px' }}>
                    {gunler.map(gun => <div key={gun} style={{ fontSize: '11px', textAlign: 'center', color: '#888', fontWeight: 'bold' }}>{gun}</div>)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                    {getDaysInMonth().map((gun, index) => {
                        if (!gun) return <div key={index}></div>;
                        const dateObj = new Date(selectedDate);
                        const curDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(gun).padStart(2, '0')}`;
                        const hasData = activeDays.includes(curDateStr);

                        return (
                            <div key={index} onClick={() => { setSelectedDate(curDateStr); setView('dashboard'); }}
                                 style={{
                                     padding: '10px 0', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                                     backgroundColor: hasData ? '#28a745' : '#262627',
                                     border: selectedDate === curDateStr ? '1px solid #fff' : 'none'
                                 }}>{gun}</div>
                        );
                    })}
                </div>
            </div>

            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>

                {view === 'dashboard' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>Hoş Geldin, {currentUser.isim}! 👋</h2>
                            <button onClick={() => {
                                setCurrentUser(null);
                                setAuthData({ isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: '' });
                                setView('login');
                            }} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Çıkış Yap</button>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{...styles.card, flex: 1, marginBottom: 0}}>
                                <h4 style={{margin: '0 0 10px 0', color: '#888'}}>Günlük Hedef Kalori</h4>
                                <p style={{fontSize: '24px', margin: 0}}><b>{currentUser.gunlukKaloriIhtiyaci?.toFixed(0)} kcal</b></p>
                            </div>
                            <div style={{...styles.card, flex: 1, marginBottom: 0}}>
                                <h4 style={{margin: '0 0 10px 0', color: '#888'}}>Vücut Yağ Oranı</h4>
                                <p style={{fontSize: '24px', margin: 0}}><b>%{currentUser.vucutYagOrani?.toFixed(1)}</b></p>
                            </div>
                        </div>

                        {/* Yeni Fotoğraf Ekleme Alanı */}
                        <div style={styles.card}>
                            <h3 style={{marginTop: 0}}>📸 Yeni Öğün Ekle</h3>
                            <input id="fileInput" type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{marginBottom: '15px'}} />

                            <button onClick={handleAnalyzeFood} disabled={isAnalyzing} style={{...styles.button, backgroundColor: isAnalyzing ? '#444' : '#28a745'}}>
                                {isAnalyzing ? `Yapay Zeka Analiz Ediyor... %${uploadProgress}` : "Yemeği Tanı ve Günlüğe Kaydet"}
                            </button>

                            {/* YENİ: Progress Bar Animasyonu */}
                            {isAnalyzing && (
                                <div style={{width: '100%', height: '10px', backgroundColor: '#262627', borderRadius: '5px', marginTop: '10px', overflow: 'hidden'}}>
                                    <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: '#007bff', transition: 'width 0.5s ease' }}></div>
                                </div>
                            )}
                        </div>

                        {/* Takvimden Seçilen Günün Yemek Geçmişi (YENİ TASARIM: Saat ve Fotoğraflı) */}
                        <div style={styles.card}>
                            <h3 style={{marginTop: 0, color: '#007bff'}}>📅 {selectedDate} Tarihli Öğünlerin</h3>

                            {dailyLogs.length === 0 ? (
                                <p style={{color: '#888', fontStyle: 'italic'}}>Bu tarihte henüz bir yemek kaydınız bulunmuyor.</p>
                            ) : (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    {dailyLogs.map((log, index) => (
                                        <div key={index} style={{
                                            borderLeft: '4px solid #28a745', backgroundColor: '#262627', padding: '15px', borderRadius: '5px',
                                            display: 'flex', gap: '20px', alignItems: 'flex-start'
                                        }}>
                                            {/* SOL KISIM: Saat */}
                                            <div style={{color: '#888', fontWeight: 'bold', fontSize: '18px', paddingTop: '5px'}}>
                                                {log.saat ? log.saat.substring(0,5) : '--:--'}
                                            </div>

                                            {/* ORTA KISIM: Fotoğraf */}
                                            {log.fotografBase64 ? (
                                                <img src={`data:image/jpeg;base64,${log.fotografBase64}`} alt="Yemek"
                                                     style={{width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #444'}} />
                                            ) : (
                                                <div style={{width: '90px', height: '90px', backgroundColor: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px', textAlign: 'center'}}>Görsel<br/>Yok</div>
                                            )}

                                            {/* SAĞ KISIM: İsim, Kalori ve Yapay Zeka Tavsiyesi */}
                                            <div style={{flex: 1}}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                    <h4 style={{margin: 0, color: '#28a745', textTransform: 'capitalize', fontSize: '20px'}}>
                                                        {log.yemekAdi.replace(/_/g, ' ')}
                                                    </h4>
                                                    <span style={{fontWeight: 'bold', fontSize: '18px', color: '#fff'}}>{log.kalori} kcal</span>
                                                </div>
                                                <hr style={{borderColor: '#444', margin: '8px 0'}}/>
                                                <p style={{margin: 0, fontSize: '14px', color: '#ddd', whiteSpace: 'pre-wrap'}}>
                                                    <b>🧠 Yapay Zeka Diyor Ki:</b><br/>{log.aiTavsiyesi}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {view === 'profile' && (
                    <div style={{maxWidth: '600px'}}>
                        <h2>👤 Profil Bilgilerini Güncelle</h2>
                        <div style={styles.profileGrid}>
                            <div><label style={styles.label}>Cinsiyet</label><select value={profileData.cinsiyet} onChange={e => setProfileData({...profileData, cinsiyet: e.target.value})} style={styles.darkInput}><option>Erkek</option><option>Kadın</option></select></div>
                            <div><label style={styles.label}>Yaş</label><input type="number" value={profileData.yas} onChange={e => setProfileData({...profileData, yas: e.target.value})} style={styles.darkInput}/></div>
                            <div><label style={styles.label}>Boy (cm)</label><input type="number" value={profileData.boy} onChange={e => setProfileData({...profileData, boy: e.target.value})} style={styles.darkInput}/></div>
                            <div><label style={styles.label}>Kilo (kg)</label><input type="number" value={profileData.kilo} onChange={e => setProfileData({...profileData, kilo: e.target.value})} style={styles.darkInput}/></div>
                            <div><label style={styles.label}>Boyun Çevresi (cm)</label><input type="number" value={profileData.boyun} onChange={e => setProfileData({...profileData, boyun: e.target.value})} style={styles.darkInput}/></div>
                            <div><label style={styles.label}>Bel Çevresi (cm)</label><input type="number" value={profileData.bel} onChange={e => setProfileData({...profileData, bel: e.target.value})} style={styles.darkInput}/></div>
                            {profileData.cinsiyet === 'Kadın' && (<div><label style={styles.label}>Kalça Çevresi (cm)</label><input type="number" value={profileData.kalca} onChange={e => setProfileData({...profileData, kalca: e.target.value})} style={styles.darkInput}/></div>)}
                        </div>
                        <button onClick={handleProfileUpdate} style={{...styles.button, backgroundColor: '#000', color: '#fff', border: '1px solid #333', marginTop: '20px', width: '200px'}}>Değişiklikleri Kaydet</button>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    authWrapper: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9' },
    authContainer: { width: '400px', padding: '40px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center', color: '#333' },
    lightInput: { width: '100%', padding: '12px', margin: '6px 0', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' },
    lightButton: { width: '100%', padding: '14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' },
    lightLink: { color: '#007bff', cursor: 'pointer', marginTop: '20px', fontSize: '14px', textDecoration: 'underline' },

    darkInput: { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#1a1a1b', color: '#fff', boxSizing: 'border-box' },
    button: { width: '100%', padding: '15px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
    navButton: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', marginBottom: '10px', transition: '0.3s' },
    card: { backgroundColor: '#1a1a1b', padding: '25px', borderRadius: '12px', border: '1px solid #333', marginBottom: '25px' },
    label: { fontSize: '14px', color: '#888', marginBottom: '5px', display: 'block' },
    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }
};

export default App;