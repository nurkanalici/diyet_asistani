package com.nurkan.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String isim;
    private String sifre; // Giriş için eklendi
    private int yas;
    private double kilo;
    private double boy;
    private double boyun;
    private double bel;
    private double kalca;
    private String cinsiyet;
    private double vucutYagOrani;
    private double gunlukKaloriIhtiyaci;

    // Her kullanıcının geçmiş yemek listesi olacak
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<FoodLog> gecmisYemekler;
}