# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY Backend/pom.xml .
COPY Backend/src ./src
RUN mvn -B -DskipTests clean package

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/music-player-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]