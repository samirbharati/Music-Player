package com.musicplayer.controller;

import com.musicplayer.entity.User;
import com.musicplayer.repository.LikedSongRepository;
import com.musicplayer.repository.PlaylistRepository;
import com.musicplayer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final LikedSongRepository likedSongRepository;
    private final PlaylistRepository playlistRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "createdAt", user.getCreatedAt().toString(),
                "likedSongsCount", likedSongRepository.countByUser(user),
                "playlistsCount", playlistRepository.countByUser(user)
        ));
    }
}
