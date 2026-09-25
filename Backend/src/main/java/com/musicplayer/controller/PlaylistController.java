package com.musicplayer.controller;

import com.musicplayer.dto.PlaylistDto;
import com.musicplayer.dto.PlaylistRequest;
import com.musicplayer.dto.SongDto;
import com.musicplayer.service.PlaylistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;

    @GetMapping
    public ResponseEntity<List<PlaylistDto>> getMyPlaylists() {
        return ResponseEntity.ok(playlistService.getUserPlaylists());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistDto> getPlaylist(@PathVariable Long id) {
        return ResponseEntity.ok(playlistService.getPlaylistById(id));
    }

    @PostMapping
    public ResponseEntity<PlaylistDto> createPlaylist(@Valid @RequestBody PlaylistRequest request) {
        return ResponseEntity.ok(playlistService.createPlaylist(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaylistDto> updatePlaylist(
            @PathVariable Long id,
            @Valid @RequestBody PlaylistRequest request) {
        return ResponseEntity.ok(playlistService.updatePlaylist(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePlaylist(@PathVariable Long id) {
        playlistService.deletePlaylist(id);
        return ResponseEntity.ok(Map.of("message", "Playlist deleted"));
    }

    @PostMapping("/{id}/songs")
    public ResponseEntity<PlaylistDto> addSong(
            @PathVariable Long id,
            @RequestBody SongDto songDto) {
        return ResponseEntity.ok(playlistService.addSongToPlaylist(id, songDto));
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public ResponseEntity<PlaylistDto> removeSong(
            @PathVariable Long id,
            @PathVariable String songId) {
        return ResponseEntity.ok(playlistService.removeSongFromPlaylist(id, songId));
    }
}
