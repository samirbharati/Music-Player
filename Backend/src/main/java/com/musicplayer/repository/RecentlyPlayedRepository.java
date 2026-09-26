package com.musicplayer.repository;

import com.musicplayer.entity.RecentlyPlayed;
import com.musicplayer.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentlyPlayedRepository extends JpaRepository<RecentlyPlayed, Long> {
    List<RecentlyPlayed> findByUserOrderByPlayedAtDesc(User user, Pageable pageable);
    Optional<RecentlyPlayed> findByUserAndSongId(User user, String songId);

    @Modifying(flushAutomatically = true)
    @Query(value = "DELETE FROM recently_played rp WHERE rp.user_id = :userId AND rp.id NOT IN (" +
           "SELECT rp2.id FROM recently_played rp2 WHERE rp2.user_id = :userId " +
           "ORDER BY rp2.played_at DESC LIMIT 50)",
           nativeQuery = true)
    void keepOnlyLatest50(@Param("userId") Long userId);
}