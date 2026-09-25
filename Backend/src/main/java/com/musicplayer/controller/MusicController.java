package com.musicplayer.controller;

import com.musicplayer.dto.SongDto;
import com.musicplayer.service.MusicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/music")
@RequiredArgsConstructor
public class MusicController {

    private final MusicService musicService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Music Player API"));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SongDto>> searchSongs(
            @RequestParam String q,
            @RequestParam(defaultValue = "all") String language,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(musicService.searchSongs(q, language, page, limit));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<SongDto>> getTrending(
            @RequestParam(defaultValue = "hindi") String language) {
        return ResponseEntity.ok(musicService.getTrendingSongs(language));
    }

    @GetMapping("/song/{id}")
    public ResponseEntity<?> getSongById(@PathVariable String id) {
        SongDto song = musicService.getSongById(id);
        if (song != null) {
            return ResponseEntity.ok(song);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@RequestBody SongDto songDto) {
        boolean liked = musicService.toggleLike(songDto);
        return ResponseEntity.ok(Map.of("liked", liked, "songId", songDto.getId()));
    }

    @GetMapping("/liked")
    public ResponseEntity<List<SongDto>> getLikedSongs() {
        return ResponseEntity.ok(musicService.getLikedSongs());
    }

    @PostMapping("/recently-played")
    public ResponseEntity<Void> addToRecentlyPlayed(@RequestBody SongDto songDto) {
        musicService.addToRecentlyPlayed(songDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/recently-played")
    public ResponseEntity<List<SongDto>> getRecentlyPlayed() {
        return ResponseEntity.ok(musicService.getRecentlyPlayed());
    }
}
