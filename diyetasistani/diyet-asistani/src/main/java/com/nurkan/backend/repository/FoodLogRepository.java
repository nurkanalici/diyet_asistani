package com.nurkan.backend.repository;

import com.nurkan.backend.entity.FoodLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FoodLogRepository extends JpaRepository<FoodLog, Long> {
    // Önceki eklediğimiz: Belirli bir günün verilerini getirir
    List<FoodLog> findByUserIdAndTarih(Long userId, LocalDate tarih);

    // YENİ EKLENEN: Kullanıcının BUGÜNE KADARKİ TÜM kayıtlarını getirir
    List<FoodLog> findByUserId(Long userId);
}