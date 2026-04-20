import React, { useState, useEffect } from 'react';
import axios from 'axios';

// =====================================================================
// DİNAMİK VÜCUT HARİTASI
// =====================================================================
const DynamicBody = ({ user }) => {
    const [hoveredPart, setHoveredPart] = useState(null);

    const sf = 1.1;
    const boyun = user.boyun || 35;
    const bel = user.bel || 80;
    const kalca = user.kalca || (user.cinsiyet === 'Kadın' ? 95 : bel + 5);

    const n_w = boyun * sf / 2;
    const w_w = bel * sf / 2;
    const h_w = kalca * sf / 2;
    const s_w = 55;

    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            {hoveredPart && (
                <div style={{ position: 'absolute', top: '10px', backgroundColor: 'rgba(40, 167, 69, 0.9)', color: '#fff', padding: '5px 12px', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold', zIndex: 10, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    {hoveredPart}
                </div>
            )}

            <svg viewBox="0 0 200 230" style={{ width: '140px', height: '180px' }}>
                <circle cx="100" cy="25" r="18" fill="#555" />
                <g onMouseEnter={() => setHoveredPart(`Boyun: ${user.boyun ? user.boyun : '--'} cm`)} onMouseLeave={() => setHoveredPart(null)} style={{ cursor: 'pointer' }}>
                    <rect x={100 - n_w} y="43" width={n_w * 2} height="15" fill="#888" style={{ transition: 'all 0.4s' }} />
                    <circle cx="100" cy="50" r="5" fill="#007bff" />
                </g>
                <g onMouseEnter={() => setHoveredPart(`Bel: ${user.bel ? user.bel : '--'} cm`)} onMouseLeave={() => setHoveredPart(null)} style={{ cursor: 'pointer' }}>
                    <polygon points={`${100 - s_w},58 ${100 + s_w},58 ${100 + w_w},130 ${100 - w_w},130`} fill="#444" style={{ transition: 'all 0.4s' }} />
                    <circle cx="100" cy="120" r="5" fill="#28a745" />
                </g>
                <g onMouseEnter={() => setHoveredPart(`Kalça: ${kalca} cm`)} onMouseLeave={() => setHoveredPart(null)} style={{ cursor: 'pointer' }}>
                    <polygon points={`${100 - w_w},130 ${100 + w_w},130 ${100 + h_w},180 ${100 - h_w},180`} fill="#555" style={{ transition: 'all 0.4s' }} />
                    <circle cx="100" cy="170" r="5" fill={user.cinsiyet === 'Kadın' ? '#e83e8c' : '#ffc107'} />
                </g>
                <polygon points={`${100 - h_w + 5},180 ${100 - 5},180 ${100 - 5},230 ${100 - h_w + 10},230`} fill="#333" style={{ transition: 'all 0.4s' }} />
                <polygon points={`${100 + 5},180 ${100 + h_w - 5},180 ${100 + h_w - 10},230 ${100 + 5},230`} fill="#333" style={{ transition: 'all 0.4s' }} />
            </svg>
        </div>
    );
};

// =====================================================================
// ANA UYGULAMA (APP)
// =====================================================================
function App() {
    const [view, setView] = useState('login');
    const [currentUser, setCurrentUser] = useState(null);

    const [authData, setAuthData] = useState({ isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: '' });
    const [profileData, setProfileData] = useState({ yas: '', kilo: '', boy: '', boyun: '', bel: '', kalca: '', cinsiyet: 'Erkek' });

    const [selectedFile, setSelectedFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [activeDays, setActiveDays] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyLogs, setDailyLogs] = useState([]);
    const [expandedLogs, setExpandedLogs] = useState({});
    const [hoveredDate, setHoveredDate] = useState(null);

    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [isCalendarOpen, setIsCalendarOpen] = useState(true);
    const [isBodyOpen, setIsBodyOpen] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
            setDailyLogs([...res.data].reverse());
            setExpandedLogs({});
        } catch (err) { console.error("Geçmiş çekilemedi:", err); }
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:8080/api/kullanici/login', { isim: authData.isim.trim(), sifre: authData.sifre.trim() });
            setCurrentUser(res.data);
            fetchActiveDays(res.data.id);
            if (!res.data.yas || !res.data.boy || !res.data.kilo) setView('profile'); else setView('dashboard');
        } catch (err) { alert("Giriş Başarısız! Kullanıcı adı veya şifre hatalı."); }
    };

    const handleRegister = async () => {
        const { isim, sifre, yas, kilo, boy, cinsiyet, boyun, bel, kalca } = authData;
        if (!isim || !isim.trim()) return alert("Lütfen 'Kullanıcı Adı' alanını doldurun.");
        if (!sifre || !sifre.trim()) return alert("Lütfen 'Şifre' belirleyin.");
        if (!yas) return alert("Lütfen 'Yaş' bilginizi girin.");
        if (!kilo) return alert("Lütfen 'Kilo' bilginizi girin.");
        if (!boy) return alert("Lütfen 'Boy' bilginizi girin.");
        const payload = { isim: isim.trim(), sifre: sifre.trim(), yas: parseInt(yas), kilo: parseFloat(kilo), boy: parseFloat(boy), cinsiyet: cinsiyet, boyun: boyun ? parseFloat(boyun) : 0, bel: bel ? parseFloat(bel) : 0, kalca: kalca ? parseFloat(kalca) : 0 };
        try {
            await axios.post('http://localhost:8080/api/kullanici/kayit', payload);
            alert("Hesap başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.");
            setAuthData({ isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: '' });
            setView('login');
        } catch (err) { alert("Kayıt başarısız! Bu kullanıcı adı zaten kullanılıyor olabilir."); }
    };

    const handleProfileUpdate = async () => {
        try {
            const payload = { ...profileData, yas: parseInt(profileData.yas) || 0, kilo: parseFloat(profileData.kilo) || 0, boy: parseFloat(profileData.boy) || 0, boyun: parseFloat(profileData.boyun) || 0, bel: parseFloat(profileData.bel) || 0, kalca: parseFloat(profileData.kalca) || 0 };
            const res = await axios.put(`http://localhost:8080/api/kullanici/${currentUser.id}/profil`, payload);
            setCurrentUser(res.data); alert("Profil başarıyla güncellendi! Yeni değerlerin hesaplandı."); setView('dashboard');
        } catch (err) { alert("Güncelleme sırasında bir hata oluştu."); }
    };

    const handleAnalyzeFood = async () => {
        if (!selectedFile) return alert("Lütfen fotoğraf seçin!");
        const formData = new FormData(); formData.append('file', selectedFile); formData.append('userId', currentUser.id);
        setIsAnalyzing(true); setUploadProgress(0);
        const progressInterval = setInterval(() => { setUploadProgress(prev => (prev >= 90 ? 90 : prev + 15)); }, 500);
        try {
            await axios.post('http://localhost:8080/api/food/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            clearInterval(progressInterval); setUploadProgress(100); fetchActiveDays(currentUser.id); fetchDailyHistory();
        } catch (err) { clearInterval(progressInterval); setUploadProgress(0); alert("Analiz hatası."); } finally {
            setTimeout(() => { setIsAnalyzing(false); setUploadProgress(0); setSelectedFile(null); document.getElementById('fileInput').value = ''; }, 1000);
        }
    };

    const toggleLog = (index) => { setExpandedLogs(prev => ({ ...prev, [index]: !prev[index] })); };

    const formatAiAdvice = (text) => {
        if (!text) return "";
        let formattedText = text;
        formattedText = formattedText.replace(/(Yarın için öğün tavsiyem:?)/gi, "\n\n🍽️ $1");
        formattedText = formattedText.replace(/(Egzersiz tavsiyem:?)/gi, "\n\n🏃‍♂️ $1");
        return formattedText;
    };

    const getDaysInMonth = () => {
        const date = new Date(selectedDate);
        const year = date.getFullYear(); const month = date.getMonth();
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
                            <div style={{display: 'flex', gap: '10px'}}><input value={authData.yas} type="number" placeholder="Yaş *" onChange={e => setAuthData({...authData, yas: e.target.value})} style={styles.lightInput}/><select value={authData.cinsiyet} onChange={e => setAuthData({...authData, cinsiyet: e.target.value})} style={styles.lightInput}><option value="Erkek">Erkek</option><option value="Kadın">Kadın</option></select></div>
                            <div style={{display: 'flex', gap: '10px'}}><input value={authData.kilo} type="number" placeholder="Kilo (kg) *" onChange={e => setAuthData({...authData, kilo: e.target.value})} style={styles.lightInput}/><input value={authData.boy} type="number" placeholder="Boy (cm) *" onChange={e => setAuthData({...authData, boy: e.target.value})} style={styles.lightInput}/></div>
                            <p style={{fontSize: '12px', color: '#dc3545', margin: '5px 0', textAlign: 'left'}}>* İşaretli alanlar zorunludur.</p><hr style={{ borderColor: '#eee', margin: '15px 0' }} />
                            <p style={{fontSize: '13px', color: '#666', marginBottom: '10px', fontWeight: 'bold'}}>İsteğe Bağlı Ölçüler</p>
                            <div style={{display: 'flex', gap: '10px'}}><input value={authData.boyun} type="number" placeholder="Boyun Çevresi" onChange={e => setAuthData({...authData, boyun: e.target.value})} style={styles.lightInput}/><input value={authData.bel} type="number" placeholder="Bel Çevresi" onChange={e => setAuthData({...authData, bel: e.target.value})} style={styles.lightInput}/></div>
                            {authData.cinsiyet === 'Kadın' && (<input value={authData.kalca} type="number" placeholder="Kalça Çevresi (cm)" onChange={e => setAuthData({...authData, kalca: e.target.value})} style={styles.lightInput}/>)}
                        </>
                    )}
                    <button onClick={view === 'login' ? handleLogin : handleRegister} style={styles.lightButton}>{view === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</button>
                    <p onClick={() => { setView(view === 'login' ? 'register' : 'login'); setAuthData({ isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: '' }); }} style={styles.lightLink}>{view === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Geri Dön'}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f0f10', color: '#fff', fontFamily: 'Arial', overflow: 'hidden' }}>

            <div style={{ width: isSidebarOpen ? '350px' : '0', minWidth: isSidebarOpen ? '350px' : '0', backgroundColor: '#1a1a1b', borderRight: isSidebarOpen ? '1px solid #333' : 'none', padding: isSidebarOpen ? '20px' : '0', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', whiteSpace: 'nowrap' }}>
                <div onClick={() => setIsMenuOpen(!isMenuOpen)} style={styles.collapsibleHeader}>
                    <h3 style={{ color: '#28a745', margin: 0 }}>🥗 Menü</h3>
                    <span style={{color: '#888', fontSize: '14px'}}>{isMenuOpen ? '▼' : '▶'}</span>
                </div>
                {isMenuOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px', marginBottom: '20px' }}>
                        <button onClick={() => setView('dashboard')} style={{...styles.navButton, backgroundColor: view === 'dashboard' ? '#28a745' : 'transparent'}}>📊 Dashboard</button>
                        <button onClick={() => setView('profile')} style={{...styles.navButton, backgroundColor: view === 'profile' ? '#28a745' : 'transparent'}}>👤 Profilim</button>
                        <button onClick={() => setView('diets')} style={{...styles.navButton, backgroundColor: view === 'diets' ? '#28a745' : 'transparent'}}>🍏 Önerilen Diyetler</button>
                        <button onClick={() => setView('exercises')} style={{...styles.navButton, backgroundColor: view === 'exercises' ? '#28a745' : 'transparent'}}>💪 Egzersiz Hareketleri</button>
                    </div>
                )}

                <hr style={{borderColor: '#333', width: '100%', margin: '10px 0'}}/>
                <div onClick={() => setIsCalendarOpen(!isCalendarOpen)} style={{...styles.collapsibleHeader, marginTop: '10px'}}>
                    <h4 style={{ color: '#888', margin: 0 }}>📅 Takvim</h4>
                    <span style={{color: '#888', fontSize: '14px'}}>{isCalendarOpen ? '▼' : '▶'}</span>
                </div>
                {isCalendarOpen && (
                    <div style={{ marginTop: '15px', marginBottom: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '5px' }}>
                            {gunler.map(gun => <div key={gun} style={{ fontSize: '11px', textAlign: 'center', color: '#888', fontWeight: 'bold' }}>{gun}</div>)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                            {getDaysInMonth().map((gun, index) => {
                                if (!gun) return <div key={index}></div>;
                                const dateObj = new Date(selectedDate);
                                const curDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(gun).padStart(2, '0')}`;
                                const foodsToday = activeDays[curDateStr] || [];
                                const hasData = foodsToday.length > 0;

                                return (
                                    <div key={index} onMouseEnter={() => setHoveredDate(curDateStr)} onMouseLeave={() => setHoveredDate(null)} onClick={() => { setSelectedDate(curDateStr); setView('dashboard'); }}
                                         style={{ position: 'relative', padding: '10px 0', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', backgroundColor: hasData ? '#28a745' : '#262627', border: selectedDate === curDateStr ? '1px solid #fff' : 'none' }}>
                                        {gun}
                                        {hoveredDate === curDateStr && hasData && (
                                            <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#007bff', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', whiteSpace: 'nowrap', zIndex: 50, boxShadow: '0 4px 10px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                                                <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '3px', marginBottom: '5px' }}>Öğünlerin:</div>
                                                {foodsToday.map((food, i) => <div key={i} style={{textAlign: 'left'}}>• {food}</div>)}
                                                <div style={{ position: 'absolute', top: '100%', left: '50%', marginLeft: '-6px', borderWidth: '6px', borderStyle: 'solid', borderColor: '#007bff transparent transparent transparent' }}></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {currentUser && (
                    <>
                        <hr style={{borderColor: '#333', width: '100%', margin: '10px 0'}}/>
                        <div onClick={() => setIsBodyOpen(!isBodyOpen)} style={{...styles.collapsibleHeader, marginTop: '10px'}}>
                            <h4 style={{ color: '#888', margin: 0 }}>👤 Vücut Analizin</h4>
                            <span style={{color: '#888', fontSize: '14px'}}>{isBodyOpen ? '▼' : '▶'}</span>
                        </div>
                        {isBodyOpen && (
                            <div style={{ marginTop: '15px' }}>
                                <DynamicBody user={currentUser} />
                            </div>
                        )}
                    </>
                )}
            </div>

            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer', fontSize: '24px', backgroundColor: '#262627', border: '1px solid #444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', transition: '0.2s', userSelect: 'none' }}>
                            ☰
                        </div>
                        <h2 style={{ margin: 0 }}>
                            {view === 'dashboard' ? `Hoş Geldin, ${currentUser.isim}! 👋` :
                                view === 'profile' ? '👤 Profil Bilgilerini Güncelle' :
                                    view === 'diets' ? '🍏 Önerilen Diyet Programları' : '💪 Egzersiz Hareketleri Rehberi'}
                        </h2>
                    </div>
                    <button onClick={() => { setCurrentUser(null); setAuthData({ isim: '', sifre: '', yas: '', kilo: '', boy: '', cinsiyet: 'Erkek', boyun: '', bel: '', kalca: '' }); setView('login'); }} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Çıkış Yap</button>
                </div>

                {view === 'dashboard' && (
                    <>
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

                        <div style={styles.card}>
                            <h3 style={{marginTop: 0}}>📸 Yeni Öğün Ekle</h3>
                            <input id="fileInput" type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{marginBottom: '15px'}} />
                            <button onClick={handleAnalyzeFood} disabled={isAnalyzing} style={{...styles.button, backgroundColor: isAnalyzing ? '#444' : '#28a745'}}>
                                {isAnalyzing ? `Yapay Zeka Analiz Ediyor... %${uploadProgress}` : "Yemeği Tanı ve Günlüğe Kaydet"}
                            </button>
                            {isAnalyzing && (
                                <div style={{width: '100%', height: '10px', backgroundColor: '#262627', borderRadius: '5px', marginTop: '10px', overflow: 'hidden'}}>
                                    <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: '#007bff', transition: 'width 0.5s ease' }}></div>
                                </div>
                            )}
                        </div>

                        <div style={styles.card}>
                            <h3 style={{marginTop: 0, color: '#007bff'}}>📅 {selectedDate} Tarihli Öğünlerin</h3>
                            {dailyLogs.length === 0 ? (
                                <p style={{color: '#888', fontStyle: 'italic'}}>Bu tarihte henüz bir yemek kaydınız bulunmuyor.</p>
                            ) : (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    {dailyLogs.map((log, index) => (
                                        <div key={index} style={{ borderLeft: '4px solid #28a745', backgroundColor: '#262627', padding: '15px', borderRadius: '8px' }}>
                                            <div onClick={() => toggleLog(index)} style={{ display: 'flex', gap: '20px', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{color: '#888', fontWeight: 'bold', fontSize: '18px'}}>{log.saat ? log.saat.substring(0,5) : '--:--'}</div>
                                                {log.fotografBase64 ? (
                                                    <img src={`data:image/jpeg;base64,${log.fotografBase64}`} alt="Yemek" style={{width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #444'}} />
                                                ) : (
                                                    <div style={{width: '70px', height: '70px', backgroundColor: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px', textAlign: 'center'}}>Görsel<br/>Yok</div>
                                                )}
                                                <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                    <h4 style={{margin: 0, color: '#28a745', textTransform: 'capitalize', fontSize: '22px'}}>{log.yemekAdi.replace(/_/g, ' ')}</h4>
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                                                        <span style={{fontWeight: 'bold', fontSize: '20px', color: '#fff'}}>{log.kalori} kcal</span>
                                                        <span style={{fontSize: '24px', color: '#888'}}>{expandedLogs[index] ? '▲' : '▼'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedLogs[index] && (
                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #444' }}>
                                                    <p style={{ margin: 0, fontSize: '15px', color: '#ddd', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}><b style={{color: '#007bff'}}>🧠 Yapay Zeka Sağlık Analizi:</b><br/>{formatAiAdvice(log.aiTavsiyesi)}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {view === 'profile' && (
                    <div style={{maxWidth: '600px'}}>
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

                {view === 'diets' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={styles.card}>
                            <h3 style={{ color: '#28a745', marginTop: 0 }}>🥗 Kilo Verme (Definasyon)</h3>
                            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>Amacınız yağ yakmak ise yüksek proteinli, düşük karbonhidratlı öğünler tercih etmelisiniz.<br/><br/><b>Sabah:</b> Yulaf ezmesi ve 2 haşlanmış yumurta.<br/><b>Öğle:</b> Izgara tavuklu yeşil salata.<br/><b>Akşam:</b> Fırın somon ve brokoli.</p>
                        </div>
                        <div style={styles.card}>
                            <h3 style={{ color: '#007bff', marginTop: 0 }}>💪 Kas Kazanımı (Bulk)</h3>
                            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>Amacınız hacim kazanmak ise karbonhidrat ve proteini dengeli şekilde yüksek almalısınız.<br/><br/><b>Sabah:</b> Fıstık ezmeli tam buğday ekmeği ve protein shake.<br/><b>Öğle:</b> Etli tam buğday makarna.<br/><b>Akşam:</b> Kırmızı et ve fırın patates.</p>
                        </div>
                    </div>
                )}

                {/* YENİ: İÇERİSİNE GIF EKLENMİŞ EGZERSİZ BÖLÜMÜ */}
                {view === 'exercises' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                        {/* 1. KART: KARDİYO */}
                        <div style={styles.card}>
                            <h3 style={{ color: '#dc3545', marginTop: 0 }}>🔥 Kardiyo & HIIT</h3>
                            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6', minHeight: '120px' }}>
                                Metabolizmanızı hızlandırmak ve yağ yakımını maksimize etmek için uygulayın.<br/><br/>
                                • 30 Dakika Tempolu Yürüyüş veya Koşu<br/>
                                • 15 Dakika İp Atlama<br/>
                                • 20 Dakika Burpees ve Jumping Jacks
                            </p>
                            {/* KENDİ BİLGİSAYARINDAKİ GIF */}
                            <img
                                src="/kardiyo.gif"
                                alt="Kardiyo Egzersizi"
                                style={{width: '100%', borderRadius: '8px', marginTop: '10px', border: '1px solid #444'}}
                            />
                        </div>

                        {/* 2. KART: AĞIRLIK ANTRENMANI (ŞINAV GIF İLE) */}
                        <div style={styles.card}>
                            <h3 style={{ color: '#ffc107', marginTop: 0 }}>🏋️ Ağırlık Antrenmanı</h3>
                            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6', minHeight: '120px' }}>
                                Kas kütlenizi artırarak bazal metabolizma hızınızı yükseltin.<br/><br/>
                                • Squat (4 Set x 12 Tekrar)<br/>
                                • Push-up / Şınav (3 Set x Maksimum Tekrar)<br/>
                                • Dumbbell Row (3 Set x 10 Tekrar)
                            </p>
                            {/* KENDİ BİLGİSAYARINDAKİ GIF */}
                            <img
                                src="/sinav.gif"
                                alt="Push Up Egzersizi"
                                style={{width: '100%', borderRadius: '8px', marginTop: '10px', border: '1px solid #444'}}
                            />
                        </div>
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
    navButton: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: '0.3s', display: 'block', boxSizing: 'border-box' },
    card: { backgroundColor: '#1a1a1b', padding: '25px', borderRadius: '12px', border: '1px solid #333', marginBottom: '25px' },
    label: { fontSize: '14px', color: '#888', marginBottom: '5px', display: 'block' },
    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' },
    collapsibleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '5px', borderRadius: '5px', userSelect: 'none' }
};

export default App;