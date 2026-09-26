package com.musicplayer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.musicplayer.dto.SongDto;
import com.musicplayer.entity.LikedSong;
import com.musicplayer.entity.RecentlyPlayed;
import com.musicplayer.entity.User;
import com.musicplayer.repository.LikedSongRepository;
import com.musicplayer.repository.RecentlyPlayedRepository;
import com.musicplayer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MusicService {

    private final WebClient jiosaavnWebClient;
    private final LikedSongRepository likedSongRepository;
    private final RecentlyPlayedRepository recentlyPlayedRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Set<String> likedSongIds(User user) {
        return new HashSet<>(likedSongRepository.findSongIdsByUser(user));
    }

    // ─── Search Songs ────────────────────────────────────────────────────────────
    public List<SongDto> searchSongs(String query, String language, int page, int limit) {
        try {
            String url = "/search/songs?query=" + query + "&page=" + page + "&limit=" + limit;
            if (language != null && !language.isEmpty() && !language.equals("all")) {
                url += "&language=" + language;
            }

            JsonNode response = jiosaavnWebClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            List<SongDto> songs = new ArrayList<>();
            if (response != null && response.has("data") && response.get("data").has("results")) {
                User user = getCurrentUser();
                Set<String> likedIds = likedSongIds(user);
                for (JsonNode songNode : response.get("data").get("results")) {
                    songs.add(mapToSongDto(songNode, likedIds));
                }
            }
            return songs;
        } catch (Exception e) {
            log.error("Error searching songs: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // ─── Get Trending Songs ──────────────────────────────────────────────────────
    public List<SongDto> getTrendingSongs(String language) {
        try {
            String lang = (language != null && !language.equals("all")) ? language : "hindi";
            JsonNode response = jiosaavnWebClient.get()
                    .uri("/search/songs?query=top+hits+" + lang + "&page=1&limit=20")
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            List<SongDto> songs = new ArrayList<>();
            if (response != null && response.has("data") && response.get("data").has("results")) {
                User user = getCurrentUser();
                Set<String> likedIds = likedSongIds(user);
                for (JsonNode songNode : response.get("data").get("results")) {
                    songs.add(mapToSongDto(songNode, likedIds));
                }
            }
            return songs;
        } catch (Exception e) {
            log.error("Error fetching trending: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // ─── Get Song By ID ──────────────────────────────────────────────────────────
    public SongDto getSongById(String songId) {
        try {
            JsonNode response = jiosaavnWebClient.get()
                    .uri("/songs?id=" + songId)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response != null && response.has("data")) {
                User user = getCurrentUser();
                Set<String> likedIds = likedSongIds(user);
                JsonNode data = response.get("data");
                if (data.isArray() && data.size() > 0) {
                    return mapToSongDto(data.get(0), likedIds);
                }
            }
        } catch (Exception e) {
            log.error("Error fetching song {}: {}", songId, e.getMessage());
        }
        return null;
    }

    // ─── Liked Songs ─────────────────────────────────────────────────────────────
    @Transactional
    public boolean toggleLike(SongDto songDto) {
        User user = getCurrentUser();
        if (likedSongRepository.existsByUserAndSongId(user, songDto.getId())) {
            likedSongRepository.deleteByUserAndSongId(user, songDto.getId());
            return false;
        } else {
            LikedSong liked = LikedSong.builder()
                    .user(user)
                    .songId(songDto.getId())
                    .songName(songDto.getName())
                    .artistName(songDto.getArtistName())
                    .albumName(songDto.getAlbumName())
                    .imageUrl(songDto.getImageUrl())
                    .audioUrl(songDto.getAudioUrl())
                    .duration(songDto.getDuration())
                    .language(songDto.getLanguage())
                    .build();
            likedSongRepository.save(liked);
            return true;
        }
    }

    public List<SongDto> getLikedSongs() {
        User user = getCurrentUser();
        return likedSongRepository.findByUserOrderByAddedAtDesc(user)
                .stream()
                .map(ls -> SongDto.builder()
                        .id(ls.getSongId())
                        .name(ls.getSongName())
                        .artistName(ls.getArtistName())
                        .albumName(ls.getAlbumName())
                        .imageUrl(ls.getImageUrl())
                        .audioUrl(ls.getAudioUrl())
                        .duration(ls.getDuration())
                        .language(ls.getLanguage())
                        .liked(true)
                        .build())
                .toList();
    }

    // ─── Recently Played ─────────────────────────────────────────────────────────
    @Transactional
    public void addToRecentlyPlayed(SongDto songDto) {
        User user = getCurrentUser();
        // Remove existing entry for this song to avoid duplicates
        recentlyPlayedRepository.findByUserAndSongId(user, songDto.getId())
                .ifPresent(recentlyPlayedRepository::delete);

        RecentlyPlayed rp = RecentlyPlayed.builder()
                .user(user)
                .songId(songDto.getId())
                .songName(songDto.getName())
                .artistName(songDto.getArtistName())
                .imageUrl(songDto.getImageUrl())
                .audioUrl(songDto.getAudioUrl())
                .duration(songDto.getDuration())
                .language(songDto.getLanguage())
                .build();
        recentlyPlayedRepository.save(rp);

        // Keep history bounded to the latest 50 songs per user
        recentlyPlayedRepository.keepOnlyLatest50(user.getId());
    }

    public List<SongDto> getRecentlyPlayed() {
        User user = getCurrentUser();
        Set<String> likedIds = likedSongIds(user);
        return recentlyPlayedRepository.findByUserOrderByPlayedAtDesc(user, PageRequest.of(0, 20))
                .stream()
                .map(rp -> SongDto.builder()
                        .id(rp.getSongId())
                        .name(rp.getSongName())
                        .artistName(rp.getArtistName())
                        .imageUrl(rp.getImageUrl())
                        .audioUrl(rp.getAudioUrl())
                        .duration(rp.getDuration())
                        .language(rp.getLanguage())
                        .liked(likedIds.contains(rp.getSongId()))
                        .build())
                .toList();
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────────
    private SongDto mapToSongDto(JsonNode node, Set<String> likedIds) {
        String songId = getTextSafe(node, "id");
        String name = getTextSafe(node, "name");
        String language = getTextSafe(node, "language");
        String duration = getTextSafe(node, "duration");

        // Artist — support both "primaryArtists" and the "artists.primary" map shapes
        String artistName = getTextSafe(node, "primaryArtists");
        if (artistName.isEmpty()) {
            artistName = getArtistNames(node);
        }
        if (artistName.isEmpty()) {
            artistName = "Unknown Artist";
        }

        // Album
        String albumName = "";
        if (node.has("album")) {
            albumName = getTextSafe(node.get("album"), "name");
        }

        // Image — pick highest quality
        String imageUrl = "";
        if (node.has("image") && node.get("image").isArray()) {
            JsonNode images = node.get("image");
            for (JsonNode img : images) {
                String quality = getTextSafe(img, "quality");
                if ("500x500".equals(quality) || "500".equals(quality)) {
                    imageUrl = getTextSafe(img, "link");
                    if (imageUrl.isEmpty()) imageUrl = getTextSafe(img, "url");
                    break;
                }
            }
            if (imageUrl.isEmpty() && images.size() > 0) {
                imageUrl = getTextSafe(images.get(images.size() - 1), "link");
                if (imageUrl.isEmpty()) imageUrl = getTextSafe(images.get(images.size() - 1), "url");
            }
        }

        // Audio URL — pick highest quality download URL
        String audioUrl = "";
        if (node.has("downloadUrl") && node.get("downloadUrl").isArray()) {
            JsonNode urls = node.get("downloadUrl");
            for (JsonNode url : urls) {
                String quality = getTextSafe(url, "quality");
                if ("320kbps".equals(quality)) {
                    audioUrl = getTextSafe(url, "link");
                    if (audioUrl.isEmpty()) audioUrl = getTextSafe(url, "url");
                    break;
                }
            }
            if (audioUrl.isEmpty() && urls.size() > 0) {
                audioUrl = getTextSafe(urls.get(urls.size() - 1), "link");
                if (audioUrl.isEmpty()) audioUrl = getTextSafe(urls.get(urls.size() - 1), "url");
            }
        }

        boolean liked = likedIds.contains(songId);

        return SongDto.builder()
                .id(songId)
                .name(name)
                .artistName(artistName)
                .albumName(albumName)
                .imageUrl(imageUrl)
                .audioUrl(audioUrl)
                .duration(duration)
                .language(language)
                .liked(liked)
                .build();
    }

    private String getTextSafe(JsonNode node, String field) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText();
        }
        return "";
    }

    private String getArtistNames(JsonNode node) {
        if (node != null && node.has("artists")
                && node.get("artists").has("primary")
                && node.get("artists").get("primary").isArray()) {
            List<String> names = new ArrayList<>();
            for (JsonNode artist : node.get("artists").get("primary")) {
                String n = getTextSafe(artist, "name");
                if (!n.isEmpty()) {
                    names.add(n);
                }
            }
            return String.join(", ", names);
        }
        return "";
    }
}
