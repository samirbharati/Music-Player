package com.musicplayer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongDto {
    private String id;
    private String name;
    private String artistName;
    private String albumName;
    private String imageUrl;
    private String audioUrl;
    private String duration;
    private String language;
    private boolean liked;
}
