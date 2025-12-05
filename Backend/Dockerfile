# 1. Use Java 17 image
FROM eclipse-temurin:17-jdk-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy JAR file
COPY target/revticket-backend-1.0.0.jar app.jar

# 4. Expose port
EXPOSE 8080

# 5. Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
