package com.nurkan.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class FoodLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String yemekAdi;
    private double kalori;
    private LocalDate tarih = LocalDate.now();
    private java.time.LocalTime saat = java.time.LocalTime.now(); // YENİ: Saat bilgisi

    @Column(columnDefinition = "LONGTEXT") // YENİ: Fotoğraflar çok uzun metinler olduğu için LONGTEXT kullanıyoruz
    private String fotografBase64;

    @Column(columnDefinition = "TEXT")
    private String aiTavsiyesi;


    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore // Sonsuz döngü engelleyici!
    private User user;

    // --- MANUEL GETTER VE SETTER'LAR (Lombok çökmelerine karşı zırh) ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getYemekAdi() { return yemekAdi; }
    public void setYemekAdi(String yemekAdi) { this.yemekAdi = yemekAdi; }

    public double getKalori() { return kalori; }
    public void setKalori(double kalori) { this.kalori = kalori; }

    public LocalDate getTarih() { return tarih; }
    public void setTarih(LocalDate tarih) { this.tarih = tarih; }

    public String getAiTavsiyesi() { return aiTavsiyesi; }
    public void setAiTavsiyesi(String aiTavsiyesi) { this.aiTavsiyesi = aiTavsiyesi; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public java.time.LocalTime getSaat() { return saat; }
    public void setSaat(java.time.LocalTime saat) { this.saat = saat; }

    public String getFotografBase64() { return fotografBase64; }
    public void setFotografBase64(String fotografBase64) { this.fotografBase64 = fotografBase64; }


}

