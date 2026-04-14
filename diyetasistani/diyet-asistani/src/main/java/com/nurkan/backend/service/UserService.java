package com.nurkan.backend.service;

import com.nurkan.backend.entity.User;
import com.nurkan.backend.entity.FoodLog;
import com.nurkan.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User kaydet(User user) {
        return userRepository.save(user);
    }

    public User girisYap(String isim, String sifre) {
        return userRepository.findByIsim(isim)
                .filter(u -> u.getSifre().equals(sifre))
                .orElse(null);
    }

    public User profilGuncelle(Long id, User guncelBilgiler) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        user.setYas(guncelBilgiler.getYas());
        user.setKilo(guncelBilgiler.getKilo());
        user.setBoy(guncelBilgiler.getBoy());
        user.setBoyun(guncelBilgiler.getBoyun());
        user.setBel(guncelBilgiler.getBel());
        user.setKalca(guncelBilgiler.getKalca());
        user.setCinsiyet(guncelBilgiler.getCinsiyet());

        // BMR (Günlük Kalori) Hesaplama - Sadece Boy ve Kilo Yeterli
        int hesapYas = user.getYas() > 0 ? user.getYas() : 24; // Yaş boşsa varsayılan 24 alarak sistemi çökertmiyoruz
        if (user.getKilo() > 0 && user.getBoy() > 0) {
            if ("Erkek".equalsIgnoreCase(user.getCinsiyet())) {
                user.setGunlukKaloriIhtiyaci(88.36 + (13.4 * user.getKilo()) + (4.8 * user.getBoy()) - (5.7 * hesapYas));
            } else {
                user.setGunlukKaloriIhtiyaci(447.59 + (9.25 * user.getKilo()) + (3.1 * user.getBoy()) - (4.33 * hesapYas));
            }
        }

        // AKILLI YAĞ ORANI HESAPLAMA (İki Kademeli)
        if (user.getBoy() > 0 && user.getKilo() > 0) {
            boolean isErkek = "Erkek".equalsIgnoreCase(user.getCinsiyet());

            // 1. KADEME: Bel ve Boyun girilmişse (Hassas Donanma Yöntemi)
            if (user.getBel() > 0 && user.getBoyun() > 0 && (isErkek || (!isErkek && user.getKalca() > 0))) {
                double logBoy = Math.log10(user.getBoy());
                if (isErkek) {
                    user.setVucutYagOrani(495 / (1.0324 - 0.19077 * Math.log10(user.getBel() - user.getBoyun()) + 0.15456 * logBoy) - 450);
                } else {
                    user.setVucutYagOrani(495 / (1.29579 - 0.35004 * Math.log10(user.getBel() + user.getKalca() - user.getBoyun()) + 0.22100 * logBoy) - 450);
                }
            }
            // 2. KADEME: Sadece Boy ve Kilo varsa (Genel VKİ Formülü ile Tahmin)
            else {
                double boyMetre = user.getBoy() / 100.0;
                double vki = user.getKilo() / (boyMetre * boyMetre);
                int cinsiyetCarpani = isErkek ? 1 : 0;
                // VKİ'den Yağ Oranı Çıkarma Formülü
                double yagOraniVki = (1.20 * vki) + (0.23 * hesapYas) - (10.8 * cinsiyetCarpani) - 5.4;
                user.setVucutYagOrani(yagOraniVki);
            }
        }

        return userRepository.save(user);
    }

    public List<FoodLog> getKullaniciGecmisi(Long userId) {
        return userRepository.findById(userId).map(User::getGecmisYemekler).orElse(new ArrayList<>());
    }

    // HESABI KOMPLE SİL
    public void hesabiSil(Long id) {
        userRepository.deleteById(id);
    }
}