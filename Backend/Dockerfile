# ============================================
# RevTicket Backend Dockerfile
# ============================================
# Multi-stage build:
# Stage 1: Build the application with Maven
# Stage 2: Run the application with lightweight JRE
# ============================================

# Stage 1: Build
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven configuration and source code
COPY pom.xml .
COPY src ./src

# Install Maven and build the application (skip tests for faster build)
RUN apt-get update && \
    apt-get install -y maven && \
    mvn clean package -DskipTests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Stage 2: Runtime
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/revticket-backend-1.0.0.jar app.jar

# Expose port 8080 for the Spring Boot application
EXPOSE 8080

# Run the application with JVM optimization
# -Djava.security.egd=file:/dev/./urandom: Faster startup in containerized environment
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

# ============================================
# Database Connection:
# - Uses environment variables from docker-compose.yml
# - Falls back to application.properties if not provided
# ============================================
