package com.musicplayer.service;

import com.musicplayer.dto.AuthResponse;
import com.musicplayer.dto.LoginRequest;
import com.musicplayer.dto.RegisterRequest;
import com.musicplayer.entity.Otp;
import com.musicplayer.entity.User;
import com.musicplayer.repository.OtpRepository;
import com.musicplayer.repository.UserRepository;
import com.musicplayer.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int OTP_MAX_ATTEMPTS = 5;
    private static final int OTP_RESEND_COOLDOWN_SECONDS = 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final PlatformTransactionManager transactionManager;

    @Transactional
    public void sendOtp(String email) {
        if (email == null || !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new RuntimeException("Invalid email address");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        // Resend cooldown to prevent OTP spamming
        otpRepository.findTopByEmailOrderByExpiryTimeDesc(email).ifPresent(last -> {
            if (last.getCreatedAt() != null
                    && last.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(OTP_RESEND_COOLDOWN_SECONDS))) {
                throw new RuntimeException("Please wait before requesting another OTP");
            }
        });

        // Generate 6 digit OTP
        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        String salt = generateSalt();
        String codeHash = hashOtp(salt, otpCode);

        // Save/Update OTP in DB (only the salted hash is stored, never plaintext)
        otpRepository.deleteByEmail(email);
        Otp otp = Otp.builder()
                .email(email)
                .salt(salt)
                .codeHash(codeHash)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();
        otpRepository.save(otp);

        // Send Email
        emailService.sendVerificationOtp(email, otpCode);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Verify OTP
        Otp otp = otpRepository.findTopByEmailOrderByExpiryTimeDesc(request.getEmail())
                .orElseThrow(() -> new RuntimeException("OTP not found. Please request a new one."));

        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (otp.getAttempts() >= OTP_MAX_ATTEMPTS) {
            throw new RuntimeException("Too many incorrect attempts. Please request a new OTP.");
        }

        if (!matchesOtp(otp, request.getOtp())) {
            recordFailedAttempt(otp.getId());
            throw new RuntimeException("Invalid OTP code");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER")
                .build();

        user = userRepository.save(user);
        otpRepository.deleteByEmail(user.getEmail()); // Cleanup OTP after success

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private String generateSalt() {
        byte[] salt = new byte[16];
        SECURE_RANDOM.nextBytes(salt);
        return HexFormat.of().formatHex(salt);
    }

    private String hashOtp(String salt, String otpCode) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest((salt + otpCode).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private boolean matchesOtp(Otp otp, String submitted) {
        if (otp.getSalt() == null || otp.getCodeHash() == null) {
            return false;
        }
        byte[] expected = HexFormat.of().parseHex(otp.getCodeHash());
        byte[] actual = HexFormat.of().parseHex(hashOtp(otp.getSalt(), submitted));
        return MessageDigest.isEqual(expected, actual);
    }

    // Persist a failed attempt in its own transaction so it survives the
    // rollback caused by the "invalid OTP" exception in the outer transaction.
    private void recordFailedAttempt(Long otpId) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        template.executeWithoutResult(status ->
                otpRepository.findById(otpId).ifPresent(otp -> {
                    otp.setAttempts(otp.getAttempts() + 1);
                    otpRepository.save(otp);
                }));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
