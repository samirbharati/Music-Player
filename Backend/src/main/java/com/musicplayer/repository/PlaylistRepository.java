package com.musicplayer.repository;

import com.musicplayer.entity.Playlist;
import com.musicplayer.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long> {

    @EntityGraph(attributePaths = "songs")
    List<Playlist> findByUserOrderByCreatedAtDesc(User user);

    Optional<Playlist> findByIdAndUser(Long id, User user);

    long countByUser(User user);
}