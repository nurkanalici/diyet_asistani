package com.nurkan.backend.controller;

import com.nurkan.backend.entity.FoodLog;
import com.nurkan.backend.entity.User;
import com.nurkan.backend.repository.FoodLogRepository;
import com.nurkan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/food")
@CrossOrigin(origins = "http://localhost:3000")
public class FoodAnalysisController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodLogRepository foodLogRepository;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeFood(@RequestParam("file") MultipartFile file, @RequestParam("userId") Long userId) {
        try {
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

            LocalDate today = LocalDate.now();
            List<FoodLog> todaysLogs = foodLogRepository.findByUserIdAndTarih(userId, today);

            // Lambda (Stream) hatasını önlemek için klasik for döngüsü kullanıldı
            double currentTotal = 0;
            for (FoodLog log : todaysLogs) {
                currentTotal += log.getKalori();
            }

            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            body.add("current_calories", currentTotal);
            body.add("target_calories", user.getGunlukKaloriIhtiyaci());

            body.add("yas", user.getYas());
            body.add("boy", user.getBoy());
            body.add("kilo", user.getKilo());
            body.add("cinsiyet", user.getCinsiyet() != null ? user.getCinsiyet() : "Erkek");
            body.add("boyun", user.getBoyun());
            body.add("bel", user.getBel());
            body.add("kalca", user.getKalca());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            RestTemplate restTemplate = new RestTemplate();

            @SuppressWarnings("unchecked") // "Unchecked" uyarısını gizler
            ResponseEntity<Map> response = restTemplate.postForEntity("http://localhost:8000/analyze-food", requestEntity, Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> pythonResponse = response.getBody();

            if (pythonResponse != null && "success".equals(pythonResponse.get("status"))) {
                FoodLog log = new FoodLog();
                log.setYemekAdi((String) pythonResponse.get("detected_food"));
                log.setKalori(Double.parseDouble(pythonResponse.get("estimated_calories").toString()));
                log.setAiTavsiyesi((String) pythonResponse.get("ai_advice"));
                log.setTarih(today);

                // YENİ: Saati ve Fotoğrafı veritabanına mühürlüyoruz
                log.setSaat(java.time.LocalTime.now());
                log.setFotografBase64(java.util.Base64.getEncoder().encodeToString(file.getBytes()));

                log.setUser(user);
                foodLogRepository.save(log);
            }

            return ResponseEntity.ok(pythonResponse);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Analiz sırasında hata: " + e.getMessage());
        }
    }

    // 2. TAKVİMİ YEŞİLE BOYAMAK İÇİN (Aktif Günleri Getirir)
    @GetMapping("/{userId}/active-days")
    public ResponseEntity<List<String>> getActiveDays(@PathVariable Long userId) {
        // Kullanıcı var mı diye kontrol et
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        // HATA VEREN KISIM DÜZELTİLDİ: user.getFoodLogs() yerine veritabanından çekiyoruz!
        List<FoodLog> userLogs = foodLogRepository.findByUserId(userId);

        List<String> activeDays = userLogs.stream()
                .map(log -> log.getTarih().toString())
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(activeDays);
    }

    @GetMapping("/{userId}/history/{date}")
    public ResponseEntity<List<FoodLog>> getDailyHistory(@PathVariable Long userId, @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<FoodLog> logs = foodLogRepository.findByUserIdAndTarih(userId, localDate);
        return ResponseEntity.ok(logs);
    }
}