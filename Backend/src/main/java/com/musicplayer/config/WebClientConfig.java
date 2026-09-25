package com.musicplayer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${jiosaavn.api.base-url}")
    private String jiosaavnBaseUrl;

    @Bean
    public WebClient jiosaavnWebClient() {
        return WebClient.builder()
                .baseUrl(jiosaavnBaseUrl)
                .defaultHeader("User-Agent", "MusicPlayer/1.0")
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024))
                .build();
    }
}
