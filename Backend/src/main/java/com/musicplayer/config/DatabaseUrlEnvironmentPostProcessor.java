package com.musicplayer.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Translates a PaaS-style DATABASE_URL (e.g. postgres://user:pass@host:5432/db)
 * into JDBC-friendly DB_URL/DB_USERNAME/DB_PASSWORD raw properties. The Spring
 * datasource binding in application.properties references them via ${DB_URL:...}
 * placeholders, so the translation is applied regardless of property source
 * ordering at startup. This makes the app deployable on Render, Heroku, Railway,
 * etc. without any extra config.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            System.err.println("[DatabaseUrlProcessor] DATABASE_URL is MISSING - falling back to DB_URL/default");
            return;
        }
        System.err.println("[DatabaseUrlProcessor] DATABASE_URL found, translating to JDBC props");
        try {
            URI uri = URI.create(databaseUrl);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            if (!scheme.startsWith("postgres")) {
                return;
            }
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
            String userInfo = uri.getUserInfo();
            String query = uri.getQuery();

            String username = "";
            String password = "";
            if (userInfo != null) {
                String[] parts = userInfo.split(":", 2);
                username = parts[0];
                if (parts.length > 1) {
                    password = parts[1];
                }
            }

            String jdbcQuery = (query == null || query.isBlank()) ? "sslmode=require" : query;
            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + path + "?" + jdbcQuery;
            Map<String, Object> props = new LinkedHashMap<>();
            props.put("DB_URL", jdbcUrl);
            props.put("DB_USERNAME", username);
            props.put("DB_PASSWORD", password);
            environment.getPropertySources().addFirst(new MapPropertySource("databaseUrlProcessor", props));
            System.err.println("[DatabaseUrlProcessor] DB_URL -> " + jdbcUrl);
        } catch (RuntimeException e) {
            // Never fail startup because of a malformed DATABASE_URL; fall through to DB_URL/DB_USERNAME
        }
    }
}