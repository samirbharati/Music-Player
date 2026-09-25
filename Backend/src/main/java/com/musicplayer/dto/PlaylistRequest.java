package com.musicplayer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaylistRequest {
    @NotBlank(message = "Playlist name is required")
    private String name;
    private String description;
    private String coverImage;
}
