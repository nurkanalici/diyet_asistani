package com.nurkan.backend.repository;

import com.nurkan.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByIsim(String isim); // İsimle kullanıcı bulmak için
}