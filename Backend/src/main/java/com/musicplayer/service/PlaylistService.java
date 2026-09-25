package com.musicplayer.service;

import com.musicplayer.dto.PlaylistDto;
import com.musicplayer.dto.PlaylistRequest;
import com.musicplayer.dto.SongDto;
import com.musicplayer.entity.Playlist;
import com.musicplayer.entity.PlaylistSong;
import com.musicplayer.entity.User;
import com.musicplayer.repository.PlaylistRepository;
import com.musicplayer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Playlist getOwnedPlaylist(Long id, User user) {
        return playlistRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));
    }

    public List<PlaylistDto> getUserPlaylists() {
        User user = getCurrentUser();
        return playlistRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PlaylistDto getPlaylistById(Long id) {
        User user = getCurrentUser();
        return toDto(getOwnedPlaylist(id, user));
    }

    @Transactional
    public PlaylistDto createPlaylist(PlaylistRequest request) {
        User user = getCurrentUser();
        Playlist playlist = Playlist.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .coverImage(request.getCoverImage())
                .build();
        return toDto(playlistRepository.save(playlist));
    }

    @Transactional
    public PlaylistDto updatePlaylist(Long id, PlaylistRequest request) {
        Playlist playlist = getOwnedPlaylist(id, getCurrentUser());
        playlist.setName(request.getName());
        if (request.getDescription() != null) playlist.setDescription(request.getDescription());
        if (request.getCoverImage() != null) playlist.setCoverImage(request.getCoverImage());
        return toDto(playlistRepository.save(playlist));
    }

    @Transactional
    public void deletePlaylist(Long id) {
        Playlist playlist = getOwnedPlaylist(id, getCurrentUser());
        playlistRepository.delete(playlist);
    }

    @Transactional
    public PlaylistDto addSongToPlaylist(Long playlistId, SongDto songDto) {
        Playlist playlist = getOwnedPlaylist(playlistId, getCurrentUser());

        // Avoid duplicate songs
        boolean exists = playlist.getSongs().stream()
                .anyMatch(s -> s.getSongId().equals(songDto.getId()));
        if (exists) return toDto(playlist);

        int position = playlist.getSongs().size();
        PlaylistSong song = PlaylistSong.builder()
                .playlist(playlist)
                .songId(songDto.getId())
                .songName(songDto.getName())
                .artistName(songDto.getArtistName())
                .albumName(songDto.getAlbumName())
                .imageUrl(songDto.getImageUrl())
                .audioUrl(songDto.getAudioUrl())
                .duration(songDto.getDuration())
                .language(songDto.getLanguage())
                .position(position)
                .build();

        playlist.getSongs().add(song);
        return toDto(playlistRepository.save(playlist));
    }

    @Transactional
    public PlaylistDto removeSongFromPlaylist(Long playlistId, String songId) {
        Playlist playlist = getOwnedPlaylist(playlistId, getCurrentUser());
        playlist.getSongs().removeIf(s -> s.getSongId().equals(songId));

        // Reorder positions
        AtomicInteger pos = new AtomicInteger(0);
        playlist.getSongs().forEach(s -> s.setPosition(pos.getAndIncrement()));

        return toDto(playlistRepository.save(playlist));
    }

    private PlaylistDto toDto(Playlist playlist) {
        List<SongDto> songs = playlist.getSongs().stream()
                .sorted((a, b) -> Integer.compare(
                        a.getPosition() != null ? a.getPosition() : 0,
                        b.getPosition() != null ? b.getPosition() : 0))
                .map(ps -> SongDto.builder()
                        .id(ps.getSongId())
                        .name(ps.getSongName())
                        .artistName(ps.getArtistName())
                        .albumName(ps.getAlbumName())
                        .imageUrl(ps.getImageUrl())
                        .audioUrl(ps.getAudioUrl())
                        .duration(ps.getDuration())
                        .language(ps.getLanguage())
                        .build())
                .collect(Collectors.toList());

        return PlaylistDto.builder()
                .id(playlist.getId())
                .name(playlist.getName())
                .description(playlist.getDescription())
                .coverImage(playlist.getCoverImage())
                .songs(songs)
                .songCount(songs.size())
                .createdAt(playlist.getCreatedAt())
                .build();
    }
}