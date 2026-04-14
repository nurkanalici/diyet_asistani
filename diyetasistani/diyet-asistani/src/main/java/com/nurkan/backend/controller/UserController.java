package com.nurkan.backend.controller;

import com.nurkan.backend.entity.User;
import com.nurkan.backend.entity.FoodLog;
import com.nurkan.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/kullanici")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/kayit")
    public ResponseEntity<User> kayit(@RequestBody User user) {
        return ResponseEntity.ok(userService.kaydet(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginUser) {
        User user = userService.girisYap(loginUser.getIsim(), loginUser.getSifre());
        if (user != null) { return ResponseEntity.ok(user); }
        return ResponseEntity.status(401).body("Hatalı kullanıcı adı veya şifre!");
    }

    // YENİ: Profil Güncelleme Kapısı
    @PutMapping("/{id}/profil")
    public ResponseEntity<User> profilGuncelle(@PathVariable Long id, @RequestBody User guncelBilgiler) {
        return ResponseEntity.ok(userService.profilGuncelle(id, guncelBilgiler));
    }

    @GetMapping("/{userId}/gecmis")
    public ResponseEntity<List<FoodLog>> getGecmis(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getKullaniciGecmisi(userId));
    }

    // YENİ: Hesabı Silme Kapısı
    @DeleteMapping("/{id}")
    public ResponseEntity<?> hesabiSil(@PathVariable Long id) {
        userService.hesabiSil(id);
        return ResponseEntity.ok("Hesap ve bağlı tüm veriler başarıyla silindi.");
    }
}