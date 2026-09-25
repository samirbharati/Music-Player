package com.musicplayer.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "liked_songs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "song_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LikedSong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;
}
