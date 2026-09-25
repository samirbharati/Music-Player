package com.musicplayer.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "playlist_songs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistSong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @Column(name = "song_id", nullable = false)
    private String songId;

    @Column(name = "song_name", nullable = false)
    private String songName;

    @Column(name = "artist_name")
    private String artistName;

    @Column(name = "album_name")
    private String albumName;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "audio_url", length = 1000)
    private String audioUrl;

    @Column(name = "duration")
    private String duration;

    @Column(name = "language")
    private String language;

    @Column(name = "position")
    private Integer position;
}
