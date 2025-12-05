# 1. Use Java 17 image
FROM openjdk:17-jdk-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy JAR file from target folder (Jenkins builds this)
COPY target/revticket-backend-1.0.0.jar app.jar

# 4. Expose port
EXPOSE 8080

# 5. Run the Spring Boot App
ENTRYPOINT ["java", "-jar", "app.jar"]
