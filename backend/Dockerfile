# ==============================================================================
# InfraPulse AI — Production Backend Dockerfile (Multi-Stage)
# ==============================================================================

# Build Stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compile and package executable Spring Boot JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Production Runtime Stage
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Create non-root system user and group
RUN addgroup -S infrapulse && adduser -S infrapulse -G infrapulse && \
    mkdir -p /app/uploads/evidence && \
    chown -R infrapulse:infrapulse /app

USER infrapulse

# Copy compiled JAR artifact from build stage
COPY --from=build --chown=infrapulse:infrapulse /app/target/*.jar app.jar

EXPOSE 8080

# Production JVM container ergonomics & memory management
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
