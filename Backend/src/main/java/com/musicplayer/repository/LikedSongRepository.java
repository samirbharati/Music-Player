package com.musicplayer.repository;

import com.musicplayer.entity.LikedSong;
import com.musicplayer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LikedSongRepository extends JpaRepository<LikedSong, Long> {
    List<LikedSong> findByUserOrderByAddedAtDesc(User user);
    Optional<LikedSong> findByUserAndSongId(User user, String songId);
    boolean existsByUserAndSongId(User user, String songId);
    void deleteByUserAndSongId(User user, String songId);
    long countByUser(User user);

    @Query("SELECT l.songId FROM LikedSong l WHERE l.user = :user")
    List<String> findSongIdsByUser(@Param("user") User user);
}