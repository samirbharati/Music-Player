package com.musicplayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicplayer.repository.OtpRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JavaMailSender mailSender;

    private static final Pattern OTP_PATTERN = Pattern.compile("(\\d{6})");

    private String requestOtp(String email) throws Exception {
        reset(mailSender);
        mvc.perform(post("/api/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent successfully"));

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        Matcher matcher = OTP_PATTERN.matcher(captor.getValue().getText());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    private String register(String username, String email, String password, String otp) throws Exception {
        MvcResult res = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", username,
                                "email", email,
                                "password", password,
                                "otp", otp))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void registrationLoginAndPlaylistOwnership() throws Exception {
        // User A
        String otpA = requestOtp("alice@test.com");

        // OTP is stored as a salted hash, never plaintext
        assertThat(otpRepository.findTopByEmailOrderByExpiryTimeDesc("alice@test.com"))
                .isPresent()
                .get()
                .satisfies(otp -> {
                    assertThat(otp.getCodeHash()).isNotEqualTo(otpA);
                    assertThat(otp.getCodeHash()).doesNotContain(otpA);
                    assertThat(otp.getCodeHash()).matches("[0-9a-f]{64}");
                });

        String tokenA = register("alice", "alice@test.com", "secret123", otpA);

        // Login flow
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alice@test.com\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));

        // Wrong password returns generic 401 message
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alice@test.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));

        // OTP is consumed/cleaned after registration
        assertThat(otpRepository.findTopByEmailOrderByExpiryTimeDesc("alice@test.com")).isEmpty();

        // User A creates a playlist
        MvcResult pl = mvc.perform(post("/api/playlists")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"My Mix\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Mix"))
                .andReturn();
        long playlistId = objectMapper.readTree(pl.getResponse().getContentAsString()).get("id").asLong();

        // User B
        String otpB = requestOtp("bob@test.com");
        String tokenB = register("bob", "bob@test.com", "secret456", otpB);

        // IDOR fix: Bob must NOT see or modify Alice's playlist
        mvc.perform(get("/api/playlists/" + playlistId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Playlist not found"));

        mvc.perform(delete("/api/playlists/" + playlistId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isBadRequest());

        mvc.perform(put("/api/playlists/" + playlistId)
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hacked\"}"))
                .andExpect(status().isBadRequest());

        // Alice can still see her own playlist
        mvc.perform(get("/api/playlists/" + playlistId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Mix"));

        // Liked songs work without external API
        mvc.perform(post("/api/music/like")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "id", "SONG_1", "name", "Test Song", "artistName", "Artist"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true));

        mvc.perform(get("/api/music/liked")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void invalidOtpIsRejectedAndCounted() throws Exception {
        mvc.perform(post("/api/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"carol@test.com\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "carol",
                                "email", "carol@test.com",
                                "password", "secret789",
                                "otp", "000000"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid OTP code"));

        assertThat(otpRepository.findTopByEmailOrderByExpiryTimeDesc("carol@test.com")
                .orElseThrow().getAttempts()).isEqualTo(1);

        // invalid email format is rejected
        mvc.perform(post("/api/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid email address"));

        JsonNode health = objectMapper.readTree(mvc.perform(get("/api/health"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(health.get("status").asText()).isEqualTo("UP");
    }
}